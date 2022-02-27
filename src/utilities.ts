import { MessageEmbed, ColorResolvable, Message, CommandInteraction } from "discord.js";

// remove cod colors from a string
declare global 
{
    interface String {
        removeCodColors(): string;
    }

    var isDefined: ( arg: any ) => boolean;

    var CreateBasicEmbed: ( options: CreateBasicEmbedArgType ) => MessageEmbed;
    var SendEmbed: ( options: SendEmbedArgType ) => void;
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

globalThis.SendEmbed = ( opt: SendEmbedArgType ) => 
{
    const embed = new MessageEmbed()
        .setColor(themeColor)

    if( opt.title != undefined )
        embed.setTitle(opt.title);

    if( opt.desc != undefined )
        embed.setDescription(opt.desc);
    
    // both ctx types have .reply property exactly same
    opt.ctx.reply( { embeds: [ embed ] })
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


// wait code execution for "x" milliseconds
export async function wait(ms: number)
{
    return new Promise((res) => setTimeout(res, ms));
}

// instantly kill app process
export function kill()
{
    return process.exit(1);
}

