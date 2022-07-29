const EventEmitter = require('events');
const PeerInterface = require('./peer_interface');
const { v4: uuidv4 } = require('uuid');

class Peer extends EventEmitter {

  constructor(config) {
    super();

    this.id = uuidv4();

    this._config = config;

    this._peer_interface = new PeerInterface(config);

    let self = this;
    this._peer_interface.on("peer_connected", function() {
      self._peer_interface.send({
        rpc: "remote_peer_offer",
        data: {
          id: self.id
        }
      });
    });

    this._peer_interface.on("peer_disconnected", function() {

    });
  }

  startConnectInterval() {
    this._peer_interface.startConnectInterval();
  }

  toJson() {
    return {
      id: this.id,
      remoteId: this.remoteId,
      connected: this._peer_interface._connected
    }
  }

}

module.exports = Peer;
