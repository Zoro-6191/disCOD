require('rootpath')()
const ErrorHandler = require('src/errorhandler')
const fetch = require('node-fetch')
const { MessageEmbed } = require('discord.js')
const conf = require('conf')
const db = require('utils/database')

const description = `Get Player's Internet Service Provider's name`
var prefix, themeColor, usage

module.exports =
{
    description,
    init: async function()
    {
        prefix = conf.mainconfig.command.prefix
        themeColor = conf.mainconfig.themeColor

        usage = `${prefix}isp @Mention/B3 ID`
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
            embed.setDescription(`Your ISP: **${ipinfo.isp}**`)
        else
        {
            if( args[0].startsWith('<@!'))
                embed.setDescription(`${args[0]}'s ISP: **${ipinfo.isp}**`)
            else embed.setDescription(`**${result[0].name}**'s ISP: **${ipinfo.isp}**`)
        }

        return msg.reply( { embeds: [embed]} )
    }
}