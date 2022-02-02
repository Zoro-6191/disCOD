// this module will take care of b3/codbot database connection
require('rootpath')()
const fs = require('fs')
const mysql = require('promise-mysql')
const eventhandler = require('src/eventhandler')
const ErrorHandler = require('src/errorhandler')
const discordclient = require('src/discordclient')

var pool, aliveLoop

module.exports = 
{
    pool,
    aliveLoop,

    init: async function()
    {
        const mainconfig = require('conf').mainconfig
		
		mysqldb = mainconfig.mysqldb

		// now check if user has entered workable entries in config, has to be in sync
		await checkConfigEntries( mysqldb )

		// no database async connection
		this.pool = await mysql.createPool(
			{
				host: mysqldb.host,
				port: mysqldb.port,
				user: mysqldb.user,
				password: mysqldb.password,
				charset : 'utf8mb4'
			})
		
		// synchronous connection
		mysql.createConnection(
			{
				host: mysqldb.host,
				port: mysqldb.port,
				user: mysqldb.user,
				password: mysqldb.password,
				database: mysqldb.database,
				charset : 'utf8mb4'
			})
			.then( ()=> DBExistsGoAhead() )
			.catch( async (err) => 
			{
				if( err.code == 'ECONNREFUSED' )
					ErrorHandler.fatal( `MySQL Server refused connection.\nThis means the MySQL server is either down or has blocked this IP Address.` )
				else ErrorHandler.fatal( `MySQL ERROR:\n${err.sqlMessage}` )
			})
		
		this.keepAlive();
    },

	processLeave: async function(member)
	{
		const id = member.user.id;

		const check = await pool.query(`SELECT * FROM discod WHERE dc_id=${id}`)
			.catch(ErrorHandler.fatal)

		if( check.length )
		{
			await pool.query(`DELETE FROM discord WHERE dc_id=${id}`)
				.catch(ErrorHandler.fatal)
				.then(()=>console.log(`Removed ${member.user.tag} from database.`))
		}
	},

	getPlayerID: async function( arg )
	{
		return new Promise( async (resolve,reject) => 
		{
			if( arg.startsWith('<@') )
			{
				num = arg.match(/(\d+)/)[0]

				// check if bot
				if( num == discordclient?.client?.user?.id || (await discordclient.client.users?.fetch(num))?.bot )
					reject( 'MENTIONED_BOT' )
				
				const result = await pool.query(`SELECT b3_id FROM discod WHERE dc_id=${num} AND linked=1`)
					.catch(reject)

				if( result.length )
					resolve( result[0].b3_id )
				else reject( 'NO_LINK' )
			}
			else
			{
				num = arg.match(/(\d+)/)

				if( num == undefined || num[0] < 1 )
            		reject('BAD_ENTRY')
				else if( num[0] == '1' ) 
					reject('WORLD_ID')
				else
				{
					const result = await pool.query(`SELECT name FROM clients WHERE id=${num[0]}`)
						.catch(reject)

					if( result.length )
						resolve(num[0])

					else reject( 'NO_RESULT' )
				} 
			}
		})
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
	const mainconfig = require('conf').mainconfig

	var currentTables = []

	// update database in pool
	module.exports.pool = await mysql.createConnection(
		{
			host: mysqldb.host,
			port: mysqldb.port,
			user: mysqldb.user,
			password: mysqldb.password,
			database: mysqldb.database,
			charset : 'utf8mb4'
		}).catch(err=>ErrorHandler.fatal(err)/* can it even get here */)

	pool = module.exports.pool

	// now to check if our table(discod) exists
	pool.query( `SHOW TABLES`, async (err, result)=> 
		{
			if( err )
				ErrorHandler.fatal(err)
			else if( result.length == 0 ) // no tables exist
			{
				console.log(`Required table "discod" doesn't exist.\nCreating`)
				return createTable()
			}
			else for( i=0; i< result.length; i++ )	// some tables exist
				currentTables[i] = result[i]['Tables_in_'+mainconfig.mysqldb.database]

			if( currentTables.includes('discod') )
				return eventhandler.bot.emit('database_ready')
			else return createTable()
		} )
}

function createTable()
{
	// read /src/discod.sql, parse it and query it
	var template = fs.readFileSync(`./src/sql/discod.sql`,'utf-8')

	pool.query( template )
		.then( ()=>
		{
			console.log(`Created Table: "discod"`)
			eventhandler.bot.emit('database_ready')
		})
		.catch( err => ErrorHandler.fatal(err) )
}