'use strict'

const wap = require('webapi-parser').WebApiParser
const utils = require('./utils')

/**
 * Converts RAML data type to JSON schema.
 *
 * @param  {string} ramlData - RAML file content.
 * @param  {string} typeName - Name of the type to be converted.
 * @param  {object} options - Options to use in conversion:
 *     basePath: Resolve references relative to this path.
 *     draft: Output JSON Schema draft version.
 *     validate: Validate output JSON Schema with Ajv.
 * @return {object} JSON Schema containing converted type.
 */
async function dt2js (ramlData, typeName, options = {}) {
  const patchedData = patchRamlData(ramlData, typeName)
  let model
  if (options.basePath) {
    const location = utils.basePathToURL(options.basePath, 'raml')
    model = await wap.raml10.parse(patchedData, location)
  } else {
    model = await wap.raml10.parse(patchedData)
  }
  const resolved = await wap.raml10.resolve(model)
  let jsonSchema
  try {
    jsonSchema = resolved.getDeclarationByName(typeName)
      .buildJsonSchema()
  } catch (err) {
    throw new Error(
      `Failed to convert to JSON Schema: ${err.toString()}`)
  }
  jsonSchema = JSON.stringify(
    JSON.parse(jsonSchema),
    (key, val) => fixStructureInconsistencies(
      removeXAmfProperties(
        fixFileTypeProperties(val))),
    2
  )
  const finalSchema = migrateDraft(JSON.parse(jsonSchema), options.draft)
  if (options.validate) {
    validateJsonSchema(finalSchema)
  }
  return finalSchema
}

/**
 * Migrates JSON Schema draft.
 *
 * @param  {object} schema - JSON Schema containing converted type.
 * @param  {string} draft - Output JSON Schema draft version.
 * @return  {object} JSON Schema with migrated draft version.
 */
function migrateDraft (schema, draft = utils.DEFAULT_DRAFT) {
  utils.validateDraft(draft)
  if (draft === '04') {
    return schema
  }

  const migrate = require('json-schema-migrate')
  const mSchema = migrate.draft6(schema)
  if (draft === '07') {
    mSchema.$schema = 'http://json-schema.org/draft-07/schema#'
  }
  return mSchema
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
 * Fixes JSON Schema structure inconsistencies.
 * In particular:
 *  - Changes 'examples' value to array (new in draft06);
 *
 * @param  {object} obj - Object to be fixed.
 * @return {object} Fixed object.
 */
function fixStructureInconsistencies (obj) {
  if (!obj || obj.constructor !== Object) {
    return obj
  }

  if (obj.examples) {
    obj.examples = Object.values(obj.examples)
  }
  return obj
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
    delete obj['x-amf-fileTypes']
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

/**
 * Validates JSON Schema.
 *
 * @param  {object} obj - JSON Schema object.
 * @throws {Error} Invalid JSON Schema.
 * @throws {Error} Validation requires "ajv" to be installed.
 */
function validateJsonSchema (obj) {
  let Ajv
  try {
    Ajv = require('ajv')
  } catch (err) {
    throw new Error(
      `Validation requires "ajv" to be installed. ${err.message}`)
  }
  const ajv = new Ajv({ allErrors: true, schemaId: 'auto' })

  if (obj.$schema.indexOf('draft-04') > -1) {
    ajv.addMetaSchema(require('ajv/lib/refs/json-schema-draft-04.json'))
  } else if (obj.$schema.indexOf('draft-06') > -1) {
    ajv.addMetaSchema(require('ajv/lib/refs/json-schema-draft-06.json'))
  }

  const valid = ajv.validateSchema(obj)
  if (!valid) {
    const errorsText = ajv.errorsText(ajv.errors, { separator: '; ' })
    throw new Error(`Invalid JSON Schema: ${errorsText}`)
  }
}

module.exports.dt2js = dt2js
