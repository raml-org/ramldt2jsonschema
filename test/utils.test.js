/* global describe, it */

const expect = require('chai').expect
const utils = require('../src/utils')

describe('utils.updateObjWith()', function () {
  it('should update first object with second', function () {
    const obj = utils.updateObjWith(
      {'a': 1, 'b': 2}, {'a': 3, 'c': 4})
    expect(obj).to.have.property('a', 3)
    expect(obj).to.have.property('b', 2)
    expect(obj).to.have.property('c', 4)
  })
})

describe('utils.capitalize()', function () {
  it('should capitalize a string', function () {
    expect(utils.capitalize('foo')).to.be.equal('Foo')
    expect(utils.capitalize('foo-bar')).to.be.equal('Foo-bar')
    expect(utils.capitalize('foo bar')).to.be.equal('Foo bar')
  })
})

describe('utils.typeNameFromRef()', function () {
  it('should get type name from $ref string', function () {
    expect(utils.typeNameFromRef('foo')).to.be.equal('Foo')
    expect(utils.typeNameFromRef('#/definitions/address'))
        .to.be.equal('Address')
  })
})

describe('utils.inferRAMLTypeName()', function () {
  it('should infer type name from file name', function () {
    const name = utils.inferRAMLTypeName('docs/json/cat.json')
    expect(name).to.be.equal('Cat')
  })
})
