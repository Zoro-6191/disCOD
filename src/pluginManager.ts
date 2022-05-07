import { existsSync, readdirSync, readFileSync } from "fs";
import JSON5 from "json5";

declare global
{
    var GlobalPlugins: PluginOBJ[];
}

type PluginOBJ = {
    name: string,
    config_required: boolean,
    conf_path?: string;
    active: boolean
}

export async function init(): Promise<void>
{
    // read plugins folder ig

    var allFiles = readdirSync("./build/plugins/");
    globalThis.GlobalPlugins = [];
    i:
    for( var i = 0; i < allFiles.length; i++ )
    {
        var ext = allFiles[i].split(".");
        
        if( ext[ext.length-1] != "js" )
            continue;

        const pluginName = ext[0];
        
        // this shouldnt throw error, unless plugin name has double dots in it ig
        const imp = await import(`./plugins/${pluginName}.js`);

        if( imp.config_required == undefined )
            throw new Error("'config_required' property of plugin "+pluginName+ " was not defined");

        if( imp.init == undefined || !(imp.init instanceof Function) )
            throw new Error("Bad entry point in plugin "+pluginName );

        // conf check
        if( imp.config_required )
        {
            const confPath = `./build/conf/plugin_${pluginName}.json5`;

            if( !existsSync(confPath) )
                throw new Error(`Config for plugin "${pluginName}" not found`);

            const read = readFileSync( confPath, {encoding: "utf8"} );

            var parsedConf;
            try
            {
                parsedConf = await JSON5.parse(read)
            }
            catch(e){ throw new Error(e) }

            GlobalPlugins.push({
                name: pluginName,
                active: parsedConf.enabled,
                config_required: imp.config_required,
                conf_path: imp.config_required?confPath:undefined,
            });

            if( !parsedConf.enabled )
                continue i;
        }
        await imp.init();
    }
}