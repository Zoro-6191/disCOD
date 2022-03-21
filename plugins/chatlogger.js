//const fs = require('fs')
const fs = require('fs-extra')
const discord = require('src/discordclient')
const { MessageEmbed } = require('discord.js')
const util = require('util')
const conf = require('conf')
const db = require('utils/database')
const ErrorHandler = require('src/errorhandler')

module.exports =
{
    init: async function()
    {
        pluginConfig = conf.plugin.chatlogger

        var statsUrl = pluginConfig.playerstatsLink

        var content = pluginConfig.serverLog;

        if (content == "") {
           return ErrorHandler.minor(` Please specify the Server Logfile in plugin config "./conf/plugin_serverlog.json" Plugin will not work`)
        } else if( !fs.existsSync(content) )
        return ErrorHandler.minor(` "serverLog" in plugin config "./conf/plugin_chatlogger.json" defined incorrectly. ${content} doesn't exist. Plugin will not work.`)


        if (pluginConfig.embed_color == "") {
            var embed_color = conf.mainconfig.themeColor
           return ErrorHandler.minor(`" embed_color" in plugin config "./conf/plugin_chatlogger.json" not defined. Using "${conf.mainconfig.themeColor}"`)
        } else var embed_color = pluginConfig.embed_color

        if( pluginConfig.channel_id == "" )
            return ErrorHandler.minor(`" channel_id" in plugin config "./conf/plugin_chatlogger.json" not defined. Plugin will not work.`) 
        else var logChannel = await discord.client.channels.cache.get( pluginConfig.channel_id )

        if ( await discord.client.channels.cache.get(pluginConfig.channel_id) === undefined) {
           return ErrorHandler.minor(` Specified "channel_id" in plugin config "./conf/plugin_chatlogger.json" does not exist. Plugin will not work`)
        }

        if (statsUrl == "") {
            statsUrl = "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
            ErrorHandler.minor(`"playerstatsLink" in plugin config "./conf/plugin_chatlogger.json" not defined. Using default Link.`)
        }


        fs.watchFile(content, async (eventType, filename) => {
            fs.readFile(content, 'utf-8', async (err, data) => {

        // display an error if file is not readable
        if (err) {
            return ErrorHandler.minor(`Error reading file ${content}`)
        }

        let lines = data.trim().split("\n")

            lineToSend = lines[lines.length - 1]


            if (lineToSend.includes("say;") && !lineToSend.includes("QUICKMESSAGE")) {

                const lineArray = new String(lineToSend).split(";")

                b3id = await getB3ID(lineArray[1])

                var lineToSend = `**[${lineArray[3]}](${statsUrl}${b3id})** Said: ${lineArray[4].replace("", "").replace("", "")}`

                const embed = new MessageEmbed()
                .setColor(embed_color)
                .setDescription(lineToSend)
                .setFooter({"text": `[Public Chat] | GUID: ${lineArray[1].slice(11)} | B3ID: @${b3id}`})

            logChannel.send({ embeds: [embed]})

            } else if (lineToSend.includes("sayteam;") && !lineToSend.includes("QUICKMESSAGE")) {

                const lineArray1 = new String(lineToSend).split(";")

                b3id = await getB3ID(lineArray1[1])

                var lineToSend = `**[${lineArray1[3]}](${statsUrl}${b3id})** Said: ${lineArray1[4].replace("", "").replace("", "")}`
                
                const embed2 = new MessageEmbed()
                .setColor("#ff0000")
                .setDescription(lineToSend)
                .setFooter({"text": `[Team Chat] | GUID: ${lineArray1[1].slice(11)} | B3ID: @${b3id}`})

            logChannel.send({ embeds: [embed2]})

            }
            });
        });

    }
}

const getB3ID = async (guid) => {
    const result = await db.pool.query( `SELECT id FROM clients WHERE guid=${guid}` )
                .catch( ErrorHandler.fatal )
            var id = result[0].id
            return id;
  }
