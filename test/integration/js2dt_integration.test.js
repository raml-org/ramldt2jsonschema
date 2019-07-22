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
const wap = require('webapi-parser').WebApiParser

const helpers = require('../helpers')
const js2dt = require('../../src/js2dt')
const js2dtCLI = require('../../src/js2dt_cli')

const EXAMPLES_FOLDER = path.join(__dirname, 'json')

/**
 * Test file by running js2dt script on it and then validating
 * with webapi-parser.
 */
async function defineTests () {
  describe('js2dt integration test', () => {
    helpers.getFiles(EXAMPLES_FOLDER).forEach(filepath => {
      it(`should convert ${filepath}`, async () => {
        const ramlStr = await js2dtCLI(filepath, 'TestType')
        const model = await wap.raml10.parse(ramlStr)
        const report = await wap.raml10.validate(model)
        if (!report.conforms) {
          console.log(ramlStr)
          throw new Error(report.toString())
        }
      })
    })
  })
}

defineTests()
