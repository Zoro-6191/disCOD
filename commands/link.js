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

    callback: async function( msg, args )
    {
        if( !args.length )
            return msg.reply( { embeds: [ new MessageEmbed().setColor( themeColor ).setTitle('You need to include your B3 @ID') ]})

        let Entry = args[0].toString()
        
        if( Entry.startsWith('@'))
            Entry = Entry.split('@')[1]
        
        if( isNaN(Entry) || parseInt(Entry) < 1 )
            return msg.reply( { embeds: [ new MessageEmbed().setColor( themeColor ).setTitle('Invalid Entry') ]})

        if( Entry == '1' )
            return msg.reply( { embeds: [ new MessageEmbed().setColor( themeColor ).setTitle('ID @1 is off limits') ]})

        // now to check if guy's id exists
        const result = await db.pool.query( `SELECT * FROM discod WHERE b3_id = ${Entry}` )
            .catch( err => {
                msg.reply( { embeds: [ new MessageEmbed().setColor(themeColor).setTitle(`Error occured while creating link.`) ]})
                ErrorHandler.fatal(err)
            })

        if( !result.length )   // first link
        {
            var potty = true
            // in case user has turned off dm
            await msg.author.send( { embeds: [ new MessageEmbed().setColor(themeColor).setDescription(`Initializing Link`) ] } )
                .catch( err =>
                { 
                    if( err.code == 50007 )
                        msg.reply( { embeds: [ new MessageEmbed().setColor( themeColor ).setTitle('You need to enable Direct Messages for this command').setDescription(`(Go to Settings> Privacy and Safety> Allow Direct Messages)`) ]})
                    else 
                    {
                        msg.reply( { embeds: [ new MessageEmbed().setColor(themeColor).setTitle(`Error occured while creating link.`) ]})
                        ErrorHandler.fatal(err)
                    }
                    potty = false
                })
                .then( res=> { dmMsg = res })

            if( potty )
                firstLink( msg, Entry )
        }
        else if( parseInt( result[0].linked ) === 0 ) // initiated before but not verified
            return msg.reply( { embeds: [ new MessageEmbed().setColor( themeColor ).setTitle('Looks like you already initiated that command once. Check DM.') ]})
        else if( parseInt( result[0].linked ) === 1 ) // initiated and verified
            return msg.reply( { embeds: [ new MessageEmbed().setColor( themeColor ).setTitle(`Your account is already linked. Type **__${prefix}unlink__** to unlink your account.`) ]})
    }
}

async function firstLink( msg, Entry )
{
    // now we gotta create a row in b3dblink.connection.discord table of our user
    // for that first we gotta fetch user info
    // also create a random password so they can verify it from in-game
    // then we send that password to user's dm

    let discordId = msg.author.id
    let discordTag = msg.author.tag
    let b3id = Entry
    let pass = Math.floor(Math.random() * 100000000)    // 8 digit numerical pass, good enough

    await db.pool.query( `INSERT INTO discod(b3_id,dc_id,dc_tag,pass) VALUES (${b3id},${discordId},'${discordTag}',${pass});` )
        .catch( err => {
            msg.reply( { embeds: [ new MessageEmbed().setColor(themeColor).setTitle(`Error occured while creating link.`) ]})
            ErrorHandler.fatal(err)
        })

    const channelEmbed = new MessageEmbed()
        .setColor(themeColor)
        .setTitle(`Link initiated. Check DM!`)
        .setThumbnail('https://cdn.discordapp.com/attachments/719492117294088252/833199914582016020/feelscoolman.png')
        .setDescription( `${msg.author}` )

    const dmEmbed = new MessageEmbed()
        .setColor(themeColor)
        .setThumbnail('https://cdn.discordapp.com/attachments/719492117294088252/833199125390295040/mmm.png')
        .setTitle(`Need Verification. Paste this in-game and you're good to go:`)
        .addField(`__!link ${pass}__`,Date().toString())

    dmMsg.edit( { embeds: [dmEmbed] } )
        .catch( ErrorHandler.fatal )
        .then( msg.reply( {embeds: [channelEmbed] }) )
        .catch( ErrorHandler.fatal )
}