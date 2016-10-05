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
var dt2js = rewire('../../src/dt2js')
var getRAMLContext = dt2js.__get__('getRAMLContext')

var EXAMPLES_FOLDER = path.join(__dirname, '..', 'examples', 'raml')

/**
 * Test file by running dt2js script for each type from it and
 * then validating output JSON.
 */
function testFile (filepath) {
  console.log('\nTesting', filepath)
  try {
    var ctx = getRAMLContext(filepath)
  } catch (error) {
    console.log('FAIL (RAML parsing):', error.message)
    return
  }
  for (var typeName in ctx) {
    testType(filepath, typeName)
  }
}

/**
 * Test single RAML type from file.
 */
function testType (filepath, typeName) {
  console.log('Testing type:', typeName)
  // dt2js.dt2js(filepath, typeName, function (err, schema) {
  //   if (err) {
  //     console.log('FAIL (script):')
  //     console.log('-', err)
  //     return
  //   }
  //   try {
  //     // TODO: Validate JSON schemas against main draft4 JSON schema
  //   } catch (error) {
  //     logValidationError(error)
  //     return
  //   }
  //   console.log('OK')
  // })
}

/**
 * Log JSON validation error.
 */
function logValidationError (error) {
  console.log('FAIL (JSON validation):')
  // TODO: Compost error message
  var errMessage = '- ' + error.message
  console.log(errMessage)
}

helpers.forEachFileIn(EXAMPLES_FOLDER, testFile)
