/* global describe, it, context */

const { expect } = require('chai')
const rewire = require('rewire')
const js2dt = rewire('../../src/js2dt')

describe('js2dt.validateRaml()', function () {
  const validateRaml = js2dt.__get__('validateRaml')
  context('when invalid RAML is passed', function () {
    it('should throw an error', async function () {
      try {
        await validateRaml(`
#%RAML 1.0 Library
types:
  Cat:
    type: number
    maximum: asd`)
        throw new Error('Expected to fail')
      } catch (e) {
        expect(e.message).to.equal(
          'Invalid RAML: maximum facet for a RAML scalar type must be a number')
      }
    })
  })
  context('when valid RAML is passed', function () {
    it('should not throw error', async function () {
      try {
        await validateRaml(`
#%RAML 1.0 Library
types:
  Cat:
    type: number`)
      } catch (e) {
        throw new Error('Expected to succeed')
      }
    })
  })
})
