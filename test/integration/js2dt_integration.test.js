'use strict'
/* global describe, it */

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

const path = require('path')
const parser = require('raml-1-parser')
const helpers = require('./helpers')

const js2dt = require('../../src/js2dt')
const cli = require('../../src/js2dt_cli')

const EXAMPLES_FOLDER = path.join(__dirname, 'json')

/**
 * Log RAML validation error.
 */
function logValidationError (error) {
  console.log('FAIL (RAML validation):')
  error.parserErrors.forEach(function (el) {
    const errMessage = '- ' + el.message + ' [' +
      el.range.start.line + '.' + el.range.start.column + ':' +
      el.range.end.line + '.' + el.range.end.column + ']'
    console.log(errMessage)
  })
}

describe('js2dt integration test', () => {
  helpers.forEachFileIn(EXAMPLES_FOLDER, (filepath) => {
    /**
     * Test file by running js2dt script on it and then validating
     * with raml-1-parser.
     */
    it(`should convert ${filepath}`, () => {
      const typeName = 'TestType'
      js2dt.setBasePath(EXAMPLES_FOLDER)
      const raml = cli(filepath, typeName)

      try {
        parser.parseRAMLSync(raml, { 'rejectOnErrors': true })
      } catch (error) {
        logValidationError(error)
        throw error
      }
    })
  })
})
