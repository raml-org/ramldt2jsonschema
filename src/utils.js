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
 * Title string.
 *
 * @param  {String} str
 * @returns  {string}
 */
function title (str) {
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
  return title(name)
}

/**
 * Clone object.
 *
 * @param  {Object} obj
 * @returns  {Object}
 */
function cloneObj (obj) {
  return JSON.parse(JSON.stringify(obj))
}

module.exports.updateObjWith = updateObjWith
module.exports.title = title
module.exports.typeNameFromRef = typeNameFromRef
module.exports.cloneObj = cloneObj
