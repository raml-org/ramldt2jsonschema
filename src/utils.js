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
      `Not supported draft. Supported drafts are: ${supportedDrafts}`)
  }
}

module.exports = {
  genBasePathLocation: genBasePathLocation,
  validateDraft: validateDraft,
  DEFAULT_DRAFT: '07'
}
