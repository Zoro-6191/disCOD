require('rootpath')()
const ErrorHandler = require('src/errorhandler')
const { MessageEmbed } = require('discord.js')
const conf = require('conf')
const db = require('utils/database')

const description = `Fetch top XLR Stats`
var prefix, themeColor, usage

module.exports =
{
    description,
    init: async function()
    {
        prefix = conf.mainconfig.command.prefix
        themeColor = conf.mainconfig.themeColor

        usage = `${prefix}xlrtopstats`
        module.exports.usage = usage
    },

    callback: async function( msg )
    {
        const result = await db.pool.query( `
        SELECT 
            clients.name,
            clients.id, 
            kills, 
            deaths, 
            ratio, 
            skill
        FROM clients, xlr_playerstats
            WHERE (clients.id = xlr_playerstats.client_id)
            AND ( (xlr_playerstats.kills > 50 ) OR (xlr_playerstats.rounds > 5) )
            AND (xlr_playerstats.hide = 0)
            AND (UNIX_TIMESTAMP(NOW()) - clients.time_edit  < 14*60*60*24)
            AND clients.id NOT IN
                ( SELECT distinct(target.id) FROM penalties as penalties, clients as target
                WHERE (penalties.type = "Ban"
                OR penalties.type = "TempBan")
                AND inactive = 0
                AND penalties.client_id = target.id
                AND ( penalties.time_expire = -1
                OR penalties.time_expire > UNIX_TIMESTAMP(NOW()) ) )
        ORDER BY xlr_playerstats.skill DESC LIMIT 12`)
            .catch( err => 
            {
                msg.reply( { embeds: [ new MessageEmbed().setColor( themeColor ).setDescription('There was an Error while processing your command') ]})
                ErrorHandler.fatal(err)
            })

        const embed = new MessageEmbed()
            .setColor( themeColor )
            .setTitle( `XLR Top Stats`)
            .setURL('https://www.youtube.com/watch?v=OLpeX4RRo28')

        for( i=0; i<12; i++ )
        {
            player = result[i]
            embed.addField( `${i+1}. __${player.name}__ @${player.id}` , 
                `Skill: ${player.skill}
                K: ${player.kills} D: ${player.deaths}
                K/D: ${player.ratio}` , true )
        }

        return msg.reply( { embeds: [embed]} )
    }
}