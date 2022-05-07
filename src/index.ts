// Package imports
import "reflect-metadata";
import "json5/lib/register";
import figlet from "figlet";
import gradient from "gradient-string";
import chalk from "chalk";
import ora from "ora";

// Local imports
import mainConfig from "./conf/config.json5";
import { createRconConnection } from "./rcon";
import { initGroups } from "./groups";
import { initDiscordClient } from "./discordCon";
import { EventEmitter } from "events";
import { initDebugger } from "./errorHandler";
import { initCommandManager } from "./commandHandler";

// TypeORM Entities
import { areConfigsOkay } from "./configs";
import { Timer } from "./utilities";
import { init as initPlugins } from "./pluginManager";
import { initDB } from "./db";

const launchTime = new Timer();

async function main()
{
    const stepTimer = new Timer();
    initDebugger();
    Debug("Debugger Enabled");
    globalThis.events = new EventEmitter();

    // TO-DO: Check configs first
    const confCheckSpinner = ora(chalk.yellow(`Checking config entries`)).start();
    await areConfigsOkay()
        .catch( er => {
            confCheckSpinner.fail(chalk.red(`Follow the json/json5 format man`));
            ErrorHandler.fatal(er);
        })
        .then( () => confCheckSpinner.succeed( `Checked all configs` + chalk.yellow(` - ${stepTimer.getTime()}ms`) ) )

    // 1: discord connection
    const discordSpinner = ora(chalk.yellow(`Attempting to connect to Discord Api`)).start();
    await initDiscordClient(mainConfig.discord_token)
        .then( () => { discordSpinner.succeed( `Connected to ` +chalk.blue.bold(discordClient.guildName)+ ` as ` + chalk.green.bold.underline(discordClient.user?.username) + chalk.yellow(` - ${stepTimer.getTime()}ms`)) } )
        .catch( err => {
            discordSpinner.fail(chalk.red(`Failed to connect to Discord`))
            ErrorHandler.fatal(err);
        }  );

    // 2: db connection
    const dbSpinner = ora(chalk.yellow(`Attempting to establish MySQL connection`)).start();
    await initDB()
    .then( () => { dbSpinner.succeed(`MySQL Connection Successful` + chalk.yellow(` - ${stepTimer.getTime()}ms`)) })
    .catch( err => {
        dbSpinner.fail(chalk.red(`Failed to connect to MySQL Server`))
        ErrorHandler.fatal(err);
    } );

    // 3: rcon connection
    // TO-DO: make it reconnectable for when server crashing?
    const rconSpinner = ora(chalk.yellow(`Attempting to establish RCON Connection`)).start();
    await createRconConnection({
        ip: mainConfig.server.rcon_ip,
        port: mainConfig.server.port,
        rconpass: mainConfig.server.rcon_password
    })
    .then( () => rconSpinner.succeed(`Connected Rcon to `+chalk.magentaBright(rcon.ip)+":"+chalk.blueBright(rcon.port) + chalk.yellow(` - ${stepTimer.getTime()}ms`) ) )
    .catch( err => {
        rconSpinner.fail(`Failed to establish RCON Connection`);
        ErrorHandler.fatal(err);
    }  );
    
    // 4: setup groupmanager?
    await initGroups()
        .catch( ErrorHandler.fatal )
        .then( () => Debug("Initialized User and Admin Groups") );

    // 5. init and start receiving commands
    const cmdSpinr = ora(chalk.yellow(`Registering Default Commands`)).start();
    await initCommandManager()
        .catch( err => {
            cmdSpinr.fail(`Failed to init commands`);
            ErrorHandler.fatal(err);
        }  )
        .then( () => { cmdSpinr.succeed(`Registered default commands (${GlobalCommands.length})` + chalk.yellow(` - ${stepTimer.getTime()}ms`)) });

    // 6. Plugins
    const pluginSpinner = ora(chalk.yellow(`Loading Plugins`)).start();
    await initPlugins()
        .catch( err => {
            pluginSpinner.fail(`Failed to load plugins`);
            ErrorHandler.fatal(err);
        }  )
        .then( () => { pluginSpinner.succeed(`Loaded ${GlobalPlugins.length} plugins` + chalk.yellow(` - ${stepTimer.getTime()}ms`)) });

    // 7. Display our thing :D
    showDisCOD();
    
    Debug("Total Launchtime: "+chalk.red(launchTime.getTime()+"ms"));
}

/**
 * Print Stylish ASCII text in console :)
 */
function showDisCOD()
{
    if( isDebug() )
        return;
    const text = "disCOD";
    figlet(text, {font: "Slant"}, async( _e, data) => 
    {
        var gradDef: string[] = ["red", "yellow", "cyan", "pink"];
        console.log("\n\n");
        const grad = gradient(gradDef)(data);
        await discordClient.user?.setUsername(text);
        console.log(grad);
        console.log("\n\n");
    })
}

main();