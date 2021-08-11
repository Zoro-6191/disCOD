// only botwide events ig
// like command, error etc
const events = require('events')
const ErrorHandler = require.main.require('./src/errorhandler')

var bot

module.exports = 
{
    init: function()
    {
        bot = new events.EventEmitter()
        module.exports.bot = bot
    }
}