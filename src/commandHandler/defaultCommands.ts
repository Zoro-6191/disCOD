import { CommandInteraction, MessageEmbed } from "discord.js";
import { Brackets, getConnection } from "typeorm";

import { Ops } from "../groups";
import { Clients } from "../entity/Clients";
import { getClientFromCommandArg, CommandArgument, CommandResponse } from "./helper";
import { Penalties } from "../entity/Penalties";
import { Discod } from "../entity/Discod";
import mainConfig from "../conf/config.json5";



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