require('rootpath')()
const events = require('events')
const ErrorHandler = require('src/errorhandler')

var bot

module.exports = 
{
    init: function()
    {
        bot = new events.EventEmitter()
        module.exports.bot = bot
    }
}