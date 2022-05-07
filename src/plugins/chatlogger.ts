import { MessageEmbed,TextChannel } from "discord.js";
import pluginConf from "../conf/plugin_chatlogger.json5";
import { existsSync } from "fs";
import {Tail} from "tail";

export const config_required = true;

export async function init(): Promise<void>
{
    var content = pluginConf.serverlog;

    // Check errors in config file
    if (content == "") {
       throw new Error(` Please specify the Server Logfile in plugin config "./conf/plugin_chatlogger.json5" Plugin will not work`)
    } else if( !existsSync(content) )
    throw new Error(` "serverLog" in plugin config "./conf/plugin_chatlogger.json5" defined incorrectly. ${content} doesn't exist. Plugin will not work.`)

    var embed_color_team = pluginConf.embed_color_team || themeColor;

    if (!pluginConf.embed_color_public) {
        var embed_color = themeColor
       throw new Error(`"embed_color" in plugin config "./conf/plugin_chatlogger.json5" not defined. Using "${themeColor}"`)
    } else var embed_color = pluginConf.embed_color_public

    if( pluginConf.channel_id == "" )
        throw new Error(`"channel_id" in plugin config "./conf/plugin_chatlogger.json5" not defined. Plugin will not work.`) 
    
    if ( discordClient.channels.cache.get(pluginConf.channel_id) === undefined) {
        throw new Error(`Specified "channel_id" in plugin config "./conf/plugin_chatlogger.json5" does not exist. Plugin will not work`)
    }

    const logChannel: TextChannel = discordClient.channels.cache.get(pluginConf.channel_id) as TextChannel;

    if (pluginConf.playerstatsLink == "") { 
        var statsUrl = "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
        ErrorHandler.minor(`"playerstatsLink" in plugin config "./conf/plugin_chatlogger.json5" not defined. Using default Link.`)
    }

    const logTail = new Tail(content);

    logTail.on('line', async(newline) => 
    {
        if( newline.includes("QUICKMESSAGE") )
            return;

        const embed = new MessageEmbed();
        const lineArray:any = new String(newline).split(";");
        const b3id = await getB3ID(lineArray[1]);
        var line = `**[${lineArray[3]}](${statsUrl}${b3id})** Said: ${lineArray[4].replace("", "").replace("", "")}`;
        var footer = ` | GUID: ${lineArray[1].slice(11)} | B3ID: @${b3id}`;

        if( newline.includes("say;") )
            embed.setColor(embed_color)                    
                .setFooter({"text": `[Public Chat]`+footer})
        else if( newline.includes("sayteam;") ) 
            embed.setColor(embed_color_team)
                .setFooter({"text": `[Team Chat]`+footer});
    
        await logChannel.send({ embeds: [embed.setDescription(line)]})
            .catch(()=>{}); // incase discord having issues
    })

    logTail.on("error", ErrorHandler.minor );
}

async function getB3ID(guid: any) 
{
    const result = await db.rawQuery( `SELECT id FROM clients WHERE guid=${guid}` )
                .catch( ErrorHandler.fatal );
    var id = result[0].id
    return id;
}
