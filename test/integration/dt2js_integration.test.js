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
const Ajv = require('ajv')
const wap = require('webapi-parser').WebApiParser
const { expect } = require('chai')

const helpers = require('../helpers')
const dt2jsCLI = require('../../src/dt2js_cli')
const dt2js = require('../../src/dt2js').dt2js

const EXAMPLES_FOLDER = path.join(__dirname, 'raml')

const ajv = new Ajv({ allErrors: true, schemaId: 'id' })
// ajv.addMetaSchema(require('ajv/lib/refs/json-schema-draft-07.json'))

function loadExamplesData () {
  const modelsProms = helpers.getFiles(EXAMPLES_FOLDER)
    .map(filepath => {
      return wap.raml10.parse(`file://${filepath}`)
    })
  return Promise.all(modelsProms)
    .then(models => {
      return models.map(model => {
        return {
          fpath: model.location.replace('file://', ''),
          names: model.declares
            .map(dec => dec.values ? dec.name.value() : undefined)
            .filter(name => !!name)
        }
      })
    })
}

/**
 * Test each file by running dt2js script on it and then validating
 * output with ajv.
 */
async function defineTests () {
  const examplesData = await loadExamplesData()
  describe('dt2js CLI integration test', function () {
    this.timeout(20000)
    examplesData.forEach(data => {
      context(`for file ${data.fpath}`, () => {
        data.names.forEach(typeName => {
          it(`should convert ${typeName}`, async () => {
            const schema = await dt2jsCLI(data.fpath, typeName)
            validateJsonSchema(schema)
          })
        })
      })
    })
  })
}

defineTests()

describe('dt2js function integration test', function () {
  context('when basePath argument is not provided', function () {
    it('should convert type', async function () {
      const data = `
#%RAML 1.0 Library

types:
  PersonAge:
    type: number
    minimum: 1
    maximum: 50
    format: int32`
      const schema = await dt2js(data, 'PersonAge')
      validateJsonSchema(JSON.stringify(schema))
    })
  })
  context('when basePath argument is provided', function () {
    it('should resolve refs relative to it and convert type', async function () {
      const data = `
#%RAML 1.0 Library

types:
  Person: !include simple_person.json`
      const basePath = path.resolve(__dirname, 'json')
      const schema = await dt2js(data, 'Person', { basePath })
      const schemaStr = JSON.stringify(schema)
      validateJsonSchema(schemaStr)
      expect(schemaStr).to.contain('Age in years')
      expect(schemaStr).to.contain('firstName')
    })
  })
})

function validateJsonSchema (schemaStr) {
  const valid = ajv.validateSchema(JSON.parse(schemaStr))
  if (!valid) {
    const errorsText = ajv.errorsText(
      ajv.errors, { 'separator': '; ' })
    throw new Error(`Invalid json: ${errorsText}`)
  }
}
