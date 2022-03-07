import { MessageEmbed } from "discord.js";
import { getClientFromCommandArg, CommandArgument, CommandResponse } from "./helper";



export async function cmd_aliases( arg: CommandArgument ): Promise< CommandResponse >
{
    const embed = new MessageEmbed().setColor(themeColor);

    const client = await getClientFromCommandArg( arg )
        .catch( () => {});

    if( client == undefined )
        return;

    embed.setTitle(`${client.name} @${client.id}`);
    
    const checkLink = await getLink(client);

    const linkStr = checkLink == undefined? `> ❌ hasn't linked`: `🔗 <@${checkLink.dcId}>`;
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

    const query = await rawQuery(`
            SELECT * FROM clients,penalties 
            WHERE
                clients.id = ${client.id}
                AND client_id = ${client.id} 
                AND TYPE IN ("Ban","Tempban") 
                AND inactive = 0 AND (time_expire = -1 or time_expire > UNIX_TIMESTAMP())
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
    else embed.setDescription(`<@${link.dcId}> **${client.name.replace("*","\*")} @${client.id}**`);

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
        embed.setDescription(`<@${link.dcId}> ${client.name} \`@${client.id}\`: **${client.guid}**`);
    else embed.setDescription(`${client.name} \`@${client.id}\`: **${client.guid}**`);

    return embed;
}