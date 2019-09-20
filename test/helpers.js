'use strict'

const fs = require('fs')
const path = require('path')

/**
 * List files in folder.
 * From http://resolvethis.com/how-to-get-all-files-in-a-folder-in-javascript/
 *
 * @param  {String} dir
 * @param  {Array} fileList
 * @returns  {Array}
 */
function getFiles (dir, fileList = []) {
  const files = fs.readdirSync(dir)
  for (const i in files) {
    if (!files.hasOwnProperty(i)) {
      continue
    }
    const name = path.join(dir, files[i])
    if (fs.statSync(name).isDirectory()) {
      getFiles(name, fileList)
    } else {
      fileList.push(name)
    }
  }
  return fileList
}

module.exports.getFiles = getFiles
