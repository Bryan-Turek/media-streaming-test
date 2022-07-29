const net = require('net');
const { clearInterval } = require('timers');
const EventEmitter = require('events');

class PeerInterface extends EventEmitter {

  constructor(config) {
    super();
    this._connected = false;
    this._socket = new net.Socket();

    this._connect_opts = { host: config.address, port: config.messaging_port };

    this._conn_interval = 0;

    let self = this;

    this._socket.addListener("connect", function() {
      // console.log("PeerInterface connected");
      clearInterval(self._conn_interval);
      self._connected = true;
      self.emit("peer_connected");
    });

    this._socket.on("close", function(hadError) {
      // console.log("PeerInterface socket closed");
      self._connected = false;
      self.emit("peer_disconnected");
      clearInterval(self._conn_interval);
      self.startConnectInterval();
    });

    this._socket.on("end", function() {
      // console.log("PeerInterface socket end");
      clearInterval(self._conn_interval);
    });

    this._socket.on("data", function(data) {
      const request = JSON.parse(data);
      console.log("Receiving", request);
      if(request.rpc) {
        self.emit(request.rpc, request);
      }
    });

    this._socket.on("error", function(error) {
      clearInterval(self._conn_interval);
      // console.log(`PeerInterface socket error: ${error.message}`);
    });

  }

  startConnectInterval() {
    let self = this;
    if(!self._connected) {
      this._conn_interval = setInterval(function() {
        // console.log("PeerInterface attempting connection");
        self._socket.connect(self._connect_opts);
      }, 1000);
    }
  }

  send(message) {
    console.log("Sending", message);
    this._socket.write(JSON.stringify(message));
  }

}

module.exports = PeerInterface;
