require('rootpath')
require('colors')

module.exports =
{
	wait: function( ms ) {
        return new Promise( resolve => setTimeout(resolve,ms) )
    },

    timeStrToMS: function( str ) 
    {
        str = str.toLowerCase()
        lastChar = str[str.length-1]
        num = parseInt(str)

        switch( lastChar )
        {
            case 's':
                return num * 1000;

            case 'm':
                return num * 1000 * 60;

            case 'h':
                return num * 1000 * 60 * 60;

            case 'd':
                return num * 1000 * 60 * 60 * 24;
        }
    },

    isTimeStringInProperFormat: function( str )
    {
        str = str.toLowerCase()
        lastChar = str[str.length-1]
        num = str.substring( 0, str.length - 1 )

        console.log(lastChar);
        console.log(num);

        if( isNaN(parseInt(num)))
            console.log('poop'.red);
        if( Number.isInteger(lastChar) )
            return false

        return true
    },
}