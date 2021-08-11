// this module is the entry point

// first reading and validating config
// then connecting to database
// then init cooldowns?
// then maybe connecting to discord bot client since theres so little that could go wrong
// then accepting commands

const eventhandler = require('./src/eventhandler')
const conf = require('./conf')
const db = require('./utils/database')


eventhandler.init()
conf.init()

eventhandler.bot.once('database_ready', ()=>
{
    // init other things
    console.log(`DB Ready`)
})