#!/usr/bin/env node
'use strict'

var js2dt = require('./js2dt.js')
var program = require('commander')

function writeToConsole (raml) {
  console.log('#%RAML 1.0 Library\n')
  console.log(raml)
}

function js2dtCLI (jsonFileName, ramlTypeName) {
  var raml = js2dt.js2dt(jsonFileName, ramlTypeName)
  writeToConsole(raml)
}

program
  .arguments('<jsonFileName> [ramlTypeName]')
  .description('Convert JSON schema to RAML Data Type. ' +
               'Writes to output.')
  .action(js2dtCLI)

program.parse(process.argv)
