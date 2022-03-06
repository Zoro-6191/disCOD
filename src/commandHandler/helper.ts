import { User, Message, CommandInteraction, MessageEmbed } from "discord.js";
import { getRepository } from "typeorm";

import { Discod } from "../entity/Discod";
import { Clients } from "../entity/Clients";

export type SlashCommandArgObject = {
    commander: Clients | undefined;
    cmd: Command;
    target?: User;
    b3id?: number;
    guid?: string;
    slot?: number;
    visible2all?: boolean,
    other?: any,
}

type ReplyTo = {
    BAD_B3ID?: boolean;
    BAD_GUID?: boolean;
    NO_LINK?: boolean;
    SLOT_EMPTY?: false;
}

export async function getClientFromSlashCommandArgObject( 
        ctx: Message | CommandInteraction, 
        arg: SlashCommandArgObject, 
        replyTo?: ReplyTo
    ): Promise< Clients | undefined >
{
    return new Promise( async(resolve,reject) => 
    {
        const embed = new MessageEmbed()
            .setColor(themeColor);

        if( arg.b3id != undefined )
        {
            const cl = await Clients.findOne(arg.b3id);
            if( cl == undefined || arg.b3id < 2 )
            {
                if( replyTo == undefined || ( replyTo != undefined && replyTo.BAD_B3ID != undefined && replyTo.BAD_B3ID ) )
                    ctx.reply({
                        embeds: [embed.setDescription(`❌ Invalid B3 ID **@${arg.b3id}**`)],
                        ephemeral: true,
                    });
                reject("BAD_B3ID");
            }
            resolve(cl);
        }
        else if( arg.guid != undefined )
        {
            const cl = await Clients.findOne({where: { guid: arg.guid }});
            
            if( cl == undefined)
            {
                if( replyTo == undefined || ( replyTo != undefined && replyTo.BAD_GUID != undefined && replyTo.BAD_GUID ) )
                    ctx.reply({
                        embeds: [embed.setDescription(`❌ Invalid GUID **@${arg.guid}**`)],
                        ephemeral: true,
                    })
                reject("BAD_GUID");
            }
            resolve(cl);
        }
        else if( arg.target != undefined )
        {
            const q = await rawQuery(`SELECT clients.* FROM clients,discod WHERE dc_id = ${arg.target.id} AND clients.id=discod.b3_id`);

            if( q[0] == undefined)
            {
                if( replyTo == undefined || ( replyTo != undefined && replyTo.NO_LINK != undefined && replyTo.NO_LINK ) )
                    ctx.reply({
                        embeds: [embed.setDescription(`❌ <@${arg.target.id}> hasn't linked :(`)],
                        ephemeral: true,
                    })
                reject("NO_LINK");
            }
            resolve( q[0] as Clients );
        }
        else if( arg.slot != undefined )
        {
            const onlinePlayer = await rcon.getOnlinePlayerBySlot(arg.slot);
            if( onlinePlayer == undefined )
            {
                if( replyTo == undefined || ( replyTo != undefined && replyTo.SLOT_EMPTY != undefined && replyTo.SLOT_EMPTY ) )
                    ctx.reply({
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
                const cl = await Clients.findOne(arg.commander.id);
                resolve(cl);
            }
            else return undefined;
        }
        return undefined;
    })
}


globalThis.getLink = async( client: Clients | number ): Promise< Discod | undefined > =>
{
    const q = await getRepository(Discod).createQueryBuilder("discod")
                                    .where( "discod.b3_id = :id", {id: typeof client == "number"? client : client.id })
                                    // .cache(true)
                                    .getOne();

    return q;
}