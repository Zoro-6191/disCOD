require('rootpath')()
const ErrorHandler = require('src/errorhandler')
const { MessageEmbed } = require('discord.js')
const conf = require('conf')
const db = require('utils/database')

const description = `Get a list of Available Gametypes`
var prefix, themeColor, usage, gametypeObj

module.exports =
{
    description,
    init: async function()
    {
        prefix = conf.mainconfig.command.prefix
        themeColor = conf.mainconfig.themeColor

        usage = `${prefix}gametypes`
        module.exports.usage = usage

        gametypeObj = require('utils/gametypes').GlobalGametypes
    },

    callback: async function( msg, args )
    {
        // get gametypes and print ez
        var embed = new MessageEmbed().setColor(themeColor).setTitle(`Available Gametypes:`)

        var descStr = `\n`

        for( var i = 0; i < gametypeObj.length; i++ )
        {
            descStr += gametypeObj[i].name + ' - `' + gametypeObj[i].token +'`' 
            descStr += `\n`
        }

        embed.setFooter(`Type !gametype <token> to change gametype`)

        msg.reply( { embeds: [embed.setDescription(`${descStr}`)] } )
    }
}