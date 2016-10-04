'use strict'

var raml2json = require('ramldt2jsonschema')
var helpers = require('./helpers')

var EXAMPLES_FOLDER = '../examples/json'

function testFile (filepath) {
  console.log('Testing: ', filepath)
  raml2json.js2dt(filepath, 'TestType', function (err, raml) {
    if (err) {
      console.log('Error in ', filepath, ':', err)
      return
    }

    // Validate with raml-1-parser

  })
}

helpers.forEachFileIn(EXAMPLES_FOLDER, testFile)
