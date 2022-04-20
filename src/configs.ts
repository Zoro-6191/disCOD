import fs from "fs";
import readline from "readline";
import path from "path";
import json5 from "json5";

declare global {
    var GlobalMaps: object;
    var GlobalGametypes: object;
}

export async function areConfigsOkay(): Promise<boolean>
{    
    // check json entries to our liking
    
    if( !fs.existsSync( `./build/conf/config.json5` ) )
        throw new Error(`Main config "./build/conf/config.json5" not found`);

    const mainconfig = await json5.parse(fs.readFileSync(`./build/conf/config.json5`,{encoding: "utf8"}));

    globalThis.themeColor = mainconfig.themeColor;
    globalThis.cmdPrefix = mainconfig.command.prefix;

    // first get all json5 files:
    var files = fs.readdirSync(__dirname+"/conf/");
    var jsonfiles: string[] = [];

    for( var i = 0; i < files.length; i++ )
        if( path.extname( __dirname + `/conf/${files[i]}`).toLowerCase().includes("json") )
            jsonfiles.push(files[i]);

    for( var i = 0; i < jsonfiles.length; i++ )
    {
        const file = jsonfiles[i];
        await checkJSON( file )
            .catch( (e: Error) => {
                throw new Error(`Invalid JSON5 format in file "./conf/${file}": ${e}`);
            } );
    }

    await parseMapsTXT( __dirname+"/conf/maps.txt" )
        .catch( (e) => { throw new Error(e); });

    await parseGametypesTXT( __dirname+"/conf/gametypes.txt" )
        .catch( (e) => { throw new Error(e); });

    return true;
}

async function checkJSON( file: string ): Promise<void>
{
    return new Promise( async( resolve, reject ) => 
    {
        const read = fs.readFileSync( __dirname + `/conf/${file}`, { encoding: "utf8" } );

        try {
            await json5.parse( read )
        }
        catch(e) {
            reject(e)
        }

        resolve();
    })
}

async function parseMapsTXT( path: string ): Promise<void>
{
    return new Promise( ( resolve, reject ) => 
    {
        if( !fs.existsSync(path) ) 
            reject(`"./conf/maps.txt" not found`);

        globalThis.GlobalMaps = {};

        const readfile = readline.createInterface({
            input: fs.createReadStream(path), 
            output: process.stdout, 
            terminal: false 
        });

        var linecount = 0;

        readfile.on( "line", (line: string) => 
        {
            linecount++;
            line = line.trim();
            if( line.startsWith('//') || line.trim() == "" )
                return;

            const parse: string[] = line.split(':');

            var token = parse[0];
            var name = parse[1];

            if( token == "" )
                reject(`Empty map Token at line ${linecount}`);
            else if( name == "" )
            {
                ErrorHandler.minor(`Empty mapname for map "${token}" at line ${linecount}`);
                name = token;
            }
            (GlobalMaps as any)[token] = name;
        } )

        readfile.on( 'close', ()=> resolve() );
    })
}

async function parseGametypesTXT( path: string ): Promise<void>
{
    return new Promise( ( resolve, reject ) => 
    {
        if( !fs.existsSync(path) ) 
            reject(`"./conf/maps.txt" not found`);

            globalThis.GlobalGametypes = {}

        const readfile = readline.createInterface({
            input: fs.createReadStream(path), 
            output: process.stdout, 
            terminal: false 
        });

        var linecount = 0;

        readfile.on( "line", (line: string) => 
        {
            linecount++;
            line = line.trim();
            if( line.startsWith('//') || line.trim() == "" )
                return;

            const parse: string[] = line.split(':');

            var token = parse[0];
            var name = parse[1];

            if( token == "" )
                reject(`Empty gametype Token at line ${linecount}`);
            else if( name == "" )
            {
                ErrorHandler.minor(`Empty gametype name for gametype "${token}" at line ${linecount}`);
                name = token;
            }
            (GlobalGametypes as any)[token] = name;
        } )

        readfile.on( 'close', ()=> resolve() );
    })
}