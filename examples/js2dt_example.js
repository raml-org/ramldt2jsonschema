'use strict'

var raml2json = require('ramldt2jsonschema')
var join = require('path').join
var fs = require('fs')

var filePath = join(__dirname, '../test/examples/json/simple_person.json')
var jsonData = fs.readFileSync(filePath).toString()

raml2json.js2dt(jsonData, 'Person', function (err, raml) {
  if (err) {
    console.log(err)
    return
  }
  console.log('#%RAML 1.0 Library\n')
  console.log(raml)
})
