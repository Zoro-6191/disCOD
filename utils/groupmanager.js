// this module takes care of admin groups
require('rootpath')()
const fs = require('fs')
const db = require('utils/database')
const ErrorHandler = require('src/errorhandler')

// for local use
var globalGroups, highestLevel

module.exports.init = async function()
{
    // check if group table is empty
    // if empty, init default groups
    // create global group object, maybe along with methods

    db.pool.query( `SELECT * FROM groups`, (err,result) => {
        if( err )
            ErrorHandler.fatal(`Error while creating global Groups object\n${err}`)
        else if( result.length == 0 )   // no entries exist in table
            ErrorHandler.fatal(`No groups exist in groups table.`)
        else createGlobalGroups( result )
    })
}

module.exports.groupOperations = 
{
    BitsToLevel,
    BitsToKeyword,
    BitsToName,
    KeywordToBits,
    KeywordToLevel,
    KeywordToName,
    LevelToBits,
    LevelToKeyword,
    LevelToName,
    isValidToken,
}

async function createGlobalGroups( queryResult )
{
    globalGroups = []
    highestLevel = 0
    lowestLevel = 100   // enough?
    
    Object.keys( queryResult ).forEach( key => 
    {
        globalGroups[globalGroups.length] = {}
        const index = globalGroups.length-1

        Object.keys( queryResult[key] ).forEach( keyx2 => 
        {
            globalGroups[index][keyx2=='id'?'bits':keyx2] = queryResult[key][keyx2]
        })

        // update highest Level
        if( queryResult[key].level > highestLevel )
            highestLevel = queryResult[key].level

        // update lowest Level
        if( queryResult[key].level < lowestLevel )
            lowestLevel = queryResult[key].level
    })
    module.exports.globalGroups = globalGroups
    module.exports.highestLevel = highestLevel
    module.exports.lowestLevel = lowestLevel
}

function BitsToLevel( bits )
{
    var obj = globalGroups.find( obj => obj.bits == bits )

    if( obj == undefined )
        return undefined

    return obj.level
}

function BitsToKeyword( bits )
{
    
    var obj = globalGroups.find( obj => obj.bits == bits )

    if( obj == undefined )
        return undefined

    return obj.keyword
}

function BitsToName( bits )
{
    var obj = globalGroups.find( obj => obj.bits == bits )

    if( obj == undefined )
        return undefined

    return obj.name
}

function KeywordToName( token )
{
    // TO-DO: regex l8r
    token = token.toLowerCase()

    var obj = globalGroups.find( obj => obj.keyword == keyword )

    if( obj == undefined )
        return undefined

    return obj.name
}

function KeywordToLevel( token )
{
    token = token.toLowerCase()

    var obj = globalGroups.find( obj => obj.keyword == keyword )

    if( obj == undefined )
        return undefined

    return obj.level
}

function KeywordToBits( token )
{
    token = token.toLowerCase()

    var obj = globalGroups.find( obj => obj.keyword == token )

    if( obj == undefined )
        return undefined

    return obj.bits
}

function LevelToKeyword( level )
{
    var obj = globalGroups.find( obj => obj.level == level )

    if( obj == undefined )
        return undefined

    return obj.keyword
}

function LevelToName( level )
{
    var obj = globalGroups.find( obj => obj.level == level )

    if( obj == undefined )
        return undefined

    return obj.name
}

function LevelToBits( level )
{
    var obj = globalGroups.find( zz => zz.level == level )

    if( obj == undefined )
        return undefined

    return obj.bits
}

function isValidToken( token )
{
    token = token.toLowerCase()

    for( var i=0; i<globalGroups.length; i++ )
        if( globalGroups[i].keyword == token )
            return true

    return false
}