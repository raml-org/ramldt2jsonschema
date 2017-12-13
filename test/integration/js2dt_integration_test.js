'use strict'

/**
 * Integration testing module (js2dt).
 * Runs js2dt script for each file from EXAMPLES_FOLDER and
 * performs validation of output RAML.
 *
 * Errors are output to console in a form:
 *  FAIL (type of fail):
 *  - Error message [optional line.column range]
 *
 * If test passes it will just log 'OK'.
 *
 * Tests are launched by running this file with nodejs.
 */

var js2dt = require('../../src/js2dt')
var helpers = require('./helpers')
var path = require('path')
var parser = require('raml-1-parser')
var fs = require('fs')

var EXAMPLES_FOLDER = path.join(__dirname, 'json')

/**
 * Test file by running js2dt script on it and then validating
 * with raml-1-parser.
 */
function testFile (filepath) {
  console.log('\nTesting', filepath)
  var jsonData = fs.readFileSync(filepath).toString()
  var typeName = 'TestType'
  js2dt.js2dt(jsonData, typeName, function (err, raml) {
    if (err) {
      console.log('FAIL (script):')
      console.log('-', err)
      return
    }
    try {
      raml = '#%RAML 1.0 Library\n' + raml
      parser.parseRAMLSync(raml, {'rejectOnErrors': true})
    } catch (error) {
      logValidationError(error)
      return
    }
    console.log('OK')
  })
}

/**
 * Log RAML validation error.
 */
function logValidationError (error) {
  console.log('FAIL (RAML validation):')
  error.parserErrors.forEach(function (el) {
    var errMessage = '- ' + el.message + ' [' +
      el.range.start.line + '.' + el.range.start.column + ':' +
      el.range.end.line + '.' + el.range.end.column + ']'
    console.log(errMessage)
  })
}

helpers.forEachFileIn(EXAMPLES_FOLDER, testFile)
