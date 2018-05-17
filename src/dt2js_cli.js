'use strict'

const fs = require('fs')
const path = require('path')
const dt2js = require('./dt2js')

/**
 * Just call dt2js.
 *
 * @param  {string} ramlFile
 * @param  {string} ramlTypeName
 */
function dt2jsCLI (ramlFile, ramlTypeName) {
  const rootFileDir = ramlFile.split(path.sep).slice(0, -1).join(path.sep)
  const ramlData = fs.readFileSync(ramlFile).toString()
  dt2js.setBasePath(rootFileDir)
  return dt2js.dt2js(ramlData, ramlTypeName)
}

module.exports = dt2jsCLI
