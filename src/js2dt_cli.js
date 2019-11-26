'use strict'

const fs = require('fs')
const yaml = require('js-yaml')
const js2dt = require('./js2dt')

/**
 * Delegates converting JSON Schema -> RAML Library to js2dt.
 *
 * @param  {string} jsonFilePath - JSON file path.
 * @param  {string} typeName - Name of RAML data type to hold converted data.
 * @param  {object} options - Options to use in conversion.
 * @return {string} RAML 1.0 Library containing converted type.
 */
async function js2dtCLI (jsonFilePath, typeName, options = {}) {
  options.basePath = jsonFilePath
  const jsonData = fs.readFileSync(jsonFilePath).toString()
  let result
  try {
    result = await js2dt.js2dt(jsonData, typeName, options)
  } catch (err) {
    return err.toString()
  }
  return `#%RAML 1.0 Library\n${yaml.safeDump(result, { noRefs: true })}`
}

module.exports = js2dtCLI
