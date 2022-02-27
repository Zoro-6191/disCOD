// import "json5/lib/register";
import { ColorResolvable, Interaction, Message, MessageEmbed } from "discord.js";
import { getConnection } from "typeorm";
import { SlashCommandBuilder } from "@discordjs/builders"
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');

import { Ops } from "./groups";
import mainconfig from "./conf/config.json5";
import defaultCmdsConfig from "./conf/default_cmds.json5";
import chalk from "chalk";

declare global 
{
    var rawQuery: ( q: string ) => Promise<any>;

    type Command = {
        name: string,
        description: string,
        type: "slash" | "prefix" | "both",
        visibleToAllByDefault: boolean,
        acceptSlashArgs: string[],
        minLevel: number,
        callback: ( args: {} | string[], ctx: Message | Interaction ) => Promise<string | MessageEmbed[]>,
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
    doesCommandExist,
    addCommandAlias,
    getCommandAlias,
    getCommandFromAlias,
    removeAllCommandAliases,
    getCommandsFromMinLevel,
    getAllCommands,
}

export default CommandManager;

export async function initCommandManager()
{
    // register default commands from config ig
    if( globalThis.GlobalCommands != undefined )
        return ErrorHandler.fatal("CommandHandler is already initialized once.");

    globalThis.GlobalCommands = [];
    globalThis.themeColor = mainconfig.themeColor;
    Debug(`Theme Color set to: ${themeColor}`)
    globalThis.rawQuery = (q: string) => getConnection().manager.query(q);

    const mainconfOps = mainconfig.command;

    globalThis.cmdPrefix = mainconfOps.prefix;
    Debug(`Prefix set to "${cmdPrefix}"`);

    const rest = new REST({ version: '9' }).setToken(mainconfig.discord_token);

    // init slash commands
    var slashCmds: SlashCommandBuilder[] = [];

    // register default commands from default_cmds.json5
    for( var i = 0; i < defaultCmdsConfig.defaultCmds.length; i++ )
    {
        var cmd = defaultCmdsConfig.defaultCmds[i];

        const defaultCallback: Function = (await import("./defaultCommands") as any)["cmd_"+cmd.name];   
        
        // const argOptions =

        if( cmd.type != "prefix" )
        {
            (slashCmds[slashCmds.length] as any) = new SlashCommandBuilder()
                .setName(cmd.name)
                .setDescription(cmd.description)

            // process acceptable command arguments
            const accInput: string[] = cmd.acceptSlashArgs;

            for( var i = 0; i < accInput.length; i++ )
            {
                if( accInput[i].includes("b3id") )
                    slashCmds[slashCmds.length-1]
                        .addIntegerOption( opt => 
                        opt.setName("b3id")
                            .setDescription("B3 ID of player")
                            .setRequired(false)
                        )
                if( accInput[i].includes("target"))
                    slashCmds[slashCmds.length-1]
                        .addMentionableOption( opt => 
                        opt.setName("target")
                            .setDescription("Mention a User")
                            .setRequired(false)
                        )
                if( accInput[i].includes("slot") )
                    slashCmds[slashCmds.length-1]
                        .addIntegerOption( opt => 
                        opt.setName("slot")
                            .setDescription("Slot of player if he's currently in-game")
                            .setRequired(false)
                        )
                if( accInput[i].includes("guid") )
                    slashCmds[slashCmds.length-1]    
                        .addStringOption( opt => 
                        opt.setName("guid")
                            .setDescription("GUID of player")
                            .setRequired(false)
                        )
                if( accInput[i].includes("visible2all") )
                    slashCmds[slashCmds.length-1]
                        .addBooleanOption( opt =>
                        opt.setName("visible2all")
                            .setDescription("If false, only you will be able to see response.")
                            .setRequired(false)
                        )
            }
        }

        
        var createCmd: Command = {
            name: cmd.name,
            alias: cmd.alias,
            type: cmd.type,
            minLevel: cmd.minLevel,
            description: cmd.description,
            callback: defaultCallback as any,
            visibleToAllByDefault: cmd.visibleToAllByDefault || mainconfig.command.visibleToAllByDefault,
            acceptSlashArgs: cmd.acceptSlashArgs
        }
        globalThis.GlobalCommands.push(createCmd);
    }

    await rest.put(
        Routes.applicationGuildCommands(discordClient.user?.id, discordClient.guildId ),
        { body: slashCmds },
    );

    // catch and process slash commands
    if( mainconfig.command.type != "prefix" )
        discordClient.on("interactionCreate", async IC => processSlashCommand(IC) )

    // catch and process prefix commands
    if( mainconfig.command.type != "slash" )
        discordClient.on("messageCreate", async msg => processPrefixCommand(msg) );
}

async function processSlashCommand( IC: Interaction )
{
    if(!IC.isCommand())
            return;

    const { commandName, options: _opt } = IC;

    // console.log(_opt);    

    const cmd = doesCommandExist( { name: commandName, alias: commandName } );
    if( typeof cmd == "boolean" )
        return ErrorHandler.minor(`Slash command don't seem to be recognized by disCOD, yet was called.`);
    
    // const clientQ = await rawQuery( `SELECT clients.*,discod.linked FROM discod,clients WHERE dc_id=${IC.user.id} AND clients.id=discod.b3_id`);   

    const response: string | MessageEmbed[] = await cmd.callback({},IC);

    if( response != "" )
    {
        if( typeof response == "string" )
            IC.reply({
                content: response,
                ephemeral: false
            });
        else IC.reply({
                embeds: response,
                ephemeral: false
            });    
    }
}

async function processPrefixCommand( msg: Message )
{
    var content: string = msg.content.trim();

    // check if we really wanna processs it
    if( !content.length || !content.startsWith(cmdPrefix) || msg.author.bot )
        return;

    // convert to array to process
    var tokens: string[] = content.split(/\s+/);

    // remove prefix
    const cmd = tokens[0].toLowerCase().substring(cmdPrefix.length);

    // create args
    tokens.shift();
    var args: string[] = tokens;

    if( !cmd.length || mainconfig.command.bypass.includes(cmd) )
        return;

    msg.channel.sendTyping()
        .catch( (_err) => 
        {
            // console.error(_err)
            ErrorHandler.minor(`Discord preventing sendTyping() as a security measure`) 
        });

    
    // time to get cmd object
    Debug(`Prefix Command: "${chalk.green(cmd)}" User: ${chalk.yellow(msg.author.tag)}` );    
    const commandObj = doesCommandExist( { name: cmd, alias: cmd } );

    if( typeof commandObj == "boolean" )
        return SendEmbed( { 
            ctx: msg, 
            desc: "Unrecognized Command" 
        });

    if( commandObj.type == "slash" )
        return SendEmbed( { 
            ctx: msg, 
            desc: `Command cannot be called like that. Do **/${commandObj.name}** instead.`
        } );

    const clientQ = await rawQuery( `SELECT clients.*,discod.linked FROM discod,clients WHERE dc_id=${msg.author.id} AND clients.id=discod.b3_id`)
                            // getConnection().manager.createQueryBuilder()
                            // .select("clients.*")
                            // .addSelect("discod.linked")
                            // .from( Clients, "clients" )
                            // .from( Discod, "discod" )
                            // .where( `discod.dc_id = :dcid AND clients.id=discod.b3_id`, { dc_id: msg.author.id } )
                            // .cache( true )
                            // .getOne()
                            // .getOneOrFail() // will throw EntityNotFoundError
    
    if( commandObj.minLevel > 0 )
    {
        if( !clientQ.length )    // not linked
            return SendEmbed( {
                ctx: msg,
                title: `You haven't linked your B3 ID to disCOD yet.`,
                desc: `Type **/help link** to know more`
            })

        if( clientQ[0].linked == '0' )    // not linked
            return SendEmbed( { 
                ctx: msg, 
                title: `Your link is unverified`, 
                // TO-DO: Link to dm channel
                desc: `Check DM` 
            });

        // check clients' power
        var level = Ops.bitsToLevel( clientQ[0].group_bits );

        if( level == null )
        {
            ErrorHandler.minor(`Client Level fetched as null`);
            return SendEmbed({
                ctx: msg,
                desc: mainconfig.msgs.err_in_cmd
            })
        }

        if( level < commandObj.minLevel )
        {
            var groupName: string = Ops.levelToName(commandObj.minLevel) || "undefined";
            var groupLevel: any = commandObj.minLevel;

            return SendEmbed({
                ctx: msg,
                desc: mainconfig.msgs.insufficient_power
                    .replace("%group%",groupName)
                    .replace("%level%",groupLevel)
            })
        }
    }

    // forward to module
    console.log(`Command: ${content} by ${msg.author.tag}`)
    const response: string | MessageEmbed[] = await commandObj.callback( {}, msg );

    if( response != "" )
    {
        if( typeof response == "string" )
            msg.reply(response);
        else msg.reply( { embeds: response } )
    }
    // event command: command, arguments, commander
    // eventhandler.bot.emit( 'command', cmd, args, result[0] )
}

interface ComMan 
{
    registerCommand( options: Command ): boolean;
    removeCommand( name: string ): void;
    doesCommandExist( options: { name?: string, alias?: string } ): Command | boolean;
    addCommandAlias( name: string, alias: string[] ): void;
    getCommandAlias( name: string ): string[] | undefined;
    getCommandFromAlias( alias: string ): Command | undefined;
    removeAllCommandAliases( name: string ): void;
    getCommandsFromMinLevel( level: number ): Command[];
    getAllCommands(): Command[];
}

function registerCommand( options: Command ): boolean
{
    // always need lowercase
    options.name = options.name.toLocaleLowerCase();
    for( var i = 0; i < options.alias.length; i++ )
        options.alias[i] = options.alias[i].toLocaleLowerCase();
    
    // can't have dups
    const exists = doesCommandExist( { name: options.name } );

    if( typeof exists == "boolean" )
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

function doesCommandExist( options: { name?: string, alias?: string } ): Command | boolean
{
    if( options === {} )
        return false;

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
    return false;
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