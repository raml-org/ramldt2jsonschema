'use strict'

var yaml = require('js-yaml')
var fs = require('fs')
var constants = require('./constants')
var utils = require('./utils')

/**
 * Load JSON file into Object.
 *
 * @param  {string} fileName - File from which to load.
 * @returns  {Object} - JSON data from file.
 */
function loadJSONFile (fileName) {
  var content = fs.readFileSync(fileName).toString()
  return JSON.parse(content)
}

/**
 * Infer RAML type name from file name
 *
 * @param  {string} fileName - File in which type is located.
 * @returns  {string}
 */
function inferRamlTypeName (fileName) {
  var cleanName = fileName.replace(/^.*[\\\/]/, '')
  var filename = cleanName.split('.')[0]
  return utils.title(filename)
}

/**
 * This callback accepts results converting JSON schema to RAML data type.
 *
 * @callback conversionCallback
 * @param {Error} err
 * @param {string} raml
 */

/**
 * Convert JSON schema to RAML data type.
 *
 * @param  {string} fileName - File in which JSON schema is located.
 * @param  {string} typeName - Name of RAML data type to hold converted data.
 * @param  {conversionCallback} cb - Callback to be called with converted value.
 */
function js2dt (fileName, typeName, cb) {
  if (typeName === undefined) {
    typeName = inferRamlTypeName(fileName)
  }
  try {
    var data = loadJSONFile(fileName)
    var defs = data.definitions
    delete data.definitions
    var defsData = processDefinitions(defs)
    var mainTypeData = ramlForm(data, [])
    var ramledData = alterRootKeywords(defsData, mainTypeData, typeName)
  } catch (error) {
    cb(error, null)
    return
  }
  cb(null, yaml.safeDump(ramledData, {'noRefs': true}))
}

/**
 * Process definitions the same way main type is processed
 * (using ramlForm).
 *
 * @param  {Object} defs - JSON 'definitions' object.
 * @returns  {Object}
 */
function processDefinitions (defs) {
  var defsData = {}
  if (!defs) {
    return defsData
  }
  for (var key in defs) {
    defsData[utils.title(key)] = ramlForm(defs[key], [])
  }
  return defsData
}

/**
 * Alter/restructure root keywords.
 *
 * @param  {Object} defsData - Only definitions data.
 * @param  {Object} mainTypeData - Main type and schema data.
 * @param  {Object} typeName - RAML data type name to hold main data.
 * @returns  {Object}
 */
function alterRootKeywords (defsData, mainTypeData, typeName) {
  delete mainTypeData['$schema']
  defsData[typeName] = mainTypeData
  return {'types': defsData}
}

/**
 * Call `ramlForm` for each element of array.
 *
 * @param  {Array} arr
 * @param  {Array} reqStack - Stack of required properties.
 * @returns  {Array}
 */
function processArray (arr, reqStack) {
  var accum = []
  arr.forEach(function (el) {
    accum = accum.concat(ramlForm(el, reqStack))
  })
  return accum
}

/**
 * Change JSON type of data to valid RAML type.
 *
 * @param  {Object} data
 * @returns  {Object}
 */
function changeType (data) {
  if (data.type === 'null') {
    data['type'] = 'nil'
  } else if (data.type === 'string' && data.media) {
    data['type'] = 'file'
    delete data.media
  } else if (data.type === 'object' && data.anyOf) {
    data = handleUnion(data)
  }
  return data
}

/**
 * Change JSON date type of data to valid RAML date type.
 *
 * @param  {Object} data
 * @returns  {Object}
 */
function changeDateType (data) {
  if (!(data.type === 'string' && data.pattern)) {
    return data
  }
  var pattern = data.pattern
  delete data.pattern
  switch (pattern) {
    case constants.dateOnlyPattern:
      data['type'] = 'date-only'
      break
    case constants.timeOnlyPattern:
      data['type'] = 'time-only'
      break
    case constants.dateTimeOnlyPattern:
      data['type'] = 'datetime-only'
      break
    case constants.RFC3339DatetimePattern:
      data['type'] = 'datetime'
      data['format'] = constants.RFC3339
      break
    case constants.RFC2616DatetimePattern:
      data['type'] = 'datetime'
      data['format'] = constants.RFC2616
      break
    default:
      data['pattern'] = pattern
  }
  return data
}

/**
 * Call `ramlForm` for all nested objects.
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
      updateWith[key] = ramlForm(val, reqStack, key)
      continue
    }
  }
  return updateWith
}

/**
 * Convert JSON schema to a library with RAML data type.
 *
 * @param  {Object} data - Data to be converted.
 * @param  {Array} reqStack - Stack of required properties.
 * @param  {string} [prop] - Property name nested objects of which are processed.
 * @returns  {Object}
 */
function ramlForm (data, reqStack, prop) {
  if (!(data instanceof Object)) {
    return data
  }
  var isObj = data.type === 'object'
  if (isObj) {
    reqStack.push({
      'reqs': data.required || [],
      'props': Object.keys(data.properties || {})
    })
    delete data.required
  }

  var updateWith = processNested(data, reqStack)
  data = utils.updateObjWith(data, updateWith)

  if (isObj) {
    reqStack.pop()
  }
  var lastEl = reqStack[reqStack.length - 1]
  if (lastEl && prop) {
    if (lastEl.props.indexOf(prop) > -1) {
      data['required'] = lastEl.reqs.indexOf(prop) > -1
    }
  }

  if (data['$ref']) {
    data = replaceRef(data)
  } else if (data.type !== undefined) {
    data = changeType(data)
    data = changeDateType(data)
  }
  return data
}

/**
 * Replace $ref in data with defined type name.
 * Type presence in 'definitions' is not validated.
 *
 * @param  {Object} data - Data containing $ref.
 * @returns  {Object}
 */
function replaceRef (data) {
  data['type'] = utils.typeNameFromRef(data['$ref'])
  delete data['$ref']
  return data
}

function handleUnion (data) {
  // TODO: Implement
  return data
}

module.exports.js2dt = js2dt
