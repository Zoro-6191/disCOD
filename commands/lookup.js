require('rootpath')()
const ErrorHandler = require('src/errorhandler')
const { MessageEmbed } = require('discord.js')
const conf = require('conf')
const db = require('utils/database')

const description = `Lookup a player from their IGN`
var prefix, themeColor, usage

module.exports =
{
    description,
    init: async function()
    {
        prefix = conf.mainconfig.command.prefix
        themeColor = conf.mainconfig.themeColor

        usage = `${prefix}lookup <name>`
        module.exports.usage = usage
    },

    callback: async function( msg, args, cmder )
    {
        if( !args.length )
            return msg.reply( { embeds: [ new MessageEmbed().setColor( themeColor ).setTitle(`Invalid Entry`).setDescription(`Usage: ${usage}`) ]})

        args = args.join(' ')

        const result = await db.pool.query(`SELECT * FROM clients WHERE name LIKE "%${args}%" ORDER BY time_edit DESC LIMIT 12`)
            .catch( err => 
            {
                msg.reply( { embeds: [ new MessageEmbed().setColor( themeColor ).setDescription('There was an Error while processing your command') ]})
                ErrorHandler.fatal(err)
            })

        if( !result.length )
            return msg.reply( { embeds: [ new MessageEmbed().setColor( themeColor ).setDescription(`No results for **__${args}__**`) ]})

        const embed = new MessageEmbed()
            .setColor(themeColor)
            .setTitle(`${result.length} Player${result.length==1?'':'s'} Matching __${args}__`)

        for( i = 0; i < result.length; i++ )
            embed.addField(`${result[i].name}`,`@${result[i].id}`,true)

        return msg.reply( { embeds: [embed]} )
    }
}