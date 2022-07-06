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

const InterfaceManager = require("./interface_manager");
InterfaceManager.listen(config.interface_port);