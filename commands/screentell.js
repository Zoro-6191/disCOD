require('rootpath')()
const ErrorHandler = require('src/errorhandler')
const { MessageEmbed } = require('discord.js')
const conf = require('conf')
const db = require('utils/database')
const rcontool = require('utils/rcontool')

const description = `Saybold PM to an online Player`
var prefix, themeColor, usage

module.exports =
{
    description,
    init: async function()
    {
        prefix = conf.mainconfig.command.prefix
        themeColor = conf.mainconfig.themeColor

        usage = `${prefix}screentell <slot> <text>`
        module.exports.usage = usage
    },

    callback: async function( msg, args, cmder )
    {
        if( !args.length )
            return msg.reply( { embeds: [ new MessageEmbed().setColor( themeColor ).setTitle(`Invalid Entry`).setDescription(`Usage: ${usage}`) ]})

        var str = args.join(' ')

        rcontool.rcontool.screentell(  `^5[disCOD] ^2${cmder.name}^7: ${str}` )
            .then( () => msg.reply( { embeds: [ new MessageEmbed().setColor( themeColor ).setDescription(`Message Sent`) ]}) )
            .catch( err => 
                {
                    msg.reply( { embeds: [ new MessageEmbed().setColor( themeColor ).setDescription(`There was an error processing your command`) ]})
                    ErrorHandler.fatal(err)
                })
    }
}