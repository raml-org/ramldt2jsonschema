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

const helpers = require('../helpers')
const dt2jsCLI = require('../../src/dt2js_cli')

const EXAMPLES_FOLDER = path.join(__dirname, 'raml')

const ajv = new Ajv({ allErrors: true, schemaId: 'id' })
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
          names: model.declares.map(dec => dec.name.value())
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
  describe('dt2js integration test', () => {
    examplesData.forEach(data => {
      context(`for file ${data.fpath}`, () => {
        data.names.forEach(typeName => {
          it(`should convert ${typeName}`, async () => {
            const schema = await dt2jsCLI(data.fpath, typeName)
            const valid = ajv.validateSchema(JSON.parse(schema))
            if (!valid) {
              const errorsText = ajv.errorsText(
                ajv.errors, { 'separator': '; ' })
              throw new Error(`Invalid json: ${errorsText}`)
            }
          })
        })
      })
    })
  })
}

defineTests()
