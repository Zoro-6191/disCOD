const ErrorHandler = require.main.require('./src/errorhandler')
const { MessageEmbed } = require('discord.js')
const conf = require.main.require('./conf')
const db = require.main.require('./utils/database')

const description = `Change Map and Gametype at the same time`
var prefix, themeColor, usage

module.exports =
{
    description,
    init: async function()
    {
        prefix = conf.mainconfig.command.prefix
        themeColor = conf.mainconfig.themeColor

        usage = `${prefix}mag <map> <gametype>`
        module.exports.usage = usage
    },

    callback: async function( msg, args )
    {

    }
}