#!/usr/bin/env node
'use strict'

const js2dt = require('./js2dt')
const utils = require('./utils')
const program = require('commander')
const fs = require('fs')

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
  const jsonData = fs.readFileSync(jsonFile).toString()
  if (ramlTypeName === undefined) {
    ramlTypeName = utils.inferRAMLTypeName(jsonFile)
  }
  js2dt.js2dt(jsonData, ramlTypeName, writeToConsole)
}

program
  .arguments('<jsonFile> <ramlTypeName>')
  .description('Convert JSON schema to RAML Data Type. ' +
               'Writes to standard output.')
  .action(js2dtCLI)

program.parse(process.argv)
