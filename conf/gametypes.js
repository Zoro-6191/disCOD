require('rootpath')()
const ErrorHandler = require('src/errorhandler')
const { MessageEmbed } = require('discord.js')
const conf = require('conf')
const db = require('utils/database')
const gametypes = require('utils/gametypes')

const description = `Get a list of Available Gametypes`
var prefix, themeColor, usage

module.exports =
{
    description,
    init: async function()
    {
        prefix = conf.mainconfig.command.prefix
        themeColor = conf.mainconfig.themeColor

        usage = `${prefix}gametypes`
        module.exports.usage = usage
    },

    callback: async function( msg, args )
    {
        // get gametypes and print ez
        
    }
}