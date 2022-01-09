require('rootpath')()
const ErrorHandler = require('src/errorhandler')
const { MessageEmbed } = require('discord.js')
const conf = require('conf')
const db = require('utils/database')

const description = `Unmask a Player`
var prefix, themeColor, usage

module.exports =
{
    description,
    init: async function()
    {
        prefix = conf.mainconfig.command.prefix
        themeColor = conf.mainconfig.themeColor

        usage = `${prefix}unmask @Mention/B3 ID`
        module.exports.usage = usage
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
                    msg.reply( { embeds: [ new MessageEmbed().setColor( themeColor ).setTitle(`Invalid Entry`).setDescription(`Usage: ${module.exports.usage}`) ]})
                else if( err == 'MENTIONED_BOT' )
                    msg.reply( { embeds: [ new MessageEmbed().setColor( themeColor ).setDescription('Why are you mentioning a Bot bro :D?') ]})
                else if( err == 'WORLD_ID' )
                    msg.reply( { embeds: [ new MessageEmbed().setColor( themeColor ).setDescription(`ID @1 is Classified`) ]})
                else if( err == 'NO_RESULT' )
                    msg.reply( { embeds: [ new MessageEmbed().setColor( themeColor ).setDescription(`No Player Found`) ]})
                else 
                {
                    msg.reply( { embeds: [ new MessageEmbed().setColor( themeColor ).setDescription('There was an Error while processing your command') ]})
                    ErrorHandler.fatal(err)
                }
            } )
        
        if( Entry == undefined )
            return
            
        const result = await db.pool.query(`SELECT * FROM clients WHERE id=${Entry}`)
            .catch( err =>
            {
                msg.reply( { embeds: [ new MessageEmbed().setColor( themeColor ).setDescription('There was an Error while processing your command') ]})
                ErrorHandler.fatal(err)
            })

        if( result[0].mask_level < 1 )
        {
            if( Entry == cmder.id )
                return msg.reply( { embeds: [ new MessageEmbed().setColor( themeColor ).setDescription(`You aren't Masked`) ]})
            else if( args[0].startsWith('<@!') )         
                return msg.reply( { embeds: [ new MessageEmbed().setColor( themeColor ).setDescription(`${args[0]} isn't Masked`) ]})
            else return msg.reply( { embeds: [ new MessageEmbed().setColor( themeColor ).setDescription(`**${result[0].name}** isn't Masked`) ]})
        }

        db.pool.query(`UPDATE clients SET mask_level=0 WHERE id=${Entry}`)
            .catch( err =>
            {
                msg.reply( { embeds: [ new MessageEmbed().setColor( themeColor ).setDescription('There was an Error while processing your command') ]})
                ErrorHandler.fatal(err)
            })
            .then( ()=>
            {
                if( Entry == cmder.id )
                    return msg.reply( { embeds: [ new MessageEmbed().setColor( themeColor ).setDescription(`Unmasked`) ]})
                else if( args[0].startsWith('<@!'))
                    return msg.reply( { embeds: [ new MessageEmbed().setColor( themeColor ).setDescription(`Unmaked ${args[0]}`) ]})
                else return msg.reply( { embeds: [ new MessageEmbed().setColor( themeColor ).setDescription(`Unmasked **${result[0].name}**`) ]})
            })
    }
}