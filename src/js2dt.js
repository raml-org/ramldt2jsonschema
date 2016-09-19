'use strict'

var yaml = require('yaml-js')
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
  console.log(ramlTypeName)
  var data = loadJSONFile(jsonFileName)
}

module.exports.js2dt = js2dt
