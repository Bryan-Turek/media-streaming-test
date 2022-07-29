const DefaultRTCPeerConnection = require('wrtc').RTCPeerConnection;
const EventEmitter = require('events');
const { time } = require('console');
const { PassThrough } = require('stream');
const { RTCVideoSource, RTCAudioSink, RTCVideoSink } = require('wrtc').nonstandard;

const TIME_TO_CONNECTED = 100000;
const TIME_TO_HOST_CANDIDATES = 3000;  // NOTE(mroberts): Too long.
const TIME_TO_RECONNECTED = 10000;

class WebRtcConnection extends EventEmitter {

  constructor(transceiver) {
    super();
    this._offer_created = false;

    this._peerConnection = new DefaultRTCPeerConnection({
      sdpSemantics: 'unified-plan'
    });

    this._audioTransceiver = this._peerConnection.addTransceiver('audio');
    this._videoTransceiver = this._peerConnection.addTransceiver('video');

    this._remoteVideoSource = new RTCVideoSource();
    this._remoteVideoTrack = this._remoteVideoSource.createTrack();
    this._videoTransceiver.sender.replaceTrack(this._remoteVideoTrack);

    this._audioSink = new RTCAudioSink(this._audioTransceiver.receiver.track);
    this._videoSink = new RTCVideoSink(this._videoTransceiver.receiver.track);

    this._frameCount = 0;
    this._framesSinceLastCheck = 0;
    this._framesPerSecond = 0;

    var self = this;

    transceiver.on('frame', (frame) => {
      console.log(frame);
      self._remoteVideoSource.onFrame(frame);
    });

    this._videoSink.addEventListener('frame', ({ frame }) => {
      transceiver.transmit(frame);
      if(!self._frameTime) {
        console.log("WebRtcConnection initializing start time")
        self._frameTime = new Date();
        self.startFPSInterval();
      }
      self._frameCount++;
    });

    var self = this;
    // this._connectionTimer = setTimeout(() => {
    //   if (self._peerConnection.iceConnectionState !== 'connected'
    //     && self._peerConnection.iceConnectionState !== 'completed') {
    //       self.close();
    //   }
    // }, TIME_TO_CONNECTED);
    this._reconnectionTimer = null;

    this._peerConnection.addEventListener('iceconnectionstatechange', this.onIceConnectionStateChange);
  }

  startFPSInterval() {
    clearInterval(this._fpsInterval);
    var self = this;
    this._fpsInterval = setInterval(function() {
      let timeBefore = self._frameTime;
      let now = new Date();
      let frameCount = self._frameCount - self._framesSinceLastCheck;
      let fps = frameCount / (now.getSeconds() - timeBefore.getSeconds());
      self._framesPerSecond = fps;
      self._framesSinceLastCheck = self._frameCount;
      // console.log(frameCount, now.getSeconds(), timeBefore.getSeconds());
      // console.log(`Frames per second: ${fps}`);
      self._frameTime = now;
    }, 1000);
  }

  getFPS() {
    return this._framesPerSecond;
  }

  async createOffer() {
    if(!this._offer_created) {
      const offer = await this._peerConnection.createOffer();
      await this._peerConnection.setLocalDescription(offer);
      this._offer_created = true;
      try {
        await this.waitUntilIceGatheringStateComplete();
      } catch (error) {
        this.close();
        throw error;
      }
    }
    return this._offer_created;
  }

  applyAnswer(answer) {
    if(this._offer_created) {
      this._peerConnection.setRemoteDescription(answer);
    }
  }

  onIceConnectionStateChange() {
    if (this.iceConnectionState === 'connected'
        || this.iceConnectionState === 'completed') {
        if (this._connectionTimer) {
          clearTimeout(this._connectionTimer);
          this._connectionTimer = null;
        }
        clearTimeout(this._reconnectionTimer);
        this._reconnectionTimer = null;
      } else if (this.iceConnectionState === 'disconnected'
        || this.iceConnectionState === 'failed') {
        if (!this._connectionTimer && !this._reconnectionTimer) {
          const self = this;
          this._reconnectionTimer = setTimeout(() => {
            console.log('closing connection');
            self.close();
          }, TIME_TO_RECONNECTED);
        }
      }
  }

  disableTrickleIce(sdp) {
    return sdp.replace(/\r\na=ice-options:trickle/g, '');
  }
  
  async waitUntilIceGatheringStateComplete() {
    if (this._peerConnection.iceGatheringState === 'complete') {
      return;
    }
  
    const deferred = {};
    deferred.promise = new Promise((resolve, reject) => {
      deferred.resolve = resolve;
      deferred.reject = reject;
    });
  
    var self = this;
    const timeout = setTimeout(() => {
      self._peerConnection.removeEventListener('icecandidate', onIceCandidate);
      deferred.reject(new Error('Timed out waiting for host candidates'));
    }, TIME_TO_HOST_CANDIDATES);
  
    function onIceCandidate({ candidate }) {
      if (!candidate) {
        clearTimeout(timeout);
        self._peerConnection.removeEventListener('icecandidate', onIceCandidate);
        deferred.resolve();
      }
    }
  
    this._peerConnection.addEventListener('icecandidate', onIceCandidate);
  
    await deferred.promise;
  }

  close() {
    console.log("Closing connection!");
    this._peerConnection.removeEventListener(
      'iceconnectionstatechange', this.onIceConnectionStateChange);
    if (this._connectionTimer) {
      clearTimeout(this._connectionTimer);
      this._connectionTimer = null;
    }
    if (this._reconnectionTimer) {
      clearTimeout(this._reconnectionTimer);
      this._reconnectionTimer = null;
    }
    this._peerConnection.close();
  };

  toJson() {
    return {
      offerCreated: this._offer_created,
      localDescription: this._peerConnection.localDescription,
      peerConfiguration: this._peerConnection.getConfiguration(),
      iceGatheringState: this._peerConnection.iceGatheringState
    }
  }

}

module.exports = WebRtcConnection;