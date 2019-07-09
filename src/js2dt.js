'use strict'

const fs = require('fs')
const path = require('path')
const request = require('sync-request')
const constants = require('./constants')
const utils = require('./utils')

let basePath = process.cwd()

/**
 * Set basePath to something other than cwd
 *
 * @param  {string} path - The path to be used as root for includes
 *
 */
function setBasePath (path) {
  basePath = path
}

/**
 * Convert JSON schema to RAML data type.
 *
 * @param  {string} jsonData - JSON file content.
 * @param  {string} typeName - Name of RAML data type to hold converted data.
 */
function js2dt (jsonData, typeName) {
  const data = JSON.parse(jsonData)

  const raml = new RamlConverter(data, typeName).toRaml()

  return raml
}

const whitelist = {
  all: { 'description': 'description' },
  number: { 'minimum': 'minimum', 'maximum': 'maximum' },
  string: { 'pattern': 'pattern', 'format': 'pattern' }
}

class RamlConverter {
  constructor (data = {}, typeName = '') {
    this.data = data
    this.draft = data.$schema ? data.$schema.match(/\/draft-(\d\d)\//) : '06'
    this.typeName = typeName
    this.types = {}
  }

  /**
   * main function to convert to raml
   *
   * @return {Object}
   */
  toRaml () {
    if (typeof this.data !== 'object') {
      return { [this.typeName]: this.data }
    }

    Object.assign(this.types, this.parseDefinitions(this.data.definitions))

    this.types[this.typeName] = this.parseType(this.data)
    return this.types
  }

  /**
   * Parse types in the JSON schema
   *
   * @param {Object} type - a type in the schema
   * @param {?boolean} required - if the type is required
   * @param {string} prop - prop name
   * @returns {Object}
   */
  parseType (type, required = undefined, prop = undefined) {
    const outType = {}

    if (required || (type.required && !Array.isArray(type.required))) {
      outType.required = required || type.required
    }

    if (typeof type === 'string') {
      outType.type = type
    } else if (typeof type === 'object') {
      if (Object.keys(type).length === 0) {
        outType.type = 'any'
      } else if (type.type != null) {
        outType.type = type.type
      } else {
        if (type.properties) {
          outType.type = 'object'
        }
      }
    } else if (typeof type === 'boolean' && type === true) {
      outType.type = 'any'
    } else {
      throw new Error(`Invalid type / Cannot convert: { ${prop}: ${JSON.stringify(type)} }`)
    }

    if (type['$ref']) {
      return this.parseType(convertRef(type), required, prop)
    }

    const combsKey = getCombinationsKey(type)
    if (combsKey && outType.type) {
      outType[combsKey] = type[combsKey]
      setCombinationsTypes(outType, combsKey)
    }

    if (type.const) {
      outType.enum = [ type.const ]
    }

    if (type.enum) {
      outType.enum = type.enum
    }

    switch (outType.type) {
      case 'object': {
        outType.properties = this.parseProps(type.properties, type.required)
        convertAdditionalProperties(outType, type.additionalProperties)
        break
      }
      case 'array': {
        if (typeof outType.items === 'object') {
          outType.items = this.parseType(type.items, true, prop + 'Items')
        } else if (Array.isArray(type.items)) {
          outType.items = type.items.map(i => this.parseType(i, true, prop + 'Item' + i))
        }
        break
      }
      case 'string': {
        if (isFileType(type)) {
          outType.media = type.media
          convertFileType(outType)
        }
        break
      }
      case 'number': {
        if (typeof type.minimum === 'number') outType.minimum = type.minimum
        if (typeof type.maximum === 'number') outType.maximum = type.maximum
        if (this.draft !== '04') {
          if (typeof type.exclusiveMinimum === 'number') outType.minimum = type.exclusiveMinimum
          if (typeof type.exclusiveMaximum === 'number') outType.maximum = type.exclusiveMaximum
        }
        break
      }
      default: {
        // nothing for now
        break
      }
    }

    if (type.title) {
      outType.displayName = type.title
    }

    const transfer = Object.assign({}, whitelist.all, whitelist[outType.type])

    Object.keys(type).forEach(key => {
      if (transfer[key]) {
        outType[transfer[key]] = type[key]
      }
    })

    convertType(outType)
    convertDateType(outType)
    // convert defined formats to regex patterns
    convertDefinedFormat(outType)
    convertPatternProperties(outType)

    if (combsKey) {
      outType[combsKey] = type[combsKey]
      this.processCombinations(outType, combsKey, prop)
    }

    return outType
  }

  /**
   *
   * @param {Object} props - properties
   * @param {Array} reqs - required props
   * @param {boolean} dropRequire - drop the require prop ( for definitions )
   *
   * @return {Object}
   */
  parseProps (props = {}, reqs = [], dropRequire = false) {
    return Object.keys(props).reduce((acc, pn) => {
      const isRequired = Array.isArray(reqs) ? reqs.includes(pn) : !!props[pn].required
      const type = this.parseType(props[pn], isRequired, pn)

      if (!dropRequire && !type.required) {
        pn += '?'
      }
      delete type.required

      return Object.assign(acc, { [pn]: Object.keys(type).length === 1 ? type.type : type })
    }, {})
  }

  /**
   * Parse definitions ( and capitalize the names )
   *
   * @param {Object} definitions
   *
   * @return {Object}
   */
  parseDefinitions (definitions) {
    const defs = this.parseProps(definitions, [], true)
    return Object.keys(defs)
      .reduce((acc, key) => Object.assign(acc, { [utils.capitalize(key)]: defs[key] }), {})
  }

  /**
   * Process combinations by creating new types
   *
   * @param data - the type the combinations are on
   * @param combsKey - the type of the combination
   * @param prop - properties
   *
   * @return {Object}
   */
  processCombinations (data, combsKey, prop) {
    prop = prop ? utils.capitalize(prop) : this.typeName
    const combSchemas = data[combsKey]
    const superTypes = []
    combSchemas.forEach((el, ind) => {
      const name = prop + 'ParentType' + ind.toString()
      superTypes.push(name)
      this.types[name] = this.parseType(el)
    })
    delete data[combsKey]
    data.type = getCombinationTypes(superTypes, combsKey)
    return data
  }
}

/**
 * convert additionalProperties from jsonSchema to raml form
 *
 * @param  {Object} data - current data
 * @param  {*} additionalProperties - potential additional properties
 * @returns  {Object} raml form
 */
function convertAdditionalProperties (data, additionalProperties) {
  if (additionalProperties !== undefined) {
    let val = data
    if (typeof additionalProperties === 'boolean') val = additionalProperties
    if (typeof additionalProperties === 'object' && Object.keys(additionalProperties).length === 0) val = true
    if (typeof additionalProperties === 'object' && Object.keys(additionalProperties).length > 0) {
      const type = additionalProperties.type
      data.properties['//'] = { type: type }
      val = false
    }
    data.additionalProperties = val
  }
  return data
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
  const anyOf = data.media.anyOf
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
  const pattern = data.pattern
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
 * Change JSON defined formats to RAML regex.
 *
 * @param  {Object} data
 * @returns  {Object}
 */
function convertDefinedFormat (data) {
  if (!(data.type === 'string' && data.format)) {
    return data
  }
  const format = data.format
  delete data.format
  switch (format) {
    case 'date-time':
      data['pattern'] = constants.FORMAT_REGEXPS['date-time']
      break
    case 'email':
      data['pattern'] = constants.FORMAT_REGEXPS['email']
      break
    case 'hostname':
      data['pattern'] = constants.FORMAT_REGEXPS['hostname']
      break
    case 'ipv4':
      data['pattern'] = constants.FORMAT_REGEXPS['ipv4']
      break
    case 'ipv6':
      data['pattern'] = constants.FORMAT_REGEXPS['ipv6']
      break
    case 'uri':
      data['pattern'] = constants.FORMAT_REGEXPS['uri']
      break
    case 'uri-reference':
      data['pattern'] = constants.FORMAT_REGEXPS['uri-reference']
      break
    case 'json-pointer':
      data['pattern'] = constants.FORMAT_REGEXPS['json-pointer']
      break
    case 'uri-template':
      data['pattern'] = constants.FORMAT_REGEXPS['uri-template']
      break
    default:
      data['pattern'] = format
  }
  return data
}

/**
 * Change JSON patternProperties to RAML pattern properties.
 *
 * @param  {Object} data
 * @returns  {Object}
 */
function convertPatternProperties (data) {
  if (!data.patternProperties) {
    return data
  }
  data.properties = data.properties || {}
  const patternProperties = data.patternProperties
  delete data.patternProperties
  Object.keys(patternProperties).map(function (pattern) {
    data.properties['/' + pattern + '/'] = patternProperties[pattern]
  })
  if (data.additionalProperties) delete data.additionalProperties
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
  let loc = data['$ref']
  let split = loc.split('#')
  delete data['$ref']

  if (loc[0] === '#') {
    data['type'] = utils.typeNameFromRef(loc)
    return data
  } else if (loc.slice(0, 4) === 'http') {
    return JSON.parse(request('GET', split[0]).getBody('utf8'))
  } else {
    return JSON.parse(fs.readFileSync(path.join(basePath, split[0])))
  }
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
module.exports.setBasePath = setBasePath
