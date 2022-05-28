import axios from "axios";
import { MessageEmbed } from "discord.js";

import { CommandArgument, CommandResponse, getClientFromCommandArg, getLinkString, resolveName } from "../commandHandler/helper";
import CommandManager from "../commandHandler";
import pluginConf from "../conf/plugin_iptools.json5";

export const config_required = true;

export async function init(): Promise<void>
{
    // commands: isp, locate, distance?, allowvpn?, ipban
    const cmds = pluginConf.commands;
    for( var i = 0; i < cmds.length; i++ )
    {
        if( cmds[i].name == "ipban" )
        {
            console.log("Hemlo");
            
            await CommandManager.registerCommand({
                ...cmds[i],
                callback: cmd_ipban,
            }).catch(ErrorHandler.minor);
        }
        else if( cmds[i].name == "isp" )
            await CommandManager.registerCommand({
                ...cmds[i],
                callback: cmd_isp,
            }).catch(ErrorHandler.minor);
        else if( cmds[i].name == "locate" )
            await CommandManager.registerCommand({
                ...cmds[i],
                callback: cmd_locate,
            }).catch(ErrorHandler.minor);
        else if( cmds[i].name == "allowvpn" )
            await CommandManager.registerCommand({
                ...cmds[i],
                callback: cmd_allowvpn,
            }).catch(ErrorHandler.minor);
    }

    // create "discod_vpn_allowed" if no exis
    await db.createTableIfDoesntExist("discod_ipbans","./sql/discod_ipbans.sql");
    await db.createTableIfDoesntExist("discod_vpn_allowed","./sql/discod_vpn_allowed.sql");    
}

async function cmd_ipban( args: CommandArgument ): Promise<CommandResponse>
{
    const embed = new MessageEmbed().setColor(themeColor);

    if( args.reason == undefined || args.reason == "" )
        return embed.setDescription(`❌ You need to provide a reason`);

    if( args.other.ip )
    {
        const ip = args.other.ip;

        if( ip.length > 16 )
            return embed.setDescription(`❌ Invalid IP`);

        const check = await db.rawQuery(`SELECT * FROM discod_ipbans WHERE ip=${ip}`);
        if( check.length )
            return embed.setDescription(`☑️ IP Already Banned`);

        const client = await getClientFromCommandArg( args, {
            BAD_B3ID: false,
            BAD_GUID: false,
            BOT_CLIENT: false,
            NO_LINK: false,
            SLOT_EMPTY: false
        } )
            .catch( () => {} );

        if( client == undefined )
        {
            await db.rawQuery(`INSERT INTO discod_ipbans (ip,reason,time_add) VALUES ('${ip}','${args.reason}',UNIX_TIMESTAMP())`);
            return embed.setDescription(`☑️ IP Banned`)
        }
        else 
        {
            await db.rawQuery(`INSERT INTO discod_ipbans (ip,client_id,reason,time_add) VALUES ('${ip}',${client.id},'${args.reason}',UNIX_TIMESTAMP())`);
            return embed.setDescription(`☑️ IP Banned for **${client.name}**`)
        }
    }

    const client = await getClientFromCommandArg( args );
    if( !client )
        return;
    const linkStr = getLinkString( client, args.specifiedClientLink );

    // first check if ban already exists in db
    const check = await db.rawQuery(`SELECT * FROM discod_ipbans WHERE ip=${client.ip}`);
    if( check.length )
        return embed.setDescription(`☑️ This IP for **${client.name}** ${linkStr} is already banned`);

    await db.rawQuery(`INSERT INTO discod_ipbans (ip,client_id,reason,time_add) VALUES ('${client.ip}',${client.id},'${args.reason}',UNIX_TIMESTAMP())`);
    return embed.setDescription(`☑️ IP Banned for **${client.name}** ${linkStr}`)
}

async function cmd_isp( args: CommandArgument ): Promise<CommandResponse>
{
    const embed = new MessageEmbed().setColor(themeColor);
    const client = await getClientFromCommandArg( args )
    if( !client )
        return;
    const linkStr = getLinkString( client, args.specifiedClientLink );
    const f = (await axios(`http://ip-api.com/json/${client.ip}`)).data;

    return embed.setDescription(`**${resolveName(client.name)}** ${linkStr} is using **${f.isp}**`);
}

async function cmd_locate( args: CommandArgument ): Promise<CommandResponse>
{
    const embed = new MessageEmbed().setColor(themeColor);

    const client = await getClientFromCommandArg( args )
    if( !client )
        return;
    const linkStr = getLinkString( client, args.specifiedClientLink );
    const f = (await axios(`http://ip-api.com/json/${client.ip}`)).data;
    
    return embed.setDescription(`**${resolveName(client.name)}** ${linkStr} is from **${f.city}, ${f.regionName}, ${f.country}** :flag_${f.countryCode.toLowerCase()}:`);
}

async function cmd_allowvpn( args: CommandArgument ): Promise<CommandResponse>
{
    const embed = new MessageEmbed().setColor(themeColor);

    const client = await getClientFromCommandArg( args )
    if( !client )
        return;
    const linkStr = getLinkString( client, args.specifiedClientLink );

    const check = await db.rawQuery(`SELECT * FROM discod_vpn_allowed WHERE client_id=${client.id}`);
    if( check.length )
        return embed.setDescription(`**${resolveName(client.name)}** ${linkStr} can already use VPN`);

    await db.rawQuery(`INSERT INTO discod_vpn_allowed (client_id) VALUES (${client.id})`);

    return embed.setDescription(`**${resolveName(client.name)}** ${linkStr} has been allowed to use VPN`);
}