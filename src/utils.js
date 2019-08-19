const path = require('path')

/**
 * Generate default location for basePath.
 *
 * @param  {string} basePath - Path to generate location for.
 * @param  {string} ext - Generated location document extension.
 * @return {string} Generated location with "file://" prefix.
 */
function genBasePathLocation (basePath, ext) {
  const docName = `basepath_default_doc.${ext}`
  return `file://${path.resolve(basePath, docName)}`
}

module.exports = {
  genBasePathLocation: genBasePathLocation
}
