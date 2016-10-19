'use strict'

var yaml = require('js-yaml')
var dtexp = require('datatype-expansion')
var constants = require('./constants')
var utils = require('./utils')

/**
 * Get RAML Data Types context.
 *
 * @param  {string} ramlData - RAML file content.
 * @returns  {Object} - RAML data types context.
 */
function getRAMLContext (ramlData) {
  var yamlContent = yaml.safeLoad(ramlData)
  return yamlContent.types
}

/**
 * This callback accepts results converting RAML data type to JSON schema.
 *
 * @callback conversionCallback
 * @param {Error} err
 * @param {Object} schema
 */

/**
 * Convert RAML data type to JSON schema.
 *
 * @param  {string} ramlData - RAML file content.
 * @param  {string} typeName - Name of the type to be converted.
 * @param  {conversionCallback} cb - Callback to be called with converted value.
 */
function dt2js (ramlData, typeName, cb) {
  try {
    var ctx = getRAMLContext(ramlData)
  } catch (error) {
    cb(error, null)
    return
  }
  if (!(ctx instanceof Object)) {
    cb(new Error('Invalid RAML data'), null)
    return
  }
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
      try {
        var schema = schemaForm(canonical, [])
        schema = addRootKeywords(schema)
      } catch (error) {
        cb(error, null)
      }
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
    accum.push(schemaForm(el, reqStack))
  })
  return accum
}

/**
 * Change RAML type of data to valid JSON schema type.
 *
 * @param  {Object} data
 * @returns  {Object}
 */
function convertType (data) {
  switch (data.type) {
    case 'union':
      data['type'] = 'object'
      break
    case 'nil':
      data['type'] = 'null'
      break
    case 'file':
      data = convertFileType(data)
      break
  }
  return data
}

/**
 * Change RAML `file` type to proper JSON type.
 *
 * @param  {Object} data
 * @returns  {Object}
 */
function convertFileType (data) {
  data['type'] = 'string'
  data['media'] = {'binaryEncoding': 'binary'}
  if (data.fileTypes) {
    data['media']['anyOf'] = []
    data.fileTypes.forEach(function (el) {
      data['media']['anyOf'].push({'mediaType': el})
    })
    delete data.fileTypes
  }
  return data
}

/**
 * Change RAML date type of data to valid JSON schema type.
 *
 * @param  {Object} data
 * @returns  {Object}
 */
function convertDateType (data) {
  switch (data.type) {
    case 'date-only':
      data['type'] = 'string'
      data['pattern'] = constants.dateOnlyPattern
      break
    case 'time-only':
      data['type'] = 'string'
      data['pattern'] = constants.timeOnlyPattern
      break
    case 'datetime-only':
      data['type'] = 'string'
      data['pattern'] = constants.dateTimeOnlyPattern
      break
    case 'datetime':
      data['type'] = 'string'
      if (data.format === undefined || data.format.toLowerCase() === constants.RFC3339) {
        data['pattern'] = constants.RFC3339DatetimePattern
      } else if (data.format.toLowerCase() === constants.RFC2616) {
        data['pattern'] = constants.RFC2616DatetimePattern
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
      updateWith[key] = processArray(val, reqStack)
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
  var lastEl = reqStack[reqStack.length - 1]
  if (data.required && lastEl && prop) {
    if (lastEl.props.indexOf(prop) > -1) {
      lastEl.reqs.push(prop)
    }
  }
  delete data.required
  var isObj = data.type === 'object'
  if (isObj) {
    reqStack.push({
      'reqs': [],
      'props': Object.keys(data.properties || {})
    })
  }

  var updateWith = processNested(data, reqStack)
  data = utils.updateObjWith(data, updateWith)
  if (isObj) {
    data.required = reqStack.pop().reqs
  }

  if (data.type) {
    data = convertType(data)
    data = convertDateType(data)
  }
  return data
}

module.exports.dt2js = dt2js
