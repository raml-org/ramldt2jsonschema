#!/usr/bin/env node
'use strict'
const program = require('commander')

const cli = require('../src/js2dt_cli')

program
  .arguments('<jsonFile> [ramlTypeName]')
  .description('Convert JSON schema to RAML Data Type. ' +
               'Writes to standard output.')
  .action((f, t) => console.log(cli(f, t)))

program.parse(process.argv)
