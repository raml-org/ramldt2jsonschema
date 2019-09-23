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
  files.forEach(fname => {
    const fpath = path.join(dir, fname)
    if (fs.statSync(fpath).isDirectory()) {
      getFiles(fpath, fileList)
    } else {
      fileList.push(fpath)
    }
  })
  return fileList
}

module.exports.getFiles = getFiles
