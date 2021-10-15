// this module will look for user commands
const {MessageEmbed} = require('discord.js')
const ErrorHandler = require.main.require('./src/errorhandler')
const eventhandler = require.main.require('./src/eventhandler')
const discordclient = require.main.require('./src/discordclient')
const fs = require('fs')
const conf = require.main.require('./conf')
const db = require.main.require('./utils/database')
const { BitsToLevel, LevelToName } = require.main.require('./utils/groupmanager').groupOperations

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

    msg.channel.sendTyping()
        .catch( err => 
        {
            console.error(err)
            console.log(`Discord preventing sendTyping() as a security measure`) 
        })

    if( !availableCommands.includes(cmd) )
        return msg.reply( { embeds: [ new MessageEmbed().setColor(themeColor).setTitle(`Unknown Command **__${prefix}${cmd}__**`) ] } )

    // check if cmdlevel json file has our command defined
    if( conf.cmdlevel[cmd] == undefined )
    {
        msg.reply( { embeds: [ new MessageEmbed().setColor(themeColor).setTitle(`There was an error processing your command.`) ] } )
        return ErrorHandler.minor(`Command Level not defined for command '${cmd}'\nEdit './conf/conf_cmdlevel.json' to fix this.`)
    }

    // check whether cmder has permission for cmd here
    const result = await db.pool.query( `SELECT clients.*,discod.linked FROM discod,clients WHERE dc_id=${msg.author.id} AND clients.id=discod.b3_id` )
        .catch( err=>
        {
            msg.reply( { embeds: [ new MessageEmbed().setColor(themeColor).setTitle(`There was an error processing your command.`) ] } )
            ErrorHandler.fatal(err)
        })

    if( conf.cmdlevel[cmd] )
    {
        if( !result.length )    // not linked
            return msg.reply( { embeds: [ new MessageEmbed().setColor(themeColor).setTitle(`You haven't linked your B3 ID to disCOD yet.`).setDescription(`Type **__${prefix}link @(your B3ID)__** to link your account.\nDM any admin for help.`) ] })

        if( result[0].linked == '0' )    // not linked
            return msg.reply( { embeds: [ new MessageEmbed().setColor(themeColor).setTitle(`You haven't validated link yet`).setDescription(`Check DM to validate your account link.\nDM any admin for help.`) ] })

        // check clients' power
        var level = BitsToLevel( result[0].group_bits )

        if( level < conf.cmdlevel[cmd] )
            return msg.reply( { embeds: [ new MessageEmbed().setColor(themeColor).setTitle(`You don't have enough power to use **__${prefix}${cmd}__**`).setDescription(`You need to be atleast ${LevelToName(conf.cmdlevel[cmd])} [${conf.cmdlevel[cmd]}]`) ] })
    }
   
    // check for cooldown here


    // forward to module
    console.log(`Command: ${content} by ${msg.author.tag}`)
    require.main.require(`./commands/${cmd}`).callback( msg, args, result[0] )

    eventhandler.bot.emit( 'command', cmd, args )
}