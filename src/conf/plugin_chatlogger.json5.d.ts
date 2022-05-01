import { ColorResolvable } from "discord.js";

interface PluginConf {
    enabled: boolean,
    channel_id: string,
    serverlog: string,
    playerstatsLink: string,
    embed_color_public: ColorResolvable,
    embed_color_team: ColorResolvable
}

declare const conf: PluginConf;
export default conf;