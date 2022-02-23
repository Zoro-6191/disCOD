// module for typechecking and intellisense for "config.json5"
interface MainConfig 
{
    discord_token: string;
    theme_color: string;
    debug: boolean;
    timezone: string;
    chat_prefix: string;
    chat_prefix_pm: string;
    readonly command: {
        prefix: string;
        readonly bypass: string[];
        readonly disabled: string[];
        enable_global_command_cooldown: boolean;
        enable_user_command_cooldown: boolean;
        default_user_cooldown: string;
        default_global_cooldown: string;
        usercooldown_bypass_level: number;
        globalcooldown_bypass_level: number;
    }
    readonly server: {
        readonly rcon_ip: string;
        readonly port: number;
        readonly rcon_password: string;
        public_ip: string;
    }
    readonly mysqldb: {
        readonly host: string;
        readonly port: number;
        readonly user: string;
        readonly password: string;
        readonly database: string;
    }
    readonly msgs: {
        readonly rules: {}
    }
}

declare const mainConfig: MainConfig;
export default mainConfig;