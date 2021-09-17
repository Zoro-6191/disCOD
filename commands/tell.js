const ErrorHandler = require.main.require('./src/errorhandler')
const conf = require.main.require('./conf')

var prefix, themeColor

module.exports =
{
    init: async function()
    {
        prefix = conf.mainconfig.command.prefix
        themeColor = conf.mainconfig.themeColor
    },

    callback: async function( msg, args )
    {

    }
}