require('rootpath')()
const ErrorHandler = require('src/errorhandler')
const { MessageEmbed } = require('discord.js')
const conf = require('conf')
const db = require('utils/database')

const description = `Get info about bans on a Player`
var prefix, themeColor, usage

module.exports =
{
    description,
    init: async function()
    {
        prefix = conf.mainconfig.command.prefix
        themeColor = conf.mainconfig.themeColor

        usage = `${prefix}baninfo @Mention/B3 ID`
        module.exports.usage = usage
    },

    callback: async function( msg, args, cmder )
    {
        if( !args.length )
            return msg.reply( { embeds: [ new MessageEmbed().setColor( themeColor ).setDescription('You need to include B3 @ID of a player.') ]})

        const Entry = await db.getPlayerID( args[0] )
            .catch( err => 
            {
                if( err == 'NO_LINK' )
                    msg.reply( { embeds: [ new MessageEmbed().setColor( themeColor ).setDescription(`${args[0]} hasn't linked their account yet`) ]})
                    else if( err == 'BAD_ENTRY' )
                    msg.reply( { embeds: [ new MessageEmbed().setColor( themeColor ).setTitle(`Invalid Entry`).setDescription(`Usage: ${module.exports.usage}`) ]})
                else if( err == 'MENTIONED_BOT' )
                    msg.reply( { embeds: [ new MessageEmbed().setColor( themeColor ).setDescription('Why are you mentioning a Bot bro :D?') ]})
                else if( err == 'WORLD_ID' )
                    msg.reply( { embeds: [ new MessageEmbed().setColor( themeColor ).setDescription(`ID @1 is Classified`) ]})
                else if( err == 'NO_RESULT' )
                    msg.reply( { embeds: [ new MessageEmbed().setColor( themeColor ).setDescription(`No Player Found`) ]})
                else 
                {
                    msg.reply( { embeds: [ new MessageEmbed().setColor( themeColor ).setDescription('There was an Error while processing your command') ]})
                    ErrorHandler.fatal(err)
                }
                args = null
            } )

        if( Entry == undefined )
            return

        const result = await db.pool.query(`
            SELECT 
                * 
            FROM 
                clients,penalties 
            WHERE
                clients.id = ${Entry}
                AND client_id = ${Entry} 
                AND TYPE IN ("Ban","Tempban") 
                AND inactive = 0 AND (time_expire = -1 or time_expire > UNIX_TIMESTAMP())
            ORDER BY penalties.time_add DESC LIMIT 1
            `)
            .catch( err => 
                {
                    msg.reply( { embeds: [ new MessageEmbed().setColor(themeColor).setDescription('There was an Error while processing your command') ] } )
                    ErrorHandler.fatal( err )
                })

        if( !result.length )
        {
            const zz = await db.pool.query(`SELECT name FROM clients WHERE id=${Entry}`)
            return msg.reply( { embeds: [ new MessageEmbed().setColor(themeColor).setDescription(`**${zz[0].name}** has no active bans`) ] } )
        }

        const adminName = (await db.pool.query(`SELECT name FROM clients WHERE id=${result[0].admin_id}`))[0].name
            
        var embed = new MessageEmbed()
            .setColor( themeColor )
            .setTitle(`${result[0].type}`)
            .setDescription(`**__${result[0].name}__** @${result[0].client_id}`)
            .addField( `Admin` , `**${adminName}** @${result[0].admin_id}` , true )
            .addField( `Time of Ban` , `${new Date(result[0].time_add*1000).toLocaleString()}` , true )
            .addField( `Ban Expiry` , `${result[0].time_expire==-1?'Never':new Date(result[0].time_add*1000).toLocaleString()}` , true )
            

        if( result[0].reason != '' )
            embed.addField( `Reason`, `${result[0].reason}`, false )

        return msg.reply( { embeds: [ embed ] } )
    }
}