#!/usr/bin/env node
'use strict'

var index = require('./index.js')
var program = require('commander')
var fs = require('fs')

/**
 * Callback to write JSON schema to file.
 *
 * @param  {Error} err
 * @param  {Object} schema
 */
function writeToFile (err, schema) {
  if (err) {
    console.log(err)
    return
  }
  var pretty = JSON.stringify(schema, null, 2)
  fs.writeFileSync('schema.json', pretty)
}

/**
 * Just call dt2js.
 *
 * @param  {string} ramlFile
 * @param  {string} ramlTypeName
 */
function dt2jsCLI (ramlFile, ramlTypeName) {
  index.dt2js(ramlFile, ramlTypeName, writeToFile)
}

program
  .arguments('<ramlFile> <ramlTypeName>')
  .description('Convert a RAML data type into JSON schema')
  .action(dt2jsCLI)

program.parse(process.argv)
