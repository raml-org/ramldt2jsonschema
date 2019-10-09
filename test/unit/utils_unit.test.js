/* global describe, it, context */

const { expect } = require('chai')
const utils = require('../../src/utils')

describe('utils.genBasePathLocation()', function () {
  it('should generate base path location', function () {
    const loc = utils.genBasePathLocation('/tmp', 'xml')
    expect(loc).to.equal('file:///tmp/basepath_default_doc.xml')
  })
  context('when provided path ends with extension', function () {
    it('should return passed value with a "file://" prefix', function () {
      const loc = utils.genBasePathLocation('/tmp/foo.xml', 'xml')
      expect(loc).to.equal('file:///tmp/foo.xml')
    })
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
        'Unsupported draft version. Supported versions are: 04,06,07')
    })
  })
})