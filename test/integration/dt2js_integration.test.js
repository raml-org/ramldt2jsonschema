'use strict'
/* global describe, it, context */

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

const path = require('path')
const rewire = require('rewire')
const Ajv = require('ajv')
const fs = require('fs')

const helpers = require('../helpers')
const dt2js = rewire('../../src/dt2js')
const cli = require('../../src/dt2js_cli')

const getRAMLContext = dt2js.__get__('getRAMLContext')
const EXAMPLES_FOLDER = path.join(__dirname, 'raml')

const ajv = new Ajv({ allErrors: true, schemaId: '$id' })
ajv.addMetaSchema(require('ajv/lib/refs/json-schema-draft-06.json'))

/**
 * Log JSON validation errors.
 */
function logValidationError () {
  const sep = '||'
  const errorsText = ajv.errorsText(ajv.errors, { 'separator': sep })
  const errors = errorsText.split(sep)
  console.log('FAIL (JSON validation):')
  errors.forEach(function (el) {
    console.log('-', el)
  })
}

describe('dt2js integration test', () => {
  helpers.forEachFileIn(EXAMPLES_FOLDER, (filepath) => {
    /**
     * Test file by running js2dt script on it and then validating
     * with raml-1-parser.
     */
    context(`for file ${filepath}`, () => {
      const ramlData = fs.readFileSync(filepath).toString()
      dt2js.setBasePath(EXAMPLES_FOLDER)
      const ctx = getRAMLContext(ramlData, EXAMPLES_FOLDER)

      for (const typeName in ctx) {
        it(`should convert ${typeName}`, () => {
          const schema = cli(filepath, typeName)
          const valid = ajv.validateSchema(schema)
          if (!valid) {
            logValidationError()
            throw new Error('Invalid json')
          }
        })
      }
    })
  })
})
