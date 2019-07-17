#!/usr/bin/env node
'use strict'
const program = require('commander')

const cli = require('../src/dt2js_cli')

program
  .arguments('<ramlFile> <ramlTypeName>')
  .description('Convert a RAML data type into JSON schema. ' +
               'Writes to standard output.')
  .action(async (f, t) => {
    console.log(await cli(f, t))
  })

program.parse(process.argv)
