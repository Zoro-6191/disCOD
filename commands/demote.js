require('rootpath')()
const ErrorHandler = require('src/errorhandler')
const { MessageEmbed } = require('discord.js')
const conf = require('conf')
const db = require('utils/database')
const { BitsToName, BitsToLevel } = require('utils/groupmanager').groupOperations

const description = 'Demote a Player'
var prefix, themeColor, usage, highestLevel
var tableExists = false

module.exports =
{
    description,
    init: async function()
    {
        prefix = conf.mainconfig.command.prefix
        themeColor = conf.mainconfig.themeColor

        usage = `${prefix}makereg @Mention/B3 ID`
        module.exports.usage = usage

        highestLevel = require('utils/groupmanager').highestLevel

        // check for demotion table
        const result = await db.pool.query(`SHOW TABLES LIKE "demotions"`)
            .catch( ErrorHandler.fatal )

        if( result.length )
            tableExists = true
    },

    callback: async function( msg, args, cmder )
    {
        const embed = new MessageEmbed().setColor(themeColor)

        if( !tableExists )
            return msg.reply( { embeds: [ embed.setDescription(`B3 Demotions Plugin Not Found`) ]})

        if( !args.length )
            return msg.reply( { embeds: [ embed.setTitle(`Invalid Entry`).setDescription(`Usage: ${module.exports.usage}`) ]})

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
            } )

        if( Entry == undefined )
            return

            
        // check if player is already demoted
        const check = await db.pool.query(`SELECT name,group_bits,client_id,inactive FROM clients,demotions WHERE clients.id=${Entry} AND demotions.client_id=${Entry}`)
            .catch( err => 
                {
                    msg.reply( { embeds: [ embed.setDescription('There was an Error while processing your command') ] } )
                    ErrorHandler.fatal( err )
                })
                
        // check if player superadmin
        // if( BitsToLevel(check.group_bits) == highestLevel )

        // entry in demotions exist
        // now check if group_bits=2
        if( check.length )
        {
            if( !check[0].inactive )
            {
                if( check[0].group_bits=='2' )
                    return msg.reply( { embeds: [ embed.setDescription( `**${check[0].name} @${Entry}** is already demoted` ) ] } )
                else
                {
                    // demotion is active but player isnt 2
                    await db.pool.query(`UPDATE clients SET group_bits=2 WHERE id=${Entry}`)
                        .catch( err => 
                        {
                            msg.reply( { embeds: [ embed.setDescription('There was an Error while processing your command') ] } )
                            ErrorHandler.fatal( err )
                        })
                    
                    return msg.reply( { embeds: [ embed.setDescription( `**${check[0].name} @${Entry}** successfully demoted` ) ] } )
                }
            }
            else
            {
                // demotion is inactive
                // activate it, increment count column
                await db.pool.query(`
                    UPDATE 
                        clients,demotions 
                    SET
                        group_bits=2,
                        count=count+1,
                        inactive=0,
                        admin_id=${cmder.id},
                        clients.time_edit=UNIX_TIMESTAMP(),
                        demotions.time_edit=UNIX_TIMESTAMP()
                    WHERE
                        clients.id=${Entry}
                        AND demotions.client_id=${Entry}`)
                    .catch( err => 
                        {
                            msg.reply( { embeds: [ embed.setDescription('There was an Error while processing your command') ] } )
                            ErrorHandler.fatal( err )
                        })

                return msg.reply( { embeds: [ embed.setDescription( `**${check[0].name} @${Entry}** successfully demoted` ) ] } )
            }
        }
        
        // entry in demotions table doesnt exist

        const name = (await db.pool.query(`SELECT name FROM clients WHERE id = ${Entry}`))[0].name

        await db.pool.query(`
        INSERT INTO demotions
                (client_id,admin_id,count,inactive,time_add,time_edit)
        VALUES  (${Entry},${cmder.id},1,0,UNIX_TIMESTAMP(),UNIX_TIMESTAMP())`)
            .catch( err => 
            {
                msg.reply( { embeds: [ embed.setDescription('There was an Error while processing your command') ] } )
                ErrorHandler.fatal( err )
            })

        await db.pool.query(`UPDATE clients SET group_bits=2 WHERE id=${Entry}`)
            .catch( err => 
            {
                msg.reply( { embeds: [ embed.setDescription('There was an Error while processing your command') ] } )
                ErrorHandler.fatal( err )
            })
        
        return msg.reply( { embeds: [ embed.setDescription( `**${name} @${Entry}** successfully demoted` ) ] } )
    }
}