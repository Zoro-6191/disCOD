require('rootpath')()
const ErrorHandler = require('src/errorhandler')
const { MessageEmbed } = require('discord.js')
const conf = require('conf')
const db = require('utils/database')

const description = `Know a player's in-game resolution and aspect ratio`
var prefix, themeColor, usage

module.exports =
{
    description,
    init: async function()
    {
        prefix = conf.mainconfig.command.prefix
        themeColor = conf.mainconfig.themeColor

        usage = `${prefix}reso @Mention/@ID`
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

        const res = await db.pool.query(`SELECT * FROM discod_reso WHERE client_id=${Entry}`)
            .catch( ErrorHandler.fatal )

        if( !res.length )
            embed.setDescription(`Don't know.`)
        else
        {
            reso = res[0].reso

            var split = reso.split('x')
            var X = parseInt(split[0])
            var Y = parseInt(split[1])

            var aspectRatio = getAspectRatio(X,Y);

            if( Entry == cmder.id )
                embed.setDescription(`Your resolution: **${res[0].reso}** (${aspectRatio})`)
            else
            {
                poop = await db.pool.query(`SELECT name FROM clients WHERE id=${Entry}`)           
                embed.setDescription(`**${poop[0].name}**'s resolution: **${res[0].reso}** (${aspectRatio})`)
            }
        }

        return msg.reply( { embeds: [ embed ]})
    }
}

function getAspectRatio(X,Y)
{
    poop = GCD(X,Y);
    return `${X/poop}:${Y/poop}`;
}

function GCD(a,b)
{
    return (b == 0) ? a : GCD(b, a%b);
}