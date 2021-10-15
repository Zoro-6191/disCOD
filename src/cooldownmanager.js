// this module handles all cooldowns
require('rootpath')()
const cjson = require('comment-json')
const fs = require('fs')
const ErrorHandler = require('src/errorhandler')

// for local use, just storing basic cooldown time values
var globalCommandCooldowns = [], userCommandCooldowns = []
var currentGlobalCooldowns = {}, currentUserCooldowns = {}

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
        
        Object.keys(globalCDJSON).forEach( each =>
            {
                globalCommandCooldowns[each] = timeStringToMS(globalCDJSON[each])
            })
        
        Object.keys(userCDJSON).forEach( each =>
            {
                userCommandCooldowns[each] = timeStringToMS(userCDJSON[each])
            })

        
    },

    addGlobalCommandCooldown: function( cmd, cd )
    {
        // globalCommandCooldowns[cmd] = timeStringToMS(cd)
    },

    addUserCommandCooldown: function( user, cmd, cd )
    {
        // userCommandCooldowns[cmd] = timeStringToMS(cd)
    },

    getGlobalCommandCooldown: function( cmd )
    {
        // return globalCommandCooldowns[cmd]
    },

    getUserCommandCooldown: function( user, cmd )
    {
        // return userCommandCooldowns
    },

    removeGlobalCommandCooldown: function( cmd )
    {

    },

    removeUserCommandCooldown: function( user, cmd )
    {

    },

    isCommandOnGlobalCooldown: function( cmd )
    {

    },

    isCommandOnUserCooldown: function( cmd, id )
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