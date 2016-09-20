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

function js2dt (jsonFileName, ramlTypeName, cb) {
  if (ramlTypeName === undefined) {
    ramlTypeName = inferRamlTypeName(jsonFileName)
  }
  var data = loadJSONFile(jsonFileName)
  try {
    var ramledData = ramlForm(data)
    ramledData = alterRootKeywords(ramledData)
  } catch (error) {
    cb(error, null)
    return
  }
  cb(null, yaml.safeDump(ramledData, {'noRefs': true}))
}

function alterRootKeywords (ramledData) {

  return ramledData
}

function processArray (arr) {
  var accum = []
  arr.forEach(function (el) {
    accum = accum.concat(ramlForm(el))
  })
  return accum
}

function updateObjWith (obj, upd) {
  for (var key in upd) {
    obj[key] = upd[key]
  }
  return obj
}

function changeType (data) {
  switch (data.type) {

  }
  return data
}

function changeDateType (data) {
  switch (data.type) {

  }
  return data
}

function processNested (data) {
  var updateWith = {}
  for (var key in data) {
    var val = data[key]

    if (val instanceof Array) {
      updateWith[key] = processArray(val)
      continue
    }

    if (val instanceof Object) {
      updateWith[key] = ramlForm(val)
      continue
    }
  }
  return updateWith
}

function ramlForm(data) {
  if (!(data instanceof Object)) {
    return data
  }

  var updateWith = processNested(data)
  data = updateObjWith(data, updateWith)

  if (data.type !== undefined) {
    data = changeType(data)
    data = changeDateType(data)
  }
  return data
}

module.exports.js2dt = js2dt
