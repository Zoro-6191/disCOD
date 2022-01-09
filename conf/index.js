// this module initializes configs
require('rootpath')()
const cjson = require('comment-json')
const fs = require('fs')
const { extname } = require('path')
const ErrorHandler = require('src/errorhandler')
const { wait, isTimeStringInProperFormat, timeStrToMS } = require('utils/utility')

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
    catch(e) { ErrorHandler.fatal(`Incorrect JSON Syntax found in file: ${mainConfPath}\n${e}`) }

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

     // now to create command object
    command = []
    // command obj will have
    // name:
    // alias?:
    // minpower: conf_cmdlevel.json
    // help:
    // usage:
    // user_cooldown:
    // global_cooldown:
    // active user cooldowns?
    // active global cooldowns?

    const availableCommands = fs.readdirSync('./commands/')
    
    try { var minpower = cjson.parse(fs.readFileSync('./conf/conf_cmdlevel.json').toString()) }
    catch(e) { ErrorHandler.fatal(`Incorrect JSON Syntax found in file: './conf/conf_cmdlevel.json'\n${e}`) }

    try { var cmdalias = cjson.parse(fs.readFileSync('./conf/command_alias.json').toString()) }
    catch(e) { ErrorHandler.fatal(`Incorrect JSON Syntax found in file: './conf/command_alias.json'\n${e}`) }

    try { var cmdusercooldown = cjson.parse(fs.readFileSync('./conf/cooldown-user.json').toString()) }
    catch(e) { ErrorHandler.fatal(`Incorrect JSON Syntax found in file: './conf/cooldown-user.json'\n${e}`) }

    try { var cmdglobalcooldown = cjson.parse(fs.readFileSync('./conf/cooldown-global.json').toString()) }
    catch(e) { ErrorHandler.fatal(`Incorrect JSON Syntax found in file: './conf/cooldown-global.json'\n${e}`) }

    // now to create object
    for( var i = 0; i < availableCommands.length; i++ )
    {
        command[command.length] = {}
        const index = command.length-1
        command[index].name = availableCommands[i].split('.js')[0]

        // now for desc and usage
        var desc, usage
        try {
            desc = require(`commands/${availableCommands[i]}`).desc
        } catch (error) {
            desc = ``
            ErrorHandler.minor(`Description for Command "${command[index].name}" undefined`)
        } 
        try {
            usage = require(`commands/${availableCommands[i]}`).usage
        } catch (error) {
            usage = ``
            ErrorHandler.minor(`Usage for Command "${command[index].name}" undefined`)
        }      
        command[index].desc = desc
        command[index].usage = usage
    }

    Object.keys(minpower).forEach( cmd => 
    {
        const index = command.indexOf( command.find( poop => poop.name == cmd ) )
        
        if( index < 0 )
            return
        
        command[index].minpower = minpower[cmd]
    })

    Object.keys( cmdalias ).forEach( cmd =>
    {
        const index = command.indexOf( command.find( poop => poop.name == cmd ) )

        if( index < 0 )
            return

        command[index].aliases = cmdalias[cmd]
    })

    Object.keys( cmdusercooldown ).forEach( cmd =>
    {
        const index = command.indexOf( command.find( poop => poop.name == cmd ) )

        if( index < 0 )
            return

        var str = cmdusercooldown[cmd]

        // if(!isTimeStringInProperFormat(str))
        //     ErrorHandler.fatal(`Incorrect Time Format in file './conf/cooldown-user.json' at key '${cmd}' with value '${str.red}' `)
        
        ms = timeStrToMS(str)

        command[index].cooldown_user = ms
    })
    
    Object.keys( cmdglobalcooldown ).forEach( cmd =>
    {
        const index = command.indexOf( command.find( poop => poop.name == cmd ) )

        if( index < 0 )
            return

        var str = cmdglobalcooldown[cmd]

        // if(!isTimeStringInProperFormat(str))
        //     ErrorHandler.fatal(`Incorrect Time Format in file './conf/cooldown-global.json' at key '${cmd}' with value '${str.red}' `)
        
        ms = timeStrToMS(str)

        command[index].cooldown_global = ms
    })
    module.exports.command = command

    // init plugins' configs
    // take file names from ../plugins, map them to plugin_(name).json, better
    // then parse it to objects
    // store in global objects for use
    var plugin = {}

    const pluginArr = fs.readdirSync( `./plugins/` )
    // remove index.js
    // splice( index, <deletecount> ) = delete specific element(s) from array
    pluginArr.splice( pluginArr.indexOf('index.js'),1)

    // now to create workable objects of their configs
    for( i=0; i<pluginArr.length; i++ )
    {
        // remove elements which don't end with .js
        const ext = extname(`./plugins/${pluginArr[i]}`)
        if(ext.toLowerCase()!='.js')
            pluginArr.splice(i,1)

        var pluginName = pluginArr[i].split('.js')[0]
        var pluginConfPath = `./conf/plugin_${pluginName}.json`

        // can't have plugins without configs coz plugin configs contain "enabled" property which is eventually checked
        if( !fs.existsSync(pluginConfPath) )
            ErrorHandler.fatal(`Config for plugin "${pluginName}" not found, which should be named as "plugin_${pluginName}"`)

        // plugin to config mapping
        try
        {
            plugin[pluginName] = cjson.parse(fs.readFileSync(`./conf/plugin_${pluginName}.json`).toString()) 
        }
        catch(e)
        {
            ErrorHandler.fatal(`Incorrect JSON Syntax found in file: ${pluginConfPath}\n${e}`)
        }
    }
    module.exports.plugin = plugin
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