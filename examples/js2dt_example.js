'use strict'
var raml2json = require('ramldt2jsonschema')

raml2json.js2dt(
    '../test/examples/json/simple_person.json', 'Person',
    function (err, raml) {
  if (err) {
    console.log(err)
    return
  }
  console.log('#%RAML 1.0 Library\n')
  console.log(raml)
})
