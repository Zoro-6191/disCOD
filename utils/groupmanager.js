// this module takes care of admin groups
const fs = require('fs')
const db = require.main.require('./utils/database')
const ErrorHandler = require.main.require('./src/errorhandler')

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
        {
            // insert default groups to table
            insertDefaultGroups()
        }
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
    LevelToName
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

    var obj = globalGroups.find( obj => obj.keyword == keyword )

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

async function insertDefaultGroups()
{
	var rl = require('readline').createInterface( {input: fs.createReadStream('./sql/templates/defaultgroups.sql'), output: process.stdout, terminal: false } );
	
    rl.on( 'error', err => ErrorHandler.fatal(err) )

    // read individual line and query it while reading
    rl.on( 'line', (line)=>
        {
            db.pool.query( line, (err,result)=>{
                if(err)
                    ErrorHandler.fatal(err)
            })
        })

    // notify to console
	rl.on( 'close', ()=> {
		console.log(`Initiated Default Groups:\n	100 - Super Admin\n	80 - Senior Admin\n	60 - Full Admin\n	40 - Admin\n	20 - Moderator\n	2 - Regular\n	1 - User\n	0 - Guest`)
        // now to forward to creating global group object
        // createGlobalGroups()
        // just querying again is probably best
        db.pool.query( `SELECT * FROM groups;`, (err,result)=>{
            if( err )
                ErrorHandler.fatal(`Error while creating global Groups object\n${err}`)
            else createGlobalGroups( result )
        })
	})
}