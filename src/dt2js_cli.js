#!/usr/bin/env node
'use strict'

const dt2js = require('./dt2js')
const program = require('commander')
const fs = require('fs')

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
  const pretty = JSON.stringify(schema, null, 2)
  console.log(pretty)
}

/**
 * Just call dt2js.
 *
 * @param  {string} ramlFile
 * @param  {string} ramlTypeName
 */
function dt2jsCLI (ramlFile, ramlTypeName) {
  const rootFileDir = ramlFile.split('/').slice(0, -1).join('/')
  const ramlData = fs.readFileSync(ramlFile).toString()
  dt2js.setBasePath(rootFileDir)
  dt2js.dt2js(ramlData, ramlTypeName, writeToConsole)
}

program
  .arguments('<ramlFile> <ramlTypeName>')
  .description('Convert a RAML data type into JSON schema. ' +
               'Writes to standard output.')
  .action(dt2jsCLI)

program.parse(process.argv)
