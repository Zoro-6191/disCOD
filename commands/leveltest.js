require('rootpath')()
const ErrorHandler = require('src/errorhandler')
const { MessageEmbed } = require('discord.js')
const conf = require('conf')
const db = require('utils/database')
const { BitsToName, BitsToLevel } = require('utils/groupmanager').groupOperations

const description = `Check admin level of a Player`
var prefix, themeColor, usage, highestLevel

module.exports =
{
    description,
    init: async function()
    {
        prefix = conf.mainconfig.command.prefix
        themeColor = conf.mainconfig.themeColor

        usage = `${prefix}leveltest @Mention/B3 ID`
        module.exports.usage = usage

        highestLevel = require('utils/groupmanager').highestLevel
    },

    callback: async function( msg, args, cmder )
    {
        const embed = new MessageEmbed().setColor(themeColor)

        if( !args.length )
            Entry = cmder.id
        else Entry = await db.getPlayerID( args[0] )
            .catch( err => 
            {
                if( err == 'NO_LINK' )
                    msg.reply( { embeds: [ embed.setDescription(`${args[0]} hasn't linked their account yet`) ]})
                else if( err == 'BAD_ENTRY' )
                    msg.reply( { embeds: [ embed.setTitle(`Invalid Entry`).setDescription(`Usage: ${module.exports.usage}`) ]})
                else if( err == 'MENTIONED_BOT' )
                    msg.reply( { embeds: [ embed.setDescription('Why are you mentioning a Bot bro :D?') ]})
                else if( err == 'WORLD_ID' )
                    msg.reply( { embeds: [ embed.setDescription(`ID @1 is Classified`) ]})
                else if( err == 'NO_RESULT' )
                    msg.reply( { embeds: [ embed.setDescription(`No Player Found`) ]})
                else 
                {
                    msg.reply( { embeds: [ embed.setDescription('There was an Error while processing your command') ]})
                    ErrorHandler.fatal(err)
                }
            } )
        
        if( Entry == undefined )
            return

        const result = await db.pool.query(`SELECT name,group_bits,mask_level,time_add FROM clients WHERE id=${Entry}`)
            .catch( err =>
            {
                msg.reply( { embeds: [ embed.setDescription('There was an Error while processing your command') ]})
                ErrorHandler.fatal(err)
            })

        // console.log(result);

        var GroupName = BitsToName(result[0].group_bits)
        var sinceStr = new Date(result[0].time_add * 1000).toLocaleString("en-US", { dateStyle: 'full', timeZone: conf.mainconfig.timezone } )

        if( BitsToLevel(cmder.group_bits) == highestLevel )
        {
            if( result[0].mask_level > 0 )
            {
                var MaskName = BitsToName(result[0].mask_level)

                if( Entry == cmder.id )
                    embed.setDescription(`You're **${GroupName}** (Masked ${MaskName}) since ${sinceStr}`)
                else if( args[0].startsWith('<@!'))
                     embed.setDescription(`${args[0]} is **${GroupName}** (Masked ${MaskName}) since ${sinceStr}`)
                else embed.setDescription(`**${result[0].name}** is **${GroupName}** (Masked ${MaskName}) since ${sinceStr}`)
            }
            else
            {
                if( Entry == cmder.id )
                    embed.setDescription(`You're **${GroupName}** since ${sinceStr}`)
                else if( args[0].startsWith('<@!'))
                    embed.setDescription(`${args[0]} is **${GroupName}** since ${sinceStr}`)
                else embed.setDescription(`**${result[0].name}** is **${GroupName}** since ${sinceStr}`)
            }
        }
        else
        {
            if( result[0].mask_level > 0 )
            {
                GroupName = BitsToName(result[0].mask_level)

                if( Entry == cmder.id )
                    embed.setDescription(`You're **${GroupName}** since ${sinceStr}`)
                else if( args[0].startsWith('<@!'))
                    embed.setDescription(`${args[0]} is **${GroupName}** since ${sinceStr}`)
                else embed.setDescription(`**${result[0].name}** is **${GroupName}** since ${sinceStr}`)
            }
            else
            {
                if( Entry == cmder.id )
                    embed.setDescription(`You're **${GroupName}** since ${sinceStr}`)
                else if( args[0].startsWith('<@!'))
                    embed.setDescription(`${args[0]} is **${GroupName}** since ${sinceStr}`)
                else embed.setDescription(`**${result[0].name}** is **${GroupName}** since ${sinceStr}`)
            }
        }
        msg.reply( { embeds: [embed] })
    }
}