'use strict'

const yaml = require('js-yaml')
const fs = require('fs')
const js2dt = require('./js2dt')

/**
 * Just call js2dt.
 *
 * @param  {string} jsonFile
 * @param  {string} ramlTypeName
 */
function js2dtCLI (jsonFile, ramlTypeName) {
  const jsonData = fs.readFileSync(jsonFile).toString()

  if (ramlTypeName != null) {
    const raml = js2dt.js2dt(jsonData, ramlTypeName)
    return `#%RAML 1.0 Library\n${yaml.safeDump({ types: raml }, {'noRefs': true})}`
  } else {
    const typeName = 'this__should__be__the__only__type'
    const raml = js2dt.js2dt(jsonData, typeName)

    const keys = Object.keys(raml)
    if (keys.length !== 1 || !keys.includes(typeName)) {
      throw new Error(`There is more than one type (${JSON.stringify(keys)}), please specify a name for the raml library`)
    }

    return `#%RAML 1.0 DataType\n${yaml.safeDump(raml[typeName], {'noRefs': true})}`
  }
}

module.exports = js2dtCLI
