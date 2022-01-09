require('rootpath')()
const ErrorHandler = require('src/errorhandler')
const { MessageEmbed } = require('discord.js')
const conf = require('conf')
const db = require('utils/database')

const description = `Fetch Player's XLR Stats`
var prefix, themeColor, usage

module.exports =
{
    description,
    init: async function()
    {
        prefix = conf.mainconfig.command.prefix
        themeColor = conf.mainconfig.themeColor

        usage = `${prefix}xlrstats @Mention/B3 ID`
        module.exports.usage = usage
    },

    callback: async function( msg, args, cmder )
    {
        var Entry 

        if( !args.length )
            Entry = cmder.id
        else Entry = await db.getPlayerID( args[0] )
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
            } )
        
        if( Entry == undefined )
            return

        const zz = await db.pool.query(`SELECT name FROM clients WHERE id=${Entry}`)
            .catch( err => 
            {
                msg.reply( { embeds: [ new MessageEmbed().setColor( themeColor ).setDescription('There was an Error while processing your command') ]})
                ErrorHandler.fatal(err)
            })

        var Name = zz[0].name

        const result = await db.pool.query(`SELECT * FROM xlr_playerstats WHERE client_id=${Entry}`)
            .catch( err => 
            {
                msg.reply( { embeds: [ new MessageEmbed().setColor( themeColor ).setDescription('There was an Error while processing your command') ]})
                ErrorHandler.fatal(err)
            })

        if( result[0] == undefined )
        {
            if( Entry == cmder.id )
                return msg.reply( { embeds: [ new MessageEmbed().setColor( themeColor ).setDescription(`You haven't registered yet\nIn-game Command: **__!register__**`) ]})
            else return msg.reply( { embeds: [ new MessageEmbed().setColor( themeColor ).setDescription(`${args[0].startsWith('<@!')?args[0]:'**'+Name+'**'} hasn't registered yet\nIn-game Command: **__!register__**`) ]})
        }

        const embed = new MessageEmbed()
            .setColor(themeColor)
            .addField(`Kills`, `${result[0].kills}`, true)
            .addField(`Deaths`, `${result[0].deaths}`, true)
            .addField(`Assists`, `${result[0].assists}`, true)
            .addField(`KDR`, `${parseFloat(result[0].ratio).toFixed(2)}`, true)
            .addField(`Rounds Played`, `${result[0].rounds}`, true)
            .addField(`Max Killstreak`, `${result[0].winstreak}`, true)

        if( Entry == cmder.id )
            embed.setTitle(`Your XLR Stats`)
        else
        {
            embed.setTitle(`XLR Stats for __${Name}__ @${Entry}`)
            if( args[0] != undefined && !args[0].startsWith('<@!') )
            {
                const zz = await db.pool.query(`SELECT dc_id FROM discod WHERE b3_id=${Entry}`)
                if( zz.length )
                    embed.setDescription(`<@!${zz[0].dc_id}>`)
                else embed.setDescription(`${Name} hasn't linked to disCOD yet`)
            }
        }
        return msg.reply( { embeds: [embed]} )
    }
}