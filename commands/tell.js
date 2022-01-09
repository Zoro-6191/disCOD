require('rootpath')()
const {MessageEmbed} = require('discord.js')
const ErrorHandler = require('src/errorhandler')
const conf = require('conf')
const db = require('utils/database')
const rcontool = require('utils/rcontool')

const description = `Chat PM a Player in-game`
var prefix, themeColor, usage

module.exports =
{
    description,
    init: async function()
    {
        prefix = conf.mainconfig.command.prefix
        themeColor = conf.mainconfig.themeColor

        usage = `${prefix}tell <slot> <text>`
        module.exports.usage = usage
    },

    callback: async function( msg, args, cmder )
    {
	    var embed = new MessageEmbed().setColor(themeColor)

	    if( args.length < 2 || parseInt( args[0] ) < 0 || parseInt(args[0]) > 64 )
	        return msg.reply( { embeds: [embed.setTitle(`Invalid Entry`).setDescription(`Usage: ${usage}`)] } )

        var str = args.join(' ')
        var slot = parseInt(args[0])

        rcon = rcontool.rcontool

        // to-do: check if slot is good/filled

        rcon.tell( slot,`^5[disCOD]: ^2${cmder.name} ^3@${cmder.id}^7: ${str}`)
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