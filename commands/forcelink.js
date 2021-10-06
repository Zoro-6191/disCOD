const ErrorHandler = require.main.require('./src/errorhandler')
const { MessageEmbed } = require('discord.js')
const conf = require.main.require('./conf')
const db = require.main.require('./utils/database')

const description = `Directly link a Discord ID to In-game ID`
var prefix, themeColor, usage

module.exports =
{
    description,
    init: async function()
    {
        prefix = conf.mainconfig.command.prefix
        themeColor = conf.mainconfig.themeColor

        usage = `${prefix}forcelink @Mention B3-ID`
        module.exports.usage = usage
    },

    callback: async function( msg, args )
    {
        if( !args.length || args[1] == undefined )
            return msg.reply( { embeds: [ new MessageEmbed().setColor( themeColor ).setTitle('Invalid Entry').setDescription(`Usage: ${usage}`) ]})

        let User = msg.mentions.users.first()
        let Entry = args[1].toString()
        
        if( Entry.startsWith('@'))
            Entry = Entry.split('@')[1]
        
        if( isNaN(Entry) || parseInt(Entry) < 1 )
            return msg.reply( { embeds: [ new MessageEmbed().setColor( themeColor ).setTitle('Invalid Entry').setDescription(`Usage: ${usage}`) ]})

        if( Entry == '1' )
            return msg.reply( { embeds: [ new MessageEmbed().setColor( themeColor ).setDescription('ID @1 is off limits') ]})

        // now we check if guy's id exists
        const result = await db.pool.query( `SELECT * FROM discod WHERE b3_id = ${Entry} OR dc_id = ${User.id}`)
            .catch( error=>
            {
                msg.reply( {embeds:[new MessageEmbed().setColor( themeColor ).setDescription('There was an error processing your command')]} )
                ErrorHandler.fatal(error)
            })

        if( !result.length )   // link dont exist
            firstLink( msg, Entry, User )
        else if( parseInt(result[0].linked) === 0 ) // initiated before but not verified
            alterRow( msg, Entry, User )
        else if( parseInt(result[0].linked) === 1 ) // initiated and verified
            return msg.reply( {embeds:[new MessageEmbed().setColor(themeColor).setDescription(`Link already exists.`)]})
    }
}

async function firstLink( msg, Entry, User )
{
    const discordId = User.id
    const discordTag = User.tag
    const pass = Math.floor(Math.random() * 100000000)    // 8 digit numerical pass, good enough
    
    const createRow = `INSERT INTO discod(b3_id,dc_id,dc_tag,pass,linked,linktime) VALUES (${Entry},${discordId},'${discordTag}',${pass},1,UNIX_TIMESTAMP());`

    await db.pool.query( createRow )
        .catch( error =>
        {
            msg.guild.author.send({embeds:[new MessageEmbed().setColor(themeColor).setDescription(`Error in firstLink() while linking.`)]})
            msg.reply({embeds: [new MessageEmbed().setColor(themeColor).setDescription(`Error occured while force creating link.`)]})
            ErrorHandler.fatal(error)
        })

    const embed = new MessageEmbed()
        .setColor(themeColor)
        .setTitle(`Successfully Force Linked @${Entry}`)
        .setThumbnail('https://cdn.discordapp.com/attachments/719492117294088252/833199125390295040/mmm.png')
        .setDescription(`${User}`)

    msg.reply({ embeds: [embed] })
}

async function alterRow( msg, Entry, User )
{
	const discordId = User.id
    const discordTag = User.tag

	const updateRow = 
	`UPDATE discod 
		SET dc_id='${discordId}',
			dc_tag='${discordTag}',
			linked=1,
			linktime=UNIX_TIMESTAMP()
		WHERE b3_id=${Entry}`
	
	await db.pool.query( updateRow )
        .catch( error =>
        {
            msg.reply({embeds: [new MessageEmbed().setColor(themeColor).setDescription(`Error occured while force creating link.`)]})
            ErrorHandler.fatal(error)
        })

    const embed = new MessageEmbed()
        .setColor(themeColor)
        .setDescription(`Successfully Force Linked @${Entry}`)
        .setThumbnail('https://cdn.discordapp.com/attachments/719492117294088252/833199125390295040/mmm.png')
        .setDescription(`${User}`)

    msg.reply({ embeds: [embed] })
}