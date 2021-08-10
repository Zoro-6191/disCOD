// this module is the entry point

// first reading and validating config
// then connecting to database
// then init cooldowns?
// then maybe connecting to discord bot client since theres so little that could go wrong
// then accepting commands

const eventhandler = require('./src/eventhandler')
const conf = require('./conf')



eventhandler.init()
conf.init()