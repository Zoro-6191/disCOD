// this module will look for user commands
const {MessageEmbed} = require('discord.js')
const ErrorHandler = require.main.require('./src/errorhandler')
const eventhandler = require.main.require('./src/eventhandler')
const discordclient = require.main.require('./src/discordclient')
const fs = require('fs')
const conf = require.main.require('./conf')

var prefix, themeColor
var availableCommands = []
var bypassedcommands = []

module.exports.letsgo = function()
{
    // forward commands to modules after checking for conditions ig

    prefix = conf.mainconfig.command.prefix
    themeColor = conf.mainconfig.themeColor
    bypassedcommands = conf.mainconfig.command.bypass

    // get all file names in ./commands folder
    availableCommands = fs.readdirSync('./commands/')

    // call command init and remove .js
    for( i=0; i < availableCommands.length; i++ )
    {
        availableCommands[i] = availableCommands[i].split('.js')[0]
        if( bypassedcommands.includes( availableCommands[i] ) )
            continue
        
        require.main.require(`./commands/${availableCommands[i]}`).init()
    }

    // begin
    discordclient.client.on( 'messageCreate', async msg => commandHandler( msg ) )
}

async function commandHandler( msg )
{
    // <ref *1> Message {
    //     channelId: '625336821005680652',
    //     guildId: '549934207518900230',
    //     deleted: false,
    //     id: '887994081144365086',
    //     type: 'DEFAULT',
    //     system: false,
    //     content: 'test',
    //     author: User {
    //       id: '415138654416273408',
    //       bot: false,
    //       system: false,
    //       flags: UserFlags { bitfield: 0 },
    //       username: 'Zoro',
    //       discriminator: '6191',
    //       avatar: '6257218a97f04aea6c735f09cfda4239'
    //     },
    //     pinned: false,
    //     tts: false,
    //     nonce: '887993941545189376',
    //     embeds: [],
    //     components: [],
    //     attachments: Collection(0) [Map] {},
    //     stickers: Collection(0) [Map] {},
    //     createdTimestamp: 1631784687077,
    //     editedTimestamp: null,
    //     reactions: ReactionManager { message: [Circular *1] },
    //     mentions: MessageMentions {
    //       everyone: false,
    //       users: Collection(0) [Map] {},
    //       roles: Collection(0) [Map] {},
    //       _members: null,
    //       _channels: null,
    //       crosspostedChannels: Collection(0) [Map] {},
    //       repliedUser: null
    //     },
    //     webhookId: null,
    //     groupActivityApplication: null,
    //     applicationId: null,
    //     activity: null,
    //     flags: MessageFlags { bitfield: 0 },
    //     reference: null,
    //     interaction: null
    //   }

    if( msg.guild === null )    // guessing this is supposed to be DM.
        return msg.author.send(new MessageEmbed().setColor(themeColor).setTitle(`GTFO my DM fucking creep`)).catch(error=>{})

    var content = msg.content

    if( !content.length || !content.startsWith(prefix) || msg.author.bot )
        return

    content = content.trim()

    let tokens = content.split(/ +/)

    const cmd = tokens[0].toLowerCase().substring(prefix.length)    // remove prefix

    // create args
    tokens.shift()
    var args = tokens

    if( !cmd.length || bypassedcommands.includes(cmd) )
        return

    if( !availableCommands.includes(cmd) )
    {
        const emb = new MessageEmbed().setColor(themeColor).setTitle(`Unknown Command **__${prefix}${cmd}__**`)
        msg.reply( { embeds: [emb] } )
        return
    }
        

    // check whether cmder has permission for cmd here


    // check for cooldown here


    // forward to module
    require.main.require(`./commands/${cmd}`).callback( msg, args )

    eventhandler.bot.emit( 'command', cmd, args )
}