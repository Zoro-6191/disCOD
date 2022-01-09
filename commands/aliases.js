require('rootpath')()
const ErrorHandler = require('src/errorhandler')
const { MessageEmbed } = require('discord.js')
const conf = require('conf')
const db = require('utils/database')

var prefix, themeColor, usage

module.exports =
{
    description: `Check Player's In-game Aliases` ,
    init: async function()
    {
        prefix = conf.mainconfig.command.prefix
        themeColor = conf.mainconfig.themeColor

        usage = `${prefix}aliases @Mention/B3 ID`
        module.exports.usage = usage
    },

    callback: async function( msg, args )
    {
        const embed = new MessageEmbed()
            .setColor(themeColor)
            
        if( !args.length )
            return msg.reply( { embeds: [ embed.setDescription(`**Invalid Entry**\nUsage: ${module.exports.usage}`) ]})

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

        const result = await db.pool.query( `SELECT clients.name,clients.mask_level,aliases.alias FROM clients,aliases WHERE clients.id = ${Entry} AND aliases.client_id=clients.id` )
            .catch( err => 
            {
                ErrorHandler.minor( err )
                return msg.reply( { embeds: [ embed.setDescription('There was an Error while processing your command') ] } )
            })

        if( result[0] === undefined )
            return msg.reply( { embeds: [ embed.setDescription('There was an Error while processing your command') ] } )

        var aliasString = "`";

        for( var zz of result )
            aliasString += `${zz.alias}, `;
        
        aliasString += "`";

        if( aliasString.length > 1975 )     // embed descriptions limit 2000chars
            aliasString = aliasString.slice(0,1975) + ' ...__**[and more]**__';

        embed.setTitle( `__${result[0].name}__'s Aliases (@${Entry})` )
            .setDescription( `${(result[0].mask_level>0)? result[0].name:aliasString}` )

        msg.reply( { embeds: [embed] } );
    }
}