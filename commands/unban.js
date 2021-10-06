const ErrorHandler = require.main.require('./src/errorhandler')
const conf = require.main.require('./conf')

const description = `Unban a Banned Player`
var prefix, themeColor, usage

module.exports =
{
    description,
    init: async function()
    {
        prefix = conf.mainconfig.command.prefix
        themeColor = conf.mainconfig.themeColor

        usage = `${prefix}unban`
        module.exports.usage = usage
    },

    callback: async function( msg, args )
    {

    }
}