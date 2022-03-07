import { Message, MessageEmbed, User } from "discord.js";
import { SlashCommandBuilder } from "@discordjs/builders"
const { Routes } = require('discord-api-types/v9');
import { getRepository } from "typeorm";

import { CommandArgument } from "./helper";
import { Clients } from "../entity/Clients";
import { Discod } from "../entity/Discod";
import { rest } from ".";

const linkCmds: Command[] = [];

const tickImageURL = `https://cdn.discordapp.com/attachments/719492117294088252/949789685444657233/721-7212637_done-icon-white-png-transparent-png.png`;
const alertImageURL = `https://cdn.discordapp.com/attachments/719492117294088252/949948729228656650/1200px-OOjs_UI_icon_alert-yellow.svg.png`;

linkCmds[0] = {
    name: "link",
    alias: [],
    description: "Link to B3 ID",
    minLevel: 0,
    visibleToAllByDefault: true,
    type: "both",
    acceptArgs: { b3id: true },
    callback: cmd_link as any,
}

linkCmds[1]= {
    name: "unlink",
    alias: [],
    description: "Unlink your B3 ID from disCOD",
    minLevel: 0,
    type: "both",
    visibleToAllByDefault: true,
    acceptArgs: {
        other: {
            confirm: true,
        }
    },
    callback: cmd_unlink as any,
}

linkCmds[2] = {
    name: "forcelink",
    alias: [],
    description: "Forcelink an ID to disCOD",
    // process minlevel to highest level
    minLevel: 100,
    type: "both",
    visibleToAllByDefault: true,
    acceptArgs: {
        target: true,
        b3id: true
    },
    callback: cmd_forcelink as any,
}

linkCmds[3] = {
    name: "forceunlink",
    alias: [],
    description: "Force Un-link a player",
    // process minlevel to highest level
    minLevel: 100,
    type: "both",
    visibleToAllByDefault: true,
    acceptArgs: {
        target: false,
        b3id: false
    },
    callback: cmd_forceunlink as any,
}

export async function registerLinkCommands()
{
    var cmds: SlashCommandBuilder[] = [];
    for( var i = 0; i < linkCmds.length; i++ )
    {
        const cmd: Command = linkCmds[i];

        GlobalCommands.push(cmd);

        const slashCommand = new SlashCommandBuilder()
            .setName(cmd.name)
            .setDescription(cmd.description)

        if( cmd.name == "link" )
            slashCommand.addIntegerOption( opt => 
                            opt.setName("b3id")
                                .setDescription("Type `!id` ingame to get your id.")
                                .setAutocomplete(true)
                                .setRequired(true)
                                .setMinValue(2)
                                .setMaxValue(999999)
                            )
        
        if( cmd.name == "unlink" )
            slashCommand.addBooleanOption( opt =>
                            opt.setName("confirm")
                                .setRequired(true)
                                .setDescription("Confirm if you want to unlink"))

        if( cmd.name == "forcelink" )
            slashCommand.addMentionableOption( opt =>
                            opt.setName("target")
                                .setRequired(true)
                                .setDescription("Mention who to forcelink.")
                                )
                        .addIntegerOption( opt => 
                            opt.setName("b3id")
                                .setDescription("Type `!id <name>` ingame to get id.")
                                .setAutocomplete(true)
                                .setRequired(true)
                                .setMinValue(2)
                                .setMaxValue(999999)
                            )
        
        if( cmd.name == "forceunlink" )
            slashCommand.addMentionableOption( opt => 
                                opt.setName("target")
                                    .setDescription("Mention a User")
                                    .setRequired(false)
                                )
                        .addIntegerOption( opt => 
                                opt.setName("b3id")
                                    .setDescription("B3 ID of player")
                                    .setRequired(false)
                                    .setMinValue(2)
                                    .setMaxValue(999999)
                                )

        cmds.push(slashCommand);
        // discordClient.application?.commands.create(slashCommand as any);
    }
    
    await rest.put(
        Routes.applicationGuildCommands(discordClient.user?.id, discordClient.guildId ),
        { body: cmds },
    );
}



export async function cmd_link( 
    arg: CommandArgument
 )
{  
    const embed = new MessageEmbed().setColor(themeColor);

    if( arg.commander != undefined && arg.link != undefined )
        return embed.setDescription(`🔗 You're already linked to \`@${arg.commander.id}\``);
    else if( arg.link != undefined && arg.commander == undefined )
    {
        if( arg.link.b3Id == arg.b3id )
            return embed.setDescription(`🔗 Linked already initiated to \`@${arg.b3id}\`\nCheck DM.`);
        else return embed.setDescription(`❌ Linked already initiated to \`@${arg.link.b3Id}\`\n**/unlink** before linking new ID.`);
    }
    else if( arg.link == undefined && arg.commander != undefined )
        throw new Error(`Link: commander and link fetched different`);

    const IDValidChec = await rawQuery(`SELECT * FROM clients WHERE id=${arg.b3id}`);
        if(!IDValidChec.length)
            return embed.setDescription(`❌ Invalid ID`);
    
    const user = arg.ctx instanceof Message? arg.ctx.author: arg.ctx.user;

    // init DM message ( later to be edited )
    var dmMsg: any;

    // check if id already exists
    const exisChec = await getRepository(Discod).findOne( { where: { b3Id: arg.b3id }} );
    if( exisChec != undefined )
    {
        if( exisChec.dcId != user.id && exisChec.linked == 1 )
            return embed.setDescription(`❌ ID is already linked to <@${exisChec.dcId}>`);
        // do we want to stop current link or delete older link and relink??
        else await getRepository(Discod).delete(exisChec.id);
    }

    // in case user has turned off dm
    var dmCheck: boolean = true;

    await user.send( { embeds: [ embed.setDescription(`Initializing Link`) ] } )
        .catch( err => { 
            if( err.code == 50007 ) {
                embed.setTitle(`You need to enable Direct Messages for this command`)
                    .setDescription(`(Go to Settings> Privacy and Safety> Allow Direct Messages)`);
            }
            else throw new Error("What just happened?");
            dmCheck = false;
        })
        .then( res => { dmMsg = res });

    if( !dmCheck )
        return embed;

    let password: string = Math.floor(Math.random() * 100000000).toString();
    
    await rawQuery(`INSERT INTO discod(b3_id,dc_id,dc_tag,pass,time_add) VALUES (${arg.b3id},${user.id},'${user.tag}',${password},UNIX_TIMESTAMP());`);

    // TO-DO: link to dm
    await dmMsg.edit({ embeds: [
        new MessageEmbed().setColor(themeColor)
            .setThumbnail(alertImageURL)
            .setTitle(`Need Verification. Paste this in-game and you're good to go:`)
            .addField(`__!link ${password}__`,Date().toString())
    ]})

    embed.setTitle(`Link initiated to \`${arg.b3id}\`. Check DM!`)
        .setThumbnail(tickImageURL)
        .setDescription( `🔗 ${user}` );

    return embed;
}


export async function cmd_unlink(
    arg: { 
        commander?: Clients, 
        cmd: Command, 
        link: Discod | undefined
        other: { confirm?: boolean }
    } 
): Promise<MessageEmbed>
{
    const embed = new MessageEmbed().setColor(themeColor);
    
    if( !arg.other.confirm )
        return embed.setDescription(`❌ Confirmation Required.`);

    if( arg.link == undefined )
        return embed.setDescription(`❌ Link doesn't exist`);

    await rawQuery(`DELETE FROM discod WHERE b3_id = ${arg.link.b3Id} OR dc_id = ${arg.link.dcId}`);

    // Emit unlink event
    events.emit("unlink", arg );

    return embed.setDescription(`✅ Unlinked from \`@${arg.link.b3Id}\``);
}

export async function cmd_forcelink( arg: { 
    commander?: Clients, 
    cmd: Command,
    link?: Discod,
    target: User,
    b3id: number 
} ): Promise<MessageEmbed>
{
    const embed = new MessageEmbed().setColor(themeColor);

    const IDValidChec = await rawQuery(`SELECT * FROM clients WHERE id=${arg.b3id}`);
    if(!IDValidChec.length)
        return embed.setDescription(`❌ Invalid ID`);

    const exisChec = await rawQuery(`SELECT * FROM discod WHERE dc_id=${arg.target.id} OR b3_id=${arg.b3id}`);
    if( exisChec.length )
    {
        const exisUser = discordClient.users.cache.find( user => user.id == exisChec[0].dc_id );
        if( exisChec[0].dc_id == arg.target.id && exisChec[0].b3_id == arg.b3id && exisChec[0].linked == 0 )
        {
            console.log("Here");
            
            // just need to change linked to 1 and timestamp "linktime"
            await rawQuery(`UPDATE discod 
                SET linked=1,
                    linktime=UNIX_TIMESTAMP()
                WHERE b3_id=${arg.b3id}`);
            
            arg.target.send( { 
                embeds: [ new MessageEmbed().setDescription(`You were force-linked by Superadmin to B3 ID \`@${arg.b3id}\``).setThumbnail(tickImageURL) ] 
            } )

            return embed.setDescription(`Successfully Force-Linked ${arg.target} to \`@${arg.b3id}\``)
                    .setThumbnail(tickImageURL);
        }
        else if( exisChec[0].dc_id == arg.target.id )
            return embed.setDescription(`❌ ${arg.target} is already linked to \`@${exisChec[0].b3_id}\``);
        else if( exisChec[0].b3_id == arg.b3id )
            return embed.setDescription(`❌ \`@${arg.b3id}\` is already linked to ${exisUser}`);
    }
    
    await rawQuery(`INSERT INTO discod(b3_id,dc_id,dc_tag,pass,linked,linktime,time_add) VALUES (${arg.b3id},${arg.target.id},'${arg.target.tag}',0,1,UNIX_TIMESTAMP(),UNIX_TIMESTAMP());`);

    arg.target.send( { 
        embeds: [ new MessageEmbed().setDescription(`You were force-linked by Superadmin to B3 ID \`@${arg.b3id}\``).setThumbnail(tickImageURL) ] 
    } )

    return embed.setDescription(`Successfully Force-Linked ${arg.target} to \`@${arg.b3id}\``)
                        .setThumbnail(tickImageURL);
}

export async function cmd_forceunlink( arg: CommandArgument ): Promise<MessageEmbed>
{
    const embed = new MessageEmbed().setColor(themeColor);

    if( arg.target == undefined && arg.b3id == undefined )
        return embed.setDescription(`Forceunlink who????????`)

    const isTarget: boolean = arg.target != undefined;

    if( isTarget )
        var exisChec = await rawQuery(`SELECT * FROM discod WHERE dc_id=${arg.target?.id}`);
    else var exisChec = await rawQuery(`SELECT * FROM discod WHERE b3_id=${arg.b3id}`);
    if( !exisChec.length )
        return embed.setDescription(`❌ ${isTarget? arg.target: `\`@${arg.b3id}\``} hasn't linked yet`);

    await rawQuery( `DELETE FROM discod WHERE b3_id = ${exisChec[0].b3_id}` );

    // Emit unlink event
    events.emit("forcelink", arg );

    return embed.setDescription(`Unlinked  ${discordClient.users.cache.find( user => user.id == exisChec[0].dc_id )} from \`@${exisChec[0].b3_id}\``);
}