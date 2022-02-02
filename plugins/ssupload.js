require('rootpath')()
require('colors')
const util = require('util')
const { MessageEmbed, MessageAttachment } = require('discord.js')
const fs = require('fs-extra')
const chokidar = require('chokidar')
const sizeOf = require('image-size')
const ErrorHandler = require('src/errorhandler')
const conf = require('conf')
const db = require('utils/database')
const discord = require('src/discordclient')
const rcon = require('utils/rcontool')

// vars for local use
var pluginConfig

module.exports =
{
    init: async function()
    {
        pluginConfig = conf.plugin.ssupload

        if( pluginConfig.embed_color == "" )
        {
            var embed_color = conf.mainconfig.themeColor
            ErrorHandler.minor(`"embed_color" in plugin config "./conf/plugin_ssupload.json" not defined. Using "${conf.mainconfig.themeColor}"`)
        }
        else var embed_color = pluginConfig.embed_color

        if( pluginConfig.channel_id == "" )
            return ErrorHandler.minor(`"channel_id" in plugin config "./conf/plugin_ssupload.json" not defined. Plugin will not work.`) 
        else var ssChannel = await discord.client.channels.cache.get( pluginConfig.channel_id )
        
        var ssfolderpath = pluginConfig.screenshot_folder_path

        if( ssfolderpath == "" )
            return ErrorHandler.minor(`"ssfolderpath" in plugin config "./conf/plugin_ssupload.json" not defined. Plugin will not work.`)

        if( !fs.existsSync(ssfolderpath) )
            return ErrorHandler.minor(`"ssfolderpath" in plugin config "./conf/plugin_ssupload.json" defined incorrectly. Path ${ssfolderpath} doesn't exist. Plugin will not work.`)

        if( !ssfolderpath.endsWith('/'))
            ssfolderpath += '/'
        
        // check for reso table
        const checkIfTableExists = await db.pool.query(`SHOW tables LIKE 'discod_reso'`)
            .catch( ErrorHandler.fatal )
        if( !checkIfTableExists.length )
        {
            ErrorHandler.minor(`Resolution table not found. Creating.`)

            await db.pool.query(`CREATE TABLE discod_reso(
                id INT NOT NULL AUTO_INCREMENT UNIQUE,
                client_id INT UNIQUE NOT NULL,
                reso VARCHAR(10) NOT NULL,
                time_add INT(10) NOT NULL DEFAULT '0',
                time_edit INT(10) NOT NULL DEFAULT '0',
                PRIMARY KEY ( id )
            ) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4;`)
                .catch(ErrorHandler.fatal)
        }

        const watcher = chokidar.watch(`${ssfolderpath}*.jpg`, { persistent: true })

        watcher.on( 'add', async path =>
        {
            // wait a second
            await wait(1000)

            // process image metadata for ss and userinfo
            const fd = await fs.open( path, 'r' )
                .catch( ErrorHandler.fatal )

            var buffer = new Buffer.allocUnsafe(150)
			
            const bytes = await fs.read(fd, buffer, 0, buffer.length, 0)
                .catch( ErrorHandler.fatal )

            // [
                // 0 '����',
                // 1 '\x10JFIF',
                // 2 '\x01\x01',
                // 3 '',
                // 4 '\x01',
                // 5 '\x01',
                // 6 '',
                // 7 '��',
                // 8 'dCoD4X',
                // 9 '^0[^3v^0.^3F^0] ^5Promod', // server
                // 10 'mp_vacant', // map
                // 11 'HAHANOOO', // ign
                // 12 '2310346613286122320',
                // 13 '0',
                // 14 'Sun May 30 15:21:05 2021\n',
                // 15 '��',
                // 16 'C',
                // 17 '\x0B\x07\b\t\b\x07\x0B\t\t\t\f\x0B\x0B\r\x10\x1A\x11\x10\x0F\x0F\x10 \x17'
            // ]

            var filename = path.split('/screenshots/')[1]

            var metaData = await buffer.slice(0, bytes.bytesRead).toString() //  to utf-8
            metaData = await metaData.split( '\x00' ) // spaces in utf-8

            var playername = metaData[11]
            var mapname = resolveMapName(metaData[10])
            var guid = metaData[12]
            var timetaken = metaData[14]==undefined?'N/A':metaData[14].split('\n')[0]

            if( guid == undefined || guid == '' )
                ErrorHandler.fatal(`GUID value can't be empty`)
            
            // image reso
            const dimensions = sizeOf(path)
            var reso = `${dimensions.width}x${dimensions.height}`

            const result = await db.pool.query( `SELECT id FROM clients WHERE guid=${guid}` )
                .catch( ErrorHandler.fatal )
            
            b3id = result[0].id

            // process ss taker
            var filenameprocess = filename.split('_')
            if( filenameprocess.length == 5 && filenameprocess[0] == "taker" && filenameprocess[1] == "slot" )
            {
                // "getss %s taker_id_%s_%s_" % (client.cid,taker.id,strr))
                var uploadedVIAb3 = true
                var takerSlotNum = parseInt(filenameprocess[2])

                // check notify
                if( filenameprocess[3] == "notify" )
                    var notifyIngame = true;
                else var notifyIngame = false;
            }
            else
            {
                var uploadedVIAb3 = false
                var notifyIngame = false;
            }
            // ss taker process end

            // log resolution here
            const checkEntry = await db.pool.query(`SELECT * FROM discod_reso WHERE client_id=${b3id}`)
                .catch(ErrorHandler.fatal)

            if( checkEntry.length )
                db.pool.query(`UPDATE discod_reso SET reso='${reso}',time_edit=UNIX_TIMESTAMP() WHERE client_id=${b3id}`)
            else db.pool.query(`INSERT INTO discod_reso (client_id,reso,time_add,time_edit) VALUES (${b3id},'${reso}',UNIX_TIMESTAMP(),UNIX_TIMESTAMP())`)
            // ==============================================

            const embed = new MessageEmbed()
                .setColor(embed_color)
                .setURL('https://www.youtube.com/watch?v=dQw4w9WgXcQ')
                .setTitle(`${playername}`)
                .setFooter(`${reso}`)
                .addField( 'B3 ID', `@${b3id}`, true )
                .addField( 'GUID', `||${guid}||`, true )
                .addField( 'Server', '[v.F] SnR India', true )
                .addField( 'Date/Time Taken', `${timetaken}`, true)
                .addField( 'Map', `${mapname}`, true)
                .setImage( `attachment://${filename}` )

            const file = new MessageAttachment(path)

            await ssChannel.send({ embeds: [embed], files: [file] })

            // notify ingame
            if( uploadedVIAb3 && notifyIngame )
                rcon.rcontool.tell( takerSlotNum, `Screenshot of ^2${playername} ^7has been uploaded to Discord` )

            // wrap up
            console.log( 'Screenshot Sent'.green.bold + ' Player: ' + `${playername}`.cyan)
            fs.close(fd)	// close filehand, frees resources
            await wait(5000)
            fs.unlinkSync(path)	// delete after 5seconds
            buffer.fill(0)
            buffer = undefined
		})
    }
}

function wait(ms)
{
    return new Promise( resolve=> setTimeout(resolve,ms) )
}

function resolveMapName(map)
{
	let mapname = "N/A"
	switch(map)
	{
		case "mp_backlot":
			mapname="Backlot";
			break;
		case "mp_citystreets":
			mapname="District";
			break;
		case "mp_crash":
			mapname="Crash";
			break;
		case "mp_crossfire":
			mapname="Crossfire";
			break;
		case "mp_strike":
			mapname="Strike";
			break;
		case "mp_shipment":
			mapname="Shipment";
			break;
		case "mp_killhouse":
			mapname="Killhouse";
			break;
		case "mp_vacant":
			mapname="Vacant";
			break;
		default:
			mapname=map
	}
	return mapname
}