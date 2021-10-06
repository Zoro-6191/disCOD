const ErrorHandler = require.main.require('./src/errorhandler')
const { MessageEmbed } = require('discord.js')
const conf = require.main.require('./conf')
const db = require.main.require('./utils/database')
const rcontool = require.main.require('./utils/rcontool')

const description = `Saybold text In-game`
var prefix, themeColor, usage

module.exports =
{
    description,
    init: async function()
    {
        prefix = conf.mainconfig.command.prefix
        themeColor = conf.mainconfig.themeColor

        usage = `${prefix}screensay <text>`
        module.exports.usage = usage
    },

    callback: async function( msg, args, cmder )
    {
        if( !args.length )
            return msg.reply( { embeds: [ new MessageEmbed().setColor( themeColor ).setTitle(`Invalid Entry`).setDescription(`Usage: ${usage}`) ]})

        var str = args.join(' ')

        rcontool.rcontool.screensay(`^5[disCOD] ^2${cmder.name}^7: ${str}`)
            .then( () => msg.reply( { embeds: [ new MessageEmbed().setColor( themeColor ).setDescription(`Message Sent`) ]}) )
            .catch( err => 
                {
                    msg.reply( { embeds: [ new MessageEmbed().setColor( themeColor ).setDescription(`There was an error processing your command`) ]})
                    ErrorHandler.fatal(err)
                })
    }
}