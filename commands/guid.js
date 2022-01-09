require('rootpath')()
const ErrorHandler = require('src/errorhandler')
const { MessageEmbed } = require('discord.js')
const conf = require('conf')
const db = require('utils/database')

const description = `Fetch GUID of a Player`
var prefix, themeColor, usage

module.exports =
{
    description,
    init: async function()
    {
        prefix = conf.mainconfig.command.prefix
        themeColor = conf.mainconfig.themeColor

        usage = `${prefix}guid @Mention/B3 ID`
        module.exports.usage = usage
    },

    callback: async function( msg, args, cmder )
    {
        const embed = new MessageEmbed().setColor(themeColor)
        
        // args can be nothing, @player, b3 id
        if( !args.length )
            Entry = cmder.id
        else Entry = await db.getPlayerID( args[0] )
            .catch( err => 
            {
                if( err == 'NO_LINK' )
                    msg.reply( { embeds: [ embed.setDescription(`${args[0]} hasn't linked their account yet`) ]})
                else if( err == 'BAD_ENTRY' )
                    msg.reply( { embeds: [ embed.setTitle(`Invalid Entry`).setDescription(`Usage: ${usage}`) ]})
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

        const result = await db.pool.query(`SELECT name,guid FROM clients WHERE id=${Entry}`)
            .catch( err => 
            {
                msg.reply( { embeds: [ embed.setDescription('There was an Error while processing your command') ]})
                ErrorHandler.fatal(err)
            })

        Entry = result[0].guid

        if( Entry == cmder.guid || Entry == cmder.id ) // issued cmd without args or smth
            embed.setDescription(`Your GUID: **__${cmder.guid}__**, ${msg.author}`)
        else if( args[0].startsWith('<@!') )
            embed.setDescription(`${args[0]}'s GUID: **__${Entry}__**`)
        else embed.setDescription(`**${result[0].name}**'s GUID: **__${Entry}__**`)

        return msg.reply( { embeds: [embed]} )
    }
}