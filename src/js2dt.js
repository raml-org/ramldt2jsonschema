'use strict'

var yaml = require('js-yaml')
var fs = require('fs')
var constants = require('./constants')

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
    ramledData = alterRootKeywords(ramledData, ramlTypeName)
  } catch (error) {
    cb(error, null)
    return
  }
  cb(null, yaml.safeDump(ramledData, {'noRefs': true}))
}

function alterRootKeywords (ramledData, ramlTypeName) {
  delete ramledData['$schema']
  var namedData = {}
  namedData[ramlTypeName] = ramledData
  return {'types': namedData}
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

function ramlForm (data) {
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

function handleUnion (data) {
  // TODO: Implement
  return data
}

module.exports.js2dt = js2dt
