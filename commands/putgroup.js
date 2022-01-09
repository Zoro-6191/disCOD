require('rootpath')()
const ErrorHandler = require('src/errorhandler')
const { MessageEmbed } = require('discord.js')
const conf = require('conf')
const db = require('utils/database')
const groupManager = require('utils/groupmanager')

const description = `Change Group of a Player`
var prefix, themeColor, usage
var demotionsPluginEnabled = false

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

        // check for demotion table
        const result = await db.pool.query(`SHOW TABLES LIKE "demotions"`)
            .catch( ErrorHandler.fatal )

        if( result.length )
            demotionsPluginEnabled = true
    },

    callback: async function( msg, args, cmder )
    {
        const embed = new MessageEmbed().setColor(themeColor)
        
        if( !args.length )
            return msg.reply( { embeds: [ embed.setTitle(`Invalid Entry`).setDescription(`Usage: ${usage}`) ]})

        const { isValidToken, BitsToName, KeywordToBits } = require('utils/groupmanager').groupOperations

        const Entry = await db.getPlayerID( args[0] )
            .catch( err => 
            {
                if( err == 'NO_LINK' )
                    msg.reply( { embeds: [ embed.setDescription(`${args[0]} hasn't linked their account yet`) ]})
                else if( err == 'BAD_ENTRY' )
                    msg.reply( { embeds: [ embed.setTitle(`Invalid Entry`).setDescription(`Usage: ${module.exports.usage}`) ]})
                else if( err == 'MENTIONED_BOT' )
                    msg.reply( { embeds: [ embed.setDescription('Why are you mentioning a Bot bro :D?') ]})
                else if( err == 'WORLD_ID' )
                    msg.reply( { embeds: [ embed.setDescription(`ID @1 is Classified`) ]})
                    else if( err == 'NO_RESULT' )
                    msg.reply( { embeds: [ embed.setDescription(`No Player Found`) ]})
                else 
                {
                    msg.reply( { embeds: [ embed.setDescription('There was an Error while processing your command') ]})
                    ErrorHandler.fatal(err)
                }
            } )
        
        if( Entry == undefined )
            return

        if( !isValidToken( args[1] ))
            return msg.reply( { embeds: [ embed.setTitle(`Invalid Token Provided`).setDescription(`Usage: ${usage}`) ]})

        args[1] = args[1].toLowerCase()
        const bits = KeywordToBits( args[1] )

        const result = await db.pool.query(`SELECT * FROM clients WHERE id=${Entry}`)
            .catch( err =>
            {
                msg.reply( { embeds: [ embed.setDescription('There was an Error while processing your command') ]})
                ErrorHandler.fatal(err)
            })

        if( result[0].group_bits == bits )
        {
            if( Entry == cmder.id )
                return msg.reply( { embeds: [ embed.setDescription(`You're already ${BitsToName(bits)}`) ]})
            else return msg.reply( { embeds: [ embed.setDescription(`**${result[0].name}** is already **${BitsToName(bits)}**`) ]})
        }

        // check demotions table
        const check = await db.pool.query( `SELECT * FROM demotions WHERE client_id=${Entry}` )
            .catch( err =>
            {
                msg.reply( { embeds: [ embed.setDescription('There was an Error while processing your command') ]})
                ErrorHandler.fatal(err)
            })

        // console.log(check);

        if( check.length )
        {
            // entry of this id exists in demotions table
            // need to change inactive to 1
            await db.pool.query(`UPDATE demotions SET inactive=1 WHERE client_id=${Entry}`)
                .catch( err =>
                {
                    msg.reply( { embeds: [ embed.setDescription('There was an Error while processing your command') ]})
                    ErrorHandler.fatal(err)
                })
        }

        await db.pool.query(`UPDATE clients SET group_bits=${bits} WHERE id=${Entry}`)
            .catch( err =>
            {
                msg.reply( { embeds: [ embed.setDescription('There was an Error while processing your command') ]})
                ErrorHandler.fatal(err)
            })
            .then( ()=>
            {
                if( args[0].startsWith('<@!'))
                    return msg.reply( { embeds: [ embed.setDescription(`${args[0]} put in group **${BitsToName(bits)}**`) ]})
                else return msg.reply( { embeds: [ embed.setDescription(`**${result[0].name}** put in group **${BitsToName(bits)}**`) ]})
            })
    }
}