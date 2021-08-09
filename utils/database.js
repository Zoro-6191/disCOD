// this module will take care of b3/codbot database connection
const mysql = require('promise-mysql')
const { exit } = require('process')
const ErrorHandler = require.main.require('./src/errorhandler')