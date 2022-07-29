const TCPServer = require('./tcp_server');
class InterfaceManager extends TCPServer {

  constructor(webRtcConnection) {
    super("InterfaceManager");

    this._webRtcConnection = webRtcConnection;

    let self = this;
    this.on("create_webrtc_connection", async function(conn, req) {
      console.log("InterfaceManager creating new WebRTC connection");
      let created = await this._webRtcConnection.createOffer();
      console.log(`InterfaceManager createOffer(): ${created}`);
      if(created) {
        // console.log(self._connection);
        conn.write(JSON.stringify(
        {
          rpc: "set_webrtc_connection_status",
          data: self._webRtcConnection.toJson()
        }));
      }
    });

    this.on("answer_webrtc_connection", function(conn, req) {
      console.log("InterfaceManager answering WebRTC connection offer");
      this._webRtcConnection.applyAnswer(req.data);
    });
  }

  listen(port) {
    super.listen(port, function() {
      console.log(`InterfaceManager listening on port ${port}`);
    });
  }

  handleClose() {}
  handleError() {}
  handleTimeout() {}

}

module.exports = InterfaceManager;
