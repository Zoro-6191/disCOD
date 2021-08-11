// this module will take care of b3/codbot database connection
const fs = require('fs')
const mysql = require('promise-mysql')
const { exit } = require('process')
const { bot } = require.main.require('./src/eventhandler')
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

// check if things are correct, then emit a global event
async function DBExistsGoAhead()
{
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
	pool.query( `SHOW TABLES LIKE discord`, async (err, result)=> 
		{
			if( err )
				ErrorHandler.fatal(err)
			else if( result.length == 0 )
			{
				console.log(`Required table "discord" doesn't exist.\nCreating`)
				createTable()
			}
			else bot.emit('database_ready')
		} )
}

function createTable()
{
	// read /src/discord.sql, parse it and query it
	var template = fs.readFileSync(`./src/sql/discord.sql`,'utf-8')

	pool.query( template )
		.then( ()=>
		{
			console.log(`Created Table: "${table}"`)
			bot.emit('database_ready')
		})
		.catch( err => ErrorHandler.fatal(err) )
}