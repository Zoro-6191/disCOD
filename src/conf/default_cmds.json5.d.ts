import { User } from "discord.js";

interface DefaultCmds {
    defaultCmds: Command[];
}

declare const defaultCmdsConfig: DefaultCmds;
export default defaultCmdsConfig;