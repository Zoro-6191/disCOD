require('rootpath')()
const ErrorHandler = require('src/errorhandler')
const { MessageEmbed } = require('discord.js')
const conf = require('conf')
const db = require('utils/database')

var prefix, themeColor

module.exports =
{
    init: async function()
    {
        prefix = conf.mainconfig.command.prefix
        themeColor = conf.mainconfig.themeColor

        module.exports.usage = `${prefix}forceunlink @MentionUser @B3ID`
    },

    callback: async function( msg, args )
    {
        const embed = new MessageEmbed().setColor(themeColor)

        if( !args.length )
            return msg.reply( { embeds: [ embed.setTitle('You need to include B3 @ID').setDescription(`Usage: ${module.exports.usage}`) ]})

        const Entry = await db.getPlayerID( args[0] )
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
                args = null
            } )

        if( Entry == undefined )
            return

        // now we check if guy's id exists
        const result = await db.pool.query( `SELECT * FROM discod WHERE b3_id = ${Entry}`)
            .catch( error=>
            {
                msg.reply( {embeds:[embed.setTitle('There was an error processing your command')]} )
                ErrorHandler.fatal(error)
            })

        if( !result.length )   // link dont exist
            return msg.reply( {embeds:[embed.setTitle(`Link doesn't exist`)]})
        else forceUnlink( msg, result )
    }
}

async function forceUnlink( msg, qResult  )
{
    const embed = new MessageEmbed().setColor(themeColor)
    await db.pool.query( `DELETE FROM discod WHERE b3_id = ${qResult[0].b3_id}` )
        .catch( error =>
        {
            msg.reply( {embeds:[embed.setTitle('There was an error processing your command')]} )
            ErrorHandler.fatal(error)
        })
        .then( ()=>
        {            
            msg.reply( { embeds: [ embed.setTitle(`Unlinked.`) ]})
        })
}