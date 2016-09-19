'use strict'
var raml2json = require('ramldt2jsonschema')

raml2json.dt2js('types.raml', 'Cat', function (err, schema) {
  if (err) {
    console.log(err)
  }
  console.log(JSON.stringify(schema, null, 2))
})
