require('rootpath')()
const ErrorHandler = require('src/errorhandler')
const { MessageEmbed } = require('discord.js')
const conf = require('conf')
const db = require('utils/database')
const rcontool = require('utils/rcontool')

const description = `Similar to in-game !scream`
var prefix, themeColor, usage

module.exports =
{
    description,
    init: async function()
    {
        prefix = conf.mainconfig.command.prefix
        themeColor = conf.mainconfig.themeColor

        usage = `${prefix}scream <text>`
        module.exports.usage = usage
    },

    callback: async function( msg, args, cmder )
    {
        var embed = new MessageEmbed().setColor( themeColor );
        
        if( !args.length )
            return msg.reply( { embeds: [ embed.setTitle(`Invalid Entry`).setDescription(`Usage: ${usage}`) ]});

        args = args.join( ' ' )
        
        const rcon = rcontool.rcontool

        rcon.say( `^5[disCOD]^7: ^2${cmder.name} ^3@${cmder.id}^7:` )
        var r = msg.reply( {embeds: [embed.setDescription(`Screaming "${args}"`)]} )

        for( var i = 1; i < 6; i++ )
        {
            rcon.say( `^${i}${args}` )
            await wait( 500 )
        }

        // r.edit( {embeds: [embed.setDescription(`Done`)]} )
    }
}

function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}