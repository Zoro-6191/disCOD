import { MessageEmbed, ColorResolvable, Message, CommandInteraction, Interaction } from "discord.js";
import { getRepository } from "typeorm";
import mainConfig from "./conf/config.json5";
import { Aliases } from "./entity/Aliases";
import { Clients } from "./entity/Clients";
import { Discod } from "./entity/Discod";

// remove cod colors from a string
declare global 
{
    interface String {
        /**
         * Remove COD Colors like `^5`
         * @returns string
         * @example "^5Zoro-^86191".removeCodColors() = "Zoro-6191"
         */
        removeCodColors(): string;
    }

    /**
     * Direct Query to MySQL Database
     * @param  {string} query
     * @returns {object} result in object format
     */
    var rawQuery: ( query: string ) => Promise<any>;

    /**
     * Check if `Clients` is linked or not
     * @param  {Clients|number} client | B3 ID
     * returns `Discod` entity
     */
    var getLink: (client: Clients) => Promise<Discod | undefined>;
    
    /**
     * `isDefined()` method like in COD GSC Script
     * @param  {any} arg
     * @returns {boolean} boolean
     */
    var isDefined: ( arg: any ) => boolean;


    var isDebug: () => boolean;

    /**
     * Wait function like in COD GSC Scripts
     * Wait code execution for "x" milliseconds
     * 
     * @param  {number} ms<br>
     * 
     * Usage: `await wait(x);`
     */
    var wait: (ms: number ) => void;

    var CreateBasicEmbed: ( options: CreateBasicEmbedArgType ) => MessageEmbed;
    var SendEmbed: ( options: SendEmbedArgType ) => Promise<void>;
    
    /**
     * Get Alias string of client
     * 
     * @param  {Clients} client or `{ id: number, name: string }`
     * @param  {number} charLength<br>
     * 
     * returns directly usable string
     */
    var getAliasString: ( client: Clients | { id: number, name: string }, charLength: number ) => Promise<string>;
}

String.prototype.removeCodColors = function(): string
{
    return this.replace(/\^\d/, "");
}

type CreateBasicEmbedArgType = {
    title?: string,
    color?: ColorResolvable,
    desc?: string,
    titleUrl?: string,
    thumbnailUrl?: string,
    imageUrl?: string,
}

type SendEmbedArgType = {
    ctx: Message | CommandInteraction,
    title?: string,
    desc?: string,
}

// kinda useless
globalThis.isDefined = ( arg: any ): boolean => 
{
    if( arg == undefined || arg == null )
        return false;
    else return true;
}

globalThis.isDebug = (): boolean =>
{
    return mainConfig.debug;
}

globalThis.SendEmbed = async ( opt: SendEmbedArgType ) => 
{
    const embed = new MessageEmbed()
        .setColor(themeColor)

    if( opt.title != undefined )
        embed.setTitle(opt.title);

    if( opt.desc != undefined )
        embed.setDescription(opt.desc);
    
    // both ctx types have .reply property exactly same
    // if( opt.ctx instanceof Message )
        await opt.ctx.reply( { embeds: [ embed ] });
    // else if( opt.ctx instanceof Interaction )
    //     opt.ctx.re
}

globalThis.CreateBasicEmbed = ( options: CreateBasicEmbedArgType ): MessageEmbed =>
{
    const embed = new MessageEmbed()
        .setColor( options.color || themeColor )
    
    if( options.desc != undefined )
        embed.setDescription(options.desc);
    if( options.title != undefined )
        embed.setTitle( options.title )
    if( options.thumbnailUrl != undefined )
        embed.setThumbnail(options.thumbnailUrl)
    if( options.titleUrl != undefined )
        embed.setURL( options.titleUrl )
    if( options.imageUrl != undefined )
        embed.setImage( options.imageUrl )
        
    return embed;
}


globalThis.getAliasString = async ( client: Clients | { id: number, name: string }, charLength: number ): Promise<string> => 
{
    const aliases = await getRepository( Aliases ).createQueryBuilder("aliases")
                                                    .select("aliases.alias")
                                                    .where("aliases.clientId = :id", {id: client.id})
                                                    .orderBy("aliases.numUsed", "DESC")
                                                    // .cache(true)
                                                    .getMany();
                                                    // find( { where: { clientId: client.id }} )
    // console.log(aliases);

    if( !aliases.length )
        var aliasString: string = client.name;
    else var aliasString: string = "";
    var andMore = `...__and [x] more__ **[%t%]**`;

    for( var i = 0; i < aliases.length; i++ )
    {
        const fix = aliases[i].alias
                            .replace("`","\`")
                            .replace("*","\*")
                            .replace("~","\~")
                            .replace("_","\_")
                            .replace("\\","\\\\")
                            .replace(">","\>");
        

        if( (aliasString.length + fix.length) < ( charLength - andMore.length ) )
        {
            if( i == aliases.length - 1 )
                aliasString += fix + ` **[${aliases.length}]**`
            else aliasString += fix + `, `;
        }
        else
        {
            aliasString += andMore.replace("[x]",(aliases.length - i).toString())
                                    .replace("%t%", aliases.length.toString());
            break;
        } 
    }
    return aliasString;
}

globalThis.wait = (ms: number) =>
{
    return new Promise((res) => setTimeout(res, ms));
}

// instantly kill app process
export function kill()
{
    return process.exit(1);
}

