'use strict'

var r2j = require('ramldt2jsonschema')
var join = require('path').join
var fs = require('fs')

var filePath = join(__dirname, '../test/integration/json/complex_cat.json')
var jsonData = fs.readFileSync(filePath).toString()

r2j.js2dt(jsonData, 'Person', function (err, raml) {
  if (err) {
    console.log(err)
    return
  }
  console.log('#%RAML 1.0 Library\n')
  console.log(raml)
})
