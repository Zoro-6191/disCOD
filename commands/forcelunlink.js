const ErrorHandler = require.main.require('./src/errorhandler')
const conf = require.main.require('./conf')

var prefix, themeColor

module.exports =
{
    init: async function()
    {
        prefix = conf.mainconfig.command.prefix
        themeColor = conf.mainconfig.themeColor

        module.exports.usage = `${prefix}forceunlink @MentionUser @B3ID`
    },

    callback: async function( msg, args )
    {
        if( !args.length )
            return msg.reply( { embeds: [ new MessageEmbed().setColor( themeColor ).setTitle('You need to include B3 @ID').setDescription(`Usage: ${module.exports.usage}`) ]})

        let User = msg.mentions.users.first()
        let Entry = args[1].toString()
        
        if( Entry.startsWith('@'))
            Entry = Entry.split('@')[1]
        
        if( isNaN(Entry) )  // if not a number
            return msg.reply( {embeds:[new MessageEmbed().setColor( themeColor ).setTitle('Invalid Entry').setDescription(`Usage: ${this.usage}`)]} )

        // now we check if guy's id exists
        const result = await db.pool.query( `SELECT * FROM discod WHERE b3_id = ${Entry} OR dc_id = ${User.id}`)
            .catch( error=>
            {
                msg.reply( {embeds:[new MessageEmbed().setColor( themeColor ).setTitle('There was an error processing your command')]} )
                ErrorHandler.fatal(error)
            })

        if( !result.length )   // link dont exist
            return msg.reply( {embeds:[new MessageEmbed().setColor(themeColor).setTitle(`Link doesn't exist`)]})
        else forceUnlink( msg )
    }
}

async function forceUnlink( msg  )
{
    await db.pool.query( `DELETE FROM discod WHERE b3_id = ${qResult.b3_id}` )
    .catch( error =>
    {
        msg.guild.owner.send( { embeds: [ new MessageEmbed().setColor(themeColor).setTitle(`Error in unlink()`)]})
        ErrorHandler.fatal(error) 
    }).then(msg.reply( { embeds: [ new MessageEmbed().setColor(themeColor).setTitle(`Successfully unlinked. Type __${prefix}link @ID__ to relink.`).setDescription(`${msg.author}`)]}) )
}