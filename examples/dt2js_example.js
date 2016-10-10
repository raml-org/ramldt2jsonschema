'use strict'

var raml2json = require('ramldt2jsonschema')
var join = require('path').join
var fs = require('fs')

var filePath = join(__dirname, '../test/examples/raml/complex_cat.raml')
var ramlData = fs.readFileSync(filePath).toString()

raml2json.dt2js(ramlData, 'Cat', function (err, schema) {
  if (err) {
    console.log(err)
    return
  }
  console.log(JSON.stringify(schema, null, 2))
})
