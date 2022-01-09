require('rootpath')()
const fs = require('fs')
const ErrorHandler = require('src/errorhandler')

var GlobalMaps = []

module.exports = 
{
    updateMapInfo,
    
    init: async function()
    {
        // read .txt, validate it, throw errors if needed
        var rl = require('readline').createInterface( {input: fs.createReadStream('./conf/maps.txt'), output: process.stdout, terminal: false } );
	
        rl.on( 'error', ErrorHandler.fatal )

        // console.log(`Reading Maps`);

        // on reading each line
        rl.on( 'line', (line)=>
            {
                // remove extra white spaces
                line = line.trim()

                if( line.startsWith('//') || line.trim() == "" )
                    return

                // now to split using ":" and creating properties for global object
                line = line.split(':')

                // each obj will have 3 properties: token, name and aliases(array)
                // aliases will always contain token minus mp_ and name.tolower
                var token = line[0]
                var name = line[1]

                updateMapInfo( token, "name", line[1] )
            })

        rl.on( 'close', ()=> {
            // notify to console
            // console.log(GlobalMaps);
            module.exports.GlobalMaps = GlobalMaps
        })
    },

    getName: async function( token )
    {
        
    },

    getAliases: async function( token )
    {

    },
    
    isValidMap: async function( token )
    {
        token = token.toLowerCase()
        for( var i = 0; i < GlobalMaps.length; i++ )
            if( GlobalMaps[i].token == token || GlobalMaps[i].aliases.includes(token) )
                return true

        return false
    },

    getMap: async function( token )
    {
        token = token.toLowerCase()
        for( var i = 0; i < GlobalMaps.length; i++ )
            if( GlobalMaps[i].token == token || GlobalMaps[i].aliases.includes(token) )
                return GlobalMaps[i]

        return undefined
    }
}

function updateMapInfo( token, property, value )
{
    token = token.toLowerCase()

    var obj = GlobalMaps.find( GTObj => GTObj.token==token )

    if( obj == undefined )   // doesn't exist yet
    {
        GlobalMaps[GlobalMaps.length] = {}
        var index = GlobalMaps.length-1
        GlobalMaps[index].token = token
    }
    else var index = GlobalMaps.indexOf(obj)   

    GlobalMaps[index][property] = value
}