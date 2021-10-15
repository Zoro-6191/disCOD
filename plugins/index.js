require('rootpath')()
require('colors')
const { DebugMode } = require('conf')
const ErrorHandler = require('src/errorhandler')
const conf = require('conf')

module.exports.init = async function()
{
    var enabledPlugins = []
    var pluginsConf = conf.mainconfig.plugins

    Object.keys(pluginsConf).forEach( async pl =>
    {
        if(pluginsConf[pl])
            enabledPlugins.push(pl)
    })

    for( var i = 0; i < enabledPlugins.length; i++ )
    {
        process.stdout.write(`Initializing "${enabledPlugins[i]}" Plugin`.yellow)
        await require(`plugins/${enabledPlugins[i]}.js`).init()
            .then( ()=> console.log(' - Done\n'.green) )
    }
}