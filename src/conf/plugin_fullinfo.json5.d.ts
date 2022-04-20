
interface PluginConf {
    enabled: boolean,
    commands: Command[]
}

declare const conf: PluginConf;
export default conf;