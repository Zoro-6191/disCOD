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
    return new Promise( (resolve, reject) => {

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
        discordClient.login( tok );

        discordClient.on( "ready", async () => 
        {
            const guildID = discordClient.guilds.cache.map( guild => guild.id);
            const guildName = discordClient.guilds.cache.map(guid => guid.name);
            discordClient.guildId = guildID[0];
            discordClient.guildName = guildName[0];
            await discordClient.user?.setAvatar("https://cdn.discordapp.com/attachments/719492117294088252/832286558488100884/cod4logo.png");
            resolve(discordClient);
        });
        discordClient.once( "error", err => reject(err) );
    })
}