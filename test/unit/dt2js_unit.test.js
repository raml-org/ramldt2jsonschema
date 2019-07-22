/* global describe, it, context */

const { expect } = require('chai')
const rewire = require('rewire')
const dt2js = rewire('../../src/dt2js')

describe('dt2js.fixFileTypeProperties()', function () {
  const fixFileTypeProperties = dt2js.__get__('fixFileTypeProperties')
  it('should ignore non-objects', function () {
    const data = ['foo', 3, ['zoo'], undefined, null, 3.4]
    data.forEach(el => {
      expect(fixFileTypeProperties(el)).to.equal(el)
    })
  })
  it('should ignore objects without "type: file" pair', function () {
    const data = { foo: 1 }
    expect(fixFileTypeProperties(data)).to.equal(data)
  })
  it('should convert object with "type: file" to draft4 binary', function () {
    const data = {
      type: 'file'
    }
    expect(fixFileTypeProperties(data)).to.deep.equal({
      type: 'string',
      media: {
        contentEncoding: 'binary'
      }
    })
  })
  context('when object contains "x-amf-fileTypes" property', function () {
    context('when property has an empty value', function () {
      it('should not add anyOf definition', function () {
        const data = {
          type: 'file',
          'x-amf-fileTypes': []
        }
        expect(fixFileTypeProperties(data)).to.deep.equal({
          type: 'string',
          'x-amf-fileTypes': [],
          media: {
            contentEncoding: 'binary'
          }
        })
      })
    })
    it('should convert that property to media.anyOf', function () {
      const data = {
        type: 'file',
        'x-amf-fileTypes': ['image/png', 'image/jpg']
      }
      expect(fixFileTypeProperties(data)).to.deep.equal({
        type: 'string',
        'x-amf-fileTypes': ['image/png', 'image/jpg'],
        media: {
          contentEncoding: 'binary',
          anyOf: [
            { mediaType: 'image/png' },
            { mediaType: 'image/jpg' }
          ]
        }
      })
    })
  })
})

describe('dt2js.replaceAmfProperties()', function () {
  const replaceAmfProperties = dt2js.__get__('replaceAmfProperties')
  it('should ignore non-objects', function () {
    const data = ['foo', 3, ['zoo'], undefined, null, 3.4]
    data.forEach(el => {
      expect(replaceAmfProperties(el)).to.equal(el)
    })
  })
  it('should remove "x-amf-" prefixes from properties names', function () {
    const data = {
      name: 'john',
      'x-amf-age': 123
    }
    expect(replaceAmfProperties(data)).to.deep.equal({
      name: 'john',
      age: 123
    })
  })
})
