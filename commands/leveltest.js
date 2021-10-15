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
        var Entry 
        if( !args.length )
            Entry = cmder.id
        else Entry = await db.getPlayerID( args[0] )
            .catch( err => 
            {
                if( err == 'NO_LINK' )
                    msg.reply( { embeds: [ new MessageEmbed().setColor( themeColor ).setDescription(`${args[0]} hasn't linked their account yet`) ]})
                else if( err == 'BAD_ENTRY' )
                    msg.reply( { embeds: [ new MessageEmbed().setColor( themeColor ).setTitle(`Invalid Entry`).setDescription(`Usage: ${usage}`) ]})
                else if( err == 'WORLD_ID' )
                    msg.reply( { embeds: [ new MessageEmbed().setColor( themeColor ).setDescription(`ID @1 is Classified`) ]})
                else 
                {
                    msg.reply( { embeds: [ new MessageEmbed().setColor( themeColor ).setDescription('There was an Error while processing your command') ]})
                    ErrorHandler.fatal(err)
                }
                args = null
            } )

        if( args == null )
            return

        const result = await db.pool.query(`SELECT name,group_bits,mask_level,time_add FROM clients WHERE id=${Entry}`)
            .catch( err =>
            {
                msg.reply( { embeds: [ new MessageEmbed().setColor( themeColor ).setDescription('There was an Error while processing your command') ]})
                ErrorHandler.fatal(err)
            })

        var GroupName = BitsToName(result[0].group_bits)
        var sinceStr = new Date(result[0].time_add * 1000).toLocaleString("en-US", { dateStyle: 'full', timeZone: conf.mainconfig.timezone } )

        if( BitsToLevel(cmder.group_bits) == highestLevel )
        {
            if( result[0].mask_level > 0 )
            {
                var MaskName = BitsToName(result[0].mask_level)

                if( Entry == cmder.id )
                    return msg.reply( { embeds: [ new MessageEmbed().setColor( themeColor ).setDescription(`You're **${GroupName}** (Masked ${MaskName}) since ${sinceStr}`) ]})
                else if( args[0].startsWith('<@!'))
                    return msg.reply( { embeds: [ new MessageEmbed().setColor( themeColor ).setDescription(`${args[0]} is **${GroupName}** (Masked ${MaskName}) since ${sinceStr}`) ]})
                else return msg.reply( { embeds: [ new MessageEmbed().setColor( themeColor ).setDescription(`**${result[0].name}** is **${GroupName}** (Masked ${MaskName}) since ${sinceStr}`) ]})
            }
            else
            {
                if( Entry == cmder.id )
                    return msg.reply( { embeds: [ new MessageEmbed().setColor( themeColor ).setDescription(`You're **${GroupName}** since ${sinceStr}`) ]})
                else if( args[0].startsWith('<@!'))
                    return msg.reply( { embeds: [ new MessageEmbed().setColor( themeColor ).setDescription(`${args[0]} is **${GroupName}** since ${sinceStr}`) ]})
                else return msg.reply( { embeds: [ new MessageEmbed().setColor( themeColor ).setDescription(`**${result[0].name}** is **${GroupName}** since ${sinceStr}`) ]})
            }
        }
        else
        {
            GroupName = BitsToName(result[0].mask_level)

            if( Entry == cmder.id )
                return msg.reply( { embeds: [ new MessageEmbed().setColor( themeColor ).setDescription(`You're **${GroupName}** since ${sinceStr}`) ]})
            else if( args[0].startsWith('<@!'))
                return msg.reply( { embeds: [ new MessageEmbed().setColor( themeColor ).setDescription(`${args[0]} is **${GroupName}** since ${sinceStr}`) ]})
            else return msg.reply( { embeds: [ new MessageEmbed().setColor( themeColor ).setDescription(`**${result[0].name}** is **${GroupName}** since ${sinceStr}`) ]})
        }
    }
}