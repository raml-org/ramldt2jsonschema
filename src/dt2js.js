'use strict'

const wap = require('webapi-parser').WebApiParser
const utils = require('./utils')

/**
 * Converts RAML data type to JSON schema.
 *
 * @param  {string} ramlData - RAML file content.
 * @param  {string} typeName - Name of the type to be converted.
 * @param  {string} [basePath] - Resolve references relative to this path.
 * @return {object} JSON Schema containing converted type.
 */
async function dt2js (ramlData, typeName, basePath) {
  const patchedData = patchRamlData(ramlData, typeName)
  let model
  if (basePath) {
    const location = utils.genBasePathLocation(basePath, 'raml')
    model = await wap.raml10.parse(patchedData, location)
  } else {
    model = await wap.raml10.parse(patchedData)
  }
  const resolved = await wap.raml10.resolve(model)
  let jsonSchema = resolved.getDeclarationByName(typeName).toJsonSchema
  jsonSchema = JSON.stringify(
    JSON.parse(jsonSchema),
    (key, val) => removeXAmfProperties(fixFileTypeProperties(val)),
    2
  )
  return JSON.parse(jsonSchema)
}

/**
 * Patches RAML string to be a regular RAML API doc with an endpoint.
 * Is necessary to make it work with resolution.
 *
 * @param  {string} ramlData - RAML file content.
 * @param  {string} typeName - Name of the type to be converted.
 * @return {string} Patched RAML content.
 */
function patchRamlData (ramlData, typeName) {
  let dataPieces = ramlData.split('\n')
  dataPieces = dataPieces.filter(p => !!p)
  dataPieces[0] = '#%RAML 1.0'
  dataPieces.push(`
/for/conversion/${typeName}:
  get:
    responses:
      200:
        body:
          application/json:
            type: ${typeName}`)
  return dataPieces.join('\n')
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
      binaryEncoding: 'binary'
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
function removeXAmfProperties (obj) {
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
