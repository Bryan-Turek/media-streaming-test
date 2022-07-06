const net = require('net');
const { clearInterval } = require('timers');
const EventEmitter = require('events');

class NodeInterface extends EventEmitter {

  constructor() {
    super();
    this._connected = false;
    this._socket = new net.Socket();

    this._conn_interval = 0;

    this._webrtc_connection_status = {
      offerCreated: false
    };

    let self = this;

    this._socket.addListener("connect", function() {
      console.log("NodeInterface connected");
      clearInterval(self._conn_interval);
      self._connected = true;
    });

    this._socket.on("close", function(hadError) {
      console.log("NodeInterface socket closed");
      self._connected = false;
      clearInterval(self._conn_interval);
      self.startConnectInterval();
    });

    this._socket.on("end", function() {
      console.log("NodeInterface socket end");
      clearInterval(self._conn_interval);
    });

    this._socket.on("data", function(data) {
      const request = JSON.parse(data);
      if(request.rpc) {
        self.emit(request.rpc, request);
      }
    });

    this._socket.on("error", function(error) {
      clearInterval(self._conn_interval);
      console.log(`NodeInterface socket error: ${error.message}`);
    });

    this.on("set_webrtc_connection_status", function(req) {
      this._webrtc_connection_status = req.data;
    });

  }

  startConnectInterval() {
    let self = this;
    if(!self._connected) {
      this._conn_interval = setInterval(function() {
        console.log("NodeInterface attempting connection");
        self._socket.connect(self._connect_opts);
      }, 1000);
    }
  }

  getWebRtcStatus() {
    return this._webrtc_connection_status;
  }

  connect(opts) {
    // check the options here to make sure they're valid
    this._connect_opts = { host: opts.address, port: opts.port };
    this.startConnectInterval();
  }

  send(message) {
    this._socket.write(JSON.stringify(message));
  }

}

module.exports = new NodeInterface();
