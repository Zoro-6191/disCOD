require('rootpath')()
const ErrorHandler = require('src/errorhandler')
const fetch = require('node-fetch')
const { MessageEmbed } = require('discord.js')
const conf = require('conf')
const db = require('utils/database')

const description = `Locate a Player`
var prefix, themeColor, usage

module.exports =
{
    description,
    init: async function()
    {
        prefix = conf.mainconfig.command.prefix
        themeColor = conf.mainconfig.themeColor

        usage = `${prefix}locate @Mention/B3 ID`
        module.exports.usage = usage
    },

    callback: async function( msg, args, cmder )
    {
        if( !args.length )
            Entry = cmder.id
        else Entry = await db.getPlayerID(args[0])

        const result = await db.pool.query(`SELECT * FROM clients WHERE id=${Entry}`)
            .catch( err => 
            {
                msg.reply( { embeds: [ new MessageEmbed().setColor( themeColor ).setDescription('There was an Error while processing your command') ]})
                ErrorHandler.fatal( err )
            })

        const ipinforeq = await fetch(`http://ip-api.com/json/${result[0].ip}`)
        const ipinfo = await ipinforeq.json()

        const embed = new MessageEmbed()
            .setColor( themeColor )

        if( Entry == cmder.id )
            embed.setDescription(`You don't know your own location :D?`)
        else
        {
            if( args[0].startsWith('<@!'))
                embed.setDescription(`${args[0]} is from **${ipinfo.city}, ${ipinfo.regionName}, ${ipinfo.country}** :flag_${ipinfo.countryCode.toLowerCase()}:`)
            else embed.setDescription(`**${result[0].name}** is from **${ipinfo.city}, ${ipinfo.regionName}, ${ipinfo.country}** :flag_${ipinfo.countryCode.toLowerCase()}:`)
        }

        return msg.reply( { embeds: [embed]} )
    }
}