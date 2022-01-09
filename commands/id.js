require('rootpath')()
const ErrorHandler = require('src/errorhandler')
const { MessageEmbed } = require('discord.js')
const conf = require('conf')
const db = require('utils/database')

const description = `Get B3 ID of a Player`
var prefix, themeColor, usage

module.exports =
{
    description,
    init: async function()
    {
        prefix = conf.mainconfig.command.prefix
        themeColor = conf.mainconfig.themeColor

        usage = `${prefix}id @Mention/GUID`
        module.exports.usage = usage
    },

    callback: async function( msg, args, cmder )
    {
        const embed = new MessageEmbed().setColor(themeColor)
        var Entry, Name

        // args can be nothing, @player, guid
        if( !args.length )
            Entry = cmder.guid
        
        else
        {
            if( args[0].startsWith('<@') )
			{
				var potty = args[0].match(/(\d+)/)[0]
				
				const result = await db.pool.query(`SELECT b3_id FROM discod WHERE dc_id=${potty}`)
					.catch(ErrorHandler.fatal)

				if( result.length )
                    Entry = result[0].b3_id
				else return msg.reply( { embeds: [ embed.setDescription(`${args[0]} hasn't linked their account yet`) ]})
			}
			else
			{
				if( isNaN(args[0]) || args[0].length < 15 )
					return msg.reply( { embeds: [ embed.setTitle(`Invalid Entry`).setDescription(`Usage: ${usage}`) ]})
				else
                {
                    const result = await db.pool.query(`SELECT name,id FROM clients WHERE guid=${args[0]}`)
                        .catch( ErrorHandler.fatal )

                    if( !result.length )
                        return msg.reply( { embeds: [ embed.setDescription(`GUID ${args[0]} doesn't exist in the database`) ]})
                    
                    Entry = result[0].id
                    Name = result[0].name
                }
			}
        }
        
        if( Entry == cmder.guid || Entry == cmder.id )
            embed.setDescription(`Your B3 ID: **__@${cmder.id}__**, ${msg.author}`)
        else
        {
            if( args[0].startsWith('<@!') )
                embed.setDescription(`${args[0]}'s B3 ID: **__@${Entry}__**`)
            else embed.setDescription(`**${Name}**'s B3 ID: **__@${Entry}__**`)
        }

        return msg.reply( { embeds: [embed]} )
    }
}