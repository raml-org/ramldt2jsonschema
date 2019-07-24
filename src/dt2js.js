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
    (key, val) => replaceAmfProperties(fixFileTypeProperties(val)),
    2
  )
  return JSON.parse(jsonSchema)
}

/**
 * Fixes "type: file" objects converted from RAML.
 * See https://github.com/aml-org/amf/issues/539
 *
 * @param  {object} obj - Object to be fixed.
 * @return {object} Fixed object.
 */
function fixFileTypeProperties (obj) {
  if (!obj || obj.constructor !== Object) {
    return obj
  }

  if (obj.type === 'file') {
    obj.type = 'string'
    obj.media = {
      contentEncoding: 'binary'
    }
    const fileTypes = obj['x-amf-fileTypes'] || []
    if (fileTypes.length > 0) {
      obj.media.anyOf = fileTypes.map(el => {
        return { mediaType: el }
      })
    }
  }
  return obj
}

/**
 * Removes "x-amf-" prefixes from object properties.
 *
 * @param  {object} obj - Object to be fixed.
 * @return {object} Fixed object.
 */
function replaceAmfProperties (obj) {
  if (!obj || obj.constructor !== Object) {
    return obj
  }

  const newObj = {}
  Object.entries(obj).map(([k, v]) => {
    k = k.startsWith('x-amf-facet-') ? k.replace('x-amf-facet-', '') : k
    k = k.startsWith('x-amf-') ? k.replace('x-amf-', '') : k
    newObj[k] = v
  })
  return newObj
}

module.exports.dt2js = dt2js
