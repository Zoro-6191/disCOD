// import "json5/lib/register";
import { ColorResolvable, CommandInteraction, Interaction, Message, MessageEmbed, User } from "discord.js";
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

declare global 
{
    type Command = {
        name: string,
        description: string,
        type: "slash" | "prefix" | "both",
        visibleToAllByDefault: boolean,
        acceptArgs: { 
            target?: User, 
            b3id?: number,
            slot?: number,
            guid?: string,
            visible2all?: string,
            other?: any
        } & any,
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
            const accInput: any = cmd.acceptArgs;

            if( accInput.target != undefined )
                currentSlashCommand.addMentionableOption( opt => 
                            opt.setName("target")
                                .setDescription("Mention a User")
                                .setRequired(accInput.target)
                            );
            if( accInput.b3id != undefined )
                currentSlashCommand.addIntegerOption( opt => 
                            opt.setName("b3id")
                                .setDescription("B3 ID of player")
                                .setMinValue(2)
                                .setMaxValue(999999)
                                .setRequired(accInput.b3id)
                            );
            if( accInput.guid != undefined )
                currentSlashCommand.addStringOption( opt => 
                            opt.setName("guid")
                                .setDescription("GUID of player")
                                .setRequired(accInput.guid)
                            );
            if( accInput.slot != undefined )
                currentSlashCommand.addIntegerOption( opt => 
                            opt.setName("slot")
                                .setDescription("Slot of player if he's currently in-game")
                                .setRequired(accInput.slot)
                            );
            if( accInput.visible2all != undefined )
                currentSlashCommand.addBooleanOption( opt =>
                            opt.setName("visible2all")
                                .setDescription("If false, only you will be able to see response.")
                                .setRequired(accInput.visible2all)
                            );
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
    commander?: Clients, 
    cmd: Command, 
    link?: Discod,
    target?: User,
    b3id?: number,
    slot?: number,
    guid?: string,
    visible2all?: boolean,
    other: any
}

async function processIncomingCommand( ctx: Message | CommandInteraction )
{
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
            return await SendEmbed( { ctx, desc: mainconfig.msgs.err_in_cmd } );
        }
        else return await SendEmbed( { ctx, desc: `❌ Unrecognized Command` } );
    }

    if( cmd.type == "slash" && !isInteraction )
        return await SendEmbed({ ctx, desc: `❌ Command cannot be called like that. Do **/${cmd.name}** instead.` });

    // run client and discod queries once
    const dcID = ctx instanceof Message? ctx.author.id : ctx.user.id;
    const discodQ = await getRepository(Discod).findOne({where: {dcId: dcID}});
    
    // check if guy has permission
    const linkCheck = await checkLink( ctx, discodQ, cmd );

    // commands like "link" and "help" can work without link so
    if( !linkCheck && cmd.minLevel > 0 )
        return;

    var commander: Clients | undefined;

    if( !linkCheck || discodQ == undefined )
        commander = undefined;
    else commander = await getRepository(Clients).findOne(discodQ.b3Id);
    
    // do i have access?
    const powerCheck = await checkPower( ctx, cmd, commander );
    if( !powerCheck )
        return;

    // create args
    // if( isInteraction )
    {
        var argObject: CommandArgument = { 
            ctx,
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
            case "visible2all":
                argObject.visible2all = !!argOpt.value;
                break;
            default: 
                argObject.other = {}
                argObject.other["argOpt.name"] = argOpt.value;
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
        return await SendEmbed({ ctx,desc: mainconfig.msgs.err_in_cmd });
    }

    if( response != undefined && response != "" )
    {
        if( isInteraction )
        {
            var visibility: boolean;
            if( argObject.visible2all != undefined )
                visibility = argObject.visible2all;
            else if( cmd.visibleToAllByDefault != undefined )
                visibility = cmd.visibleToAllByDefault;
            else visibility = mainconfig.command.visibleToAllByDefault;
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
            console.log(`Command: ${chalk.green(cmd.name)} by ${chalk.green(ctx.user.tag)} in ${chalk.green(ctx.channel)}, Visibility: ${visibility? "all" : "private"}`);
        }
        else
        {
            if( typeof response == "string" )
                await ctx.reply(response);
            else if( isArray(response) )
                await ctx.reply({ embeds: response });
            else await ctx.reply({ embeds: [response] });

            console.log(`Command: ${chalk.magenta(cmd.name)} by ${chalk.magenta(ctx.author.tag)} in ${chalk.magenta(ctx.channel)}`);
        } 
    }
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

async function checkLink( ctx: Message | CommandInteraction, discodQ: Discod | undefined, cmd: Command ): Promise<boolean>
{
    if( discodQ === undefined )
    {
        if( cmd.minLevel != 0 )
            SendEmbed( {
                ctx,
                title: `❌ You haven't linked your B3 ID to disCOD yet.`,
                desc: `Type **/help link** to know more`
            });
        return false;
    }
    else if( discodQ.linked == 0 )
    {
        if( cmd.minLevel != 0 )
            SendEmbed( { 
                ctx,
                title: `❌ Your link is unverified`, 
                // TO-DO: Link to dm channel
                desc: `Check DM` 
            });
        return false;
    }
    return true;
}

async function checkPower( ctx: Message | CommandInteraction, cmd: Command, client: Clients | undefined ): Promise<boolean>
{
    if( cmd.minLevel == 0 )
        return true;

    if( client == undefined )
        return false;

    // check clients' power
    var level = Ops.bitsToLevel( client.groupBits );

    if( level == null )
    {
        ErrorHandler.minor(`Client Level fetched bad. Client: @${client.id}.Fetched bits: ${client.groupBits}`);
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