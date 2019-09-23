'use strict'
/* global describe, it, context */

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
const yaml = require('js-yaml')
const { expect } = require('chai')

const helpers = require('../helpers')
const js2dtCLI = require('../../src/js2dt_cli')
const js2dt = require('../../src/js2dt').js2dt

const EXAMPLES_FOLDER = path.join(__dirname, 'json')

/**
 * Test file by running js2dt script on it and then validating
 * with webapi-parser.
 */
async function defineTests () {
  describe('js2dt CLI integration test', () => {
    helpers.getFiles(EXAMPLES_FOLDER).forEach(filepath => {
      it(`should convert ${filepath}`, async () => {
        const ramlStr = await js2dtCLI(filepath, 'TestType')
        await validateRamlDataType(ramlStr)
      })
    })
  })
}

defineTests()

describe('js2dt function integration test', function () {
  context('when using cli', function () {
    it('should resolve references', async function () {
      const ramlStr = await js2dtCLI(
        path.resolve(__dirname, 'json/person_include.json'),
        'Person')
      await validateRamlDataType(ramlStr)
      expect(ramlStr).to.contain('Age in years')
    })
  })

  context('when basePath argument is not provided', function () {
    it('should convert type', async function () {
      const data = `
        {
          "title": "Person",
          "properties": {
            "person":  {
              "type": "string"
            }
          }
        }
      `
      const raml = await js2dt(data, 'Person')
      const ramlStr = `#%RAML 1.0 Library\n${yaml.safeDump(raml, { noRefs: true })}`
      await validateRamlDataType(ramlStr)
    })
  })
  context('when basePath argument is provided', function () {
    it('should resolve refs relative to it and convert type', async function () {
      const data = `
        {
          "title": "Person",
          "properties": {
            "person": {
              "$ref": "simple_person.json"
            }
          }
        }
      `
      const basePath = path.resolve(__dirname, 'json')
      const raml = await js2dt(data, 'Person', { basePath })
      const ramlStr = `#%RAML 1.0 Library\n${yaml.safeDump(raml, { noRefs: true })}`
      await validateRamlDataType(ramlStr)
      expect(ramlStr).to.contain('Age in years')
      expect(ramlStr).to.contain('firstName')
    })
  })
})

async function validateRamlDataType (ramlStr) {
  const model = await wap.raml10.parse(ramlStr)
  const report = await wap.raml10.validate(model)
  if (!report.conforms) {
    throw new Error(report.toString())
  }
}
