import { readdirSync } from "fs";
import JSON5 from "json5";

declare global
{
    var GlobalPlugins: PluginOBJ[];
}

type PluginOBJ = {
    name: string,
    config_required: boolean,
    conf_path: string;
    active: boolean
}

export async function init(): Promise<void>
{
    // read plugins folder ig

    var allFiles = readdirSync("./build/plugins/");

    for( var i = 0; i < allFiles.length; i++ )
    {
        var ext = allFiles[i].split(".");
        
        if( ext[ext.length-1] != "js" )
            continue;

        const pluginName = ext[0];
        
        // this shouldnt throw error, unless plugin name has double dots in it ig
        const imp = await import(`./plugins/${pluginName}.js`);

        if( imp.config_required == undefined )
            throw new Error("config_required property of plugin "+pluginName+ " was not defined");

        if( imp.init == undefined || !(imp.init instanceof Function) )
            throw new Error("Bad entry point in plugin "+pluginName );

        await imp.init();
    }
}