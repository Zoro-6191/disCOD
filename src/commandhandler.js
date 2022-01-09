// this module will look for user commands
require('rootpath')()
const {MessageEmbed} = require('discord.js')
const ErrorHandler = require('src/errorhandler')
const eventhandler = require('src/eventhandler')
const discordclient = require('src/discordclient')
const conf = require('conf')
const db = require('utils/database')
const { BitsToLevel, LevelToName } = require('utils/groupmanager').groupOperations

var prefix, themeColor
var bypassedcommands = []

module.exports.letsgo = async function()
{
    // forward commands to modules after checking for conditions ig

    prefix = conf.mainconfig.command.prefix
    themeColor = conf.mainconfig.themeColor
    bypassedcommands = conf.mainconfig.command.bypass

    // init commands
    var cmd = conf.command
    for( var i = 0; i < cmd.length; i++ )
    {
        if( !bypassedcommands.includes(cmd[i].name) )
            await require(`commands/${cmd[i].name}`).init()
                // .then( () => console.log(`Command Registered: `.green+cmd[i].name.yellow ) )
    }

    // begin
    discordclient.client.on( 'messageCreate', commandHandler )
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
            // console.error(err)
            ErrorHandler.minor(`Discord preventing sendTyping() as a security measure`) 
        })

    // time to get cmd object
    const commandObj = conf.command.find( zz => zz.name == cmd || (zz.aliases != undefined && zz.aliases.includes(cmd)) )

    if( commandObj == undefined )
        return msg.reply( { embeds: [ new MessageEmbed().setColor(themeColor).setDescription(`Unknown Command **${cmd}**`) ] } )

    // check if cmdlevel json file has our command defined
    if( commandObj.minpower == undefined )
    {
        msg.reply( { embeds: [ new MessageEmbed().setColor(themeColor).setDescription(`There was an error processing your command.`) ] } )
        return ErrorHandler.minor(`Command Level not defined for command '${cmd}'\nEdit './conf/conf_cmdlevel.json' to fix this.`)
    }

    // check whether cmder has permission for cmd here
    const result = await db.pool.query( `SELECT clients.*,discod.linked FROM discod,clients WHERE dc_id=${msg.author.id} AND clients.id=discod.b3_id` )
        .catch( err=>
        {
            msg.reply( { embeds: [ new MessageEmbed().setColor(themeColor).setDescription(`There was an error processing your command.`) ] } )
            ErrorHandler.fatal(err)
        })

    if( commandObj.minpower > 0 )
    {
        if( !result.length )    // not linked
            return msg.reply( { embeds: [ new MessageEmbed().setColor(themeColor).setTitle(`You haven't linked your B3 ID to disCOD yet.`).setDescription(`Type **__${prefix}link @(your B3ID)__** to link your account.\nDM any admin for help.`) ] })

        if( result[0].linked == '0' )    // not linked
            return msg.reply( { embeds: [ new MessageEmbed().setColor(themeColor).setTitle(`You haven't validated link yet`).setDescription(`Check DM to validate your account link.\nDM any admin for help.`) ] })

        // check clients' power
        var level = BitsToLevel( result[0].group_bits )

        if( level < commandObj.minpower )
            return msg.reply( { embeds: [ new MessageEmbed().setColor(themeColor).setTitle(`You don't have enough power to use **__${prefix}${cmd}__**`).setDescription(`You need to be atleast ${LevelToName(commandObj.minpower)} [${commandObj.minpower}]`) ] })
    }
   
    // check for cooldown here


    // forward to module
    console.log(`Command: ${content} by ${msg.author.tag}`)
    require(`commands/${commandObj.name}`).callback( msg, args, result[0] )

    // event command: command, arguments, commander
    eventhandler.bot.emit( 'command', cmd, args, result[0] )
}