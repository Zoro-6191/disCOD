// this module handles all cooldowns
const ErrorHandler = require.main.require('./src/errorhandler')

// for local use
var globalCommandCooldown, userCommandCooldown = {},{}

module.exports = 
{
    init: function()
    {
        // assign cooldown values by config
    },

    globalCommandCooldown,
    userCommandCooldown,

    addGlobalCommandCooldown: function( cmd )
    {

    },

    addUserCommandCooldown: function( user, cmd )
    {
        
    },

    getGlobalCommandCooldown: function( cmd )
    {

    },

    getUserCommandCooldown: function( user, cmd )
    {
        
    },

    removeGlobalCommandCooldown: function( cmd )
    {

    },

    removeUserCommandCooldown: function( user, cmd )
    {

    }
}