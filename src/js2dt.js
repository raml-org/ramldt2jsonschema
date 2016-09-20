'use strict'

var yaml = require('js-yaml')
var fs = require('fs')

function loadJSONFile (jsonFileName) {
  var content = fs.readFileSync(jsonFileName).toString()
  return JSON.parse(content)
}

function inferRamlTypeName (jsonFileName) {
  var filename = jsonFileName.split('.')[0]
  return filename[0].toUpperCase() + filename.slice(1)
}

function js2dt (jsonFileName, ramlTypeName) {
  if (ramlTypeName === undefined) {
    ramlTypeName = inferRamlTypeName(jsonFileName)
  }
  var data = loadJSONFile(jsonFileName)

  // TODO: Data transformation happens here

  return yaml.safeDump(data)
}

module.exports.js2dt = js2dt
