#!/usr/bin/env node
'use strict'
const program = require('commander')

const cli = require('../src/dt2js_cli')

program
  .arguments('<ramlFile> <ramlTypeName>')
  .option(
    '--draft <num>',
    'Output JSON Shema draft version. Supported values are: "04", "06", "07"')
  .description('Convert a RAML data type into JSON schema. ' +
               'Writes to standard output.')
  .action(async (f, t, opts) => {
    console.log(await cli(f, t, opts))
  })

program.parse(process.argv)
