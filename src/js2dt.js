'use strict'

const wap = require('webapi-parser').WebApiParser
const yaml = require('js-yaml')
const utils = require('./utils')

/**
 * Convert JSON schema to RAML Library.
 *
 * @param  {string} jsonData - JSON file content.
 * @param  {string} typeName - Name of RAML data type to hold converted data.
 * @param  {string} [basePath] - Resolve references relative to this path.
 * @return {object} RAML 1.0 Library containing converted type.
 */
async function js2dt (jsonData, typeName, basePath) {
  const schema = {
    swagger: '2.0',
    definitions: {},
    paths: {}
  }
  schema.paths[`/for/conversion/${typeName}`] = {
    get: {
      responses: {
        200: {
          schema: {
            '$ref': `#/definitions/${typeName}`
          }
        }
      }
    }
  }
  schema.definitions[typeName] = JSON.parse(jsonData)
  const schemaString = JSON.stringify(schema)

  let model
  if (basePath) {
    const location = utils.genBasePathLocation(basePath, 'json')
    model = await wap.oas20.parse(schemaString, location)
  } else {
    model = await wap.oas20.parse(schemaString)
  }

  const resolved = await wap.oas20.resolve(model)
  const raml = resolved.getDeclarationByName(typeName).toRamlDatatype
  return yaml.safeLoad(raml)
}

module.exports.js2dt = js2dt
