// this module connects to discord
const ErrorHandler = require.main.require('./src/errorhandler')
const Discord = require('discord.js')
const conf = require.main.require('./conf')
const eventhandler = require.main.require('./src/eventhandler')
require('colors')

var prefix, themeColor

module.exports = 
{
    init: function()
    {
        prefix = conf.mainconfig.command.prefix
        themeColor = conf.mainconfig.themeColor

        var client = new Discord.Client({ 
            intents: 
            [
                'DIRECT_MESSAGES',
                'DIRECT_MESSAGE_REACTIONS',
                'DIRECT_MESSAGE_TYPING',
                'GUILDS',
                'GUILD_BANS',
                'GUILD_EMOJIS_AND_STICKERS',
                'GUILD_INTEGRATIONS',
                'GUILD_INVITES',
                'GUILD_MEMBERS', 
                'GUILD_MESSAGES', 
                'GUILD_MESSAGE_REACTIONS',
                'GUILD_MESSAGE_TYPING',
                'GUILD_PRESENCES',
                'GUILD_VOICE_STATES',
                'GUILD_WEBHOOKS'
            ],
            partials: ['MESSAGE', 'CHANNEL', 'REACTION']
        })

        client.login( conf.mainconfig.discord_token )

        client.once( 'ready', ()=> {
            logTime()
            eventhandler.bot.emit('ready')
        } )

        module.exports.client = client
    }
}

async function logTime()
{
    var fulltime = new Date().toTimeString().split(' ')[0].split(':')   // idk any better method
    var hour = fulltime[0], minutes = fulltime[1]

    console.log(`\n Bot Started at ${parseInt(hour)>12?(parseInt(hour)-12):hour}:${minutes} ${parseInt(hour)>12?'PM':'AM'} `.red.bgWhite.bold + ' \n'.reset)
}