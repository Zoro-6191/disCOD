// this module handles all cooldowns
const cjson = require('comment-json')
const fs = require('fs')
const ErrorHandler = require.main.require('./src/errorhandler')

// for local use, just storing basic cooldown time values
var globalCommandCooldowns, userCommandCooldowns

module.exports = 
{
    init: function()
    {
        // assign cooldown values by config

        const globalCDpath = './conf/cooldown-global.json'
        const userCDpath = './conf/cooldown-user.json'

        if( !fs.existsSync(globalCDpath) )
            ErrorHandler.fatal(`Cooldown Config File "${globalCDpath}" not found`)
        else if( !fs.existsSync(userCDpath) )
            ErrorHandler.fatal(`Cooldown Config File "${userCDpath}" not found`)

        var globalCDJSON, userCDJSON

        // get globalCD
        try
        {
            globalCDJSON = cjson.parse( fs.readFileSync(globalCDpath).toString() )
        }
        catch(e)
        {
            ErrorHandler.fatal(`Incorrect JSON Syntax found in file: ${globalCDpath}\n${e}`)
        }

        // get userCD
        try
        {
            userCDJSON = cjson.parse( fs.readFileSync(userCDpath).toString() )
        }
        catch(e)
        {
            ErrorHandler.fatal(`Incorrect JSON Syntax found in file: ${userCDpath}\n${e}`)
        }

        // now to go through each and making a workable object outta it
        // milliseconds sounds easiest since we'll be using to realtime ms l8r
        // also, assigning default to non mentioned or even mentioned ones

        // first global
        console.log( globalCDJSON )
        console.log( userCDJSON )

        console.log( timeStringToMS( '1s' ))
    },

    addGlobalCommandCooldown: function( cmd, cd )
    {

    },

    addUserCommandCooldown: function( user, cmd, cd )
    {
        
    },

    getGlobalCommandCooldown: function( cmd )
    {

    },

    getUserCommandCooldown: function( user, cmd )
    {
        
    },

    removeGlobalCommandCooldown: function( cmd )
    {

    },

    removeUserCommandCooldown: function( user, cmd )
    {

    }
}

function timeStringToMS( str )
{
    str = str.toLowerCase().trim()

    if( str.length < 2 )
        ErrorHandler.fatal(`Incorrect Time Format ${str}`)

    var num = parseInt( str.substr( 0, str.length - 1 ) )
    var lastchar = str[str.length - 1]

    var time

    switch( lastchar )
    {
        default:
        case 's':
            time = num * 1000
        break;

        case 'm':
            time = num * 1000 * 60
        break;

        case 'h':
            time = num * 1000 * 60 * 60
        break;

        case 'd':
            time = num * 1000 * 60 * 60 * 24
        break;
    }

    return time
}