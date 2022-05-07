import { Client, Intents } from "discord.js";

declare global 
{    
    interface DiscordClient extends Client {
        guildId: string;
        guildName: string;
    }

    var discordClient: DiscordClient;
}

export function getDiscordClient(): DiscordClient {
    return discordClient;
}

export async function initDiscordClient( tok: string ): Promise<DiscordClient> 
{
    return new Promise( async(resolve, reject) => {

        if( globalThis.discordClient != undefined )
            reject("Discord Client has already been initiated.");
        try
        {    
            (globalThis.discordClient as any) = new Client({intents: [
                Intents.FLAGS.DIRECT_MESSAGES,
                Intents.FLAGS.DIRECT_MESSAGE_REACTIONS,
                Intents.FLAGS.DIRECT_MESSAGE_TYPING,
                Intents.FLAGS.GUILDS,
                Intents.FLAGS.GUILD_BANS,
                Intents.FLAGS.GUILD_EMOJIS_AND_STICKERS,
                Intents.FLAGS.GUILD_INTEGRATIONS,
                Intents.FLAGS.GUILD_INVITES,
                Intents.FLAGS.GUILD_MEMBERS,
                Intents.FLAGS.GUILD_MESSAGES,
                Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
                Intents.FLAGS.GUILD_MESSAGE_TYPING,
                Intents.FLAGS.GUILD_PRESENCES,
                Intents.FLAGS.GUILD_SCHEDULED_EVENTS,
                Intents.FLAGS.GUILD_VOICE_STATES,
                Intents.FLAGS.GUILD_WEBHOOKS,
            ]});
        }
        catch( e ) { reject(e) }
        await discordClient.login( tok )
            .catch(reject)

        discordClient.on( "ready", async () => 
        {
            const guildID = discordClient.guilds.cache.map( guild => guild.id);
            const guildName = discordClient.guilds.cache.map( guid => guid.name );

            if( !isDefined(guildName) || !isDefined(guildName[0]) || guildName[0] == "" )
                reject("Has the bot joined any server? Or are you using an expired token?");

            discordClient.guildId = guildID[0];
            discordClient.guildName = guildName[0];
            await discordClient.user?.setAvatar("https://images-ext-1.discordapp.net/external/59mjxCV4jJOKbE0aygO_BWOs8QT98Tc4j29Fc768_XY/https/pngimage.net/wp-content/uploads/2018/05/cod4-png-6.png").catch(()=>{});
            resolve(discordClient);
        });
        discordClient.once( "error", err => reject(err) );
    })
}