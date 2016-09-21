#!/usr/bin/env node
'use strict'

var js2dt = require('./js2dt.js')
var program = require('commander')

/**
 * Callback to write RAML data to console.
 *
 * @param  {Error} err
 * @param  {string} raml
 */
function writeToConsole (err, raml) {
  if (err) {
    console.log(err)
    return
  }
  console.log('#%RAML 1.0 Library\n')
  console.log(raml)
}

/**
 * Just call js2dt.
 *
 * @param  {string} jsonFile
 * @param  {string} ramlTypeName
 */
function js2dtCLI (jsonFile, ramlTypeName) {
  js2dt.js2dt(jsonFile, ramlTypeName, writeToConsole)
}

program
  .arguments('<jsonFile> [ramlTypeName]')
  .description('Convert JSON schema to RAML Data Type. ' +
               'Writes to output.')
  .action(js2dtCLI)

program.parse(process.argv)
