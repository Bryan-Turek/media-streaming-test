const express = require("express");
const router = express.Router();

const NodeInterface = require("../node_interface");

//initialize webrtc_connection if one does not exist
router.post('/api/v1/webrtc_connection', function(req, res) {
  NodeInterface.send({
    rpc: "create_webrtc_connection"
  });
  res.send({});
});

//get the webrtc_connection status
router.get('/api/v1/webrtc_connection', function(req, res) {
  res.send(NodeInterface.getWebRtcStatus());
});

//reply to webrtc offer with answer generated from client
router.post('/api/v1/webrtc_connection/answer', function(req, res) {
  NodeInterface.send({
    rpc: "answer_webrtc_connection",
    data: req.body
  });
  res.send({});
});

module.exports = router;