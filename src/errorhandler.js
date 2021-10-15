// this module takes care of exceptions
require('rootpath')()
const { exit } = require('process')

module.exports = 
{
    minor: function(error)
    {
        console.error(error)
    },
    fatal: function( error )
    {
        // console.error(`\nERROR: In File: ${module.parent.filename}\n`)   // doesnt work correct
        console.error(`======== ERROR: =======================================`)
        console.error(error)
        console.error('Bot will shut down ====================================')
        exit(1)
    },
    warning: function( warning )
    {
        console.log(`WARNING: ${warning}`)
    }
}