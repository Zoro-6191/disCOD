import "reflect-metadata";
import "json5/lib/register";
import { createConnection } from "typeorm";
import figlet from "figlet";
import gradient from "gradient-string";

import mainConfig from "./conf/config.json5";
import { Aliases } from "./entity/Aliases";
import { Clients } from "./entity/Clients";
import { Groups } from "./entity/Groups";
import { Ipaliases } from "./entity/Ipaliases";
import { Penalties } from "./entity/Penalties";
import { createRconConnection } from "./rcon";
import { initGroups } from "./groups";
import { initDiscordClient } from "./discordCon";
import { EventEmitter } from "events";
import { initDebugger } from "./errorHandler";

async function main()
{
    initDebugger();
    Debug("Debugger Enabled");
    globalThis.events = new EventEmitter();

    // 1: discord connection
    await initDiscordClient(mainConfig.discord_token)
        .then( () => { Debug("Connected to Discord as "+discordClient.user?.tag) } )
        .catch( ErrorHandler.minor )

    // 2: db connection
    await createConnection(
    {
        type: "mysql",
        host: mainConfig.mysqldb.host,
        port: mainConfig.mysqldb.port,
        password: mainConfig.mysqldb.password,

        // utf8mb4 needed for special char discord names
        charset: "utf8mb4",

        entities: [ Aliases, Clients, Groups, Ipaliases, Penalties ],

        // hmm do we want this?
        cache: true
    })
    .then( () => Debug(`Connected to MySQL Database`) )
    .catch( ErrorHandler.fatal );

    // 3: rcon connection
    // TO-DO: make it reconnectable for when server crashing
    await createRconConnection({
        ip: mainConfig.server.rcon_ip,
        port: mainConfig.server.port,
        rconpass: mainConfig.server.rcon_password
    })
    .then( () => Debug(`Connected Rcon to `+rcon.ip+":"+rcon.port) )
    .catch( ErrorHandler.fatal );
    
    // 4: setup groupmanager?
    await initGroups()
        .catch( ErrorHandler.fatal )
        .then( () => Debug("\nInitialized User and Admin Groups") );

    figlet("disCOD", ( _e, data) => {
        var gradDef = ["red", "blue", "cyan", "pink"];

        console.log(gradient(gradDef)("==============================================================\nd"));
        const grad = gradient(gradDef)(data);
        console.log(gradient(gradDef)("==============================================================\nd"));

        console.log(grad);
    })
}

main();