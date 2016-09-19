#!/usr/bin/env node
'use strict'

var index = require('./index.js')
var program = require('commander')

/**
 * Callback to write JSON schema to console.
 *
 * @param  {Error} err
 * @param  {Object} schema
 */
function writeToConsole (err, schema) {
  if (err) {
    console.log(err)
    return
  }
  var pretty = JSON.stringify(schema, null, 2)
  console.log(pretty)
}

/**
 * Just call dt2js.
 *
 * @param  {string} ramlFile
 * @param  {string} ramlTypeName
 */
function dt2jsCLI (ramlFile, ramlTypeName) {
  index.dt2js(ramlFile, ramlTypeName, writeToConsole)
}

program
  .arguments('<ramlFile> <ramlTypeName>')
  .description('Convert a RAML data type into JSON schema. ' +
               'Writes to output.')
  .action(dt2jsCLI)

program.parse(process.argv)
