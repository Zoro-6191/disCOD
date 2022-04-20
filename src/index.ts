// Package imports
import "reflect-metadata";
import "json5/lib/register";
import { createConnection, getConnection } from "typeorm";
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
import { Aliases } from "./entity/Aliases";
import { Clients } from "./entity/Clients";
import { CurrentClients } from "./entity/CurrentClients";
import { CurrentSvars } from "./entity/CurrentSvars";
import { Demotions } from "./entity/Demotions";
import { Discod } from "./entity/Discod";
import { DiscodClientsMisc } from "./entity/DiscodClientsMisc";
import { DiscodVpnAllowed } from "./entity/DiscodVpnAllowed";
import { Groups } from "./entity/Groups";
import { Ipaliases } from "./entity/Ipaliases";
import { Penalties } from "./entity/Penalties";
import { XlrActionstats } from "./entity/XlrActionstats";
import { XlrBodyparts } from "./entity/XlrBodyparts";
import { XlrHistoryMonthly } from "./entity/XlrHistoryMonthly";
import { XlrHistoryWeekly } from "./entity/XlrHistoryWeekly";
import { XlrMapstats } from "./entity/XlrMapstats";
import { XlrOpponents } from "./entity/XlrOpponents";
import { XlrPlayeractions } from "./entity/XlrPlayeractions";
import { XlrPlayerbody } from "./entity/XlrPlayerbody";
import { XlrPlayermaps } from "./entity/XlrPlayermaps";
import { XlrPlayerstats } from "./entity/XlrPlayerstats";
import { XlrWeaponstats } from "./entity/XlrWeaponstats";
import { XlrWeaponusage } from "./entity/XlrWeaponusage";
import { areConfigsOkay } from "./configs";
import { Timer } from "./utilities";
import { init as initPlugins } from "./pluginManager";

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
    await createConnection(
    {
        type: "mysql",
        host: mainConfig.mysqldb.host,
        port: mainConfig.mysqldb.port,
        username: mainConfig.mysqldb.user,
        password: mainConfig.mysqldb.password,
        database: mainConfig.mysqldb.database,
        // cache: true,
        // synchronize: true,

        // utf8mb4 needed for special char discord names
        charset: "utf8mb4",

        entities: 
        [
            // Default Entities 
            Aliases, 
            Clients, 
            CurrentClients,
            CurrentSvars,
            Groups, 
            Ipaliases, 
            Penalties,

            // XLR Entities
            XlrActionstats,
            XlrBodyparts,
            XlrHistoryMonthly,
            XlrHistoryWeekly,
            XlrMapstats,
            XlrOpponents,
            XlrPlayeractions,
            XlrPlayerbody,
            XlrPlayermaps,
            XlrPlayerstats,
            XlrWeaponstats,
            XlrWeaponusage,

            // Discod entities
            Discod,
            DiscodClientsMisc,
            DiscodVpnAllowed,

            // Extra Entities
            Demotions,
        ],
    })
    .then( () => { dbSpinner.succeed(`MySQL Connection Successful` + chalk.yellow(` - ${stepTimer.getTime()}ms`)) })
    .catch( err => {
        dbSpinner.fail(chalk.red(`Failed to connect to MySQL Server`))
        ErrorHandler.fatal(err);
    }  );
    // rawQuery method
    globalThis.rawQuery = (q: string) => getConnection().manager.query(q);

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
        .catch( ErrorHandler.fatal )
        .then( () => { cmdSpinr.succeed(`Registered default commands (${GlobalCommands.length})` + chalk.yellow(` - ${stepTimer.getTime()}ms`)) });

    // 6. Plugins
    initPlugins();

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

    figlet("disCOD", {font: "Slant"}, ( _e, data) => 
    {
        var gradDef: string[] = ["red", "yellow", "cyan", "pink"];
        console.log("\n\n");
        const grad = gradient(gradDef)(data);
        console.log(grad);
        console.log("\n\n");
    })
}

main();