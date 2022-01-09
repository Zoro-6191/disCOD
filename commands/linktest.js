require('rootpath')()
const ErrorHandler = require('src/errorhandler')
const { MessageEmbed } = require('discord.js')
const conf = require('conf')
const db = require('utils/database')

const description = `Test Player's disCOD Link`
var prefix, themeColor, usage

module.exports =
{
    description,
    init: async function()
    {
        prefix = conf.mainconfig.command.prefix
        themeColor = conf.mainconfig.themeColor

        usage = `${prefix}linktest @Mention/B3 ID`
        module.exports.usage = usage
    },

    callback: async function( msg, args, cmder )
    {
        const embed = new MessageEmbed().setColor(themeColor)

        if( !args.length )
            Entry = cmder.id
        else Entry = await db.getPlayerID( args[0] )
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

        const result = await db.pool.query(`SELECT name,dc_id,linked,linktime,discod.time_add FROM clients,discod WHERE clients.id=${Entry} AND discod.b3_id=clients.id`)
            .catch( err =>
            {
                msg.reply( { embeds: [ embed.setDescription('There was an Error while processing your command') ]})
                ErrorHandler.fatal(err)
            })

        if( !result.length )
        {
            // id/mention isnt linked
            if( !args.length )
                return msg.reply( { embeds: [ embed.setDescription(`You haven't linked disCOD to in-game ID`) ]})

            if( args[0].startsWith(`<@`) )
                return msg.reply( { embeds: [ embed.setDescription(`${args[0]} hasn't linked their B3 ID to disCOD`) ]})
            else
            {
                const name = (await db.pool.query(`SELECT name FROM clients WHERE id=${Entry}`))[0].name
                return msg.reply( { embeds: [ embed.setDescription(`**${name} @${Entry}** hasn't linked their B3 ID to disCOD`) ]})
            }
        }

        if( result[0].linked == '0' )
        {
            if( Entry == cmder.id )
                return msg.reply( { embeds: [ embed.setDescription(`You haven't validated your link yet. Check DM.`) ]})
            else if( args[0].startsWith('<@') )
                return msg.reply( { embeds: [ embed.setDescription(`${args[0]} hasn't validated their link yet`) ]})
            else
            {
                const name = (await db.pool.query(`SELECT name FROM clients WHERE id=${Entry}`))[0].name
                return msg.reply( { embeds: [ embed.setDescription(`**${name} @${Entry}** hasn't validated their link yet`) ]})
            } 
        }

        var at = new Date(result[0].linktime * 1000).toLocaleString("en-US", { dateStyle: 'full', timeZone: conf.mainconfig.timezone } )

        if( Entry == cmder.id )
            return msg.reply( { embeds: [ embed.setDescription(`You have linked disCOD to **@${Entry}** at **${at}**`) ]})
        else if( args[0].startsWith('<@') )
            return msg.reply( { embeds: [ embed.setDescription(`${args[0]} has linked disCOD to **@${Entry}** at **${at}**`) ]})
        else
        {
            const name = (await db.pool.query(`SELECT name FROM clients WHERE id=${Entry}`))[0].name
            return msg.reply( { embeds: [ embed.setDescription(`**${name} @${Entry}** has linked disCOD to in-game ID at **${at}**`) ]})
        } 
    }
}