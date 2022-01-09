require('rootpath')()
const ErrorHandler = require('src/errorhandler')
const { MessageEmbed } = require('discord.js')
const conf = require('conf')
const db = require('utils/database')
const rcontool = require('utils/rcontool')

const description = `Restart Current Map`
var prefix, themeColor, usage

module.exports =
{
    description,
    init: async function()
    {
        prefix = conf.mainconfig.command.prefix
        themeColor = conf.mainconfig.themeColor

        usage = `${prefix}map_restart`
        module.exports.usage = usage
    },

    callback: async function( msg, args, cmder )
    {
        const embed = new MessageEmbed().setColor(themeColor)
        const rcon = rcontool.rcontool

        rcon.say(`^5[disCOD]: ^7Map Restarted by ^1${cmder.name} ^3@${cmder.id}`)

        for( var i=3; i>-1; i-- )
        {
            await wait(1000)
            if(i)
                rcon.say(`^5[disCOD]: ^2Restarting in ${i}..`)
        }        
        rcon.map_restart()
            .then( ()=>
            {
                msg.reply( { embeds: [ embed.setDescription(`Successfully Restarted the Map`) ]})
            })
            .catch( err =>
            {
                msg.reply( { embeds: [ embed.setDescription('There was an Error while processing your command') ]})
                ErrorHandler.fatal(err)
            })
    }
}

function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}