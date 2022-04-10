// import "json5/lib/register";
import { ColorResolvable, CommandInteraction, Interaction, Message, User } from "discord.js";
import { getConnection, getRepository } from "typeorm";
import { SlashCommandBuilder } from "@discordjs/builders"
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
import { isArray } from "util";
import chalk from "chalk";

import { Ops } from "../groups";
import mainconfig from "../conf/config.json5";
import defaultCmdsConfig from "../conf/default_cmds.json5";
import { Clients } from "../entity/Clients";
import { registerLinkCommands } from "./linkCommands";
import { Discod } from "../entity/Discod";
import { CommandResponse } from "./helper";
import { Timer } from "../utilities";

declare global 
{
    type Command = {
        name: string,
        description: string,
        type: "slash" | "prefix" | "both",
        visibleToAllByDefault: boolean,
        acceptArgs: { 
            target?: boolean, 
            b3id?: boolean,
            slot?: boolean,
            guid?: boolean,
            name?: boolean,
            text?: boolean,
            group?: boolean,
            maptoken?: boolean,
            gametype?: boolean,
            visible2all?: boolean,
            other?: OtherCommandArg[]
        },
        minLevel: number,
        callback: ( args: CommandArgument ) => Promise<CommandResponse>,
        // helpMsg: string,
        alias: string[],
    }
    var GlobalCommands: Command[];

    // TO-DO: do we want this? or /commands? or both?
    var cmdPrefix: string;
    var themeColor: ColorResolvable;
}

export type OtherCommandArg = {
    name: string;
    type: "string" | "int" | "mention" | "boolean" | "number" | "channel" | "role",
    required: boolean,
    description?: string
}

var CommandManager: ComMan = {
    registerCommand,
    removeCommand,
    getCommand,
    addCommandAlias,
    getCommandAlias,
    getCommandFromAlias,
    removeAllCommandAliases,
    getCommandsFromMinLevel,
    getAllCommands,
}

export default CommandManager;

export const rest = new REST({ version: '9' }).setToken(mainconfig.discord_token);

/**
 * Initialize Command Manager for the first time
 */
export async function initCommandManager()
{
    // register default commands from config ig
    if( globalThis.GlobalCommands != undefined )
        return ErrorHandler.fatal("CommandHandler is already initialized once.");

    globalThis.GlobalCommands = [];
    globalThis.themeColor = mainconfig.themeColor;

    // rawQuery method
    globalThis.rawQuery = (q: string) => getConnection().manager.query(q);

    const mainconfOps = mainconfig.command;

    globalThis.cmdPrefix = mainconfOps.prefix;

    // init slash commands
    var slashCmds: SlashCommandBuilder[] = [];

    // register link commands before others
    await registerLinkCommands();

    //  slash choices
    var groupChoices: [name: string, value: string][] = [];
    for( var i = 0; i < GlobalGroups.length; i++ )
        groupChoices.push([ GlobalGroups[i].name, GlobalGroups[i].keyword ]);
    
    var mapChoices: [name: string, value: string][] = [];
    Object.keys(GlobalMaps).forEach( (key: string) => {
        mapChoices.push([ (GlobalMaps as any)[key], key ]);
    })

    var gametypeChoices: [name: string, value: string][] = [];
    Object.keys(GlobalGametypes).forEach( (key: string) => {
        gametypeChoices.push([ (GlobalGametypes as any)[key], key ]);
    })

    // register default commands from default_cmds.json5
    for( var i = 0; i < defaultCmdsConfig.defaultCmds.length; i++ )
    {
        var cmd = defaultCmdsConfig.defaultCmds[i];

        cmd.callback = (await import("./defaultCommands") as any)["cmd_"+cmd.name];

        if( cmd.type != "prefix" )
        {
            (slashCmds[slashCmds.length] as any) = new SlashCommandBuilder()
                .setName(cmd.name)
                .setDescription(cmd.description)

            const currentSlashCommand = slashCmds[slashCmds.length-1];

            // process acceptable command arguments
            // discord wants required options first, then optional options, so we need to sort
            const accInput: any = Object.fromEntries(Object.entries(cmd.acceptArgs).sort( ([,x],[,y]) => (x === y)? 0 : x? -1 : 1 ));

            Object.keys(accInput).forEach( key => {
                if( key == "target" )
                    currentSlashCommand.addMentionableOption( opt => 
                            opt.setName("target")
                                .setDescription("Mention a User")
                                .setRequired(accInput.target)
                            );
                else if( key == "b3id" )
                    currentSlashCommand.addIntegerOption( opt => 
                            opt.setName("b3id")
                                .setDescription("B3 ID of player")
                                .setMinValue(2)
                                .setMaxValue(999999)
                                .setRequired(accInput.b3id)
                            );
                else if( key == "slot" )
                    currentSlashCommand.addIntegerOption( opt => 
                            opt.setName("slot")
                                .setDescription("Slot of player if he's currently in-game")
                                .setRequired(accInput.slot)
                                .setMinValue(0)
                                .setMaxValue(63)
                            );
                else if( key == "text" )
                    currentSlashCommand.addStringOption( opt => 
                                opt.setName("text")
                                    .setDescription("Enter any text")
                                    .setRequired(accInput.text)
                                );
                else if( key == "name" )
                    currentSlashCommand.addStringOption( opt => 
                                opt.setName("name")
                                    .setDescription("Name of online player")
                                    .setRequired(accInput.name)
                                );
                else if( key == "guid" )
                    currentSlashCommand.addStringOption( opt => 
                            opt.setName("guid")
                                .setDescription("GUID of player")
                                .setRequired(accInput.guid)
                            );
                else if( key == "maptoken" )
                    currentSlashCommand.addStringOption( opt => 
                            opt.setName("maptoken")
                                .setDescription("Token of map, like mp_crash")
                                .setRequired(accInput.maptoken)
                                .setChoices(mapChoices)
                            );
                else if( key == "gametype" )
                    currentSlashCommand.addStringOption( opt => 
                            opt.setName("gametype")
                                .setDescription("Gametype Token, like dm or sd")
                                .setRequired(accInput.gametype)
                                .setChoices(gametypeChoices)
                            );
                else if( key == "visible2all" )
                    currentSlashCommand.addBooleanOption( opt =>
                            opt.setName("visible2all")
                                .setDescription("If false, only you will be able to see response.")
                                .setRequired(accInput.visible2all)
                            );
                else if( key == "group" )
                    currentSlashCommand.addStringOption( opt => 
                            opt.setName("group")
                                .setDescription("User or Admin group")
                                .setRequired(accInput.group)
                                .addChoices(groupChoices)
                            );
                else if( key == "other" && cmd.acceptArgs.other != undefined && cmd.acceptArgs.other.length > 0 )
                {
                    // again, need to register required first smh
                    const sorted = cmd.acceptArgs.other.sort( (a: any,b: any) => a.required == b.required? 0 : a.required? -1 : 1 );

                    for( var k = 0; k < sorted.length; k++ )
                    {
                        const cmdd = sorted[k];
                        if( cmdd.type == "string" )
                            currentSlashCommand.addStringOption( opt => 
                                opt.setName(cmdd.name)
                                    .setDescription( cmdd.description != undefined? cmdd.description : "Extra Arg" )
                                    .setRequired(cmdd.required)
                                );
                        else if( cmdd.type == "boolean" )
                            currentSlashCommand.addBooleanOption( opt => 
                                opt.setName(cmdd.name)
                                    .setDescription( cmdd.description != undefined? cmdd.description : "Extra Arg" )
                                    .setRequired(cmdd.required)
                                );
                        else if( cmdd.type == "channel" )
                            currentSlashCommand.addChannelOption( opt => 
                                opt.setName(cmdd.name)
                                    .setDescription( cmdd.description != undefined? cmdd.description : "Extra Arg" )
                                    .setRequired(cmdd.required)
                                );
                        else if( cmdd.type == "int" )
                            currentSlashCommand.addIntegerOption( opt => 
                                opt.setName(cmdd.name)
                                    .setDescription( cmdd.description != undefined? cmdd.description : "Extra Arg" )
                                    .setRequired(cmdd.required)
                                );
                        else if( cmdd.type == "mention" )
                            currentSlashCommand.addMentionableOption( opt => 
                                opt.setName(cmdd.name)
                                    .setDescription( cmdd.description != undefined? cmdd.description : "Extra Arg" )
                                    .setRequired(cmdd.required)
                                );
                        else if( cmdd.type == "number" )
                            currentSlashCommand.addNumberOption( opt => 
                                opt.setName(cmdd.name)
                                    .setDescription( cmdd.description != undefined? cmdd.description : "Extra Arg" )
                                    .setRequired(cmdd.required)
                                );
                        else if( cmdd.type == "role" )
                            currentSlashCommand.addRoleOption( opt => 
                                opt.setName(cmdd.name)
                                    .setDescription( cmdd.description != undefined? cmdd.description : "Extra Arg" )
                                    .setRequired(cmdd.required)
                                );
                    }
                }
            });
        }
        
        var createCmd: Command = { ...cmd }
        globalThis.GlobalCommands.push(createCmd);
    }    

    await rest.put(
        Routes.applicationGuildCommands(discordClient.user?.id, discordClient.guildId ),
        { body: slashCmds },
    );

    // catch and process slash commands
    if( mainconfig.command.type != "prefix" )
        discordClient.on( "interactionCreate", async IC => processIncomingCommand( IC as CommandInteraction ) )

    // catch and process prefix commands
    if( mainconfig.command.type != "slash" )
        discordClient.on( "messageCreate", async msg => processIncomingCommand(msg) );
}

type CommandArgument = { 
    ctx: Message | CommandInteraction,
    isSlashCommand: boolean,
    commander?: Clients | null, 
    cmd: Command, 
    link?: Discod | null,
    target?: User,
    b3id?: number,
    slot?: number,
    guid?: string,
    name?: string,
    text?: string,
    maptoken?: string,
    gametype?: string,
    group?: string,
    visible2all?: boolean,
    other: any
}

async function processIncomingCommand( ctx: Message | CommandInteraction )
{
    const totalTimeTracker = new Timer();
    Debug(`Command Interaction`);
    
    const isInteraction = ctx instanceof CommandInteraction || ctx instanceof Interaction;

    if( isInteraction )
    {
        // Slash Command
        if( !ctx.isApplicationCommand() )
            return;

        var { commandName, options: _opt } = ctx;
    }
    else if( ctx instanceof Message )
    {
        // Prefix Command
        var content: string = ctx.content.trim();

        // check if we really wanna processs it
        if( !content.length || !content.startsWith(cmdPrefix) || ctx.author.bot )
            return;

        // convert to array to process
        var tokens: string[] = content.split(/\s+/);

        // remove prefix
        var commandName = tokens[0].toLowerCase().substring(cmdPrefix.length);

        // obtain args in string format
        tokens.shift();
        var prefixArgs: string[] = tokens;

        // do we want the command?
        if( !commandName.length || mainconfig.command.bypass.includes(commandName) )
            return;

        // send "disCOD is Typing..."
        await ctx.channel.sendTyping()
            .catch( () => {} );
    }

    // get our command from globalcommands
    const cmd = getCommand( { name: commandName, alias: commandName } );
    
    if( cmd == undefined )
    {
        if( isInteraction )
        {
            ErrorHandler.minor(`Slash command don't seem to be recognized by disCOD, yet was called.`);
            return await ctx.reply({
                embeds: [CreateBasicEmbed({desc: mainconfig.msgs.err_in_cmd})],
                ephemeral: true,
            });
        }
        else return await SendEmbed( { ctx, desc: `❌ Unrecognized Command` } );
    }

    if( cmd.type == "slash" && !isInteraction )
        return await SendEmbed({ ctx, desc: `❌ Command cannot be called like that. Do **/${cmd.name}** instead.` });

    // run client and discod queries once
    const dcID = ctx instanceof Message? ctx.author.id : ctx.user.id;
    const discodQ = await getRepository(Discod).findOne({where: {dc_id: dcID}});
    
    // check if guy has permission
    const linkCheck = await checkLink( ctx, discodQ, cmd );

    // commands like "link" and "help" can work without link so
    if( !linkCheck && cmd.minLevel > 0 )
        return;

    var commander: Clients | null;

    if( !linkCheck || discodQ == undefined )
        commander = null;
    else commander = await getRepository(Clients).findOne({ where: { id: discodQ.b3_id } });
    
    // do i have access?
    const powerCheck = await checkPower( ctx, cmd, commander );
    if( !powerCheck )
        return;

    // create args
    // if( isInteraction )
    {
        var argObject: CommandArgument = { 
            ctx,
            isSlashCommand: isInteraction,
            commander, 
            cmd, 
            link: discodQ,
            other: {}
        };
    }

    for( var i = 0; i < _opt.data.length; i++ )
    {
        const argOpt = _opt.data[i];

        switch(argOpt.name)
        {
            case "target":
                argObject.target = argOpt.user;
                break;
            case "b3id":
                argObject.b3id = argOpt.value as number;
                break;
            case "slot":
                argObject.slot = argOpt.value as number;
                break;
            case "guid":
                argObject.guid = argOpt.value as string;
                break;
            case "group":
                argObject.group = argOpt.value as string;
                break;
            case "maptoken":
                argObject.maptoken = (argOpt.value as string).toLowerCase();
                break;
            case "gametype":
                argObject.gametype = (argOpt.value as string).toLowerCase();
                break;
            case "name":
                argObject.name = argOpt.value as string;
                break;
            case "text": 
                argObject.text = argOpt.value as string;
                break;
            case "visible2all":
                argObject.visible2all = !!argOpt.value;
                break;
            default: 
                argObject.other = {}
                argObject.other[argOpt.name] = argOpt.value;
                break;
        }
    }

    // call our command
    var response: CommandResponse;
    try
    {
        response = await cmd.callback(argObject);
    }
    catch(e)
    {
        ErrorHandler.minor(e);
        await ctx.reply({
                embeds: [CreateBasicEmbed({desc: mainconfig.msgs.err_in_cmd})],
                ephemeral: true,
            });
        return;
    }

    var visibility: boolean;
    if( argObject.visible2all != undefined )
        visibility = argObject.visible2all;
    else if( cmd.visibleToAllByDefault != undefined )
        visibility = cmd.visibleToAllByDefault;
    else visibility = mainconfig.command.visibleToAllByDefault;

    if( response != undefined && response != "" )
    {
        if( isInteraction )
        {
            if( typeof response == "string" )
                await ctx.reply({
                    content: response,
                    ephemeral: !visibility,
                });
            else if( isArray(response) )
                await ctx.reply({
                    embeds: response,
                    ephemeral: !visibility,
                });
            else await ctx.reply({
                embeds: [response],
                ephemeral: !visibility,
            });
        }
        else
        {
            if( typeof response == "string" )
                await ctx.reply(response);
            else if( isArray(response) )
                await ctx.reply({ embeds: response });
            else await ctx.reply({ embeds: [response] });
        } 
    }
    var logStr: string = `Command: ${chalk.magenta(cmd.name)} by `;
    if( isInteraction )
        logStr += `${chalk.magenta(ctx.user.tag)} in ${chalk.magenta(ctx.channel)}, Visibility: ${visibility? "all" : "private"}`;
    else logStr += `${chalk.magenta(ctx.author.tag)} in ${chalk.magenta(ctx.channel)}`;

    if( isDebug() )
        logStr += chalk.yellow(` - ${totalTimeTracker.getTime()}ms`);
    console.log(logStr)  
}

interface ComMan 
{
    registerCommand( options: Command ): boolean;
    removeCommand( name: string ): void;
    getCommand( options: { name?: string, alias?: string } ): Command | undefined;
    addCommandAlias( name: string, alias: string[] ): void;
    getCommandAlias( name: string ): string[] | undefined;
    getCommandFromAlias( alias: string ): Command | undefined;
    removeAllCommandAliases( name: string ): void;
    getCommandsFromMinLevel( level: number ): Command[];
    getAllCommands(): Command[];
}

async function checkLink( ctx: Message | CommandInteraction, discodQ: Discod | null, cmd: Command ): Promise<boolean>
{
    if( discodQ == undefined )
    {
        if( cmd.minLevel != 0 )
            await ctx.reply({
                embeds: [CreateBasicEmbed({
                    title: `❌ You haven't linked your B3 ID to disCOD yet.`,
                    desc: `Type **/help link** to know more`})],
                ephemeral: true,
            });
        return false;
    }
    else if( discodQ.linked == 0 )
    {
        if( cmd.minLevel != 0 )
            await ctx.reply({
                embeds: [CreateBasicEmbed({
                    title: `❌ Your link is unverified`,
                    desc: `Check DM` })],
                ephemeral: true,
            });
        return false;
    }
    return true;
}

async function checkPower( ctx: Message | CommandInteraction, cmd: Command, client: Clients | null ): Promise<boolean>
{
    if( cmd.minLevel == 0 )
        return true;

    if( client == undefined )
        return false;

    // check clients' power
    var level = Ops.bitsToLevel( client.group_bits );

    if( level == null )
    {
        ErrorHandler.minor(`Client Level fetched bad. Client: @${client.id}.Fetched bits: ${client.group_bits}`);
        SendEmbed({ ctx, desc: mainconfig.msgs.err_in_cmd });
        return false;
    }

    if( level < cmd.minLevel )
    {
        var groupName: string = Ops.levelToName(cmd.minLevel) || "undefined";
        var groupLevel: any = cmd.minLevel;

        SendEmbed({
            ctx,
            desc: mainconfig.msgs.insufficient_power
                .replace("%group%",groupName)
                .replace("%level%",groupLevel)
        });
        return false;
    }
    return true;
}

function registerCommand( options: Command ): boolean
{
    // always need lowercase
    options.name = options.name.toLocaleLowerCase();
    for( var i = 0; i < options.alias.length; i++ )
        options.alias[i] = options.alias[i].toLocaleLowerCase();
    
    // can't have dups
    const exists = getCommand( { name: options.name } );

    if( exists == undefined )
        GlobalCommands.push(options);
    else 
    {
        removeCommand( exists.name );
        GlobalCommands.push(options);
    }
    return false;
}

function removeCommand( name: string ): void
{
    for( var i = 0; i < GlobalCommands.length; i++ )
    {
        const cmd = GlobalCommands[i];
        if( cmd.name == name )
        {
            GlobalCommands.splice(i, 1);
            return;
        }
    }
}

function getCommand( options: { name?: string, alias?: string } ): Command | undefined
{
    if( options === {} )
        return;

    for( var i = 0; i < GlobalCommands.length; i++ )
    {
        const cmd = GlobalCommands[i];
            
        if( options.name != undefined )
            if( cmd.name == options.name )
                return cmd;
        if( options.alias != undefined )
            if( cmd.alias.includes(options.alias) )
                return cmd;
    }
    return;
}

function getCommandAlias( name: string ): string[] | undefined
{
    for( var i = 0; i < GlobalCommands.length; i++ )
    {
        const cmd = GlobalCommands[i];
        if( cmd.name == name )
            return cmd.alias;
    }
    return undefined;
}

function getCommandFromAlias(alias: string): Command | undefined
{
    for( var i = 0; i < GlobalCommands.length; i++ )
    {
        const cmd = GlobalCommands[i];
        if( cmd.alias.includes(alias) )
            return cmd;
    }
    return undefined;
}

function addCommandAlias( name: string, alias: string[] | string ): string[]
{
    for( var i = 0; i < GlobalCommands.length; i++ )
    {
        const cmd = GlobalCommands[i];
        if( cmd.name == name )
        {
            if( typeof alias == "string" )
            {
                if( cmd.alias.includes(alias) )
                    return cmd.alias;
                cmd.alias.push(alias);
                return cmd.alias;
            }
            else
            {
                j_loop:
                for( var j = 0; j < alias.length; j++ )
                {
                    if( cmd.alias.includes(alias[j]) )
                        continue j_loop;
                    cmd.alias.push(alias[j]);
                }
                return cmd.alias;
            }
        }
    }
    return [];
}

function getCommandsFromMinLevel(level: number): Command[] 
{
    var availCmds: Command[] = [];

    for( var i = 0; i  < GlobalCommands.length; i++ )
    {
        const cmd = GlobalCommands[i];
        if( cmd.minLevel >= level )
            availCmds.push(cmd);
    }
    return availCmds;
}

function removeAllCommandAliases( name: string ): void
{
    for( var i = 0; i < GlobalCommands.length; i++ )
    {
        const cmd = GlobalCommands[i];
        if( cmd.name == name )
            cmd.alias = [];
    }
}

function getAllCommands(): Command[] {
    return globalThis.GlobalCommands;
}