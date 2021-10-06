const ErrorHandler = require.main.require('./src/errorhandler')
const { MessageEmbed } = require('discord.js')
const conf = require.main.require('./conf')
const db = require.main.require('./utils/database')
const rcontool = require.main.require('./utils/rcontool')

const description = `Send text to In-game Chat`
var prefix, themeColor, usage

module.exports =
{
    description,
    init: async function()
    {
        prefix = conf.mainconfig.command.prefix
        themeColor = conf.mainconfig.themeColor

        usage = `${prefix}say <text>`
        module.exports.usage = usage
    },

    callback: async function( msg, args, cmder )
    {
        if( !args.length )
            return msg.reply( { embeds: [ new MessageEmbed().setColor( themeColor ).setTitle('Invalid Entry.').setDescription(`Usage: ${usage}`) ]})
        
        var str = args.join(' ')

        rcon = rcontool.rcontool

        rcon.say(`^5[disCOD]: ^2${cmder.name} ^3@${cmder.id}^7: ${str}`)
            .then( ()=>
            {
                msg.reply( { embeds: [ new MessageEmbed().setColor( themeColor ).setDescription(`Message Sent`) ]})
            })
            .catch( err =>
            {
                msg.reply( { embeds: [ new MessageEmbed().setColor( themeColor ).setDescription('There was an Error while processing your command') ]})
                ErrorHandler.fatal(err)
            })
    }
}