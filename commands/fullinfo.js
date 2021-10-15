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

        const aliasQresult = await db.pool.query( `SELECT * FROM aliases WHERE client_id=${Entry}` )
            .catch( err => 
            {
                msg.reply( {embeds:[new MessageEmbed().setColor( themeColor ).setTitle('There was an error processing your command')]} )
                ErrorHandler.fatal( err )
            })

        let aliasString = ""
        if( aliasQresult[0] === undefined )
            aliasString = "No aliases"
        else 
        {
            for( let each of aliasQresult )
                aliasString += `${each.alias}, `
            
            if( aliasString.length > 1962 )     // embed descriptions limit 2000chars
                aliasString = aliasString.slice(0,1962) + ' ... __**[and more]**__'
        }
		
        const result = await db.pool.query( 
            `SELECT
                xlr_playerstats.kills,
                xlr_playerstats.deaths,
                xlr_playerstats.assists,
                xlr_playerstats.ratio,
                xlr_playerstats.winstreak,
                xlr_playerstats.rounds,
                clients.name,
                clients.ip,
                clients.guid,
                clients.greeting,
                clients.group_bits,
                clients.mask_level,
                clients.time_add,
                clients.time_edit
            FROM clients,xlr_playerstats 
            WHERE clients.id = ${Entry}
            AND xlr_playerstats.client_id = clients.id` )
            .catch( error =>
            {
                msg.reply( {embeds:[new MessageEmbed().setColor( themeColor ).setTitle('There was an error processing your command')]} )
                ErrorHandler.fatal( error )
            })
            
        var player = result[0]

        var kills = player.kills===undefined? "N/A" : player.kills
        var deaths = player.deaths===undefined? "N/A" : player.deaths
        var assists = player.assists===undefined? "N/A" : player.assists
        var ratio = player.ratio===undefined? "N/A" : player.ratio
        var rounds = player.rounds===undefined? "N/A" : player.rounds
        var winstreak = player.winstreak===undefined? "N/A" : player.winstreak
        
        const ipinforeq = await fetch(`http://ip-api.com/json/${player.ip}`)
        const ipinfo = await ipinforeq.json()

        const embed = new MessageEmbed()
            .setColor(themeColor)
            .setTitle(`__${player.name}__ @${Entry}`)
            // .setURL('@')
            .setDescription(`__Aliases:__ ${aliasString}`)
            .addField('First Joined',`${new Date(player.time_add * 1000).toLocaleString("en-US", { dateStyle: 'full', timeZone: conf.mainconfig.timezone } )}`,true)
            .addField('GUID',`||${player.guid}||`,true)
            .addField('Group',`${ BitsToName(player.group_bits) }`,true)
            .addField(`${player.mask_level?'Masked As':'Masked'}`,`${player.mask_level?BitsToName(player.mask_level):'No'}`,true)	// empty
            .addField('Last Seen',`${new Date(player.time_edit * 1000).toLocaleString("en-US", { dateStyle: 'full', timeZone: conf.mainconfig.timezone } )}`,true)
            .addField(`Country`,`:flag_${ipinfo.countryCode.toLowerCase()}: ${ipinfo.country}`,true)
            .addField('City',`${ipinfo.city}, ${ipinfo.region}`,true)
            .addField('ISP',`${ipinfo.isp}`,true)
            .addField('Greeting',`${player.greeting? player.greeting:'No greeting set.'}`,true)
            .addField('Kills',`${kills}`,true)
            .addField('Deaths',`${deaths}`,true)
            .addField('Assists',`${assists}`,true)
            .addField('KDR',`${ratio}`,true)
            .addField('Rounds Played',`${rounds}`,true)
            .addField('Max Killstreak',`${winstreak}`,true)
            
        msg.reply({ embeds: [embed] })
    }
}