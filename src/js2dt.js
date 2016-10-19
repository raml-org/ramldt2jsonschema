'use strict'

var yaml = require('js-yaml')
var constants = require('./constants')
var utils = require('./utils')

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
 * @param  {string} jsonData - JSON file content.
 * @param  {string} typeName - Name of RAML data type to hold converted data.
 * @param  {conversionCallback} cb - Callback to be called with converted value.
 */
function js2dt (jsonData, typeName, cb) {
  try {
    var emitter = new RAMLEmitter(JSON.parse(jsonData), typeName)
    var ramledData = emitter.emit()
  } catch (error) {
    cb(error, null)
    return
  }
  cb(null, yaml.safeDump(ramledData, {'noRefs': true}))
}

/**
 * Holds functions to convert JSON schema to RAML data type.
 *
 * @param  {Object} data
 * @param  {string} typeName - Name of RAML data type to hold converted data.
 */
function RAMLEmitter (data, typeName) {
  this.data = data
  this.mainTypeName = typeName
  this.types = {}

  /**
   * Process definitions, delete them from data and add processed
   * values to `this.types`.
   */
  this.processDefinitions = function () {
    var defsData = this.translateDefinitions(this.data.definitions)
    delete this.data.definitions
    this.types = utils.updateObjWith(this.types, defsData)
  }

  /**
   * Process main data and save result in `this.types`.
   */
  this.processMainData = function () {
    delete this.data['$schema']
    this.types[this.mainTypeName] = this.ramlForm(this.data, [])
  }

  /**
   * Run conversion process and emit results.
   */
  this.emit = function () {
    this.processDefinitions()
    this.processMainData()
    return {'types': this.types}
  }

  /**
   * Convert JSON schema to a library with RAML data type.
   *
   * @param  {Object} data - Data to be converted.
   * @param  {Array} reqStack - Stack of required properties.
   * @param  {string} [prop] - Property name nested objects of which are processed.
   * @returns  {Object}
   */
  this.ramlForm = function (data, reqStack, prop) {
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

    var combsKey = getCombinationsKey(data)
    if (combsKey && data.type) {
      data = setCombinationsTypes(data, combsKey)
    }

    if (isFileType(data)) {
      data = convertFileType(data)
    }

    var updateWith = this.processNested(data, reqStack)
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
      data = convertRef(data)
    } else if (data.type) {
      data = convertType(data)
      data = convertDateType(data)
    }
    if (combsKey) {
      data = this.processCombinations(data, combsKey, prop)
    }
    return data
  }

  /**
   * Process definitions the same way main type is processed
   * (using ramlForm).
   *
   * @param  {Object} defs - JSON 'definitions' object.
   * @returns  {Object}
   */
  this.translateDefinitions = function (defs) {
    var defsData = {}
    if (!defs) {
      return defsData
    }
    for (var key in defs) {
      defsData[utils.capitalize(key)] = this.ramlForm(defs[key], [])
    }
    return defsData
  }

  /**
   * Call `ramlForm` for each element of array.
   *
   * @param  {Array} arr
   * @param  {Array} reqStack - Stack of required properties.
   * @returns  {Array}
   */
  this.processArray = function (arr, reqStack) {
    var accum = []
    arr.forEach(function (el) {
      accum.push(this.ramlForm(el, reqStack))
    }.bind(this))
    return accum
  }

  /**
   * Call `ramlForm` for all nested objects.
   *
   * @param  {Object} data
   * @param  {Array} reqStack - Stack of required properties.
   * @returns  {Object}
   */
  this.processNested = function (data, reqStack) {
    var updateWith = {}
    for (var key in data) {
      var val = data[key]

      if (val instanceof Array) {
        updateWith[key] = this.processArray(val, reqStack)
        continue
      }

      if (val instanceof Object) {
        updateWith[key] = this.ramlForm(val, reqStack, key)
        continue
      }
    }
    return updateWith
  }

  this.processCombinations = function (data, combsKey, prop) {
    prop = prop ? utils.capitalize(prop) : this.mainTypeName
    var combSchemas = data[combsKey]
    var superTypes = []
    combSchemas.forEach(function (el, ind) {
      var name = prop + 'ParentType' + ind.toString()
      superTypes.push(name)
      this.types[name] = el
    }.bind(this))
    delete data[combsKey]
    data.type = getCombinationTypes(superTypes, combsKey)
    return data
  }
}

/**
 * Change JSON types of data to valid RAML type.
 * Performs simple conversions of types.
 *
 * @param  {Object} data
 * @returns  {Object}
 */
function convertType (data) {
  if (data.type === 'null') {
    data['type'] = 'nil'
  }
  return data
}

/**
 * Determine whether data is of RAML type `file`.
 *
 * @param  {Object} data
 * @returns  {boolean}
 */
function isFileType (data) {
  return (!!(data.type === 'string' &&
          data.media &&
          data.media.binaryEncoding === 'binary'))
}

/**
 * Change JSON type to RAML file type.
 *
 * @param  {Object} data
 * @returns  {Object}
 */
function convertFileType (data) {
  data['type'] = 'file'
  var anyOf = data.media.anyOf
  if (anyOf && anyOf.length > 0) {
    data['fileTypes'] = []
    anyOf.forEach(function (el) {
      if (el.mediaType) {
        data.fileTypes.push(el.mediaType)
      }
    })
    if (data.fileTypes.length < 1) {
      delete data.fileTypes
    }
  }
  delete data.media
  return data
}

/**
 * Change JSON date type of data to valid RAML date type.
 *
 * @param  {Object} data
 * @returns  {Object}
 */
function convertDateType (data) {
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
 * Replace $ref in data with defined type name.
 * Type presence in 'definitions' is not validated.
 *
 * @param  {Object} data - Data containing $ref.
 * @returns  {Object}
 */
function convertRef (data) {
  data['type'] = utils.typeNameFromRef(data['$ref'])
  delete data['$ref']
  return data
}

function getCombinationsKey (data) {
  if (data.anyOf) {
    return 'anyOf'
  } else if (data.allOf) {
    return 'allOf'
  } else if (data.oneOf) {
    return 'oneOf'
  }
}

function setCombinationsTypes (data, combsKey) {
  data[combsKey].forEach(function (el) {
    if (!el.type) {
      el.type = data.type
    }
  })
  return data
}

function getCombinationTypes (types, combsKey) {
  if (combsKey === 'allOf') {
    return types
  } else if (combsKey === 'oneOf' || combsKey === 'anyOf') {
    return types.join(' | ')
  }
}

module.exports.js2dt = js2dt
