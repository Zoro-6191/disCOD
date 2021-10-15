require('rootpath')()
const ErrorHandler = require('src/errorhandler')
const { MessageEmbed } = require('discord.js')
const conf = require('conf')
const db = require('utils/database')
const groupManager = require('utils/groupmanager')

const description = ``
var prefix, themeColor, usage

module.exports =
{
    description,
    init: async function()
    {
        prefix = conf.mainconfig.command.prefix
        themeColor = conf.mainconfig.themeColor

        usage = `${prefix}mask <group token> @Mention/B3 ID\nAvailable Tokens:`

        const globalGroups = groupManager.globalGroups

        for( var i=0; i<globalGroups.length; i++ )
            usage += `\n\u200B\u200B${globalGroups[i].name} [${globalGroups[i].level}] - ${globalGroups[i].keyword}`

        module.exports.usage = usage
    },

    callback: async function( msg, args, cmder )
    {
        if( !args.length )
            return msg.reply( { embeds: [ new MessageEmbed().setColor( themeColor ).setTitle(`Invalid Entry`).setDescription(`Usage: ${usage}`) ]})

        const { isValidToken, KeywordToBits, BitsToName } = groupManager.groupOperations

        if( !isValidToken(args[0].toLowerCase()) )
            return msg.reply( { embeds: [ new MessageEmbed().setColor( themeColor ).setTitle(`Invalid Token Provided`).setDescription(`Usage: ${usage}`) ]})

        var Entry

        if( args[1] == undefined )
            Entry = cmder.id
        else Entry = await db.getPlayerID( args[1] )
            .catch( err => 
            {
                if( err == 'NO_LINK' )
                    msg.reply( { embeds: [ new MessageEmbed().setColor( themeColor ).setDescription(`${args[1]} hasn't linked their account yet`) ]})
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

        args[0] = args[0].toLowerCase()
        const maskbits = KeywordToBits( args[0] )

        const result = await db.pool.query(`SELECT * FROM clients WHERE id=${Entry}`)
            .catch( err =>
            {
                msg.reply( { embeds: [ new MessageEmbed().setColor( themeColor ).setDescription('There was an Error while processing your command') ]})
                ErrorHandler.fatal(err)
            })

        if( result[0].mask_level == maskbits )
        {
            if( Entry == cmder.id )
                return msg.reply( { embeds: [ new MessageEmbed().setColor( themeColor ).setDescription(`You're already masked as ${BitsToName(maskbits)}`) ]})
            else return msg.reply( { embeds: [ new MessageEmbed().setColor( themeColor ).setDescription(`**${result[0].name}** is already masked as **${BitsToName(maskbits)}**`) ]})
        }

        db.pool.query(`UPDATE clients SET mask_level=${maskbits} WHERE id=${Entry}`)
            .catch( err =>
            {
                msg.reply( { embeds: [ new MessageEmbed().setColor( themeColor ).setDescription('There was an Error while processing your command') ]})
                ErrorHandler.fatal(err)
            })
            .then( ()=>
            {
                if( Entry == cmder.id )
                    return msg.reply( { embeds: [ new MessageEmbed().setColor( themeColor ).setDescription(`Masked as **${BitsToName(maskbits)}**`) ]})
                else if( args[1].startsWith('<@!'))
                    return msg.reply( { embeds: [ new MessageEmbed().setColor( themeColor ).setDescription(`${args[1]} masked as **${BitsToName(maskbits)}**`) ]})
                else return msg.reply( { embeds: [ new MessageEmbed().setColor( themeColor ).setDescription(`**${result[0].name}** masked as **${BitsToName(maskbits)}**`) ]})
            })
    }
}