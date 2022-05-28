import { CommandInteraction, Message, MessageEmbed } from "discord.js";
import { getRepository } from "typeorm";

import { Ops } from "../groups";
import { Clients } from "../entity/Clients";
import { CommandArgument, CommandResponse, getAliasString, getLinkString, resolveName } from "./helper";
import { Discod } from "../entity/Discod";
import mainConfig from "../conf/config.json5";
import { XlrPlayerstats } from "../entity/XlrPlayerstats";
import CommandManager from ".";

export async function cmd_aliases( arg: CommandArgument ): Promise< CommandResponse >
{
    const embed = new MessageEmbed().setColor(themeColor);

    const client = arg.specifiedClient;
    if( client == undefined )
        return;
    const linkStr = getLinkString( client, arg.specifiedClientLink );

    embed.setTitle(`${resolveName(client.name)}`);

    const aliasString = await getAliasString( client, 2000-linkStr.length, true );

    return embed.setDescription(`${linkStr}\n${aliasString}`);
}

export async function cmd_ban( arg: CommandArgument ): Promise< CommandResponse >
{
    const embed = new MessageEmbed().setColor(themeColor);

    const client = arg.specifiedClient;
    if( client == undefined )
        return;
    const linkStr = getLinkString( client, arg.specifiedClientLink );

    if( arg.reason == undefined )
        return embed.setDescription(`❌ You need to provide a reason`)

    await db.rawQuery(`INSERT INTO penalties 
    (type,duration,inactive,admin_id,time_add,time_edit,time_expire,reason,keyword,client_id) 
    VALUES
    ("Ban",30,0,${arg.commander?.id},UNIX_TIMESTAMP(),UNIX_TIMESTAMP(),time_add+(30*60),"${arg.reason}","",${client.id});`);

    db.rawQuery(`UPDATE clients SET group_bits=2 WHERE id=${client.id}`);

    embed.addField("Reason",arg.reason,true);

    return embed.setDescription(`☑️ **${resolveName(client.name)}** ${linkStr} banned for 30 minutes`);
}

export async function cmd_permban( arg: CommandArgument ): Promise< CommandResponse >
{
    const embed = new MessageEmbed().setColor(themeColor);

    const client = arg.specifiedClient;
    if( client == undefined )
        return;
    const linkStr = getLinkString( client, arg.specifiedClientLink );
    
    if( arg.reason == undefined )
        return embed.setDescription(`❌ You need to provide a reason`);

    db.rawQuery(`INSERT INTO penalties 
    (type,duration,inactive,admin_id,time_add,time_edit,time_expire,reason,keyword,client_id) 
    VALUES
    ("Ban",0,0,${arg.commander?.id},UNIX_TIMESTAMP(),UNIX_TIMESTAMP(),-1,"${arg.reason}","",${client.id});`);

    db.rawQuery(`UPDATE clients SET group_bits=2 WHERE id=${client.id}`);

    embed.addField("Reason",arg.reason,true);

    embed.setDescription(`☑️ **${resolveName(client.name)}** ${linkStr} permanently banned`);

    return embed;
}

export async function cmd_unban( arg: CommandArgument ): Promise< CommandResponse >
{
    const embed = new MessageEmbed().setColor(themeColor);
    
    const client = arg.specifiedClient;
    if( client == undefined )
        return;
    const linkStr = getLinkString( client, arg.specifiedClientLink );
    
    rcon.sendRconCommand(`unban ${client.guid}`);

    const check = await db.rawQuery(`SELECT * FROM penalties WHERE client_id=${client.id} AND inactive=0`);

    if( !check.length )
        return embed.setDescription(`**${resolveName(client.name)}** ${linkStr} isn't banned. If this player was banned from RCON, they have been unbanned.`);

    await db.rawQuery(`UPDATE penalties SET inactive=1,time_edit=UNIX_TIMESTAMP() WHERE client_id=${client.id} AND inactive=0`)

    return embed.setDescription(`☑️ Unbanned **${resolveName(client.name)}** ${linkStr}`);
}

export async function cmd_baninfo( arg: CommandArgument ): Promise< CommandResponse >
{
    const embed = new MessageEmbed().setColor(themeColor);

    const client = arg.specifiedClient;
    if( client == undefined )
        return;
    const linkStr = getLinkString( client, arg.specifiedClientLink );

    const query = await db.rawQuery(`
            SELECT * FROM clients,penalties 
            WHERE
                clients.id = ${client.id}
                AND client_id = ${client.id} 
                AND type IN ("Ban","TempBan") 
                AND inactive = 0 
                AND (time_expire = -1 or time_expire > UNIX_TIMESTAMP())
            ORDER BY penalties.time_add DESC LIMIT 1
            `);

    if( !query.length )
        return embed.setDescription(`**${resolveName(client.name)}** ${linkStr} has no active bans`);

    embed.setTitle(`${query[0].type}`);
    
    embed.setDescription(`**__${query[0].name}__** ${linkStr}`);
    
    embed.addField( `Admin` , `**${arg.commander?.name}** @${query[0].admin_id}` , true )
        .addField( `Time of Ban` , `${new Date(query[0].time_add*1000).toLocaleString()}` , true )
        .addField( `Ban Expiry` , `${query[0].time_expire==-1?'Never':new Date(query[0].time_add*1000).toLocaleString()}` , true )

    if( query[0].reason != '' )
        embed.addField( `Reason`, `${query[0].reason}`, false )
    
    return embed;
}

export async function cmd_id( arg: CommandArgument ): Promise< CommandResponse >
{
    const embed = new MessageEmbed().setColor(themeColor);

    const client = arg.specifiedClient;
    if( client == undefined )
        return;
    const linkStr = getLinkString( client, arg.specifiedClientLink );

    return embed.setDescription(`**${resolveName(client.name)}** ${linkStr}`);
}

export async function cmd_guid( arg: CommandArgument ): Promise< CommandResponse >
{
    const embed = new MessageEmbed().setColor(themeColor);

    const client = arg.specifiedClient;
    if( client == undefined )
        return;
    const linkStr = getLinkString( client, arg.specifiedClientLink );

    return embed.setDescription(`${resolveName(client.name)} ${linkStr}: **${client.guid}**`);
}

export async function cmd_lbans(): Promise< CommandResponse >
{
    const embed = new MessageEmbed().setColor(themeColor).setTitle(`Latest Active Bans`);

    const query = await db.rawQuery(`
        SELECT 
            penalties.*,
            clients.name as clientname,
            discod.dc_id as admin_dc_id
        FROM penalties
        LEFT JOIN clients ON penalties.client_id = clients.id
        LEFT JOIN discod ON penalties.admin_id = discod.b3_id
        WHERE 
            penalties.type IN ("Ban","Tempban") 
            AND inactive=0 
            AND (penalties.time_expire > UNIX_TIMESTAMP() OR penalties.time_expire=-1)
            ORDER BY penalties.time_add DESC, penalties.id DESC LIMIT 12`
    );

    if( !query.length )
        return embed.setDescription(`No active bans at the moment.`);

    for( var i = 0; i < query.length; i++ )
    {
        const ban = query[i];
        const isPermanent = ban.time_expire==-1;
        const adminStr = ban.admin_dc_id == undefined? `\`@${ban.admin_id}\`` : `<@${ban.admin_dc_id}>`;

        var fieldContent: string = `Player: ${ban.clientname} \`@${ban.client_id}\`\n`
        if( ban.admin_id != 0 )
            fieldContent += `Admin: ${adminStr}\n`

        if( ban.reason != "")
            fieldContent += `Reason: \`${ban.reason.removeCodColors()}\n\``;

        const readableBanDate: string = getReadableDateFromTimestamp(ban.time_add);

        fieldContent += `Ban Time: ${readableBanDate}\n`;

        if( !isPermanent )
        {
            const readableExpireDate: string = getReadableDateFromTimestamp(ban.time_expire);
            fieldContent += `Expires on: ${readableExpireDate}\n`;
        }
        embed.addField( `${isPermanent? "Permanent Ban": "Ban"}`, fieldContent, true )
    }

    return embed;
}

export async function cmd_putgroup( arg: CommandArgument ): Promise< CommandResponse >
{
    const embed = new MessageEmbed().setColor(themeColor);

    if( arg.group == undefined )
        return embed.setDescription(`❌ Invalid Command Usage`);

    const client = arg.specifiedClient;
    if( client == undefined )
        return;
    const linkStr = getLinkString( client, arg.specifiedClientLink );
    const group = arg.specifiedGroup;
    if( group == undefined )
        return;

    if( client.group_bits == group.bits )
        return embed.setDescription(`❌ ${resolveName(client.name)} ${linkStr} is already in group **${group.name}**`);
    
    await db.rawQuery(`UPDATE clients SET group_bits=${group.bits},time_edit=UNIX_TIMESTAMP() WHERE id=${client.id}`);

    return embed.setDescription(`☑️ **${resolveName(client.name)}** ${linkStr} put in group **${group.name}**. (was ${Ops.bitsToName(client.group_bits)})`);
}

export async function cmd_mask( arg: CommandArgument ): Promise< CommandResponse >
{
    const embed = new MessageEmbed().setColor(themeColor);

    if( arg.group == undefined )
        return embed.setDescription(`❌ Invalid Command Usage`);

    const client = arg.specifiedClient;
    if( client == undefined )
        return;
    const linkStr = getLinkString( client, arg.specifiedClientLink );

    const group = arg.specifiedGroup;    
    if( group == undefined )
        return;
    if( group.level == 0 )
        return embed.setDescription(`❌ Cannot mask as **${group.name}**`);

    if( client.mask_level == group.level )
        return embed.setDescription(`❌ ${resolveName(client.name)} ${linkStr} is already masked as **${group.name}**`);

    await db.rawQuery(`UPDATE clients SET mask_level=${group.level},time_edit=UNIX_TIMESTAMP() WHERE id=${client?.id}`);

    return embed.setDescription(`☑️ **${resolveName(client.name)}** ${linkStr} masked as **${group.name}**`);
}

export async function cmd_unmask( arg: CommandArgument ): Promise< CommandResponse >
{
    const embed = new MessageEmbed().setColor(themeColor);

    const client = arg.specifiedClient;
    if( client == undefined )
        return;
    const linkStr = getLinkString( client, arg.specifiedClientLink );

    if( client.mask_level < 1 )
        return embed.setDescription(`❌ **${client?.name}** ${linkStr} isn't masked`);

    await db.rawQuery(`UPDATE clients SET mask_level=0,time_edit=UNIX_TIMESTAMP() WHERE id=${client.id}`);

    return embed.setDescription(`☑️ **${client?.name}** ${linkStr} was **Unmasked**`);
}

export async function cmd_fast_restart( arg: CommandArgument ): Promise< CommandResponse >
{
    const embed = new MessageEmbed().setColor(themeColor);

    await arg.ctx.reply({
        embeds: [embed.setDescription(`Sending Command..`)],
        ephemeral: !(arg.visible2all!=undefined? arg.visible2all : arg.cmd.visibleToAllByDefault),
    });

    await rcon.say(`${mainConfig.chat_prefix}^5${arg.commander?.name} ^3@${arg.commander?.id} ^7issued ^2Fast Restart`);
    await wait(2000);

    for( var i = 3; i > 0; i-- )
    {
        await rcon.say(`Fast Restarting in ^1${i}..`);
        await wait(1000);
    }

    await rcon.fast_restart();

    const successMsg = `☑️ Successfully Fast Restarted`;

    if( arg.ctx instanceof CommandInteraction )
        arg.ctx.editReply({embeds: [embed.setDescription(successMsg)]});
    else arg.ctx.edit({embeds: [embed.setDescription(successMsg)]});

    return;
}

export async function cmd_leveltest( arg: CommandArgument ): Promise< CommandResponse >
{
    const embed = new MessageEmbed().setColor(themeColor);

    const client = arg.specifiedClient;
    if( client == undefined )
        return;
    const linkStr = getLinkString( client, arg.specifiedClientLink );

    var group: GlobalGroup | undefined;
    
    if( client.mask_level > 0 )
        group = Ops.getGroupFromLevel(client.mask_level);
    else group = Ops.getGroupFromBits(client.group_bits);

    if( group == undefined )
        throw new Error("GROUP_UNDEFINED");

    return embed.setDescription(`**${resolveName(client.name)}** ${linkStr} is **${group.name}** since ${getReadableDateFromTimestamp(client.time_add)}`);
}

export async function cmd_masktest( arg: CommandArgument ): Promise<CommandResponse>
{
    const embed = new MessageEmbed().setColor(themeColor);

    const client = arg.specifiedClient;
    if( client == undefined )
        return;
    const linkStr = getLinkString( client, arg.specifiedClientLink );

    var maskGroup: GlobalGroup | undefined;

    if( client.mask_level > 0 )
        maskGroup = Ops.getGroupFromLevel(client.mask_level);

    if( maskGroup == undefined )
        return embed.setDescription(`**${resolveName(client.name)}** ${linkStr} is not masked`);

    const userGroup = Ops.getGroupFromBits(client.group_bits);

    return embed.setDescription(`**${resolveName(client.name)}** ${linkStr} of group ${userGroup?.name} is masked as **${maskGroup?.name}**`);
}

export async function cmd_list(): Promise<CommandResponse>
{
    const embed = new MessageEmbed().setColor(themeColor);

    const status = await rcon.status();
    const info = await rcon.serverinfo();
    const onlinePlayers = status.onlinePlayers;

    // make guid array for db query
    if( onlinePlayers.length )
    {
        var guidStr: string[] = [];    
        for( var i = 0; i < onlinePlayers.length; i++ )
            guidStr.push(onlinePlayers[i].guid);
    
        var query: any[] = await getRepository(Clients).createQueryBuilder("c")
                                                    .leftJoin( Discod, "d", "d.b3_id = c.id" )
                                                    .select(["c.*","dc_id"])
                                                    .where("c.guid IN (:...guds)", { guds: guidStr } )
                                                    .execute();
    }
    else var query = [];

    function mapGuid( players: RconOnlinePlayer[], query: any[] ): any[]
    {
        var finalPlayerList: any = [];
        for( var i=0; i<query.length; i++ )
        {
            for( var j=0; j<players.length; j++ )
            {
                if( players[j].guid == query[i].guid )
                {
                    const client = query[i];
                    const player = players[j];

                    finalPlayerList[i] = {};

                    finalPlayerList[i].id = client.id;
                    finalPlayerList[i].time_add = client.time_add;
                    finalPlayerList[i].time_edit = client.time_edit;
                    finalPlayerList[i].mask_level = client.mask_level;
                    finalPlayerList[i].group_bits = client.group_bits;
                    finalPlayerList[i].connections = client.connections;
                    finalPlayerList[i].greeting = client.greeting;
                    finalPlayerList[i].dc_id = client.dc_id;
                    finalPlayerList[i].ip = client.ip;
                    finalPlayerList[i].name = player.name;
                    finalPlayerList[i].guid = player.guid;
                    finalPlayerList[i].slot = player.slot;
                    finalPlayerList[i].score = player.score;
                }
            }
        }

        return finalPlayerList;
    }

    const finalPlayerList = mapGuid( onlinePlayers, query );

    embed.setTitle((status.hostname).removeCodColors() + ` (${onlinePlayers.length}/${rcon.sv_maxclients})` )
            .setDescription(`Map: ${(GlobalMaps as any)[status.map]}\nUptime: ${info.uptime}`)
            .setURL(`https://www.youtube.com/watch?v=dQw4w9WgXcQ`);

    for( i = 0; i < 24; i++ )
    {
        const player = finalPlayerList[i];

        if( player == undefined )
            continue;
        
        var fieldContent = ``;

        if( player.dc_id != null )
            fieldContent += `<@${player.dc_id}>\n`;
        else fieldContent += `\`@${player.id}\`\n`;

        if( player.mask_level > 0 )
            var group = Ops.getGroupFromLevel( player.mask_level );
        else var group = Ops.getGroupFromBits( player.group_bits );

        if( group == undefined )
            throw new Error("GROUP_UNDEFINED");
        fieldContent += `${group.name}\n`;

        embed.addField( `(${player.slot}) ${player.name.removeCodColors()}`, fieldContent, true);
    }

    if( finalPlayerList.length > 24 )
    {
        var embed2 = new MessageEmbed().setColor(themeColor);

        for( var i = 24; i < finalPlayerList.length; i++ )
        {
            const player = finalPlayerList[i];
            if( player == undefined )
                continue;

            var fieldContent = ``;

            if( player.dc_id != null )
                fieldContent += `<@${player.dc_id}>\n`;
            else fieldContent += `\`@${player.id}\`\n`;

            if( player.mask_level > 0 )
                var group = Ops.getGroupFromLevel( player.mask_level );
            else var group = Ops.getGroupFromBits( player.group_bits );

            if( group == undefined )
                throw new Error("GROUP_UNDEFINED");
            fieldContent += `${group.name}\n`;

            embed2.addField( `(${player.slot}) ${player.name.removeCodColors()}`, fieldContent, true);
        }
        embed2.setFooter("/connect "+mainConfig.server.public_ip);
        return [embed,embed2];
    }
    else embed.setFooter("/connect "+mainConfig.server.public_ip);

    return [embed];
}

export async function cmd_seen( arg: CommandArgument ): Promise<CommandResponse>
{
    const embed = new MessageEmbed().setColor(themeColor);

    const client = arg.specifiedClient;
    if( client == undefined )
        return;
    const linkStr = getLinkString( client, arg.specifiedClientLink );
    const lastseen = new Date(client.time_edit*1000);
    
    return embed.setDescription(`**${resolveName(client.name)}** ${linkStr} was last seen on **${lastseen.toLocaleDateString()} ${lastseen.toLocaleTimeString()}**`);
}

export async function cmd_lookup( arg: CommandArgument ): Promise<CommandResponse>
{
    const embed = new MessageEmbed().setColor(themeColor);

    if( arg.name == undefined || arg.name == "" )
        return embed.setDescription(`❌ Enter a name to lookup`);

    const query = await db.rawQuery(`SELECT clients.*,discod.dc_id FROM clients 
                LEFT JOIN discod ON discod.b3_id = clients.id
                WHERE clients.name LIKE "%${arg.name}%" ORDER BY clients.time_edit DESC LIMIT 12`);

    embed.setTitle(`Database search for "${arg.name}": ${query.length} matches` );

    for( var i = 0; i < query.length; i++ )
    {
        const player = query[i];

        var fieldContent = ``;

        if( player.dc_id != undefined )
            fieldContent += `<@${player.dc_id}>\n`

        fieldContent += `${Ops.bitsToName(player.group_bits)}`

        embed.addField(`${player.name} @${player.id}`,fieldContent,true);
    }

    return embed;
}

export async function cmd_map_restart( arg: CommandArgument ): Promise<CommandResponse>
{
    const embed = new MessageEmbed().setColor(themeColor);

    await arg.ctx.reply({
        embeds: [embed.setDescription(`Sending Command..`)],
        ephemeral: !(arg.visible2all!=undefined? arg.visible2all : arg.cmd.visibleToAllByDefault),
    });

    await rcon.say(`${mainConfig.chat_prefix}^5${arg.commander?.name} ^3@${arg.commander?.id} ^7issued ^2Map Restart`);
    await wait(2000);

    for( var i = 3; i > 0; i-- )
    {
        await rcon.say(`Map Restarting in ^1${i}..`);
        await wait(1000);
    }

    await rcon.map_restart();

    const successMsg = `☑️ Successfully Restarted Map`;

    if( arg.ctx instanceof CommandInteraction )
        arg.ctx.editReply({embeds: [embed.setDescription(successMsg)]});
    else arg.ctx.edit({embeds: [embed.setDescription(successMsg)]});

    return;
}

export async function cmd_say( arg: CommandArgument ): Promise< CommandResponse >
{
    const embed = new MessageEmbed().setColor(themeColor);

    if( arg.text == undefined )
        return embed.setDescription(`❌ Enter valid text`);

    await rcon.say( `${mainConfig.chat_prefix}^5${arg.commander?.name} ^3@${arg.commander?.id}^7: ${arg.text}` );

    embed.setDescription(`☑️ Printed "${arg.text}" in in-game chat`);

    return embed;
}

export async function cmd_map( arg: CommandArgument ): Promise< CommandResponse >
{
    const embed = new MessageEmbed().setColor(themeColor);

    if( arg.specifiedMap == undefined || arg.maptoken == undefined )
        return;

    const map = await rcon.getCurrentMap();
    if( arg.maptoken.toLowerCase() == map )
        return embed.setDescription(`❌ Current map is already **${arg.specifiedMap}**`);

    arg.ctx.reply({ embeds: [ embed.setDescription(`Changing Map to **${arg.maptoken}**`)] })

    await rcon.say(`${mainConfig.chat_prefix}^5${arg.commander?.name} ^3@${arg.commander?.id} ^7changed map to ^2${arg.specifiedMap}`);
    await wait(2000);

    for( var i = 3; i > 0; i-- )
    {
        await rcon.say(`Map Changing in ^1${i}..`);
        await wait(1000);
    }

    await rcon.map(`${arg.maptoken}`);

    if( arg.ctx instanceof Message )
        await arg.ctx.edit({ embeds: [ embed.setDescription(`☑️ Changed Map to **${arg.specifiedMap}**`)] });
    else await arg.ctx.editReply({ embeds: [ embed.setDescription(`☑️ Changed Map to **${arg.specifiedMap}**`)] });

    return;
}

export async function cmd_gametype( arg: CommandArgument ): Promise< CommandResponse >
{
    const embed = new MessageEmbed().setColor(themeColor);

    if( arg.gametype == undefined || arg.specifiedGametype == undefined )
        return;

    const gtname = arg.specifiedGametype;

    const gt = await rcon.getCurrentGametype();
    if( arg.gametype.toLowerCase() == gt )
        return embed.setDescription(`❌ Current gametype is already **${gtname}**`);

    arg.ctx.reply({ embeds: [ embed.setDescription(`Changing Gametype to **${gtname}**`)] })

    await rcon.say(`${mainConfig.chat_prefix}^5${arg.commander?.name} ^3@${arg.commander?.id} ^7changed gametype to ^2${gtname}`);
    await wait(2000);

    for( var i = 3; i > 0; i-- )
    {
        await rcon.say(`Gametype Changing in ^1${i}..`);
        await wait(1000);
    }

    await rcon.gametype(`${arg.gametype}`);

    if( arg.ctx instanceof Message )
        await arg.ctx.edit({ embeds: [ embed.setDescription(`☑️ Changed Gametype to **${gtname}**`)] });
    else await arg.ctx.editReply({ embeds: [ embed.setDescription(`☑️ Changed Gametype to **${gtname}**`)] });

    return;
}

export async function cmd_mag( arg: CommandArgument ): Promise< CommandResponse >
{
    const embed = new MessageEmbed().setColor(themeColor);

    if( arg.maptoken == undefined || arg.gametype == undefined || arg.specifiedMap == undefined || arg.specifiedGametype == undefined )
        return;

    const mapname = arg.specifiedMap;
    const gtname = arg.specifiedGametype;

    const info = await rcon.serverinfo();

    if( arg.maptoken == info.mapname && arg.gametype == info.g_gametype )
        return embed.setDescription(`❌ Map and Gametype are already **${mapname} ${gtname}**`);
    else if( arg.gametype != info.g_gametype && arg.maptoken == info.mapname )
    {
        rcon.setDvar(`g_gametype`,arg.gametype);
        arg.ctx.reply({ embeds: [ embed.setDescription(`☑️ Changing Gametype to **${gtname}**`)] });
        rcon.say(`${mainConfig.chat_prefix}^5${arg.commander?.name} ^3@${arg.commander?.id} ^7changed gametype to ^2${gtname}`);
    }
    else if( arg.gametype == info.g_gametype && arg.maptoken != info.mapname )
    {
        arg.ctx.reply({ embeds: [ embed.setDescription(`☑️ Changing Map to **${mapname}**`)] });
        rcon.say(`${mainConfig.chat_prefix}^5${arg.commander?.name} ^3@${arg.commander?.id} ^7changed map to ^2${mapname}`);
    }
    else 
    {
        rcon.setDvar(`g_gametype`,arg.gametype);
        arg.ctx.reply({ embeds: [ embed.setDescription(`☑️ Changing Map and Gametype to **${mapname} ${gtname}**`)] });
        rcon.say(`${mainConfig.chat_prefix}^5${arg.commander?.name} ^3@${arg.commander?.id} ^7changed map and gametype to ^3${mapname} ^2${gtname}`);
    }

    await wait(2000);

    for( var i = 3; i > 0; i-- )
    {
        await rcon.say(`Changing in ^1${i}..`);
        await wait(1000);
    }

    if( arg.gametype != info.g_gametype && arg.maptoken == info.mapname )
        rcon.sendRconCommand(`map_restart`);
    else rcon.sendRconCommand(`map ${arg.maptoken}`);

    return;
}

export async function cmd_getss( arg: CommandArgument ): Promise<CommandResponse>
{
    const embed = new MessageEmbed().setColor(themeColor);

    if( arg.slot == undefined )
        return embed.setDescription(`❌ Enter player slot`);

    const response = await rcon.getss( arg.slot );

    return embed.setDescription(response);
}

export async function cmd_xlrstats( arg: CommandArgument ): Promise<CommandResponse>
{
    const embed = new MessageEmbed().setColor(themeColor);

    const client = arg.specifiedClient;
    if( client == undefined )
        return;
    const linkStr = getLinkString( client, arg.specifiedClientLink );
        
    const stats = await getRepository(XlrPlayerstats).findOne( { where: { client_id: client.id }});

    var str = `**XLR Stats** for **${resolveName(client.name)}** ${linkStr}\n`;

    if( stats == undefined )
        return embed.setDescription( str + " hasn't registered yet");

    str += `\`\`\`c
Kills: ${stats.kills}
Deaths: ${stats.deaths}
KDR: ${stats.ratio}
Skill: ${stats.skill}
Rounds Played: ${stats.rounds}
Max Win Streak: ${stats.winstreak}\`\`\``

    return embed.setDescription(str);
}

export async function cmd_xlrtopstats(): Promise<CommandResponse>
{
    const embed = new MessageEmbed().setColor(themeColor).setTitle(`XLR Top Stats`);
    // TO-DO: option to disable showing only linked boys in topstats
    const q = await db.rawQuery(`
        SELECT 
            clients.name,
            clients.id, 
            kills, 
            deaths, 
            ratio, 
            skill,
            discod.dc_id
        FROM clients, xlr_playerstats, discod
        WHERE (clients.id = xlr_playerstats.client_id)
            AND ( (xlr_playerstats.kills > 50 ) OR (xlr_playerstats.rounds > 5) )
            AND (xlr_playerstats.hide = 0)
            AND (UNIX_TIMESTAMP(NOW()) - clients.time_edit  < 14*60*60*24)
            AND discod.b3_id = clients.id AND discod.linked = 1
            AND clients.id NOT IN
                ( SELECT distinct(target.id) FROM penalties as penalties, clients as target
                WHERE (penalties.type = "Ban"
                OR penalties.type = "TempBan")
                AND inactive = 0
                AND penalties.client_id = target.id
                AND ( penalties.time_expire = -1
                OR penalties.time_expire > UNIX_TIMESTAMP(NOW()) ) )
        ORDER BY xlr_playerstats.skill DESC LIMIT 12`);
    
    for( var i = 0; i < q.length; i++ )
    {
        var fieldContent = `<@${q[i].dc_id}>\n`;
        fieldContent += `\`\`\`apache\nKills: ${q[i].kills}\nKDR: ${q[i].ratio}\nSkill: ${q[i].skill}\`\`\``;

        embed.addField(`${i+1}. ${q[i].name}`,fieldContent,true);
    }   

    return embed;
}

export async function cmd_help( arg: CommandArgument ): Promise< CommandResponse >
{
    const embed = new MessageEmbed().setColor(themeColor);

    if( arg.other.command == undefined )
    {
        if( arg.commander?.group_bits == undefined )
            throw new Error("Commander Group bits undefined");
        const minLevel = Ops.bitsToLevel(arg.commander?.group_bits);
        if( minLevel == undefined )
            throw new Error("Minimum level was undefined");
        const permCommands = CommandManager.getCommandsFromMinLevel(minLevel);
        embed.setTitle("Available Commands");
        var desc = ``;

        for( var i = 0; i < permCommands.length; i++ )
        {
            const cmd = permCommands[i];
            desc += `> **${cmd.type == 'prefix'? mainConfig.command.prefix : "/"}${cmd.name}**\n`
        }
        embed.setDescription(desc);
        embed.setFooter(`Specify a command in **/help** to know more about it`);
        return embed;
    }
    const fetched = CommandManager.getCommand({name: arg.other.command, alias: arg.other.command })    
    if( fetched == undefined )
        return embed.setDescription(`❌ Command __**${arg.other.command}**__ does not exist`);
    
    embed.setTitle("Command: "+arg.other.command);
    var desc = ``;
    desc += `**Description:** ${fetched.description}`;
    if( fetched.type != 'slash' && fetched.alias.length )
        desc += `\n**Aliases:** ${fetched.alias.join(", ")}`;
    const grN = Ops.levelToName(fetched.minLevel);
    desc += `\n**Minimum level:** ${grN == undefined?"":grN} [${fetched.minLevel}]`;

    return embed.setDescription(desc);
}

export async function cmd_xlrbotstats(): Promise<CommandResponse>
{
    const embed = new MessageEmbed().setColor(themeColor);

    const q = await db.rawQuery(`SELECT 
    clients.name,
    clients.id, 
    kills, 
    deaths, 
    ratio, 
    skill,
    discod.b3_id,
    discod.dc_id
FROM clients, xlr_playerstats, discod
WHERE (clients.id = discod.b3_id)
    AND (clients.id = xlr_playerstats.client_id)
    AND ( (xlr_playerstats.kills > 50 ) OR (xlr_playerstats.rounds > 5) )
    AND (xlr_playerstats.hide = 0)
    AND (UNIX_TIMESTAMP(NOW()) - clients.time_edit  < 432000)
    AND clients.id NOT IN
        ( SELECT distinct(target.id) FROM penalties as penalties, clients as target
        WHERE (penalties.type = "Ban"
        OR penalties.type = "TempBan")
        AND inactive = 0
        AND penalties.client_id = target.id
        AND ( penalties.time_expire = -1
        OR penalties.time_expire > UNIX_TIMESTAMP(NOW()) ) )
ORDER BY xlr_playerstats.skill ASC LIMIT 12;`);

    if( q == undefined )
        throw new Error("XLR Bot Stats query returned undefined");

    for( var i = 0; i < q.length; i++ )
    {
        var fieldContent = `<@${q[i].dc_id}>\n`;
        fieldContent += `\`\`\`apache\nKills: ${q[i].kills}\nKDR: ${q[i].ratio}\nSkill: ${q[i].skill}\`\`\``;

        embed.addField(`${i+1}. ${q[i].name}`,fieldContent,true);
    }   

    return embed;
}