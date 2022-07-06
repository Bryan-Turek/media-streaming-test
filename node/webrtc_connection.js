const DefaultRTCPeerConnection = require('wrtc').RTCPeerConnection;
const EventEmitter = require('events');
const { PassThrough } = require('stream');
const { RTCAudioSink, RTCVideoSink } = require('wrtc').nonstandard;

class WebRtcConnection extends EventEmitter {

  constructor() {
    super();
    this._offer_created = false;

    this._peerConnection = new DefaultRTCPeerConnection({
      sdpSemantics: 'unified-plan'
    });

    this._audioTransceiver = this._peerConnection.addTransceiver('audio');
    this._videoTransceiver = this._peerConnection.addTransceiver('video');

    this._audioSink = new RTCAudioSink(this._audioTransceiver.receiver.track);
    this._videoSink = new RTCVideoSink(this._videoTransceiver.receiver.track);

    this._videoSink.addEventListener('frame', ({ frame: frame }) => {
      console.log(frame);
    });
  }

  async createOffer() {
    if(!this._offer_created) {
      const offer = await this._peerConnection.createOffer();
      await this._peerConnection.setLocalDescription(offer);
      this._offer_created = true;
      // try {
      //   await waitUntilIceGatheringStateComplete(this._peerConnection, options);
      // } catch (error) {
      //   this.close();
      //   throw error;
      // }
    }
    return this._offer_created;
  }

  applyAnswer(answer) {
    if(this._offer_created) {
      this._peerConnection.setRemoteDescription(answer);
    }
  }

  onIceConnectionStateChange() {}

  close() {
    this._peerConnection.removeEventListener(
      'iceconnectionstatechange', this.onIceConnectionStateChange);
    // if (this.connectionTimer) {
    //   options.clearTimeout(this.connectionTimer);
    //   connectionTimer = null;
    // }
    // if (this.reconnectionTimer) {
    //   options.clearTimeout(this.reconnectionTimer);
    //   reconnectionTimer = null;
    // }
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

function disableTrickleIce(sdp) {
  return sdp.replace(/\r\na=ice-options:trickle/g, '');
}

async function waitUntilIceGatheringStateComplete(peerConnection, options) {
  if (peerConnection.iceGatheringState === 'complete') {
    return;
  }

  const { timeToHostCandidates } = options;

  const deferred = {};
  deferred.promise = new Promise((resolve, reject) => {
    deferred.resolve = resolve;
    deferred.reject = reject;
  });

  const timeout = options.setTimeout(() => {
    peerConnection.removeEventListener('icecandidate', onIceCandidate);
    deferred.reject(new Error('Timed out waiting for host candidates'));
  }, timeToHostCandidates);

  function onIceCandidate({ candidate }) {
    if (!candidate) {
      options.clearTimeout(timeout);
      peerConnection.removeEventListener('icecandidate', onIceCandidate);
      deferred.resolve();
    }
  }

  peerConnection.addEventListener('icecandidate', onIceCandidate);

  await deferred.promise;
}

module.exports = new WebRtcConnection();