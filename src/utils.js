const path = require('path')
const url = require('url')

/**
 * Convert file path to file URL adding default file name if missing.
 *
 * @param  {string} basePath - Path to generate location for.
 * @param  {string} ext - Generated location document extension.
 * @return {string} Generated location with "file://" prefix.
 */
function basePathToURL (basePath, ext) {
  if (!basePath.endsWith(`.${ext}`)) {
    basePath = path.join(basePath, `basepath_default_doc.${ext}`)
  }
  return url.pathToFileURL(basePath.replace(/\\/g, '/')).href
}

/**
 * Validates draft version.
 *
 * @param  {string} draft - Output JSON Schema draft version.
 * throws {Error} If specified draft is not supported.
 */
function validateDraft (draft) {
  const supportedDrafts = ['04', '06', '07']
  if (supportedDrafts.indexOf(draft) < 0) {
    throw new Error(
      `Unsupported draft version. Supported versions are: ${supportedDrafts}`)
  }
}

module.exports = {
  basePathToURL: basePathToURL,
  validateDraft: validateDraft,
  DEFAULT_DRAFT: '07'
}
