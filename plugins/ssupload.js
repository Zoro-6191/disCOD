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

        const watcher = chokidar.watch(`${ssfolderpath}*.jpg`, { persistent: true })

        watcher.on( 'add', async path =>
        {
            // wait few seconds
            await wait(1000)

            // process image metadata for ss and userinfo
            const fd = await fs.open( path, 'r' )
                .catch( ErrorHandler.fatal )

            var buffer = new Buffer.allocUnsafe(150)
			
            const bytes = await fs.read(fd, buffer, 0, buffer.length, 0)
                .catch( ErrorHandler.fatal )

            // console.log(bytes);

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
            var ssTaker = filename.slice(0,(filename.length-11)) // _0000.jpg = 9chars

            var metaData = await buffer.slice(0, bytes.bytesRead).toString() //  to utf-8
            // console.log(buffer);
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
            
            // wrap up
            console.log( 'Screenshot Sent'.green.bold + ' Player: ' + `${playername}`.cyan + ' Taken By: ' + `${ssTaker}`.cyan)
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