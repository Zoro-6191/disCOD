// this file takes care of all rcon command sending related stuff
// TO-DO: exception handling
require('rootpath')()

var rcontool

module.exports.initRcon = async function()
{
    const { createRconCommands } = require( '@arbytez/cod4-rcon-commands' )
	const server = require('conf').mainconfig.server

    // TO-DO: check authenticity of config entries

    rcontool = createRconCommands( server.rcon_ip, parseInt(server.port), server.rcon_password )

    module.exports.rcontool = rcontool

    console.log("Initialized: Rcon UDP JS Library by arbytez")
}