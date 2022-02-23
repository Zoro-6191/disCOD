// module for typechecking and intellisense for "command_alias.json5"

// \[\s?(\w+(,?\s\w+)?)+\s?\]
// ^ regex used to replace to "string[]" XD
interface CommandAliasConfig {
    readonly aliases: string[],
    readonly ban: string[],
    readonly fast_restart: string[],
    readonly fullinfo: string[],
    readonly gametype: string[],
    readonly getss: string[],
    readonly help: string[],
    readonly id: string[],
    readonly kick: string[],
    readonly lastbans: string[],
    readonly leveltest: string[],
    readonly lookup: string[],
    readonly makereg: string[],
    readonly map_restart: string[],
    readonly map: string[],
    readonly onlineadmins: string[],
    readonly permban: string[],
    readonly putgroup: string[],
    readonly resolution: string[],
    readonly rules: string[],
    readonly scream: string[],
    readonly source: string[],
    readonly xlrstats: string[]
}

declare const exportvar: CommandAliasConfig;
export default exportvar;