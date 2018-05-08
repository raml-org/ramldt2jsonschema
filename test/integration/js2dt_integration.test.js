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

const { js2dt } = require('../../src/js2dt')
const helpers = require('./helpers')
const path = require('path')
const parser = require('raml-1-parser')
const fs = require('fs')

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
      const jsonData = fs.readFileSync(filepath).toString()
      const typeName = 'TestType'

      let raml = js2dt(jsonData, typeName)

      console.log(raml)

      try {
        raml = '#%RAML 1.0 Library\n' + raml
        parser.parseRAMLSync(raml, {'rejectOnErrors': true})
      } catch (error) {
        logValidationError(error)
        throw error
      }
    })
  })
})
