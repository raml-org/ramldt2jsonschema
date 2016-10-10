'use strict'

/**
 * Merge second object into first one.
 *
 * @param  {Object} obj
 * @param  {Object} upd
 * @returns  {Object}
 */
function updateObjWith (obj, upd) {
  for (var key in upd) {
    obj[key] = upd[key]
  }
  return obj
}

/**
 * Capitalize string.
 *
 * @param  {String} str
 * @returns  {string}
 */
function capitalize (str) {
  return str[0].toUpperCase() + str.slice(1)
}

/**
 * Get RAML type name from $ref string.
 *
 * @param  {String} ref
 * @returns  {string}
 */
function typeNameFromRef (ref) {
  var name = ref.replace(/^.*[\\\/]/, '')
  return capitalize(name)
}

/**
 * Infer RAML type name from file name
 *
 * @param  {string} fileName - File in which type is located.
 * @returns  {string}
 */
function inferRAMLTypeName (fileName) {
  var cleanName = fileName.replace(/^.*[\\\/]/, '')
  var filename = cleanName.split('.')[0]
  return capitalize(filename)
}

module.exports.updateObjWith = updateObjWith
module.exports.capitalize = capitalize
module.exports.typeNameFromRef = typeNameFromRef
module.exports.inferRAMLTypeName = inferRAMLTypeName
