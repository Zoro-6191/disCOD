require('rootpath')()
const ErrorHandler = require('src/errorhandler')
const fetch = require('node-fetch')
const { MessageEmbed } = require('discord.js')
const conf = require('conf')
const db = require('utils/database')
const { BitsToName } = require('utils/groupmanager').groupOperations

const description = `Fetch complete information about a Player`
var prefix, themeColor, usage

module.exports =
{
    description,
    init: async function()
    {
        prefix = conf.mainconfig.command.prefix
        themeColor = conf.mainconfig.themeColor

        usage = `${prefix}fullinfo @Mention/B3 ID`
        module.exports.usage = usage
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

        const aliasQresult = await db.pool.query( `SELECT * FROM aliases WHERE client_id=${Entry}` )
            .catch( err => 
            {
                msg.reply( {embeds:[embed.setTitle('There was an error processing your command')]} )
                ErrorHandler.fatal( err )
            })

        let aliasString = "`"
        if( aliasQresult[0] === undefined )
            aliasString = "No aliases"
        else 
        {
            for( let each of aliasQresult )
                aliasString += `${each.alias}, `

            aliasString += "`";
            
            if( aliasString.length > 1962 )     // embed descriptions limit 2000chars
                aliasString = aliasString.slice(0,1962) + ' __**[and more]**__'
        }

        const clientsResult = await db.pool.query(`SELECT * FROM clients WHERE id=${Entry}`)

        // Link Check
        const linkcheck = await db.pool.query(`SELECT * FROM discod WHERE b3_id=${Entry}`)
        var linkedStr = ""
        if( linkcheck.length )
        {
            if( linkcheck[0].linked )
                linkedStr = `<@${linkcheck[0].dc_id}> `+ '`@'+linkcheck[0].b3_id+'`'
            else linkedStr = `<@${linkcheck[0].dc_id}> `+ '`@'+linkcheck[0].b3_id+'`' + `, **Unverified**`
        }
        else linkedStr = `Doesn't Exist`
        // link check end
		
        const xlrResult = await db.pool.query( 
            `SELECT
                kills,
                deaths,
                assists,
                ratio,
                winstreak,
                rounds
            FROM xlr_playerstats 
            WHERE xlr_playerstats.client_id = ${Entry}` )
            .catch( error =>
            {
                msg.reply( {embeds:[embed.setTitle('There was an error processing your command')]} )
                ErrorHandler.fatal( error )
            })
            
        if( !xlrResult.length )
        {
            var kills = "N/A"
            var deaths = "N/A"
            var assists = "N/A"
            var ratio = "N/A"
            var rounds = "N/A"
            var winstreak = "N/A"
        }
        else
        {
            var kills = xlrResult[0].kills
            var deaths = xlrResult[0].deaths
            var assists = xlrResult[0].assists
            var ratio = xlrResult[0].ratio
            var rounds = xlrResult[0].rounds
            var winstreak = xlrResult[0].winstreak
        }

        const player = clientsResult[0]
        
        const ipinforeq = await fetch(`http://ip-api.com/json/${player.ip}`)
        const ipinfo = await ipinforeq.json()

        embed.setTitle(`__${player.name}__ @${Entry}`)
            // .setURL('@')
            .setDescription(`__Aliases:__ ${aliasString}`)
            // .addField('GUID',`||${player.guid}||`,true)
            .addField('disCOD Link',`${linkedStr}`,true)
            .addField('First Joined',`${new Date(player.time_add * 1000).toLocaleString("en-US", { dateStyle: 'full', timeZone: conf.mainconfig.timezone } )}`,true)
            .addField('Group',`${ BitsToName(player.group_bits) }`,true)
            .addField(`Country`,`:flag_${ipinfo.countryCode.toLowerCase()}: ${ipinfo.country}`,true)
            .addField('Last Seen',`${new Date(player.time_edit * 1000).toLocaleString("en-US", { dateStyle: 'full', timeZone: conf.mainconfig.timezone } )}`,true)
            .addField(`${player.mask_level?'Masked As':'Masked'}`,`${player.mask_level?BitsToName(player.mask_level):'No'}`,true)	// empty
            .addField('City',`${ipinfo.city}, ${ipinfo.region}`,true)
            .addField('ISP',`${ipinfo.isp}`,true)
            .addField('Greeting',`${player.greeting? player.greeting:'No greeting set.'}`,true)
            .addField('Kills',`${kills}`,true)
            .addField('Deaths',`${deaths}`,true)
            .addField('Assists',`${assists}`,true)
            .addField('KDR',`${parseFloat(ratio).toFixed(2)}`,true)
            .addField('Rounds Played',`${rounds}`,true)
            .addField('Max Killstreak',`${winstreak}`,true)
            
        msg.reply({ embeds: [embed] })
    }
}