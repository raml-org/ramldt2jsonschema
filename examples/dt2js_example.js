'use strict'
var raml2json = require('ramldt2jsonschema')

raml2json.dt2js(
    '../test/examples/raml/complex_cat.raml', 'Cat',
    function (err, schema) {
  if (err) {
    console.log(err)
    return
  }
  console.log(JSON.stringify(schema, null, 2))
})
