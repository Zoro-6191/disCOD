import { MessageEmbed } from "discord.js";
import axios from "axios";

import { CommandArgument, CommandResponse, getClientFromCommandArg } from "../commandHandler/helper";
import CommandManager from "../commandHandler";
import Ops from "../groups";

import pluginConf from "../conf/plugin_fullinfo.json5";

export const config_required = true;


export async function init(): Promise<void>
{
    await CommandManager.registerCommand({
        ...pluginConf.commands[0],
        callback: cmd_fullinfo,
    }).catch(ErrorHandler.minor);
}

export async function cmd_fullinfo( args: CommandArgument ): Promise<CommandResponse>
{
    const embed = new MessageEmbed().setColor(themeColor);

    const client = await getClientFromCommandArg( args )
    if( client == undefined )
        return;

    const q = await db.rawQuery(`SELECT 
clients.name,clients.ip,clients.connections,clients.guid,clients.group_bits,clients.mask_level,clients.greeting,clients.time_add,clients.time_edit,
    discod.dc_id,discod.linktime,
    xlr_playerstats.kills,xlr_playerstats.deaths,xlr_playerstats.ratio,xlr_playerstats.skill,xlr_playerstats.rounds
FROM clients
LEFT JOIN discod ON discod.b3_id=${client.id}
LEFT JOIN xlr_playerstats ON xlr_playerstats.client_id=${client.id}
WHERE clients.id=${client.id}`);

    embed.setTitle(`${client.name} @${client.id}`);

    const linkStr = q[0].dc_id == undefined? `> ❌ hasn't linked`: `🔗 <@${q[0].dc_id}>`;
    const aliasString = await getAliasString( client, 500-linkStr.length );

    const groupName = Ops.bitsToName(q[0].group_bits);
    const groupLevel = Ops.bitsToLevel(q[0].group_bits);

    if( groupName == undefined || groupLevel == undefined )
    {
        ErrorHandler.minor(`Bad group_bits`);
        console.log(q);
    }

    embed.setDescription(`${linkStr}\n${aliasString}`)
        .addField(`Group`, `${groupName} [${groupLevel}]`, true)

    if( q[0].mask_level )
    {
        const maskName = Ops.levelToName( q[0].mask_level )
        embed.addField(`Masked as`, maskName == undefined? "IDK" : maskName, true);
    }

    const lastSeen = new Date(q[0].time_edit * 1000);

    embed.addField('First Joined',`${new Date(q[0].time_add * 1000).toLocaleDateString()}`,true)
    embed.addField('Last Seen',`${lastSeen.toLocaleDateString()} ${lastSeen.toLocaleTimeString()}`,true)

    if( q[0].greeting != "" )
        embed.addField(`Greeting`,(q[0].greeting).removeCodColors(),true)
            
    embed.addField("XLR Stats", q[0].kills == undefined? "Not Registered" : `\`\`\`c
Kills: ${q[0].kills}\nDeaths: ${q[0].deaths}\nKDR: ${q[0].ratio}\nSkill: ${q[0].skill}\nRounds Played: ${q[0].rounds}\`\`\``);

    const ipinforeq = await axios(`http://ip-api.com/json/${q[0].ip}`)
    const ispData = ipinforeq.data;

    embed.addField(`Geolocation`,`\`\`\`apache
ISP: ${ispData.isp}
Country: ${ispData.country}
Region: ${ispData.regionName}
City: ${ispData.city}
Timezone: ${ispData.timezone}\`\`\``);

    return embed;
}