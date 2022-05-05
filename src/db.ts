import { createConnection, getConnection } from "typeorm";
import mainConfig from "./conf/config.json5";
import {existsSync, readFileSync} from "fs";

import { Aliases } from "./entity/Aliases";
import { Clients } from "./entity/Clients";
import { CurrentClients } from "./entity/CurrentClients";
import { CurrentSvars } from "./entity/CurrentSvars";
import { Discod } from "./entity/Discod";
import { DiscodClientsMisc } from "./entity/DiscodClientsMisc";
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


declare global {
    var db: DatabaseModule;
}

(globalThis.db as any) = {};

interface DatabaseModule {
    /**
     * Direct Query to MySQL Database
     * @param  {string} query
     * @returns {object} result in object format
     */
    rawQuery: ( query: string ) => Promise<any>;

    createTableIfDoesntExist: ( tableName: string, sqlPath: string ) => Promise< void >;
}

var existingTables: string[] = [];

const requiredExtraTables = [
    "discod",
    "discod_clients_misc",
    "discod_vpn_allowed"
]

export async function initDB(): Promise< boolean >
{
    return new Promise( async(resolve,reject) => {
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
            ],
        }).catch( reject )

        // rawQuery method
        db.rawQuery = (q: string) => getConnection().manager.query(q);

        // check for tables
        const tableQ = await db.rawQuery(`SHOW TABLES`);
        // console.log("Tables Q:",tableQ);

        for( var i = 0; i < tableQ.length; i++ )
            existingTables.push(tableQ[i][Object.keys(tableQ[0])[0]]);

        for( var i = 0; i < requiredExtraTables.length; i++ )
            await db.createTableIfDoesntExist(requiredExtraTables[i],`./sql/${requiredExtraTables[i]}.sql`)
                .catch(reject);

        resolve(true);
    });
}

globalThis.db.createTableIfDoesntExist = async( tableName: string, sqlPath: string ): Promise< void > =>
{
    if( existingTables.includes(tableName) )
        return;

    if(!existsSync(sqlPath))
        throw new Error(`${tableName} doesn't exist in the database, couldn't locate "${sqlPath}" either`);

    const sqlRead = readFileSync(sqlPath,{encoding: "utf8"});
    await db.rawQuery(sqlRead);
    existingTables.push(tableName);
}