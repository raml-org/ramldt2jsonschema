/* global describe, it, context */

const { expect } = require('chai')
const utils = require('../../src/utils')

describe('utils.genBasePathLocation()', function () {
  it('should generate base path location', function () {
    const loc = utils.genBasePathLocation('/tmp', 'xml')
    expect(loc).to.equal('file:///tmp/basepath_default_doc.xml')
  })
})

describe('utils.validateDraft()', function () {
  context('when draft is valid', function () {
    it('should not throw error', function () {
      expect(_ => utils.validateDraft('04')).to.not.throw(Error)
      expect(_ => utils.validateDraft('06')).to.not.throw(Error)
      expect(_ => utils.validateDraft('07')).to.not.throw(Error)
    })
  })
  context('when draft is invalid', function () {
    it('should throw error', function () {
      expect(_ => utils.validateDraft('144')).to.throw(
        Error,
        'Not supported draft. Supported drafts are: 04,06,07')
    })
  })
})
