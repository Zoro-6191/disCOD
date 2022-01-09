require('rootpath')()
const ErrorHandler = require('src/errorhandler')
const { MessageEmbed } = require('discord.js')
const conf = require('conf')
const db = require('utils/database')
const { LevelToName } = require('utils/groupmanager').groupOperations

const description = `Get a list of commands available to you or request info about any command`
var command, prefix, themeColor, usage

module.exports =
{
    description,
    init: async function()
    {
        prefix = conf.mainconfig.command.prefix
        themeColor = conf.mainconfig.themeColor

        usage = `${prefix}help <cmd?>`
        module.exports.usage = usage

        command = conf.command
    },

    callback: async function( msg, args, cmder )
    {
        const embed = new MessageEmbed().setColor(themeColor)
        
        if( args.length )
        {
            args[0] = args[0].toLowerCase()
            const commandObj = command.find( poop => poop.name == args[0] || (poop.aliases != undefined && poop.aliases.includes(args[0])) )
            
            if( commandObj == undefined )
                return msg.reply( { embeds: [ embed.setDescription(`Unknown Command **${args[0]}**`) ]})

            embed.setTitle(`Command: __${commandObj.name}__`)
                
            var str = `**Power**: ${await LevelToName(commandObj.minpower)}`
            str += `\n**Description:** ${require(`commands/${commandObj.name}`).description}`
            str += `\n**Usage:** ${require(`commands/${commandObj.name}`).usage}`

            if( commandObj.aliases != undefined )
            {
                if(  commandObj.aliases.length > 1 )
                    str += `\n**Aliases:** ${commandObj.aliases.join(', ')}`
                else if(  commandObj.aliases.length == 1 )
                    str += `\n**Alias:** ${commandObj.aliases[0]}`
            }

            embed.setDescription(`${str}`)
            return msg.reply( { embeds: [embed] })
        }
        else
        {
            var cmdstr = ``
            for( var i = 0; i < command.length; i++ )
            {
                cmdstr += command[i].name

                if( i < command.length - 1 )
                    cmdstr += `, `
            }

            embed.setTitle( `Available Commands:` )
                .setDescription( cmdstr )
                .setFooter(`Type !help <command> for more details on a command`)

            msg.reply( { embeds: [embed] } )
        }
    }
}