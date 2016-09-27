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

function title (str) {
  return str[0].toUpperCase() + str.slice(1)
}

module.exports.updateObjWith = updateObjWith
module.exports.title = title
