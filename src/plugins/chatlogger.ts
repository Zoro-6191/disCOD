import { MessageEmbed,TextChannel } from "discord.js";
import pluginConf from "../conf/plugin_chatlogger.json5";
import { existsSync, readFile } from "fs";
import chokidar from "chokidar";

export const config_required = true;

export async function init(): Promise<void>
{
    var content = pluginConf.serverlog;

    // Check errors in config file
    if (content == "") {
       return ErrorHandler.minor(` Please specify the Server Logfile in plugin config "./conf/plugin_chatlogger.json5" Plugin will not work`)
    } else if( !existsSync(content) )
    return ErrorHandler.minor(` "serverLog" in plugin config "./conf/plugin_chatlogger.json5" defined incorrectly. ${content} doesn't exist. Plugin will not work.`)


    if (!pluginConf.embed_color_team) {
        var embed_color = themeColor
       return ErrorHandler.minor(`" embed_color" in plugin config "./conf/plugin_chatlogger.json5" not defined. Using "${themeColor}"`)
    } else var embed_color_team = pluginConf.embed_color_team

    if (!pluginConf.embed_color_public) {
        var embed_color = themeColor
       return ErrorHandler.minor(`" embed_color" in plugin config "./conf/plugin_chatlogger.json5" not defined. Using "${themeColor}"`)
    } else var embed_color = pluginConf.embed_color_public

    if( pluginConf.channel_id == "" )
        return ErrorHandler.minor(`" channel_id" in plugin config "./conf/plugin_chatlogger.json5" not defined. Plugin will not work.`) 
    
    if ( discordClient.channels.cache.get(pluginConf.channel_id) === undefined) {
        return ErrorHandler.minor(` Specified "channel_id" in plugin config "./conf/plugin_chatlogger.json5" does not exist. Plugin will not work`)
    }

    const logChannel: TextChannel = discordClient.channels.cache.get(pluginConf.channel_id) as TextChannel;

    if (pluginConf.playerstatsLink == "") { 
        var statsUrl = "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
        ErrorHandler.minor(`"playerstatsLink" in plugin config "./conf/plugin_chatlogger.json5" not defined. Using default Link.`)
    }

        chokidar.watch(content).on('change', async (path) => {
        
          readFile(path, 'utf-8', async (err, data) => {
       

    // display an error if file is not readable
    if (err) {
        return ErrorHandler.minor(`Error reading file ${content}`)
    }

    let lines = data.trim().split("\n")

        lineToSend = lines[lines.length - 1]


        if (lineToSend.includes("say;") && !lineToSend.includes("QUICKMESSAGE")) {

            const lineArray:any = new String(lineToSend).split(";")

            const b3id = await getB3ID(lineArray[1])

            var lineToSend = `**[${lineArray[3]}](${statsUrl}${b3id})** Said: ${lineArray[4].replace("", "").replace("", "")}`

            const embed = new MessageEmbed()
            .setColor(embed_color)
            .setDescription(lineToSend)
            .setFooter({"text": `[Public Chat] | GUID: ${lineArray[1].slice(11)} | B3ID: @${b3id}`})

       await logChannel.send({ embeds: [embed]})

        } else if (lineToSend.includes("sayteam;") && !lineToSend.includes("QUICKMESSAGE")) {

            const lineArray1 = new String(lineToSend).split(";")

            const b3id = await getB3ID(lineArray1[1])

            var lineToSend = `**[${lineArray1[3]}](${statsUrl}${b3id})** Said: ${lineArray1[4].replace("", "").replace("", "")}`

            const embed2 = new MessageEmbed()
            .setColor(embed_color_team)
            .setDescription(lineToSend)
            .setFooter({"text": `[Team Chat] | GUID: ${lineArray1[1].slice(11)} | B3ID: @${b3id}`})

        await logChannel.send({ embeds: [embed2]})

        }
        });
    });

}

const getB3ID = async (guid: any) => {
    const result = await rawQuery( `SELECT id FROM clients WHERE guid=${guid}` )
                .catch( ErrorHandler.fatal )
            var id = result[0].id
            return id;
  }
