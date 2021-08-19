// this module will take care of b3/codbot database connection
const fs = require('fs')
const mysql = require('promise-mysql')
const { exit } = require('process')
const eventhandler = require.main.require('./src/eventhandler')
const ErrorHandler = require.main.require('./src/errorhandler')

var pool, aliveLoop

module.exports = 
{
    pool,
    aliveLoop,

    init: async function()
    {
        const mainconfig = require.main.require('./conf').mainconfig
		
		mysqldb = mainconfig.mysqldb

		// now check if user has entered workable entries in config, has to be in sync
		await checkConfigEntries( mysqldb )

		// no database async connection
		this.pool = await mysql.createPool(
			{
				host: mysqldb.host,
				port: mysqldb.port,
				user: mysqldb.user,
				password: mysqldb.password
			})
		
		// synchronous connection
		mysql.createConnection(
			{
				host: mysqldb.host,
				port: mysqldb.port,
				user: mysqldb.user,
				password: mysqldb.password,
				database: mysqldb.database
			}).then( ()=> DBExistsGoAhead() )
			.catch( async (err) => 
				{
					if( err.code == 'ECONNREFUSED' )
						ErrorHandler.fatal( `MySQL Server refused connection.\nThis means the MySQL server is either down or has blocked this IP Address.` )
					else ErrorHandler.fatal( `MySQL ERROR:\n${err.sqlMessage}` )
				})
		
		this.keepAlive();
    },

    reconnect: function()
    {

    },

    keepAlive: async function()
    {
		aliveLoop = setInterval( () => pool.query('SELECT 1') , 100000 );	// every 100seconds, should be fine
	},

	info: function()
    {
        return pool
    }
}

function checkConfigEntries( mysqldb )
{
	// host can be pretty much anything
	// but can't contain spaces

	Object.keys(mysqldb).forEach( property => 
	{
		if( property != "port" )
		{
			mysqldb[property] = mysqldb[property].trim()	// remove extra white spaces from line start and end

			// for idiots
			if( mysqldb[property].split(' ').length > 1 )
				ErrorHandler.fatal(`Invalid Entry in JSON\nFile: /conf/codbot.json\nIn property "${property}" of mysqldb\nSpaces are not allowed: "${mysqldb[property]}"`)
		}
	});
}

// check if things are correct, then emit a global event
async function DBExistsGoAhead()
{
	var currentTables = []

	// update database in pool
	module.exports.pool = await mysql.createConnection(
		{
			host: mysqldb.host,
			port: mysqldb.port,
			user: mysqldb.user,
			password: mysqldb.password,
			database: mysqldb.database
		}).catch(err=>ErrorHandler.fatal(err)/* can it even get here */)

	pool = module.exports.pool

	// now to check if our table(discord) exists
	pool.query( `SHOW TABLES`, async (err, result)=> 
		{
			if( err )
				ErrorHandler.fatal(err)
			else if( result.length == 0 ) // no tables exist
			{
				console.log(`Required table "discord" doesn't exist.\nCreating`)
				return createTable()
			}
			else for( i=0; i< result.length; i++ )	// some tables exist
				currentTables[i] = result[i].Tables_in_codbot

			if( currentTables.includes('discord') )
				return eventhandler.bot.emit('database_ready')
			else return createTable()
		} )
}

function createTable()
{
	// read /src/discord.sql, parse it and query it
	var template = fs.readFileSync(`./src/sql/discord.sql`,'utf-8')

	pool.query( template )
		.then( ()=>
		{
			console.log(`Created Table: "discord"`)
			eventhandler.bot.emit('database_ready')
		})
		.catch( err => ErrorHandler.fatal(err) )
}