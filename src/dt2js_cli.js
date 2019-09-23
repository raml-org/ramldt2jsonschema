'use strict'

const fs = require('fs')
const dt2js = require('./dt2js')

/**
 * Delegates converting RAML data type -> JSON Schema to dt2js.
 *
 * @param  {string} ramlFilePath - RAML file path.
 * @param  {string} typeName - Name of the type to be converted.
 * @param  {object} options - Options to use in conversion.
 * @return {string} JSON Schema containing converted type.
 */
async function dt2jsCLI (ramlFilePath, typeName, options = {}) {
  options.basePath = ramlFilePath
  const ramlData = fs.readFileSync(ramlFilePath).toString()
  let result
  try {
    result = await dt2js.dt2js(ramlData, typeName, options)
  } catch (err) {
    return err.toString()
  }
  return JSON.stringify(result, null, 2)
}

module.exports = dt2jsCLI
