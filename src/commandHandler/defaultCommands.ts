import { CommandInteraction, Message, MessageEmbed } from "discord.js";
import { Brackets, getConnection, getRepository } from "typeorm";

import { Ops } from "../groups";
import { Clients } from "../entity/Clients";
import { getClientFromCommandArg, CommandArgument, CommandResponse } from "./helper";
import { Penalties } from "../entity/Penalties";
import { Discod } from "../entity/Discod";
import mainConfig from "../conf/config.json5";
import { XlrPlayerstats } from "../entity/XlrPlayerstats";

export async function cmd_aliases( arg: CommandArgument ): Promise< CommandResponse >
{
    const embed = new MessageEmbed().setColor(themeColor);

    const client = await getClientFromCommandArg( arg )
        .catch( () => {});

    if( client == undefined )
        return;

    embed.setTitle(`${client.name} @${client.id}`);
    
    const checkLink = await getLink(client);

    const linkStr = checkLink == undefined? `> ❌ hasn't linked`: `🔗 <@${checkLink.dc_id}>`;
    const aliasString = await getAliasString( client, 2000-linkStr.length );

    embed.setDescription(`${linkStr}\n${aliasString}`);

    return embed;
}

export async function cmd_baninfo( arg: CommandArgument ): Promise< CommandResponse >
{
    const embed = new MessageEmbed().setColor(themeColor);

    const client = await getClientFromCommandArg( arg )
        .catch( () => {} );

    if( client == undefined )
        return;

    const sql = getConnection().createQueryBuilder()
                            .from(Clients, "c")
                            .addFrom(Penalties, "p")
                            // .select("")
                            .where("c.id = :clID", { clID: client.id })
                            .andWhere( "p.client_id = :clIDD", { clIDD: client.id } )
                            .andWhere( "p.type IN (:...types)", { types: ["Ban", "TempBan"] })
                            .andWhere( new Brackets(qb => {
                                qb.where("p.time_expire = -1")
                                .orWhere("p.time_expire > UNIX_TIMETAMP()")
                            }))
                            .orderBy( "p.time_add", "DESC")
                            .limit(1)
                            .getSql();

    console.log(sql);

    const query = await rawQuery(`
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
        return embed.setDescription(`**${client.name}** has no active bans`);

    embed.setTitle(`${query[0].type}`)
        .setDescription(`**__${query[0].name}__** @${query[0].client_id}`)
        .addField( `Admin` , `**${arg.commander?.name}** @${query[0].admin_id}` , true )
        .addField( `Time of Ban` , `${new Date(query[0].time_add*1000).toLocaleString()}` , true )
        .addField( `Ban Expiry` , `${query[0].time_expire==-1?'Never':new Date(query[0].time_add*1000).toLocaleString()}` , true )

    if( query[0].reason != '' )
        embed.addField( `Reason`, `${query[0].reason}`, false )
    
    return embed;
}

export async function cmd_id( arg: CommandArgument ): Promise< CommandResponse >
{
    const embed = new MessageEmbed().setColor(themeColor);

    const client = await getClientFromCommandArg( arg )
        .catch( () => {} );
        
    if( client == undefined )
        return;
    
    const link = await getLink(client);

    if( link == undefined )
        embed.setDescription(`${client.name} \`${client.id}\``);
    else embed.setDescription(`<@${link.dc_id}> **${client.name.replace("*","\*")} @${client.id}**`);

    return embed;
}

export async function cmd_guid( arg: CommandArgument ): Promise< CommandResponse >
{
    const embed = new MessageEmbed().setColor(themeColor);

    const client = await getClientFromCommandArg( arg )
        .catch( () => {} );

    if( client == undefined )
        return;
    
    const link = await getLink(client);

    if( link != undefined )
        embed.setDescription(`<@${link.dc_id}> ${client.name} \`@${client.id}\`: **${client.guid}**`);
    else embed.setDescription(`${client.name} \`@${client.id}\`: **${client.guid}**`);

    return embed;
}

export async function cmd_lbans(): Promise< CommandResponse >
{
    const embed = new MessageEmbed().setColor(themeColor).setTitle(`Latest Active Bans`);

    const query = await rawQuery(`
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

    const client = await getClientFromCommandArg( arg );
    if( client == undefined )
        return;

    const link = await getLink(client);
    const group: GlobalGroup | undefined = Ops.getGroupFromKeyword(arg.group);
    
    if( group == undefined )
        return embed.setDescription(`❌ Invalid Group **${arg.group}**`);

    if( client.group_bits == group.bits )
    {
        if( link != undefined )
            return embed.setDescription(`❌ <@${link.dc_id}> ${client.name} \`@${client.id}\` is already in group **${group.name}**`);
        else return embed.setDescription(`❌ ${client.name} \`@${client.id}\` is already in group **${group.name}**`);
    }
    
    await rawQuery(`UPDATE clients SET group_bits=${group.bits},time_edit=UNIX_TIMESTAMP() WHERE id=${client.id}`);

    if( link != undefined )
        embed.setDescription(`☑️ <@${link.dc_id}> ${client.name} \`@${client.id}\` put in group **${group.name}**. (was ${Ops.bitsToName(client.group_bits)})`);
    else embed.setDescription(`☑️ ${client.name} \`@${client.id}\` put in group **${group.name}**. (was ${Ops.bitsToName(client.group_bits)})`);

    return embed;
}

export async function cmd_mask( arg: CommandArgument ): Promise< CommandResponse >
{
    const embed = new MessageEmbed().setColor(themeColor);

    if( arg.group == undefined )
        return embed.setDescription(`❌ Invalid Command Usage`);

    if( arg.commander == undefined )
        throw new Error("COMMANDER_UNDEFINED");
        
    var client: Clients | undefined | null;
    var link: Discod | null;

    if( !isDefined(arg.b3id) && !isDefined(arg.target) )
    {
        client = arg.commander;
        link = arg.link as Discod | null;
    }
    else 
    {
        client = await getClientFromCommandArg( arg );
        if( client == undefined )
            return;
        link = await getLink(client);
    }

    if( client == undefined )
            return;

    const group: GlobalGroup | undefined = Ops.getGroupFromKeyword(arg.group);
    
    if( group == undefined )
        return embed.setDescription(`❌ Invalid Group **${arg.group}**`);

    if( client?.mask_level == group.level )
    {
        if( link != undefined )
            return embed.setDescription(`❌ <@${link.dc_id}> ${client.name} \`@${client.id}\` is already masked as **${group.name}**`);
        else return embed.setDescription(`❌ ${client.name} \`@${client.id}\` is already masked as **${group.name}**`);
    }

    await rawQuery(`UPDATE clients SET mask_level=${group.level},time_edit=UNIX_TIMESTAMP() WHERE id=${client?.id}`);

    if( link != undefined )
        embed.setDescription(`☑️ <@${link.dc_id}> ${client?.name} \`@${client?.id}\` masked as **${group.name}**`);
    else embed.setDescription(`☑️ ${client?.name} \`@${client?.id}\` masked as **${group.name}**`);

    return embed;
}

export async function cmd_unmask( arg: CommandArgument ): Promise< CommandResponse >
{
    const embed = new MessageEmbed().setColor(themeColor);

    var client: Clients | undefined | null;
    var link: Discod | null;

    if( !isDefined(arg.b3id) && !isDefined(arg.target) )
    {
        client = arg.commander;
        link = arg.link as Discod | null;
    }
    else 
    {
        client = await getClientFromCommandArg( arg );
        if( client == undefined )
            return;
        link = await getLink(client);
    }

    if( client == undefined )
        throw new Error("CLIENT_UNDEFINED");

    if( client.mask_level < 1 )
    {
        if( link != undefined )
            embed.setDescription(`❌ <@${link.dc_id}> ${client?.name} \`@${client?.id}\` isn't masked`);
        else embed.setDescription(`❌ ${client?.name} \`@${client?.id}\` isn't masked`);
        return embed;
    }

    await rawQuery(`UPDATE clients SET mask_level=0,time_edit=UNIX_TIMESTAMP() WHERE id=${client.id}`);

    if( link != undefined )
        embed.setDescription(`☑️ <@${link.dc_id}> ${client?.name} \`@${client?.id}\` **Unmasked**`);
    else embed.setDescription(`☑️ ${client?.name} \`@${client?.id}\` masked as **Unmasked**`);

    return embed;
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

    var client: Clients | undefined | null;
    var link: Discod | null;

    if( !isDefined(arg.b3id) && !isDefined(arg.target) )
    {
        client = arg.commander;
        link = arg.link as Discod | null;
    }
    else 
    {
        client = await getClientFromCommandArg( arg );
        if( client == undefined )
            return;
        link = await getLink(client);
    }
    if( client == undefined )
        throw new Error("CLIENT_UNDEFINED");

    var group: GlobalGroup | undefined;
    
    if( client.mask_level > 0 )
        group = Ops.getGroupFromLevel(client.mask_level);
    else group = Ops.getGroupFromBits(client.group_bits);

    if( group == undefined )
        throw new Error("GROUP_UNDEFINED");

    if( link != undefined )
        embed.setDescription(`<@${link.dc_id}> ${client.name} \`@${client.id}\` is **${group.name}** since ${getReadableDateFromTimestamp(client.time_add)}`);
    else embed.setDescription(`${client.name} \`@${client.id}\` is **${group.name}** since ${getReadableDateFromTimestamp(client.time_add)}`);

    return embed;
}

export async function cmd_masktest( arg: CommandArgument ): Promise<CommandResponse>
{
    const embed = new MessageEmbed().setColor(themeColor);

    var client: Clients | undefined | null;
    var link: Discod | null;

    if( !isDefined(arg.b3id) && !isDefined(arg.target) )
    {
        client = arg.commander;
        link = arg.link as Discod | null;
    }
    else 
    {
        client = await getClientFromCommandArg( arg );
        if( client == undefined )
            return;
        link = await getLink(client);
    }
    if( client == undefined )
        throw new Error("CLIENT_UNDEFINED");

    var maskGroup: GlobalGroup | undefined;

    if( client.mask_level > 0 )
        maskGroup = Ops.getGroupFromLevel(client.mask_level);

    if( maskGroup == undefined )
    {
        if( link != undefined )
            return embed.setDescription(`<@${link.dc_id}> ${client.name} \`@${client.id}\` is not masked`);
        else embed.setDescription(`${client.name} \`@${client.id}\` is not masked`);
    }

    const userGroup = Ops.getGroupFromBits(client.group_bits);

    if( link != undefined )
        embed.setDescription(`<@${link.dc_id}> ${client.name} \`@${client.id}\` of group ${userGroup?.name} is masked as **${maskGroup?.name}**`);
    else embed.setDescription(`${client.name} \`@${client.id}\` of group ${userGroup?.name} is masked as **${maskGroup?.name}**`);

    return embed;
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

    const client = await getClientFromCommandArg(arg);
    if( client == undefined )
        return;

    const link = await getLink(client);

    const lastseen = new Date(client.time_edit*1000);
    
    if( link != undefined )
        embed.setDescription(`<@${link.dc_id}> ${client.name} \`@${client.id}\` was last seen on **${lastseen.toLocaleDateString()} ${lastseen.toLocaleTimeString()}**`);
    else embed.setDescription(`${client.name} \`@${client.id}\` was last seen on **${lastseen.toLocaleDateString()} ${lastseen.toLocaleTimeString()}**`);

    return embed;
}

export async function cmd_lookup( arg: CommandArgument ): Promise<CommandResponse>
{
    const embed = new MessageEmbed().setColor(themeColor);

    if( arg.name == undefined || arg.name == "" )
        return embed.setDescription(`❌ Enter a name to lookup`);

    const query = await rawQuery(`SELECT clients.*,discod.dc_id FROM clients 
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

    if( arg.maptoken == undefined )
        return embed.setDescription(`❌ Enter a map`);

    const mapname = (GlobalMaps as any)[arg.maptoken];

    if( mapname == undefined )
        return embed.setDescription(`❌ Unknown map`);

    const map = await rcon.getCurrentMap();
    if( arg.maptoken.toLowerCase() == map )
        return embed.setDescription(`❌ Current map is already **${mapname}**`);

    arg.ctx.reply({ embeds: [ embed.setDescription(`Changing Map to **${mapname}**`)] })

    await rcon.say(`${mainConfig.chat_prefix}^5${arg.commander?.name} ^3@${arg.commander?.id} ^7changed map to ^2${mapname}`);
    await wait(2000);

    for( var i = 3; i > 0; i-- )
    {
        await rcon.say(`Map Changing in ^1${i}..`);
        await wait(1000);
    }

    await rcon.map(`${arg.maptoken}`);

    if( arg.ctx instanceof Message )
        await arg.ctx.edit({ embeds: [ embed.setDescription(`☑️ Changed Map to **${mapname}**`)] });
    else await arg.ctx.editReply({ embeds: [ embed.setDescription(`☑️ Changed Map to **${mapname}**`)] });

    return;
}

export async function cmd_gametype( arg: CommandArgument ): Promise< CommandResponse >
{
    const embed = new MessageEmbed().setColor(themeColor);

    if( arg.gametype == undefined )
        return embed.setDescription(`❌ Enter a gametype`);

    const gtname = (GlobalGametypes as any)[arg.gametype];

    if( gtname == undefined )
        return embed.setDescription(`❌ Unknown Gametype`);

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

    if( arg.maptoken == undefined )
        return embed.setDescription(`❌ Enter a Map`);
    else if( arg.gametype == undefined )
        return embed.setDescription(`❌ Enter a Gametype`);

    const mapname = (GlobalGametypes as any)[arg.gametype];
    const gtname = (GlobalMaps as any)[arg.maptoken];

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
    
    // do we get the client or just send through slot or name?

    if( arg.slot == undefined )
        return embed.setDescription(`❌ Enter player slot`);

    const response = await rcon.getss( arg.slot );

    return embed.setDescription(response);
}

export async function cmd_xlrstats( arg: CommandArgument ): Promise<CommandResponse>
{
    const embed = new MessageEmbed().setColor(themeColor);

    var client: Clients | undefined | null;
    var link: Discod | null;

    if( !isDefined(arg.b3id) && !isDefined(arg.target) )
    {
        client = arg.commander;
        link = arg.link as Discod | null;
    }
    else 
    {
        client = await getClientFromCommandArg( arg );
        if( client == undefined )
            return;
        link = await getLink(client);
    }
    if( client == undefined )
        throw new Error("CLIENT_UNDEFINED");
        
    const stats = await getRepository(XlrPlayerstats).findOne( { where: { client_id: client.id }});

    var str = ``;

    if( link != undefined )
        str += `<@${link.dc_id}> `;
    
    str += `${client.name} \`@${client.id}\`**\n`;

    if( stats == undefined )
        return embed.setDescription( str + " hasn't registered yet");

    str += `\`\`\`c
Kills: ${stats.kills}\nDeaths: ${stats.deaths}\nKDR: ${stats.ratio}\nSkill: ${stats.skill}\nRounds Played: ${stats.rounds}\nMax Win Streak: ${stats.winstreak}\`\`\``

    return embed.setDescription("**XLR Stats for " + str);
}