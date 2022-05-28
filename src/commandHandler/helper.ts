import { User, Message, CommandInteraction, MessageEmbed } from "discord.js";
import { getRepository } from "typeorm";

import { Discod } from "../entity/Discod";
import { Clients } from "../entity/Clients";
import { Aliases } from "../entity/Aliases";

export type CommandArgument = { 
    ctx: Message | CommandInteraction,
    isSlashCommand: boolean,
    commander?: Clients | null, 
    cmd: Command, 
    commanderLink?: Discod | null,
    calledOn?: "self" | "other",
    specifiedClient?: Clients,
    specifiedClientLink?: Discod | null,
    specifiedMap?: string,
    specifiedGametype?: string,
    specifiedGroup?: GlobalGroup,
    target?: User,
    b3id?: number,
    slot?: number,
    guid?: string,
    name?: string,
    text?: string,
    group?: string,
    maptoken?: string,
    gametype?: string,
    reason?: string,
    visible2all?: boolean,
    other?: any
}

export type CommandResponse = MessageEmbed | string | undefined | MessageEmbed[] | [MessageEmbed];

type ReplyTo = {
    BAD_B3ID?: boolean;
    BAD_GUID?: boolean;
    NO_LINK?: boolean;
    SLOT_EMPTY?: boolean;
    BOT_CLIENT?: boolean
}

export async function getClientFromCommandArg(
        arg: CommandArgument, 
        replyTo?: ReplyTo
    ): Promise< Clients | undefined | null >
{
    return new Promise( async(resolve,reject) => 
    {
        const embed = new MessageEmbed()
            .setColor(themeColor);

        if( arg.b3id != undefined )
        {
            const cl = await Clients.findOne({where: { id: arg.b3id }});
            if( cl == undefined || arg.b3id < 2 )
            {
                if( replyTo == undefined || ( replyTo != undefined && replyTo.BAD_B3ID != undefined && replyTo.BAD_B3ID ) )
                    await arg.ctx.reply({
                        embeds: [embed.setDescription(`❌ Invalid B3 ID **@${arg.b3id}**`)],
                        ephemeral: true,
                    });
                reject("BAD_B3ID");
            }
            else resolve(cl);
        }
        else if( arg.guid != undefined )
        {
            const cl = await Clients.findOne({where: { guid: arg.guid }});
            
            if( cl == null)
            {
                if( replyTo == undefined || ( replyTo != undefined && replyTo.BAD_GUID != undefined && replyTo.BAD_GUID ) )
                    await arg.ctx.reply({
                        embeds: [embed.setDescription(`❌ Invalid GUID **@${arg.guid}**`)],
                        ephemeral: true,
                    })
                reject("BAD_GUID");
            }
            else resolve(cl);
        }
        else if( arg.target != undefined )
        {
            if( arg.target.bot )
            {
                console.log("Here");
                
                if( replyTo == undefined || ( replyTo != undefined && replyTo.BOT_CLIENT != undefined && replyTo.BOT_CLIENT ) )
                    await arg.ctx.reply({
                        embeds: [embed.setDescription(`❌ ${arg.target} is a bot`)],
                        ephemeral: true,
                    });
                reject("BOT_CLIENT");
            }

            const q: [Clients] = await getRepository(Clients).createQueryBuilder("clients")
                                        .leftJoin( Discod, "discod", "discod.dc_id = :dcID", { dcID: arg.target.id } )
                                        .select(["clients.*"])
                                        .where("clients.id = discod.b3_id")
                                        .execute();

            if( q[0] == undefined )
            {
                if( replyTo == undefined || ( replyTo != undefined && replyTo.NO_LINK != undefined && replyTo.NO_LINK ) )
                    await arg.ctx.reply({
                        embeds: [embed.setDescription(`❌ ${arg.target} hasn't linked :(`)],
                        ephemeral: true,
                    }).catch(()=>{});
                reject("NO_LINK");
            }
            else resolve( q[0] as Clients);
        }
        else if( arg.slot != undefined )
        {
            const onlinePlayer = await rcon.getOnlinePlayerBySlot(arg.slot);
            if( onlinePlayer == undefined )
            {
                if( replyTo == undefined || ( replyTo != undefined && replyTo.SLOT_EMPTY != undefined && replyTo.SLOT_EMPTY ) )
                    await arg.ctx.reply({
                        embeds: [embed.setDescription(`❌ Slot [${arg.slot}] is unoccupied`)],
                        ephemeral: true,
                    });
                reject("SLOT_EMPTY");
            }
            resolve(await Clients.findOne({where: { guid: onlinePlayer?.guid }}));
        }
        resolve(undefined);
    })
}


globalThis.getLink = async( client: Clients | number ): Promise< Discod | null> =>
{
    const q = await getRepository(Discod).createQueryBuilder("discod")
                                    .where( "discod.b3_id = :id", {id: typeof client == "number"? client : client.id })
                                    // .cache(true)
                                    .getOne();

    return q;
}

export function getLinkString( client: Clients, link: Discod | null | undefined ): string
{
    if( link == undefined || client.mask_level )
        return `\`@${client.id}\``;
    else return `[<@${link.dc_id}>]`;
}

export function resolveName( name: string ): string
{
    return name.removeCodColors()
                .replace("`","\\`")
                .replace("*","\\*")
                .replace("_","\\_")
                .replace("~","\\~")
                .replace(">","\\>")
                .replace("||","\\|\\|");
}

export async function getAliasString( client: Clients, charLength: number, maskFilter: boolean ): Promise<string>
{
    if( maskFilter && client.mask_level )
        return "No Aliases";

    const aliases = await getRepository( Aliases ).createQueryBuilder("aliases")
                                                    .select("aliases.alias")
                                                    .where("aliases.client_id = :id", {id: client.id})
                                                    .orderBy("aliases.num_used", "DESC")
                                                    // .cache(true)
                                                    .getMany();
                                                    // find( { where: { clientId: client.id }} )

    if( !aliases.length )
        var aliasString: string = client.name;
    else var aliasString: string = "";
    var andMore = `...__and [x] more__ **[%t%]**`;

    for( var i = 0; i < aliases.length; i++ )
    {
        const fix = resolveName(aliases[i].alias);

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