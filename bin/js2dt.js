#!/usr/bin/env node
'use strict'
const program = require('commander')

const cli = require('../src/js2dt_cli')

program
  .arguments('<jsonFile> [ramlTypeName]')
  .option(
    '--validate',
    'Validate output RAML with webapi-parser. Throws an error if it is invalid.',
    false)
  .description('Convert JSON schema to RAML Data Type. ' +
               'Writes to standard output.')
  .action(async (f, t, opts) => {
    console.log(await cli(f, t, opts))
  })

program.parse(process.argv)
