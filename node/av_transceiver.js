const dgram = require('dgram');
const EventEmitter = require('events');

const UDP_CHUNK_SIZE = 512;
const UDP_CHUNK_COUNT = 900;
const VIDEO_FRAME_SIZE = 460800;

class AVTransceiver extends EventEmitter {

  constructor(config) {
    super();

    this._receive_socket = dgram.createSocket('udp4');
    this._transmit_socket = dgram.createSocket('udp4');

    this._peers = null;

    this._frameChunk = 0;
    this._frame = new Uint8Array(new ArrayBuffer(VIDEO_FRAME_SIZE));

    var self = this;
    this._receive_socket.on("connect", this.handlePeerConnect);
    this._receive_socket.on("error", this.handlePeerError);
    this._receive_socket.on("close", this.handlePeerClose);
    this._receive_socket.on("message", (data) => {
      self._frame.set(data, this._frameChunk * UDP_CHUNK_SIZE);
      self._frameChunk++;
      if(self._frameChunk === UDP_CHUNK_COUNT) {
        self._frameChunk = 0;
        let frame = new ArrayBuffer(self._frame.byteLength);
        new Uint8Array(frame).set(new Uint8Array(self._frame));
        self.emit('frame', {
          width: 640,
          height: 480,
          rotation: 0,
          data: frame
        });
        // console.log(self._frame);
      }
    });

    console.log(`AvTransceiver listening on port: ${config.port}`);
    this._receive_socket.bind(config.port, config.host);
    this._transmit_socket.bind();
  }

  handlePeerConnect() {
    console.log('udp client connected')
  }
  handlePeerError() {}
  handlePeerClose() {}

  setPeers(peers) {
    this._peers = peers;
  }

  transmit(frame) {
    if(this._peers) {
      // console.log(frame);
      for(let key of Object.keys(this._peers)) {
        for (let i = 0; i < frame.data.length; i += UDP_CHUNK_SIZE) {
          const chunk = frame.data.slice(i, i + UDP_CHUNK_SIZE);
          this._transmit_socket.send(
            chunk,
            this._peers[key]._config.av_port,
            this._peers[key]._config.address);
        }
      }
    }
  }

}

module.exports = AVTransceiver;
