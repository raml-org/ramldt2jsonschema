#!/usr/bin/env node
'use strict'

var js2dt = require('./js2dt.js')
var program = require('commander')

function js2dtCLI (jsonFileName) {
  var output = js2dt.js2dt(jsonFileName)
  console.log(output)
}

program
  .arguments('<jsonFileName>')
  .description('Convert JSON schema to RAML Data Type. ' +
               'Writes to output.')
  .action(js2dtCLI)

program.parse(process.argv)
