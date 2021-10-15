require('rootpath')()
const ErrorHandler = require('src/errorhandler')
const conf = require('conf')

const description = `Chat PM a Player in-game`
var prefix, themeColor, usage

module.exports =
{
    description,
    init: async function()
    {
        prefix = conf.mainconfig.command.prefix
        themeColor = conf.mainconfig.themeColor

        usage = `${prefix}tell <slot> <text>`
        module.exports.usage = usage
    },

    callback: async function( msg, args )
    {

    }
}