// @ts-ignore
import { CommandInteraction, Message, MessageEmbed } from "discord.js";

export async function cmd_aliases( arg: {} ): Promise<string | MessageEmbed[]>
{
    // if( ctx instanceof Interaction )
    //     console.log("Command Interaction");
        
    // if( ctx instanceof Message )
    //     console.log("Message Instance");
    
    const embed = CreateBasicEmbed({
        title: `Aliases for <Mention> @<B3 ID>`,
        desc: `<Actual Aliases>`
    })

    return [embed];    
}

export async function cmd_ban()
{
    return "";
}