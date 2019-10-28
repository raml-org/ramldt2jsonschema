#!/usr/bin/env node
'use strict'
const program = require('commander')

const cli = require('../src/dt2js_cli')

program
  .arguments('<ramlFile> <ramlTypeName>')
  .option(
    '--draft <num>',
    'JSON Shema draft version to convert to. Supported values are: "04", "06" and "07" (default)')
  .option(
    '--validate',
    'Validate output JSON Schema with Ajv. Throws an error if schema is invalid. ' +
    'Requires "ajv" to be installed.',
    false)
  .description('Convert a RAML data type into JSON schema. ' +
               'Writes to standard output.')
  .action(async (f, t, opts) => {
    console.log(await cli(f, t, opts))
  })

program.parse(process.argv)
