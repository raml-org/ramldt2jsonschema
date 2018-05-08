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

const helpers = require('./helpers')
const path = require('path')
const rewire = require('rewire')
const Ajv = require('ajv')
const fs = require('fs')

const dt2js = rewire('../../src/dt2js')
const getRAMLContext = dt2js.__get__('getRAMLContext')

const EXAMPLES_FOLDER = path.join(__dirname, 'raml')

const ajv = new Ajv({ allErrors: true, schemaId: 'id' })
ajv.addMetaSchema(require('ajv/lib/refs/json-schema-draft-04.json'))

/**
 * Log JSON validation errors.
 */
function logValidationError () {
  const sep = '||'
  const errorsText = ajv.errorsText(ajv.errors, {'separator': sep})
  const errors = errorsText.split(sep)
  console.log('FAIL (JSON validation):')
  errors.forEach(function (el) {
    console.log('-', el)
  })
}

// FIXME: commented out line in complex_homeanimal.raml

describe('dt2js integration test', () => {
  helpers.forEachFileIn(EXAMPLES_FOLDER, (filepath) => {
    /**
     * Test file by running js2dt script on it and then validating
     * with raml-1-parser.
     */
    context(`for file ${filepath}`, () => {
      const ramlData = fs.readFileSync(filepath).toString()
      dt2js.setBasePath(__dirname)
      const ctx = getRAMLContext(ramlData, __dirname)
      for (const typeName in ctx) {
        it(`should convert ${typeName}`, () => {
          const schema = dt2js.dt2js(ramlData, typeName)
          const valid = ajv.validateSchema(schema)
          if (!valid) {
            logValidationError()
            throw new Error('Invalid json')
          }
          // dt2js.dt2js(ramlData, typeName, function (err, schema) {
          //   if (err) return done(err)
          //
          //   try {
          //     const valid = ajv.validateSchema(schema)
          //     if (!valid) {
          //       logValidationError()
          //       return done(new Error('Invalid json'))
          //     }
          //   } catch (error) {
          //     return done(error)
          //   }
          //   done()
          // })
        })
      }
    })
  })
})
