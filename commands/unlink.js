const ErrorHandler = require.main.require('./src/errorhandler')
const { MessageEmbed } = require('discord.js')
const conf = require.main.require('./conf')
const db = require.main.require('./utils/database')

const description = `Unlink disCOD and In-game ID`
var prefix, themeColor, usage

module.exports =
{
    description,
    init: async function()
    {
        prefix = conf.mainconfig.command.prefix
        themeColor = conf.mainconfig.themeColor

        usage = `${prefix}unlink`
        module.exports.usage = usage
    },

    callback: async function( msg, args )
    {
        const result = await db.pool.query( `SELECT * FROM discod WHERE dc_id = ${msg.author.id}` )
        .catch( err => 
            {
                msg.guild.author.send( { embeds: [ new MessageEmbed().setColor(themeColor).setTitle(`Error while unlinking.`) ]})
                ErrorHandler.fatal( err )
            })

        if( !result.length )   // link doesnt exist
            return msg.reply( { embeds: [ new MessageEmbed().setColor(themeColor).setTitle(`You haven't linked any ID yet.`) ]})
        
        else unlink( msg, args, result[0] )
    }
}

async function unlink( msg, tokens, qResult )
{
    await db.pool.query( `DELETE FROM discod WHERE b3_id = ${qResult.b3_id}` )
    .catch( error =>
    {
        msg.guild.owner.send( { embeds: [ new MessageEmbed().setColor(themeColor).setTitle(`Error in unlink()`)]})
        ErrorHandler.fatal(error) 
    }).then(msg.reply( { embeds: [ new MessageEmbed().setColor(themeColor).setTitle(`Successfully unlinked. Type __${prefix}link @ID__ to relink.`).setDescription(`${msg.author}`)]}) )
}