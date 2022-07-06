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
NodeInterface = require("./node_interface");
NodeInterface.connect(config.node_interface);

const bodyParser = require('body-parser');
const express = require("express");

const app = express();

const server = require("http").Server(app);

app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(bodyParser.json());

app.get("/", (req, res) => {
    res.render("room", {roomId: 1});
});

app.use(require("./v1/webrtc_connection"));

server.listen(3030);
