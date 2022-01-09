require('rootpath')()
const ErrorHandler = require('src/errorhandler')
const { MessageEmbed } = require('discord.js')
const conf = require('conf')
const db = require('utils/database')
const { BitsToName } = require('utils/groupmanager').groupOperations
const rcon = require('utils/rcontool')

const description = `Get a list of online players`
var prefix, themeColor, usage

module.exports =
{
    description,
    init: async function()
    {
        prefix = conf.mainconfig.command.prefix
        themeColor = conf.mainconfig.themeColor

        usage = `${prefix}list`
        module.exports.usage = usage
    },

    callback: async function( msg, args )
    {
		const embed = new MessageEmbed().setColor(themeColor)
		const rconStatus = await rcon.rcontool.rconStatus()
		players = rconStatus.onlinePlayers

		if(!rconStatus.online)
			return msg.reply( {embeds:[embed.setTitle(`Server currently offline`)]} )

		if( !players.length )
			result = []
		else
		{
			let guidStr = ""
			for(i=0;i<players.length;i++)
				guidStr += players[i].id + ','

			guidStr=guidStr.substring(0, guidStr.length - 1);

			result = await db.pool.query( `SELECT * FROM clients WHERE guid IN(${guidStr})`)
				.catch( err =>
				{
					msg.reply( { embeds: [ embed.setDescription('There was an Error while processing your command') ]})
					ErrorHandler.fatal(err)
				})
		}
		        
        embed.setThumbnail(`https://cdn.discordapp.com/attachments/719492117294088252/832286558488100884/cod4logo.png`)
            .setURL('https://www.youtube.com/watch?v=dQw4w9WgXcQ')
            .setTitle(`${removeColor(rconStatus.sv_hostname)} (${players.length}/${rconStatus.sv_maxclients})`)
            .setDescription( `Map: ${await processMapName(rconStatus.mapname)} (${await processGametype(rconStatus.g_gametype)})
                Server Uptime: ${rconStatus.uptime}\n` )
                
        obj = assignID(players,result)

		if( !players.length )
			linQ = []
		else
		{
			// check for discod table links
			var idStr = ''
			for( var i = 0; i < obj.length; i++ )
				if( obj[i].id != undefined && obj[i].id != '' && !obj[i].mask_level )	// dont want masked ppl here
					idStr += obj[i].id+','
			idStr = idStr.substring(0, idStr.length - 1);

			linQ = await db.pool.query(`SELECT b3_id,dc_id FROM discod WHERE b3_id IN(${idStr})`)
				.catch( err =>
				{
					msg.reply( { embeds: [ embed.setDescription('There was an Error while processing your command') ]})
					ErrorHandler.fatal(err)
				})
		}

		for( var i = 0; i < linQ.length; i++ )
			for( var j = 0; j < obj.length; j++ )
				if( linQ[i].b3_id == obj[j].id )
					obj[j].dc_id = linQ[i].dc_id

        for( i=0; i<24; i++ )   // embed addfield limit is 25
            if( players[i] != undefined )
            {
                player = players[i]
                embed.addField(`(${player.num}) __${player.name}__ @${obj[i].id}`, `${obj[i].dc_id==undefined?'':'<@'+obj[i].dc_id+'>\n'}Power: ${processGroupBits(obj[i].group_bits,obj[i].mask_level)}`, true )
            }

        const embed2 = new MessageEmbed()
            .setColor(themeColor)
            .setFooter(`/connect ${conf.mainconfig.server.public_ip}`)
        
        if( players.length > 24 )
            for( i=24; i<players.length; i++ )
            {
                player = players[i]
                embed2.addField(`(${player.num}) __${player.name}__ @${obj[i].id}`, `${obj[i].dc_id==undefined?'':'\n<@'+obj[i].dc_id+'>\n'}Power: ${processGroupBits(obj[i].group_bits,obj[i].mask_level)}`, true )
            }
        else embed.setFooter(`/connect ${conf.mainconfig.server.public_ip}`)

        msg.channel.send({embeds:[embed]})

        if( players.length > 24 )
            msg.channel.send({embeds:[embed2]})
    }
}

function removeColor( str )
{
    // convert to array
    str = [...str]

    for( i=0;i<str.length;i++ )
        if( str[i]==="^" && ( str[i+1] != undefined && str[i+1] >= '0' && str[i+1] <= '9' ) )
            str.splice(i,2)

    return str.join("")
}

function processMapName(map)
{
	let mapname = "N/A"
	switch(map)
	{
		case "mp_backlot":
			mapname="Backlot";
			break;
		case "mp_citystreets":
			mapname="District";
			break;
		case "mp_crash":
			mapname="Crash";
			break;
		case "mp_crossfire":
			mapname="Crossfire";
			break;
		case "mp_strike":
			mapname="Strike";
			break;
		case "mp_shipment":
			mapname="Shipment";
			break;
		case "mp_killhouse":
			mapname="Killhouse";
			break;
		case "mp_vacant":
			mapname="Vacant";
			break;
		default:
			mapname=map
	}
	return mapname
}

function processGametype(gt)
{
	let gametype = "N/A"
	switch(gt)
	{
		case "sr":
			gametype="SnR";
			break;
		case "sd":
			gametype="SnD";
			break;
		case "dm":
			gametype="DM";
			break;
		case "war":
			gametype="TDM";
			break;
		default:
			gametype=gt
	}
	return gametype
}

function processGroupBits( bits, mask )
{
    return BitsToName( parseInt(mask)? mask : bits )
}

function assignID( players, result )
{
	obj = []
	for( i=0; i<players.length; i++ )
		for( j=0; j<result.length; j++ )
			if( players[i].id == result[j].guid )
				obj[i]=result[j]

	return obj;
}