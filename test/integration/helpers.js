'use strict'

var fs = require('fs')

/**
 * List files in folder.
 * From http://resolvethis.com/how-to-get-all-files-in-a-folder-in-javascript/
 *
 * @param  {String} dir
 * @param  {Array} fileList
 * @returns  {Array}
 */
function getFiles (dir, fileList){
  fileList = fileList || []

  var files = fs.readdirSync(dir)
  for (var i in files){
    if (!files.hasOwnProperty(i)) {
      continue
    }
    var name = dir + '/' + files[i]
    if (fs.statSync(name).isDirectory()){
      getFiles(name, fileList)
    } else {
      fileList.push(name)
    }
  }
  return fileList
}

/**
 * Run callback for each file in path.
 *
 */
function forEachFileIn (path, cb) {
  getFiles(path).forEach(function (filepath) {
    cb(filepath)
  })
}

module.exports.forEachFileIn = forEachFileIn
