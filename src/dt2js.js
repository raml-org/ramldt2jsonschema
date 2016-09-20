'use strict'

var yaml = require('js-yaml')
var fs = require('fs')
var dtexp = require('datatype-expansion')

/**
 * Get RAML Data Types context.
 *
 * @param  {string} fileName - File from which to get context.
 * @returns  {Object} - RAML data types context.
 */
function getRAMLContext (fileName) {
  var content = fs.readFileSync(fileName).toString()
  var yaml_content = yaml.safeLoad(content)
  return yaml_content.types
}

/**
 * This callback accepts results converting RAML type to JSON schema.
 *
 * @callback conversionCallback
 * @param {Error} err
 * @param {Object} schema
 */

/**
 * Convert RAML type to JSON schema.
 *
 * @param  {string} fileName - File in which type is located.
 * @param  {string} typeName - Name of the type to be converted.
 * @param  {conversionCallback} cb - Callback to be called with converted value.
 */
function dt2js (fileName, typeName, cb) {
  var ctx = getRAMLContext(fileName)
  dtexp.expandedForm(ctx[typeName], ctx, function (err, expanded) {
    if (err) {
      cb(err, null)
      return
    }
    dtexp.canonicalForm(expanded, function (err, canonical) {
      if (err) {
        cb(err, null)
        return
      }
      var schema = schemaForm(canonical, [])
      schema = addRootKeywords(schema)
      cb(err, schema)
    })
  })
}

/**
 * Add missing JSON schema root keywords.
 *
 * @param  {Object} schema
 * @returns  {Object}
 */
function addRootKeywords (schema) {
  schema['$schema'] = 'http://json-schema.org/draft-04/schema#'
  return schema
}

/**
 * Call `schemaForm` for each element of array.
 *
 * @param  {Array} arr
 * @param  {Array} reqStack - Stack of required properties.
 * @returns  {Array}
 */
function processArray (arr, reqStack) {
  var accum = []
  arr.forEach(function (el) {
    accum = accum.concat(schemaForm(el, reqStack))
  })
  return accum
}

/**
 * Merge second object into first one.
 *
 * @param  {Object} obj
 * @param  {Object} upd
 * @returns  {Object}
 */
function updateObjWith (obj, upd) {
  for (var key in upd) {
    obj[key] = upd[key]
  }
  return obj
}

/**
 * Change RAML type of object to valid JSON schema type.
 *
 * @param  {Object} data
 * @returns  {Object}
 */
function changeType (data) {
  switch (data.type) {
    case 'union':
      data['type'] = 'object'
      break
    case 'nil':
      data['type'] = 'null'
      break
    case 'file':
      data['type'] = 'string'
      data['media'] = {'binaryEncoding': 'binary'}
      break
  }
  return data
}

/**
 * Change RAML date type of object to valid JSON schema type.
 *
 * @param  {Object} data
 * @returns  {Object}
 */
function changeDateType (data) {
  switch (data.type) {
    case 'date-only':
      data['type'] = 'string'
      data['pattern'] = '^(\d{4})-(\d{2})-(\d{2})$'
      break
    case 'time-only':
      data['type'] = 'string'
      data['pattern'] = '^(\d{2})(:)(\d{2})(:)(\d{2})(\.\d+)?$'
      break
    case 'datetime-only':
      data['type'] = 'string'
      data['pattern'] = '^(\d{4})-(\d{2})-(\d{2})T(\d{2})(:)(\d{2})(:)(\d{2})(\.\d+)?$'
      break
    case 'datetime':
      data['type'] = 'string'
      if (data.format === undefined || data.format.toLowerCase() === 'rfc3339') {
        data['pattern'] = '^(\d{4})-(\d{2})-(\d{2})T(\d{2})(:)(\d{2})(:)(\d{2})(\.\d+)?(Z|([+-])(\d{2})(:)?(\d{2}))$'
      } else if (data.format.toLowerCase() === 'rfc2616') {
        data['pattern'] = '(?:(?:Mon|Tue|Wed|Thu|Fri|Sat|Sun), ' +
                          '(?:[0-2][0-9]|3[01]) ' +
                          '(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) ' +
                          '\d{4} (?:[01][0-9]|2[0-3]):[012345][0-9]:[012345][0-9] ' +
                          'GMT|(?:Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday), ' +
                          '(?:[0-2][0-9]|3[01])-(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)' +
                          '-\d{2} (?:[01][0-9]|2[0-3]):[012345][0-9]:[012345][0-9] ' +
                          'GMT|(?:Mon|Tue|Wed|Thu|Fri|Sat|Sun) ' +
                          '(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) ' +
                          '(?:[ 1-2][0-9]|3[01]) (?:[01][0-9]|2[0-3]):[012345][0-9]:[012345][0-9] \d{4})'
      }
      delete data.format
      break
  }
  return data
}

/**
 * Call `schemaForm` for all nested objects.
 *
 * @param  {Object} data
 * @param  {Array} reqStack - Stack of required properties.
 * @returns  {Object}
 */
function processNested (data, reqStack) {
  var updateWith = {}
  for (var key in data) {
    var val = data[key]

    if (val instanceof Array) {
      var accum = processArray(val, reqStack)
      updateWith[key] = accum
      continue
    }

    if (val instanceof Object) {
      updateWith[key] = schemaForm(val, reqStack, key)
      continue
    }
  }
  return updateWith
}

/**
 * Convert canonical form of RAML type to valid JSON schema.
 *
 * @param  {Object} data - Data to be converted.
 * @param  {Array} reqStack - Stack of required properties.
 * @param  {string} [prop] - Property name nested objects of which are processed.
 * @returns  {Object}
 */
function schemaForm (data, reqStack, prop) {
  if (!(data instanceof Object)) {
    return data
  }
  var lastInd = reqStack.length - 1
  if (data.required && reqStack[lastInd] && prop) {
    reqStack[lastInd] = reqStack[lastInd].concat(prop)
  }
  delete data.required
  if (data.properties) {
    reqStack[reqStack.length] = []
  }

  var updateWith = processNested(data, reqStack)
  data = updateObjWith(data, updateWith)
  if (data.properties) {
    data.required = reqStack.pop()
  }

  if (data.type !== undefined) {
    data = changeType(data)
    data = changeDateType(data)
  }
  return data
}

module.exports.dt2js = dt2js
module.exports.getRAMLContext = getRAMLContext
module.exports.addRootKeywords = addRootKeywords
module.exports.processArray = processArray
module.exports.updateObjWith = updateObjWith
module.exports.changeType = changeType
module.exports.changeDateType = changeDateType
module.exports.processNested = processNested
module.exports.schemaForm = schemaForm
