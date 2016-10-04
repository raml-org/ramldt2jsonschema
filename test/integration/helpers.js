'use strict'

function listFiles (folder) {

}

function forEachFileIn (path, cb) {
  listFiles(path).forEach(function (filepath) {
    cb(filepath)
  })
}

module.exports.forEachFileIn = forEachFileIn
