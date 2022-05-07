import { MessageEmbed,TextChannel } from "discord.js";
import pluginConf from "../conf/plugin_chatlogger.json5";
import { existsSync } from "fs";
import {Tail} from "tail";

export const config_required = true;

export async function init(): Promise<void>
{
    var content = pluginConf.serverlog;

    // Check errors in config file
    if (content == "")
       throw new Error(` Please specify the Server Logfile in plugin config "./conf/plugin_chatlogger.json5" Plugin will not work`)
    else if( !existsSync(content) )
        throw new Error(` "serverLog" in plugin config "./conf/plugin_chatlogger.json5" defined incorrectly. ${content} doesn't exist. Plugin will not work.`);

    var embed_color_team = pluginConf.embed_color_team || themeColor;

    if (!pluginConf.embed_color_public) {
        var embed_color = themeColor;
        throw new Error(`"embed_color" in plugin config "./conf/plugin_chatlogger.json5" not defined. Using "${themeColor}"`);
    } 
    else var embed_color = pluginConf.embed_color_public;

    if( pluginConf.channel_id == "" )
        throw new Error(`"channel_id" in plugin config "./conf/plugin_chatlogger.json5" not defined. Plugin will not work.`) 
    
    if ( discordClient.channels.cache.get(pluginConf.channel_id) === undefined)
        throw new Error(`Specified "channel_id" in plugin config "./conf/plugin_chatlogger.json5" does not exist. Plugin will not work`);

    const logChannel: TextChannel = discordClient.channels.cache.get(pluginConf.channel_id) as TextChannel;

    if( !pluginConf.playerstatsLink )
        var statsUrl = "https://www.youtube.com/watch?v=dQw4w9WgXcQ";
    else statsUrl = pluginConf.playerstatsLink;

    const logTail = new Tail(content);

    logTail.on('line', async(newline) => 
    {
        if( newline.includes("QUICKMESSAGE") || ( !newline.includes("say;") && !newline.includes("sayteam;") ) )
            return;

        const isTeamChat = newline.includes("sayteam;");

        const embed = new MessageEmbed();
        const lineArray:string[] = new String(newline).split(";");
        if( lineArray.length < 5 )
            return;
        const b3id = await getB3ID(lineArray[1]);

        embed.setFooter({"text": `@${b3id}`});

        const playerName = (lineArray[3] as string).removeCodColors();
        lineArray.splice(0,4);
        const said = lineArray.join(";").trim().removeCodColors()
                                .replace("", "")
                                .replace("", "")
                                .replace("||","|\|")
                                .replace("`","\`")
                                .replace(`_`,`\_`)
                                .replace("~","\~")
                                .replace("*","\*")

        var line = `**[${playerName}](${statsUrl}${b3id})**${isTeamChat?"(team)":""}: ${said}`;
        
        if( isTeamChat ) 
            embed.setColor(embed_color_team);
        else embed.setColor(embed_color);
    
        await logChannel.send({ embeds: [embed.setDescription(line)]})
            .catch(()=>{}); // incase discord having issues
    });

    logTail.on("error", ErrorHandler.minor );
}

async function getB3ID(guid: any) 
{
    const result = await db.rawQuery( `SELECT id FROM clients WHERE guid=${guid}` )
        .catch( ErrorHandler.fatal );
    return result[0].id;
}
