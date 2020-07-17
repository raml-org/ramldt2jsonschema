'use strict'

const wap = require('webapi-parser').WebApiParser
const yaml = require('js-yaml')
const utils = require('./utils')

/**
 * Convert JSON schema to RAML Library.
 *
 * @param  {string} jsonData - JSON file content.
 * @param  {string} typeName - Name of RAML data type to hold converted data.
 * @param  {object} options - Options to use in conversion:
 *     basePath: Resolve references relative to this path.
 *     validate: Validate output RAML with webapi-parser.
 * @return {object} RAML 1.0 Library containing converted type.
 */
async function js2dt (jsonData, typeName, options = {}) {
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
            $ref: `#/definitions/${typeName}`
          }
        }
      }
    }
  }
  schema.definitions[typeName] = JSON.parse(jsonData)
  const schemaString = JSON.stringify(schema)

  let model
  if (options.basePath) {
    const location = utils.basePathToURL(options.basePath, 'json')
    model = await wap.oas20.parse(schemaString, location)
  } else {
    model = await wap.oas20.parse(schemaString)
  }

  const resolved = await wap.oas20.resolve(model)
  const raml = getDeclarationByName(resolved, typeName)
  if (options.validate) {
    await validateRaml(raml)
  }
  return yaml.safeLoad(raml)
}

/* Wrapper function to ease testing */
function getDeclarationByName (model, typeName) {
  try {
    return model.getDeclarationByName(typeName).toRamlDatatype
  } catch (err) {
    throw new Error(
      `Failed to convert to RAML Library: ${err.toString()}`)
  }
}

/**
 * Validates RAML.
 *
 * @param  {string} ramlStr - RAML 1.0 Library string.
 * @throws {Error} Invalid RAML Data Type.
 */
async function validateRaml (ramlStr) {
  const model = await wap.raml10.parse(ramlStr)
  const report = await wap.raml10.validate(model)
  if (!report.conforms) {
    throw new Error(`Invalid RAML: ${report.results[0].message}`)
  }
}

module.exports.js2dt = js2dt
