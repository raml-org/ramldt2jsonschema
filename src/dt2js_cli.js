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
function writeToFile (err, schema, ramlTypeName) {
  if (err) {
    console.log(err)
    return
  }
  var pretty = JSON.stringify(schema, null, 2)
  var filename = ramlTypeName + '.json'
  fs.writeFileSync(filename, pretty)
}

/**
 * Just call dt2js.
 *
 * @param  {string} ramlFile
 * @param  {string} ramlTypeName
 */
function dt2jsCLI (ramlFile, ramlTypeName) {
  index.dt2js(ramlFile, ramlTypeName, function (err, schema) {
    writeToFile(err, schema, ramlTypeName)
  })
}

program
  .arguments('<ramlFile> <ramlTypeName>')
  .description('Convert a RAML data type into JSON schema')
  .action(dt2jsCLI)

program.parse(process.argv)
