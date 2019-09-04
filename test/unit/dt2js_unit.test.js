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
        binaryEncoding: 'binary'
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
          media: {
            binaryEncoding: 'binary'
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
        media: {
          binaryEncoding: 'binary',
          anyOf: [
            { mediaType: 'image/png' },
            { mediaType: 'image/jpg' }
          ]
        }
      })
    })
  })
})

describe('dt2js.removeXAmfProperties()', function () {
  const removeXAmfProperties = dt2js.__get__('removeXAmfProperties')
  it('should ignore non-objects', function () {
    const data = ['foo', 3, ['zoo'], undefined, null, 3.4]
    data.forEach(el => {
      expect(removeXAmfProperties(el)).to.equal(el)
    })
  })
  it('should remove "x-amf-" prefixes from properties names', function () {
    const data = {
      name: 'john',
      'x-amf-age': 123
    }
    expect(removeXAmfProperties(data)).to.deep.equal({
      name: 'john',
      age: 123
    })
  })
})

describe('dt2js.patchRamlData()', function () {
  const patchRamlData = dt2js.__get__('patchRamlData')
  it('should replace RAML tag and add an endpoint', function () {
    const ramlData = `#%RAML 1.0 Library
types:
  Cat:
    type: string`
    expect(patchRamlData(ramlData, 'Cat')).to.equal(`#%RAML 1.0
types:
  Cat:
    type: string

/for/conversion/Cat:
  get:
    responses:
      200:
        body:
          application/json:
            type: Cat`)
  })
})
