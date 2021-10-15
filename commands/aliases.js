require('rootpath')()
const ErrorHandler = require('src/errorhandler')
const { MessageEmbed } = require('discord.js')
const conf = require('conf')
const db = require('utils/database')

const description = `Check Player's In-game Aliases`
var prefix, themeColor, usage

module.exports =
{
    description,
    init: async function()
    {
        prefix = conf.mainconfig.command.prefix
        themeColor = conf.mainconfig.themeColor

        usage = `${prefix}aliases @Mention/B3 ID`
        module.exports.usage = usage
    },

    callback: async function( msg, args )
    {
        if( !args.length )
            return msg.reply( { embeds: [ new MessageEmbed().setColor( themeColor ).setDescription('You need to include B3 @ID of a player.') ]})

        const Entry = await db.getPlayerID( args[0] )
            .catch( err => 
            {
                if( err == 'NO_LINK' )
                    msg.reply( { embeds: [ new MessageEmbed().setColor( themeColor ).setDescription(`${args[0]} hasn't linked their account yet`) ]})
                else if( err == 'BAD_ENTRY' )
                    msg.reply( { embeds: [ new MessageEmbed().setColor( themeColor ).setDescription('Invalid Entry') ]})
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

        const result = await db.pool.query( `SELECT clients.name,clients.mask_level,aliases.alias FROM clients,aliases WHERE clients.id = ${parseInt(Entry)} AND aliases.client_id=clients.id` )
            .catch( err => 
            {
                ErrorHandler.minor( err )
                return msg.reply( { embeds: [ new MessageEmbed().setColor(themeColor).setDescription('There was an Error while processing your command') ] } )
            })

        if( result[0] === undefined )
            return msg.reply( { embeds: [ new MessageEmbed().setColor(themeColor).setDescription('There was an Error while processing your command') ] } )

        var aliasString = ""

        for( var zz of result )
            aliasString += `${zz.alias}, `

        if( aliasString.length > 1975 )     // embed descriptions limit 2000chars
            aliasString = aliasString.slice(0,1975) + ' ...__**[and more]**__'

        const embed = new MessageEmbed()
            .setColor( themeColor )
            .setTitle( `__${result[0].name}__'s Aliases (@${Entry})` )
            .setDescription( `${(result[0].mask_level>0)? result[0].name:aliasString}` )

        msg.reply( { embeds: [embed] } )
    }
}