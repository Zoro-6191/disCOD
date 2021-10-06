// this module initializes configs
const cjson = require('comment-json')
const fs = require('fs')
const ErrorHandler = require('../src/errorhandler')

const DetailedDebug = false

module.exports.DebugMode = false

module.exports.init = function()
{
    if( DetailedDebug )
        console.log(`DETAILED DEBUG FOR CONF MODULE: ON\nInitializing Conf`)

    const mainConfPath = './conf/config.json'

    if( !fs.existsSync(mainConfPath) )
        ErrorHandler.fatal(`Main Config File "${mainConfPath}" not found`)
    else if( DetailedDebug )
        console.log(`Main Config File "${mainConfPath}" Exists`)

    // JSON Syntax check, as well main config parse
    try
    {
        const mainconfig = cjson.parse(fs.readFileSync(mainConfPath).toString())
        this.mainconfig = mainconfig
        if( DetailedDebug )
            console.log(`Parsed ${mainConfPath}\nExported MainConfig`)
    }
    catch(e)
    {
        ErrorHandler.fatal(`Incorrect JSON Syntax found in file: ${mainConfPath}\n${e}`)
    }

    // cmdlevel cjson
    try
    {
        const cmdlevel = cjson.parse(fs.readFileSync('./conf/conf_cmdlevel.json').toString())
        this.cmdlevel = cmdlevel
        if( DetailedDebug )
            console.log(`Parsed ${cmdlevel}\nExported cmdlevel`)
    }
    catch(e)
    {
        ErrorHandler.fatal(`Incorrect JSON Syntax found in file: './conf/conf_cmdlevel.json'\n${e}`)
    }

    // check debug mode
    var debugvar = this.mainconfig.debug
    if( typeof debugvar == 'boolean' )
    {
        if(debugvar)
        {
            this.DebugMode = true
            console.log(`Debug Mode: On`)
        }
        else console.log(`Debug Mode: Off`)
    }  
    else ErrorHandler.warning(`Debug mode only accepts boolean(true/false) as it's variable, and without quotes.\nDisabling Debug Mode.`)

    // check if timezone is mentioned correctly
    var tz = this.mainconfig.timezone
    if( tz == undefined || !isValidTimeZone(tz))
    {
        this.mainconfig.timezone = 'GMT'
        if( this.DebugMode || DetailedDebug )
            console.log(`Bad Timezone Entry in config: "${tz}\nUsing "GMT"`)
    }
    else if( this.DebugMode || DetailedDebug )
        console.log(`Timezone "${tz}" accepted.`)
    else console.log(`TimeZone: ${tz}`)
    // timezone check end
}

function isValidTimeZone(tz) 
{
    if (!Intl || !Intl.DateTimeFormat().resolvedOptions().timeZone)
        throw new Error('Time zones are not available in this environment');

    try 
    {
        Intl.DateTimeFormat(undefined, {timeZone: tz});
        return true;
    }
    catch(ex) 
    {
        return false;
    }
}