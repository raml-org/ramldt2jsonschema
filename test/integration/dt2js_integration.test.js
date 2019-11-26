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
const rewire = require('rewire')

const helpers = require('../helpers')
const dt2jsCLI = require('../../src/dt2js_cli')
const dt2jsMod = rewire('../../src/dt2js')

const EXAMPLES_FOLDER = path.join(__dirname, 'raml')

const ajv = new Ajv({ allErrors: true, schemaId: 'auto' })
ajv.addMetaSchema(require('ajv/lib/refs/json-schema-draft-04.json'))

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
  const dt2js = dt2jsMod.__get__('dt2js')
  context('when using cli', function () {
    it('should resolve references', async function () {
      const schema = await dt2jsCLI(
        path.resolve(__dirname, 'raml/complex-library.raml'),
        'CatInJson')
      validateJsonSchema(schema)
      expect(schema).to.contain('time_of_birth')
    })
  })

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
  context('when type is defined using schema inclusion and draft is 04', function () {
    it('should include $schema property in output', async function () {
      const data = `
#%RAML 1.0 Library

types:
  Person:
    type: !include simple_person.json
    description: hello`
      const basePath = path.resolve(__dirname, 'json')
      const schema = await dt2js(data, 'Person', { basePath, draft: '04' })
      const schemaStr = JSON.stringify(schema)
      validateJsonSchema(schemaStr)
      expect(schemaStr).to.contain('Age in years')
      expect(schemaStr).to.contain('firstName')
      expect(schemaStr).to.contain('draft-04')
      expect(schemaStr).to.contain('hello')
      expect(schemaStr).to.contain('$schema')
    })
  })
})

describe('dt2js function integration test with --validate option', function () {
  const dt2js = dt2jsMod.__get__('dt2js')
  const data = `
#%RAML 1.0 Library

types:
  PersonAge:
    type: string
    enum: 4
  PersonName:
    type: string
`
  context('when --validate option is passed', function () {
    it('should validate output json schema', async function () {
      try {
        await dt2js(data, 'PersonAge', { validate: true, draft: '04' })
        throw new Error('Expected to fail')
      } catch (e) {
        expect(e.message).to.equal(
          "Invalid JSON Schema: data.definitions['PersonAge'].enum should NOT have fewer than 1 items")
      }
    })
  })
  context('when --validate option is NOT passed', function () {
    it('should not validate output json schema', async function () {
      try {
        await dt2js(data, 'PersonName')
      } catch (e) {
        throw new Error('Expected to succeed')
      }
    })
  })
})

function validateJsonSchema (schemaStr) {
  const valid = ajv.validateSchema(JSON.parse(schemaStr))
  if (!valid) {
    const errorsText = ajv.errorsText(
      ajv.errors, { separator: '; ' })
    throw new Error(`Invalid json: ${errorsText}`)
  }
}
