// this module will take care of b3/codbot database connection
const mysql = require('promise-mysql')
const { exit } = require('process')
const ErrorHandler = require.main.require('./src/errorhandler')

var connection, pool, aliveLoop

module.exports = 
{
    connection,
    pool,
    aliveLoop,

    init: function()
    {
        const mainconfig = require.main.require('./conf').mainconfig
		const { bot } = require.main.require('./src/eventhandler')
		
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
		this.connection = await mysql.createConnection(
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

					if( err.code == 'ER_ACCESS_DENIED_ERROR' )
						ErrorHandler.fatal( `MySQL ERROR:\n${err.sqlMessage}` )

					if( err.code == 'ER_BAD_DB_ERROR' )	// database doesn't exist
                        ErrorHandler.fatal( `MySQL ERROR:\n${err.sqlMessage}` )
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