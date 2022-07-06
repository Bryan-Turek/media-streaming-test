const net = require('net');
const EventEmitter = require('events');
const WebRtcConnection = require('./webrtc_connection');

class InterfaceManager extends EventEmitter {

  constructor() {
    super();
    this._server = new net.Server();

    var self = this;
    this._server.on("connection", function(conn) {
      console.log("Connection created");

      self._connection = conn;
      self._connection.setEncoding("utf-8");

      self._connection.on("data", function(buffer) {
        let request = JSON.parse(buffer);
        console.log(request);
        if(request.rpc) {
          self.emit(request.rpc, request);
        } else {
          let error = "Unable to process request.";
          console.error(error);
          self._connection.write({
            success: false,
            message: error
          })
        }
      });

      self._connection.once("close", self.handleClose);
      self._connection.on("error", self.handleError);
      self._connection.on("timeout", self.handleTimeout);
    });

    this._server.on("close", function() {
      console.log("InterfaceManager server closed");
    });

    this._server.on("error", function(error) {
      console.log(`InterfaceManager error: ${error.message}`);
    });

    this.on("create_webrtc_connection", async function(req) {
      console.log("InterfaceManager creating new WebRTC connection");
      let created = await WebRtcConnection.createOffer();
      console.log(`InterfaceManager createOffer(): ${created}`);
      if(created) {
        // console.log(self._connection);
        self._connection.write(JSON.stringify(
        {
          rpc: "set_webrtc_connection_status",
          data: WebRtcConnection.toJson()
        }));
      }
    });

    this.on("answer_webrtc_connection", function(req) {
      console.log("InterfaceManager answering WebRTC connection offer");
      WebRtcConnection.applyAnswer(req.data);
    });
  }

  listen(port) {
    if(!this._server.listening) {
      this._server.listen(port, function() {
        console.log(`InterfaceManager listening for connection requests on socket localhost:${port}`)
      });
    }
  }

  handleClose() {}
  handleError() {}
  handleTimeout() {}

}

module.exports = new InterfaceManager();
