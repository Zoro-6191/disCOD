// this module is the entry point
const eventhandler = require('./src/eventhandler')
const conf = require('./conf')
const db = require('./utils/database')
const rcontool = require('./utils/rcontool')
const groupmanager = require('./utils/groupmanager')
const maps = require('./utils/maps')
const gametypes = require('./utils/gametypes')
const cooldownmanager = require('./src/cooldownmanager')
const discordclient = require('./src/discordclient')
const commandhandler = require('./src/commandhandler')
const plugins = require('./plugins')

eventhandler.init()
conf.init()
db.init()

eventhandler.bot.once('database_ready', async()=>
{
    await rcontool.initRcon()
    await cooldownmanager.init()
    await groupmanager.init()
    await maps.init()
    await gametypes.init()

    // now connect to discord?    
    discordclient.init()
})

eventhandler.bot.once( 'ready', ()=>
{
    plugins.init()
    commandhandler.letsgo()
})