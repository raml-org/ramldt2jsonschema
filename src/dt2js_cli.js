#!/usr/bin/env node
var index = require('./index.js');
var program = require('commander');

// CLI callback that writes JSON schema to a file.
function writeToFile(err, schema) {
  console.log(schema);
}

program
  .arguments('<ramlFile> <ramlTypeName>')
  .description('Convert a RAML data type into JSON schema')
  .action(function(ramlFile, ramlTypeName){
    index.dt2js(ramlFile, ramlTypeName, writeToFile);
  });

program.parse(process.argv);
