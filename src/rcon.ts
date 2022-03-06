import { createSocket, Socket } from "dgram";
import { encode } from "iconv-lite";

declare global 
{
    var rcon: RconClient;
    
    type RconOnlinePlayer = 
    {
        readonly guid: string;
        readonly slot: number;
        readonly name: string;
        readonly ip: string;
        readonly steamId: string;
        readonly ping: number | string;
        readonly score: number;
        readonly port: number;
        readonly lastmsg: number;
        readonly qport: number;
        readonly rate: number;
    }
}

type RconConnectionOptions = 
{
    readonly ip: string, 
    readonly port: number,
    readonly rconpass: string
}

interface RconClient 
{
    ip: string;
    port: number;
    rconpass: string | undefined;
    connected: boolean;
    
    /**
     * Similar to GSC
     * @param  {string} dvar
     * @returns `Promise< string | number | boolean >`
     */
    getDvar( dvar: string ): Promise< string | number | boolean >;

    /**
     * Similar to GSC
     * @param  {string} dvar
     * @returns `Promise< boolean >`
     */
    getDvarBool( dvar: string ): Promise< boolean >;
    
    /**
     * Similar to GSC
     * @param  {string} dvar
     * @returns Promise
     */
    getDvarString( dvar: string ): Promise<string>;
    
    /**
     * Similar to GSC
     * @param  {string} dvar
     * @returns Promise< number >
     */
    getDvarInt( dvar: string ): Promise<number>;
    
    /**
     * Similar to GSC
     * @param  {string} dvar
     * @returns Promise< number >
     */
    getDvarFloat( dvar: string ): Promise<number>;
    
    /**
     * Get current Hostname
     * @returns Promise< string >
     */
    getHostname(): Promise<string>;
    
    /**
     * Get server's max possible clients
     * @returns number
     */
    getMaxClients(): number;
    
    getMultipleDvars( ...dvars: string[] ): Promise<object>; 
    getOnlinePlayers( options?: GetOnlinePlayersArgs ): Promise< RconOnlinePlayer[] >;
    getOnlinePlayerBySlot( slot: number ): Promise< RconOnlinePlayer | undefined>;
    getServerOs(): string | undefined;
    kick( slot: number | string, reason?: string ): Promise<string>;
    quit(): Promise<boolean>;
    sendRconCommand( cmd: string ): Promise<string>;
    serverinfo(): Promise<object>;
    setDvar( dvar: string, value: string | number ): Promise<boolean>;
    setHostname( newname: string ): Promise<boolean>;
    status(): Promise<RconStatus>;
    testConnection(): Promise<boolean>;
}

type GetOnlinePlayersArgs = { 
    status?: string,
    sortby?: "slot" | "ping" | "score"
}

type RconStatus = 
{
    hostname: string;
    version: string;
    udpip: string;
    os: string;
    map: string;

    onlinePlayers: RconOnlinePlayer[];
}

interface RconInfo {
    sv_maxclients: number,
    fs_game: string,
    version: string,
    shortversion: string,
    build: number,
    branch: string,
    revision: string,
    protocol: number,
    sv_privateClients: number,
    sv_hostname: string,
    sv_minPing: number,
    sv_maxPing: number,
    sv_disableClientConsole: number,
    sv_voice: number,
    g_mapStartTime: string,
    uptime: string,
    g_gametype: string,
    mapname: string,
    sv_maxRate: number,
    sv_floodprotect: number,
    sv_pure: number,
    gamename: string,
    g_compassShowEnemies: number,
}

// createRconConnection: to be called externally to initiate connection
export async function createRconConnection( options: RconConnectionOptions): Promise<RconClient>
{
    return new Promise( async( resolve, reject  ) => 
    {
        globalThis.rcon = new CreateRconConnection( options );

        if( !(await rcon.testConnection()) )
            reject();
        else rcon.connected = true;

        resolve(rcon);
    })
}

// To-DO: Confirm whether to reuse opened UDP socket or open one everytime
class CreateRconConnection implements RconClient
{
    readonly ip: string;
    readonly port: number = 28960;
    readonly rconpass: string;
    public connected: boolean = false;

    private socket: Socket;
    private hostname: string;
    private maxclients: number;
    private modname: string;
    private os: string;

    constructor( options: RconConnectionOptions )
    {
        this.ip = options.ip;
        this.rconpass = options.rconpass;
        this.port = options.port;

        // now we create udp socket and return this instance

        this.socket = createSocket('udp4');

        return this;
    }

    public async testConnection(): Promise<boolean>
    {
        const msg = this.encodeOutgoingMsg(`rcon ${this.rconpass} status`);
        this.sendUDPMessage(msg);
        try
        {
            const tes = await this.decodeIncomingMsg();

            if( tes )
            {
                // update permanent dvars here
                // like sv_hostname etc

                return true;
            }
        }
        catch(e)
        {
            console.log(e);
            return false;
        }
        return false;
    }

    private decodeIncomingMsg( maxTimeOut: number = 500 ): Promise<string>
    {
        return new Promise( async (resolve, reject) => 
        {
            try 
            {
                let out = '';

                // TO-DO: Check full scope of wat comes, and wat _rinfo is
                this.socket.on('message', (incomingMessage, _rinfo) => {
                    const res = Buffer.from(incomingMessage)
                    .toString()
                    .replace('����print', '')
                    .replace('����infoResponse', '')
                    .replace('����statusResponse', '')
                    .replace('\n', '');
                    out += res;
                });
                await wait(maxTimeOut);

                // TO-DO: Does this work like I want it to?
                this.socket.removeAllListeners();
                resolve(out);
            } 
            catch (error) 
            {
                this.socket.removeAllListeners();   
                reject(error.message);
            }
        });
    }

    private encodeOutgoingMsg( msg: string )
    {
        const bufferTemp = encode(msg, 'ascii');
        const bufferSend: any = new Uint8Array(bufferTemp.length + 5);

        bufferSend[0] = encode('255', 'ascii');
        bufferSend[1] = encode('255', 'ascii');
        bufferSend[2] = encode('255', 'ascii');
        bufferSend[3] = encode('255', 'ascii');
        bufferSend[4] = encode('02', 'ascii');

        let j = 4;

        for (let i = 0; i < bufferTemp.length; i++)
            bufferSend[j++] = bufferTemp[i];

        bufferSend[bufferSend.length - 1] = encode('00', 'ascii');
        return bufferSend;
    }

    private async sendUDPMessage( msg: string )
    {
        this.socket.send(msg, this.port, this.ip );
    }

    public async getDvar(dvar: string): Promise<string | number | boolean> 
    {
        const resp = await this.sendRconCommand(dvar)    ;

        // TO-DO: process "resp" and check dvar type and whether it exists

        return resp;
    }

    public async getDvarBool(dvar: string): Promise<boolean> 
    {
        const resp = await this.sendRconCommand(dvar);
        
        // TD-DO: Process "resp" better

        return !!resp;
    }

    public async getDvarFloat(dvar: string ): Promise<number> 
    {
        const resp = await this.sendRconCommand(dvar);

        // TO-DO: process if rcon gave no dvar found
        
        var flot: number = Number.parseFloat(resp);

        if( Number.isNaN(flot) )
            return 0;

        return flot;
    }

    public async getDvarInt(dvar: string): Promise<number> 
    {
        const resp = await this.sendRconCommand(dvar);

        // TO-DO: process if rcon gave no dvar found
        
        var intt = Number.parseInt(resp);

        if( Number.isNaN(intt) )
            return 0;

        return intt;
    }
    /**
     * Fetch Dvar in string return format from Rcon
     * @param  {string} dvar
     * @returns Promise
     */
    public async getDvarString(dvar: string): Promise<string> 
    {
        const resp = await this.sendRconCommand(dvar);

        // TO-DO: process rcon not recognizing dvar

        return resp.toString();    
    }

    public async getHostname(): Promise<string> 
    {
        if(!this.hostname)
        {
            const hname: string = await this.getDvarString("sv_hostname");
            this.hostname = hname;

            return hname;
        }
        return this.hostname;
    }

    public getMaxClients(): number
    {
        return this.maxclients;    
    }

    private async parseRconStatus( status: string ): Promise<RconStatus>
    {
        var bob: any = {};

        const lines: string[] = status.split("\n");

        for( var i = 0; i < 6; i++ )
        {
            var line: string = lines[i];
            var pair: string[] = line.split(":");            
            var key: string = pair[0].trim().replace("/","");
            pair.shift();
            var value: string = pair.join(":").trim();

            (bob as any)[key] = value;
        }

        // update instace constants
        this.os = bob.os;

        const toRet: RconStatus = {
            ...bob,
            onlinePlayers: await this.getOnlinePlayers({status: status})
        }
        return toRet;
    }

    private pasreRconInfo( info: string ): RconInfo
    {
        const infoObj: any = {};

        const lines = info.split("\n");

        // remove "Server info settings:"
        lines.shift();

        for( var i =  0; i < lines.length; i++ )
        {
            const line = lines[i];

            // split by multiple white spaces
            const mat = line.split(/\s+/);

            // remove extra ''
            mat.shift();

            const key = mat[0];
            var temp: string[] = mat;
            temp.shift();

            (infoObj as any)[key] = temp.join(" ");
        }
        // toRet = {...(infoObj as any)}

        const toRet: RconInfo = 
        {
            sv_maxclients: Number( infoObj.sv_maxclients || NaN ),
            build: Number( infoObj.build || NaN ),
            g_compassShowEnemies: Number( infoObj.g_compassShowEnemies || NaN ),
            protocol: Number( infoObj.protocol || "" ),
            sv_minPing: Number( infoObj.sv_minPing || NaN ),
            sv_maxPing: Number( infoObj.sv_maxPing || NaN ),
            sv_disableClientConsole: Number( infoObj.sv_disableClientConsole || NaN ),
            sv_pure: Number( infoObj.sv_pure || NaN ),
            sv_voice: Number( infoObj.sv_voice || NaN ),
            sv_maxRate: Number( infoObj.sv_maxRate || NaN ),

            ...infoObj
        }

        // update instance constants
        this.modname = infoObj.fs_game;

        return toRet;
    }

    public async getMultipleDvars(...dvars: string[]): Promise<object> 
    {
        const toRet: object = {};
        for( var i = 0; i < dvars.length; i++ )
        {
            const resp = await this.getDvar( dvars[i] );
            (toRet as any)[dvars[i]] = resp;
        }
        return toRet;
    }

    // TO-DO: sorting
    public async getOnlinePlayers( options?: GetOnlinePlayersArgs ): Promise<RconOnlinePlayer[]> 
    {
        if( options == undefined )
            options = {};

        if( options.status == undefined )
            var getStatus = await this.sendRconCommand("status");
        else var getStatus = options.status;

        // this.setDvarsFromRconStatus();
        
        // making online player array outta this status
        const lines = getStatus.split('\n');
        let players: RconOnlinePlayer[] = [];
        lines.forEach((line, _i) => 
        {
            const patternPl = /^\s*(\d+)\s+(-?\d+)\s+(\d+)\s+(\d+)\s+([a-fA-F0-9]{16,32}|\d+) (.+?)\s+(\d+) (\d+\.\d+\.\d+\.\d+):(\-?\d+)\s+(\-?\d+)\s+(\d+)$/;
            let lineParsed = line.match(patternPl);
            if (lineParsed) 
            {
                var pName = lineParsed[6].trim();

                if (pName && pName.endsWith('^7')) {
                    pName = pName.slice( 0, pName.length - 2 );
                }

                const playerParsed: RconOnlinePlayer = 
                {
                    slot: parseInt(lineParsed[1]),
                    score: parseInt(lineParsed[2]),
                    ping: parseInt(lineParsed[3]),
                    guid: lineParsed[4].trim(),
                    steamId: lineParsed[5].trim(),
                    name: lineParsed[6].trim(),
                    lastmsg: parseInt(lineParsed[7]),
                    ip: lineParsed[8].trim(),
                    port: parseInt(lineParsed[9]),
                    qport: parseInt(lineParsed[10]),
                    rate: parseInt(lineParsed[11]),
                };
                
                players.push(playerParsed);
            }
        });
        players = players.sort((a, b) => (b.score || 0) - (a.score || 0));
        
        return players;
    }

    public async getOnlinePlayerBySlot( slot: number): Promise<RconOnlinePlayer | undefined>
    {
        const players = await this.getOnlinePlayers();
        for( var i = 0; i < players.length; i++ )
            if( players[i].slot == slot )
                return players[i];
        return undefined;
    }

    public getModName(): string
    {
        return this.modname;
    }

    public async sendRconCommand( cmd: string ): Promise<string>
    {
        const encodedMsg: string = await this.encodeOutgoingMsg(`rcon ${this.rconpass} ${cmd}`);
        await this.sendUDPMessage( encodedMsg );
        const out: string = await this.decodeIncomingMsg();

        return out;
    }

    public async serverinfo(): Promise<RconInfo> 
    {
        const cmd: string = await this.sendRconCommand("serverinfo");
        const parsed: RconInfo = this.pasreRconInfo(cmd);
        return parsed;
    }
    
    public async setDvar(dvar: string, value: string | number ): Promise<boolean>
    {
        const resp = await this.sendRconCommand(`set ${dvar} ${value}`);

        // TO-DO: check whether it actually changed it

        return !!resp;    
    }

    public async setHostname(newname: string): Promise<boolean> 
    {
        const resp = await this.sendRconCommand(`sv_hostname ${newname}`);

        // TO-DO: check whether it actually changed it

        return !!resp;
    }

    public async status(): Promise<RconStatus>
    {
        // status must be an object
        const out = await this.sendRconCommand(`status`);
        
        // TO-DO: update instance constants too

        const parsed: RconStatus = await this.parseRconStatus( out );

        return parsed;
    }

    public async kick( slot: number | string, reason: string = "" ): Promise<string>
    {
        return await this.sendRconCommand(`kick ${slot} ${reason}`);

        // TO-DO: return object containing whether kick was successful and message
    }

    public async quit(): Promise<boolean>
    {
        const out = await this.sendRconCommand(`quit`);
        console.log(out);
        
        // TO-DO: check "out" and return based on that

        return true;
    }

    public getServerOs(): string | undefined
    {
        return this.os;
    }
}
