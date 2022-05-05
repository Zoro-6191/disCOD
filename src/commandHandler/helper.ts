import { User, Message, CommandInteraction, MessageEmbed } from "discord.js";
import { getRepository } from "typeorm";

import { Discod } from "../entity/Discod";
import { Clients } from "../entity/Clients";

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
                    arg.ctx.reply({
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
                    arg.ctx.reply({
                        embeds: [embed.setDescription(`❌ Invalid GUID **@${arg.guid}**`)],
                        ephemeral: true,
                    })
                reject("BAD_GUID");
            }
            else resolve(cl);
        }
        else if( arg.target != undefined )
        {
            
            const q: [Clients] = await getRepository(Clients).createQueryBuilder("clients")
                                        .leftJoin( Discod, "discod", "discod.dc_id = :dcID", { dcID: arg.target.id } )
                                        .select(["clients.*"])
                                        .where("clients.id = discod.b3_id")
                                        .execute();

            if( q[0] == undefined )
            {
                if( replyTo == undefined || ( replyTo != undefined && replyTo.NO_LINK != undefined && replyTo.NO_LINK ) )
                    arg.ctx.reply({
                        embeds: [embed.setDescription(`❌ <@${arg.target.id}> hasn't linked :(`)],
                        ephemeral: true,
                    })
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
                    arg.ctx.reply({
                        embeds: [embed.setDescription(`❌ Slot [${arg.slot}] is unoccupied`)],
                        ephemeral: true,
                    });
                reject("SLOT_EMPTY");
            }
            resolve(await Clients.findOne({where: { guid: onlinePlayer?.guid }}));
        }
        else 
        {
            if( arg.commander != undefined )
            {
                const cl = await Clients.findOne({where: { id: arg.commander.id }});
                resolve(cl);
            }
            else return undefined;
        }
        return undefined;
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