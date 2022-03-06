// @ts-ignore
import { CommandInteraction, Interaction, Message, MessageEmbed } from "discord.js";
import { getClientFromSlashCommandArgObject, SlashCommandArgObject } from "./helper";

export async function cmd_aliases( arg: SlashCommandArgObject, ctx: Message | CommandInteraction )
{
    const embed = new MessageEmbed().setColor(themeColor);

    const client = await getClientFromSlashCommandArgObject( ctx, arg )
        .catch( () => {})

    if( client == undefined )
        return "";

    embed.setTitle(`${client.name} @${client.id}`);
    
    const checkLink = await getLink(client);

    const linkStr = checkLink == undefined? `> ❌ hasn't linked`: `🔗 <@${checkLink.dcId}>`;
    const aliasString = await getAliasString( client, 2000-linkStr.length );

    embed.setDescription(`${linkStr}\n${aliasString}`);

    return embed;
}



export async function cmd_ban()
{
    return "";
}