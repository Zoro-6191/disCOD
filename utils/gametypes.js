require('rootpath')()
const fs = require('fs')
const ErrorHandler = require('src/errorhandler')

var GlobalGametypes = []

module.exports = 
{
    updateGametypeInfo,
    
    init: async function()
    {
        // read .txt, validate it, throw errors if needed
        var rl = require('readline').createInterface( {input: fs.createReadStream('./conf/gametypes.txt'), output: process.stdout, terminal: false } );
	
        rl.on( 'error', ErrorHandler.fatal )

        // console.log(`Reading Gametypes`);

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

                updateGametypeInfo( token, "name", line[1] )
            })

        rl.on( 'close', ()=> {
            // notify to console
            // console.log(GlobalGametypes);
            module.exports.GlobalGametypes = GlobalGametypes
        })
    },

    getName: async function( token )
    {
        
    },

    getAliases: async function( token )
    {

    },
    
    isValidGametype: async function( token )
    {
        token = token.toLowerCase()
        for( var i = 0; i < GlobalGametypes.length; i++ )
            if( GlobalGametypes[i].token == token || GlobalGametypes[i].aliases.includes(token) )
                return true

        return false
    },

    getGametype: async function( token )
    {
        token = token.toLowerCase()
        for( var i = 0; i < GlobalGametypes.length; i++ )
            if( GlobalGametypes[i].token == token || GlobalGametypes[i].aliases.includes(token) )
                return GlobalGametypes[i]

        return undefined
    }
}

function updateGametypeInfo( token, property, value )
{
    token = token.toLowerCase()

    var obj = GlobalGametypes.find( GTObj => GTObj.token==token )

    if( obj == undefined )   // doesn't exist yet
    {
        GlobalGametypes[GlobalGametypes.length] = {}
        var index = GlobalGametypes.length-1
        GlobalGametypes[index].token = token
    }
    else var index = GlobalGametypes.indexOf(obj)   

    GlobalGametypes[index][property] = value
}