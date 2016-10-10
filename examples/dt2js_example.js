'use strict'

var raml2json = require('ramldt2jsonschema')
var fs = require('fs')

var ramlData = fs.readFileSync(
    '../test/examples/raml/complex_cat.raml').toString()

raml2json.dt2js(ramlData, 'Cat', function (err, schema) {
  if (err) {
    console.log(err)
    return
  }
  console.log(JSON.stringify(schema, null, 2))
})
