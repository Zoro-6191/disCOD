require('rootpath')()
const ErrorHandler = require('src/errorhandler')
const { MessageEmbed } = require('discord.js')
const conf = require('conf')
const db = require('utils/database')
const rcon = require('utils/rcontool')

const description = `Take Screenshot of a Player`
var prefix, themeColor, usage

module.exports =
{
    description,
    init: async function()
    {
        prefix = conf.mainconfig.command.prefix
        themeColor = conf.mainconfig.themeColor

        usage = `${prefix}getss <slot>`
        module.exports.usage = usage
    },

    callback: async function( msg, args )
    {
        const embed = new MessageEmbed().setColor(themeColor)
        
        if( !args.length )
            return msg.reply( { embeds: [ embed.setTitle('You need to include in-game slot of a player.').setDescription(`Usage: ${usage}`) ]})
        
        let Entry = parseInt(args[0])
    
        if( isNaN(Entry) || Entry < 0 || Entry > 64 )
            return msg.reply( { embeds: [ embed.setTitle('Invalid Entry').setDescription(`Usage: ${usage}`) ]})

        // check if slot exists
        const rconStatus = await rcon.rcontool.rconStatus()
		players = rconStatus.onlinePlayers

        if( !players || !players.length )	// server empty
			return msg.reply( { embeds: [ embed.setDescription('Currently no players online') ]})
            
        if( !isSlotOccupied( players, Entry ) )
			return msg.reply( { embeds: [ embed.setDescription(`Slot **${Entry}** isn't occupied by a player`) ]})

        await rcon.rcontool.getss(Entry)
        const name = getPlayerName( players, Entry )

        embed.setTitle(`Waiting for a move event to take ${name? '__'+name+'__':'Player'}'s Screenshot.`)
        
        if( conf.plugin.ssupload.enabled )
            embed.setDescription(`${msg.guild.channels.cache.get(conf.plugin.ssupload.channel_id)}`)

		return msg.reply( {embeds: [embed]} )
    }
}

function getPlayerName( players, num )
{
	num=parseInt(num)
	for( i=0; i<players.length; i++ )
		if( players[i].num == num )
			return players[i].name
	
	return undefined
}

function isSlotOccupied( players, num )
{
	num=parseInt(num)
	for( i=0; i<players.length; i++ )
		if( players[i].num == num )
			return true
	
	return false
}