require('rootpath')()
const ErrorHandler = require('src/errorhandler')
const { MessageEmbed } = require('discord.js')
const conf = require('conf')
const db = require('utils/database')
const groupManager = require('utils/groupmanager')

const description = `Change Group of a Player`
var prefix, themeColor, usage

module.exports =
{
    description,
    init: async function()
    {
        prefix = conf.mainconfig.command.prefix
        themeColor = conf.mainconfig.themeColor

        usage = `${prefix}putgroup @Mention/B3 ID <group token>\nAvailable Tokens:`

        const globalGroups = groupManager.globalGroups

        for( var i=0; i<globalGroups.length; i++ )
            usage += `\n\u200B\u200B${globalGroups[i].name} [${globalGroups[i].level}] - ${globalGroups[i].keyword}`

        module.exports.usage = usage
    },

    callback: async function( msg, args, cmder )
    {
        if( !args.length )
            return msg.reply( { embeds: [ new MessageEmbed().setColor( themeColor ).setTitle(`Invalid Entry`).setDescription(`Usage: ${usage}`) ]})

        const { isValidToken, BitsToName, KeywordToBits } = require('utils/groupmanager').groupOperations

        const Entry = await db.getPlayerID( args[0] )
            .catch( err => 
            {
                if( err == 'NO_LINK' )
                    msg.reply( { embeds: [ new MessageEmbed().setColor( themeColor ).setDescription(`${args[0]} hasn't linked their account yet`) ]})
                else if( err == 'BAD_ENTRY' )
                    msg.reply( { embeds: [ new MessageEmbed().setColor( themeColor ).setTitle(`Invalid Entry`).setDescription(`Usage: ${usage}`) ]})
                else if( err == 'WORLD_ID' )
                    msg.reply( { embeds: [ new MessageEmbed().setColor( themeColor ).setDescription(`ID @1 is Classified`) ]})
                else 
                {
                    msg.reply( { embeds: [ new MessageEmbed().setColor( themeColor ).setDescription('There was an Error while processing your command') ]})
                    ErrorHandler.fatal(err)
                }
                args = null
            } )

        if( args == null )
            return

        if( !isValidToken( args[1] ))
            return msg.reply( { embeds: [ new MessageEmbed().setColor( themeColor ).setTitle(`Invalid Token Provided`).setDescription(`Usage: ${usage}`) ]})

        args[1] = args[1].toLowerCase()
        const bits = KeywordToBits( args[1] )

        const result = await db.pool.query(`SELECT * FROM clients WHERE id=${Entry}`)
            .catch( err =>
            {
                msg.reply( { embeds: [ new MessageEmbed().setColor( themeColor ).setDescription('There was an Error while processing your command') ]})
                ErrorHandler.fatal(err)
            })

        if( result[0].group_bits == bits )
        {
            if( Entry == cmder.id )
                return msg.reply( { embeds: [ new MessageEmbed().setColor( themeColor ).setDescription(`You're already ${BitsToName(bits)}`) ]})
            else return msg.reply( { embeds: [ new MessageEmbed().setColor( themeColor ).setDescription(`**${result[0].name}** is already **${BitsToName(bits)}**`) ]})
        }

        db.pool.query(`UPDATE clients SET group_bits=${bits} WHERE id=${Entry}`)
            .catch( err =>
            {
                msg.reply( { embeds: [ new MessageEmbed().setColor( themeColor ).setDescription('There was an Error while processing your command') ]})
                ErrorHandler.fatal(err)
            })
            .then( ()=>
            {
                if( args[0].startsWith('<@!'))
                    return msg.reply( { embeds: [ new MessageEmbed().setColor( themeColor ).setDescription(`${args[0]} put in group **${BitsToName(bits)}**`) ]})
                else return msg.reply( { embeds: [ new MessageEmbed().setColor( themeColor ).setDescription(`**${result[0].name}** put in group **${BitsToName(bits)}**`) ]})
            })
    }
}