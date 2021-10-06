const ErrorHandler = require.main.require('./src/errorhandler')
const { MessageEmbed } = require('discord.js')
const conf = require.main.require('./conf')
const db = require.main.require('./utils/database')

const description = 'Demote a Player'
var prefix, themeColor, usage

module.exports =
{
    description,
    init: async function()
    {
        prefix = conf.mainconfig.command.prefix
        themeColor = conf.mainconfig.themeColor

        usage = `${prefix}makereg @Mention/B3 ID`
        module.exports.usage = usage

        // check for demotion table and create if no exist
    },

    callback: async function( msg, args, cmder )
    {

    }
}