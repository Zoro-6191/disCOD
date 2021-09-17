const ErrorHandler = require.main.require('./src/errorhandler')
const conf = require.main.require('./conf')

var prefix, themeColor

module.exports =
{
    name: 'aliases',
    description: 'Check in game aliases of @player',
    usage: `${prefix}aliases @B3ID`,

    init: async function()
    {
        prefix = conf.mainconfig.command.prefix
        themeColor = conf.mainconfig.themeColor
    },

    callback: async function( msg, args )
    {
        if( !args.length )
            return msg.channel.send( new Discord.MessageEmbed().setColor( themeColor ).setTitle('You need to include B3 @ID of a player.'))

        let Entry = args[0].toString()
        
        if( Entry.startsWith('@'))
            Entry = Entry.split('@')[1]
        
        if( isNaN(Entry) )
            return msg.channel.send( new Discord.MessageEmbed().setColor( themeColor ).setTitle('Invalid Entry'))

        let lastName = "", titleString = ""
        let MaskLevel

        var sql = `SELECT alias FROM aliases WHERE client_id = ${parseInt(Entry)}`
        var sql1 = `SELECT name,mask_level FROM clients WHERE id = ${parseInt(Entry)}`

        b3db.query( sql1, ( err, result )=>
        {
            if( err || result[0] === undefined )
                titleString = `Aliases of @${Entry}`
            else titleString = `__${result[0].name}__'s Aliases (@${Entry})`
            lastName = result[0].name
            MaskLevel = result[0].mask_level
        })

        b3db.query( sql, ( err, result )=> 
        {
            if( err || result[0] === undefined )
                return msg.channel.send( new Discord.MessageEmbed().setColor(themeColor).setTitle('There was an error processing your command.'))

            // console.log( JSON.stringify(result) );    // for [object Object]

            let aliasString = ""

            for( let zz of result )
                aliasString += `${zz.alias}, `

            if( aliasString.length > 1975 )     // embed descriptions limit 2000chars
                aliasString = aliasString.slice(0,1975) + ' ... __**[and more]**__'

            const embed = new Discord.MessageEmbed()
                .setColor( themeColor )
                .setTitle( titleString )
                .setDescription( `${(MaskLevel>0)? lastName:aliasString}` )

            msg.channel.send( embed )
        });
    }
}