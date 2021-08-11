// this file takes care of all rcon command sending related stuff
// TO-DO: exception handling

module.exports.initRcon = async function()
{
    const { createRconCommands } = require( '@arbytez/cod4-rcon-commands' )
	const server = require.main.require('./conf').mainconfig.server

    // TO-DO: check authenticity of config entries

    module.exports.rcontool = createRconCommands( server.rcon_ip, parseInt(server.port), server.rcon_password )
    
    console.log("Initialized: Rcon UDP JS Library by arbytez")
}