require('rootpath')()
const ErrorHandler = require('src/errorhandler')
const { MessageEmbed } = require('discord.js')
const conf = require('conf')
const db = require('utils/database')

const description = `Link Discord account to In-Game account`
var prefix, themeColor, usage, dmMsg

module.exports =
{
    description,
    init: async function()
    {
        prefix = conf.mainconfig.command.prefix
        themeColor = conf.mainconfig.themeColor

        usage = `${prefix}link B3-ID`
        module.exports.usage = usage
    },

    callback: async function( msg, args, cmder )
    {
        const embed = new MessageEmbed().setColor(themeColor)
        
        if( !args.length )
            return msg.reply( { embeds: [ embed.setTitle('You need to include your B3 ID').setDescription(`Type __!id__ ingame to know your B3 ID`) ]})

        let Entry = args[0].toString()
        
        if( Entry.startsWith('@'))
            Entry = Entry.split('@')[1]
        
        if( isNaN(Entry) || parseInt(Entry) < 1 )
            return msg.reply( { embeds: [ embed.setTitle('Invalid Entry') ]})

        if( Entry == '1' )
            return msg.reply( { embeds: [ embed.setTitle('ID @1 is off limits') ]})

        // now to check if guy's id exists
        const idcheck = await db.pool.query( `SELECT * FROM discod WHERE b3_id = ${Entry} OR dc_id = ${msg.author.id}` )
            .catch( err => {
                msg.reply( { embeds: [ embed.setTitle(`Error occured while creating link.`) ]})
                ErrorHandler.fatal(err)
            })

        if( !idcheck.length )   // first link
        {
            var potty = true
            // in case user has turned off dm
            await msg.author.send( { embeds: [ embed.setDescription(`Initializing Link`) ] } )
                .catch( err =>
                { 
                    if( err.code == 50007 )
                        msg.reply( { embeds: [ embed.setTitle('You need to enable Direct Messages for this command').setDescription(`(Go to Settings> Privacy and Safety> Allow Direct Messages)`) ]})
                    else 
                    {
                        msg.reply( { embeds: [ embed.setTitle(`Error occured while creating link.`) ]})
                        ErrorHandler.fatal(err)
                    }
                    potty = false
                })
                .then( res=> { dmMsg = res })

            if( potty )
                firstLink( msg, Entry )
        }
        else if( parseInt( idcheck[0].linked ) === 0 && idcheck[0].b3_id == Entry ) // initiated before but not verified
            return msg.reply( { embeds: [ embed.setTitle('Looks like you already initiated that command once. Check DM or !unlink to link a new ID.') ]})
        else if( parseInt( idcheck[0].linked ) === 0 && idcheck[0].b3_id != Entry ) // initiated before but not verified
            return msg.reply( { embeds: [ embed.setTitle(`Looks like you already initiated that command once using different ID (@${idcheck[0].b3_id}). Unlink first to link a new ID.`) ]})
        else if( parseInt( idcheck[0].linked ) === 1 ) // initiated and verified
            return msg.reply( { embeds: [ embed.setTitle(`Your account is already linked. Type **__${prefix}unlink__** to unlink your account.`) ]})
    }
}

async function firstLink( msg, Entry )
{
    const embed = new MessageEmbed().setColor(themeColor)
    let discordId = msg.author.id
    let discordTag = msg.author.tag.replace(`'`, '').replace('`', '').replace('"','')   // replace coz query cant include quotes
    let b3id = Entry
    let pass = Math.floor(Math.random() * 100000000)    // 8 digit numerical pass, good enough

    await db.pool.query( `INSERT INTO discod(b3_id,dc_id,dc_tag,pass,time_add) VALUES (${b3id},${discordId},'${discordTag}',${pass},UNIX_TIMESTAMP());` )
        .catch( err => {
            msg.reply( { embeds: [ embed.setTitle(`Error occured while creating link.`) ]})
            ErrorHandler.fatal(err)
        })

    embed.setTitle(`Link initiated. Check DM!`)
        .setThumbnail('https://cdn.discordapp.com/attachments/719492117294088252/833199914582016020/feelscoolman.png')
        .setDescription( `${msg.author}` )

    const dmEmbed = new MessageEmbed()
        .setColor(themeColor)
        .setThumbnail('https://cdn.discordapp.com/attachments/719492117294088252/833199125390295040/mmm.png')
        .setTitle(`Need Verification. Paste this in-game and you're good to go:`)
        .addField(`__!link ${pass}__`,Date().toString())

    dmMsg.edit( { embeds: [dmEmbed] } )
        .catch( ErrorHandler.fatal )
        .then( msg.reply( {embeds: [embed] }) )
        .catch( ErrorHandler.fatal )
}