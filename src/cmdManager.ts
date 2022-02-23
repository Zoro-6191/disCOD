import "json5/lib/register";
import mainconfig from "./conf/config.json5";

import {} from "discord.js";

declare global 
{
    type Command = {
        name: string,
        minLevel: number,
        callback: Function,
        desc: string,
        helpMsg: string,
        alias: string[]
    }

    // TO-DO: do we want this? or /commands? or both?
    var cmdPrefix: string;
}

var GlobalCommands: Command[];

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
    if( GlobalCommands.length )
    {
        ErrorHandler.fatal("CommandHandler is already initialized once.")
        return;
    }

    const mainconfOps = mainconfig.command;

    globalThis.cmdPrefix = mainconfOps.prefix;

    Debug(`Prefix set to "${cmdPrefix}"`);
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
                return true;
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
    return GlobalCommands;
}