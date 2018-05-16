#!/usr/bin/env node
'use strict'
const program = require('commander')

const cli = require('../src/dt2js_cli')

program
  .arguments('<ramlFile> <ramlTypeName>')
  .description('Convert a RAML data type into JSON schema. ' +
               'Writes to standard output.')
  .action((f, t) => console.log(JSON.stringify(cli(f, t), null, 2)))

program.parse(process.argv)
