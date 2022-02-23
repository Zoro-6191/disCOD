import chalk from "chalk";
import { kill } from "./utilities";

import "json5/lib/register";
import mainconf from "./conf/config.json5";

interface ErHandler 
{
    fatal( err: string | object ): void;
    minor( err: string | object ): void;
}

declare global 
{
    var ErrorHandler: ErHandler;
    function Debug( arg: any ): void;
}

export async function initDebugger(): Promise<void>
{
    globalThis.ErrorHandler = new erHandler;

    globalThis.Debug = ( arg: any ) => {
        if( mainconf.debug )
            console.log(chalk.gray(`Debug: `), arg);    
    }
}

class erHandler implements ErHandler
{
    constructor()
    {
        return this;
    }
    public fatal(err: string | object): void 
    {
        events.emit("error_fatal", err);
        console.log( chalk.red("Fatal Error:"), err );
        kill();
    }

    public minor(err: string | object): void {
        events.emit("error_minor",err);
        console.log(chalk.yellow("Warning: "), err ); 
    }
}