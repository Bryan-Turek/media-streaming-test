const { v4: uuidv4 } = require('uuid');
const TCPServer = require('./tcp_server');
const Peer = require('./peer');

class PeerManager extends TCPServer {

  constructor(config) {
    super("PeerManager");

    this._peers = {};

    super.listen(config.port, function() {
      console.log(`PeerManager listening for connection requests on socket localhost:${config.port}`)
    });

    let self = this;
    this.on("remote_peer_offer", function(conn, request) {
      let response = {
        rpc: "remote_peer_answer",
        data: {
          id: request.data.id,
        }
      }
      console.log("Sending", response);
      conn.write(JSON.stringify(response));
    });
  }

  addPeers(peers) {
    let self = this;
    peers.forEach(config => {
      let newPeer = new Peer(config);
      
      newPeer._peer_interface.addListener("remote_peer_answer", function(req) {
        console.log(self._peers[req.data.id]);
      });

      console.log(`Adding new peer: ${newPeer.id}`);
      this._peers[newPeer.id] = newPeer;
      newPeer.startConnectInterval();
    });
    self.emit('addedPeers', this._peers);
  }

}

module.exports = PeerManager;
