'use strict'

/**
 * Integration testing module (dt2js).
 * Runs dt2js script for each file from EXAMPLES_FOLDER and
 * performs validation of output JSON.
 *
 * Errors are output to console in a form:
 *  FAIL (type of fail):
 *  - Error message [optional line.column range]
 *
 * If test passes it will just log 'OK'.
 *
 * Tests are launched by running this file with nodejs.
 */

var helpers = require('./helpers')
var path = require('path')
var rewire = require('rewire')
var Ajv = require('ajv')
var fs = require('fs')

var dt2js = rewire('../../src/dt2js')
var getRAMLContext = dt2js.__get__('getRAMLContext')

var EXAMPLES_FOLDER = path.join(__dirname, 'raml')

var ajv = new Ajv({schemaId: 'id', allErrors: true})
ajv.addMetaSchema(require('ajv/lib/refs/json-schema-draft-04.json'))

var draft4schema = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'draft4schema.json')).toString())
var validate = ajv.compile(draft4schema)

/**
 * Test file by running dt2js script for each type from it and
 * then validating output JSON.
 */
function testFile (filepath) {
  try {
    var ramlData = fs.readFileSync(filepath).toString()
    dt2js.setBasePath(__dirname)
    var ctx = getRAMLContext(ramlData, __dirname)
  } catch (error) {
    console.log('\nLoading', filepath)
    console.log('FAIL (RAML parsing):', '\n-', error.message)
    return
  }
  for (var typeName in ctx) {
    try {
      testType(filepath, ramlData, typeName)
    } catch (err) {
      console.log('\nTesting', filepath)
      console.log('FAIL (script):', '\n-', err.message)
    }
  }
}

/**
 * Test single RAML type from file.
 */
function testType (filepath, ramlData, typeName) {
  dt2js.dt2js(ramlData, typeName, function (err, schema) {
    console.log('\nTesting', filepath, 'Type:', typeName)
    if (err) {
      console.log('FAIL (script):', '\n-', err.message)
      return
    }
    try {
      var valid = validate(schema)
      if (!valid) {
        logValidationError()
        return
      }
    } catch (error) {
      console.log('FAIL (JSON validation):', '\n-', error.message)
      return
    }
    console.log('OK')
  })
}

/**
 * Log JSON validation errors.
 */
function logValidationError () {
  var sep = '||'
  var errorsText = ajv.errorsText(validate.errors, {'separator': sep})
  var errors = errorsText.split(sep)
  console.log('FAIL (JSON validation):')
  errors.forEach(function (el) {
    console.log('-', el)
  })
}

helpers.forEachFileIn(EXAMPLES_FOLDER, testFile)
