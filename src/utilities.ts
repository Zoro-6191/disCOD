import { MessageEmbed, ColorResolvable, Message, CommandInteraction } from "discord.js";
import mainConfig from "./conf/config.json5";
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

        containsOnlyDigits(): boolean;
    }

    /**
     * Check if `Clients` is linked or not
     * @param  {Clients|number} client | B3 ID
     * returns `Discod` entity
     */
    var getLink: (client: Clients) => Promise<Discod | null>;
    
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

    var getReadableDateFromTimestamp: ( timestamp: number ) => string;
}

String.prototype.removeCodColors = function(): string
{
    return this.replace(/\^\d/g, "");
}

String.prototype.containsOnlyDigits = function(): boolean
{
    return /^\d+$/.test(this as string);
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
        await opt.ctx.reply( { embeds: [ embed ] }).catch(ErrorHandler.minor)
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

globalThis.wait = (ms: number) =>
{
    return new Promise((res) => setTimeout(res, ms));
}

// instantly kill app process
export function kill()
{
    return process.exit(1);
}

globalThis.getReadableDateFromTimestamp = ( timestamp: number ): string => 
{
    const poop = new Date(timestamp*1000); 
    
    return poop.toDateString();    
    // return poop.getHours()+":"+poop.getMinutes().toString()+" "+poop.getDate()+"/"+(poop.getMonth()+1)+"/"+poop.getFullYear();
}

export class Timer
{
    private start: number;

    constructor()
    {
        this.start = this.getEpoch();
        return this;
    }

    public getTime(): number
    {
        const start = this.start;
        this.updateTimer();
        return this.getEpoch() - start;
    }

    private updateTimer(): void
    {
        this.start = this.getEpoch();
    }

    private getEpoch(): number
    {
        return new Date() as any;
    }
}

export function getDurationMS( dur: string ): number | undefined
{
    // separate number and text part
    // tosmall text?
    // process num part
    var numPart = extractNumFromStr( dur );
    if( numPart == undefined || numPart == 0 )
        return undefined;

    var ms: number = 0;

    switch( dur )
    {
        case "s":
            ms = numPart * 1000;
            break;
        case "m":
            ms = numPart * 1000 * 60;
            break;
        case "h":
            ms = numPart * 1000 * 60 * 60;
            break;
        case "d":
            ms = numPart * 1000 * 60 * 60 * 24;
            break;
        default:
            return undefined;
    }
    return ms;
}

export function extractNumFromStr( str: string ): number | undefined
{
    const matches = str.match(/\d+/g);
    if( matches == null )
        return undefined;
    return parseInt(matches[0]);
}