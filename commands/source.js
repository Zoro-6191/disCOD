require('rootpath')()
const fetch = require('node-fetch')
const { MessageEmbed } = require('discord.js')
const conf = require('conf')

const description = `Get Bot's Source repository link`
var prefix, themeColor, usage

const sourceLink = `https://api.github.com/repos/Zoro-6191/disCOD`

module.exports = 
{
    description,
    init: async function()
    {
        prefix = conf.mainconfig.command.prefix
        themeColor = conf.mainconfig.themeColor

        usage = `${prefix}source`
        module.exports.usage = usage
    },

    callback: async function( msg )
    {
        var f = await fetch(sourceLink)
        const data = await f.json()

        if( data?.message == 'Not Found' )
        {
            var embed = new MessageEmbed()
            .setColor( themeColor )
            .setTitle( `Not Found` )

            return msg.reply({embeds: [embed]})
        }

        if( data?.private )
        {
            var embed = new MessageEmbed()
            .setColor( themeColor )
            .setThumbnail(data.owner.avatar_url)
            .setTitle( `This bot is not Open Source :/` )
            .setDescription( `[${data.owner.html_url}](${data.owner.html_url})` )

            return msg.reply({embeds: [embed]})
        }

        var embed = new MessageEmbed()
            .setColor( themeColor )
            .setThumbnail(data?.owner?.avatar_url)
            .setTitle( `${data?.full_name}` )
            .setDescription(`[${data?.html_url}](${data?.html_url})
            Created: ${timeConvert(data?.created_at)}
            Last Updated: ${timeConvert(data?.updated_at)}
            Language: ${data?.language}`)

        embed.addField(`B3 Plugin`,`[https://github.com/jyotirmay-exe/b3-plugin-disCOD](https://github.com/jyotirmay-exe/b3-plugin-disCOD)`)

        msg.channel.send({embeds: [embed]})
    }
}

function timeConvert(str)
{
    str = str.split('Z')[0].split('T')

    var date = str[0]
    var time = str[1]

    return `${date} ${time}`
}