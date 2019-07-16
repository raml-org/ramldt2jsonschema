'use strict'

const wap = require('webapi-parser').WebApiParser
const yaml = require('js-yaml')

/**
 * Convert JSON schema to RAML Library.
 *
 * @param  {string} jsonData - JSON file content.
 * @param  {string} typeName - Name of RAML data type to hold converted data.
 * @return {object} RAML 1.0 Library containing converted type.
 */
async function js2dt (jsonData, typeName) {
  const parsedSchema = {
    openapi: '2.0',
    definitions: {}
  }
  parsedSchema.definitions[typeName] = JSON.parse(jsonData)
  const model = await wap.oas20.parse(JSON.stringify(parsedSchema))
  const raml = model.getDeclarationByName(typeName).toRamlDatatype
  return yaml.safeLoad(raml)
}

module.exports.js2dt = js2dt
