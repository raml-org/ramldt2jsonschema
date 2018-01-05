'use strict'

var r2j = require('ramldt2jsonschema')
var join = require('path').join
var fs = require('fs')

var filePath = join(__dirname, '../test/integration/raml/complex_cat.raml')
var ramlData = fs.readFileSync(filePath).toString()

r2j.dt2js(ramlData, 'Cat', function (err, schema) {
  if (err) {
    console.log(err)
    return
  }
  console.log(JSON.stringify(schema, null, 2))
})
