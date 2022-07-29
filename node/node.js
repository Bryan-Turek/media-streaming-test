const args = require('minimist')(process.argv.slice(2));
const path = require('path');

const envConfigFile = process.env.NODE_CONFIG_FILE;

function help() {
  console.log(`\
${path.basename(process.argv[1])} --config=config.json\
  `);
}

if(!(envConfigFile || args.config)) {
  console.error("Error: undefined configuration file.");
  help();
  process.exit(1);
}

const config = require(args.config || envConfigFile);
console.log(config);

//Initialize the Audio and Video transceiver
const avTransceiver = require('./av_transceiver');
const AudioVideoTransceiver = new avTransceiver(config.av);

// Initialize Peers
const peerManager = require("./peer_manager");
const PeerManager = new peerManager(config.messaging);
PeerManager.on('addedPeers', function(peers) {
  AudioVideoTransceiver.setPeers(peers);
});
PeerManager.addPeers(config.peers);

//Initialize the WebRTC connection
const wrtcConnection = require('./webrtc_connection');
const WebRtcConnectionInstance = new wrtcConnection(AudioVideoTransceiver);

//Setup the InterfaceManager
const ifManager = require("./interface_manager");
const InterfaceManager = new ifManager(WebRtcConnectionInstance);
InterfaceManager.listen(config.interface_port);
