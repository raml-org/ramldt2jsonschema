'use strict'

const wap = require('webapi-parser').WebApiParser

/**
 * Converts RAML data type to JSON schema.
 *
 * @param  {string} ramlData - RAML file content.
 * @param  {string} typeName - Name of the type to be converted.
 * @return {object} JSON Schema containing converted type.
 */
async function dt2js (ramlData, typeName) {
  const model = await wap.raml10.parse(ramlData)
  const resolved = await wap.raml10.resolve(model)
  let jsonSchema = resolved.getDeclarationByName(typeName).toJsonSchema
  jsonSchema = JSON.stringify(
    JSON.parse(jsonSchema),
    (key, val) => key.startsWith('x-amf-') ? undefined : val,
    2
  )
  return JSON.parse(jsonSchema)
}

module.exports.dt2js = dt2js
