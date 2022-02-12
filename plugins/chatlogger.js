const discord = require('src/discordclient')
const fs = require('fs')
const { MessageEmbed } = require('discord.js')
const conf = require('conf')
const db = require('utils/database')
const ErrorHandler = require('src/errorhandler')
const util = require('util')

module.exports =
{
    init: async function()
    {
        pluginConfig = conf.plugin.chatlogger
        var statsUrl = pluginConfig.playerstatsLink
        const content = pluginConfig.serverLog;
        var embed_color = pluginConfig.embed_color

        fs.watchFile(content, async (eventType, filename) => {
            fs.readFile(content, 'utf-8', async (err, data) => {

        logChannel = discord.client.channels.cache.get(pluginConfig.channel_id)

        let lines = data.trim().split("\n")

            lineToSend = lines[lines.length - 1]

            if (lineToSend.includes("say;") && !lineToSend.includes("QUICKMESSAGE")) {

                const lineArray = new String(lineToSend).split(";")

                b3id = await getB3ID(lineArray[1])

                lineToSend = `**[${lineArray[3]}](${statsUrl}${b3id})** Said: ${lineArray[4].replace("", "").replace("", "")}`

                const embed = new MessageEmbed()
                .setColor(embed_color)
                .setDescription(lineToSend)
                .setFooter(`[Public Chat] GUID: ${lineArray[1].slice(11)} B3ID: @${b3id}`)

            logChannel.send({ embeds: [embed]})

            } else if (lineToSend.includes("sayteam;") && !lineToSend.includes("QUICKMESSAGE")) {

                const lineArray1 = new String(lineToSend).split(";")

                b3id = await getB3ID(lineArray1[1])

                lineToSend = `**[${lineArray1[3]}](${statsUrl}${b3id})** Said: ${lineArray1[4].replace("", "").replace("", "")}`

                const embed2 = new MessageEmbed()
                .setColor("#ff0000")
                .setDescription(lineToSend)
                .setFooter(`[Team Chat] GUID: ${lineArray1[1].slice(11)} B3ID: @${b3id}`)

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