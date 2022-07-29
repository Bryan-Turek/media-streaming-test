const net = require('net');
const EventEmitter = require('events');

class TCPServer extends EventEmitter {

  constructor(name) {
    super();

    this._name = name;
    this._server = new net.Server();

    let self = this;
    this._server.on("connection", function(conn) {
      console.log(`${self._name} connection created`);

      let connection = conn;
      connection.setEncoding("utf-8");

      connection.addListener("data", function(buffer) {
        let request = JSON.parse(buffer);
        console.log("Receiving", request);
        if(request.rpc) {
          // console.log(request.rpc, this, request);
          self.emit(request.rpc, this, request);
        } else {
          let error = "Unable to process request.";
          console.error(error);
          self._connection.write({
            rpc: "remote_peer_error",
            data: error
          })
        }
      });
      connection.once("close", self.handleConnClose);
      connection.addListener("error", self.handleConnError);
      connection.addListener("timeout", self.handleConnTimeout);
    });

    this._server.on("close", function() {
      console.log(`${self._name} server closed`);
    });

    this._server.on("error", function(error) {
      console.log(`${self._name} error: ${error.message}`);
    });
  }

  listen(port, cb) {
    if(!this._server.listening) {
      this._server.listen(port, cb);
    }
  }

  handleConnClose() {

  }

  handleConnError() {

  }

  handleConnTimeout() {

  }

}

module.exports = TCPServer;