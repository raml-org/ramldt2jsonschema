/* global describe, it */

var expect = require('chai').expect
var utils = require('../src/utils')

describe('utils.updateObjWith()', function () {
  it('should update first object with second', function () {
    var obj = utils.updateObjWith(
      {'a': 1, 'b': 2}, {'a': 3, 'c': 4})
    expect(obj).to.have.property('a', 3)
    expect(obj).to.have.property('b', 2)
    expect(obj).to.have.property('c', 4)
  })
})

describe('utils.title()', function () {
  it('should title a string', function () {
    expect(utils.title('foo')).to.be.equal('Foo')
    expect(utils.title('foo-bar')).to.be.equal('Foo-bar')
    expect(utils.title('foo bar')).to.be.equal('Foo bar')
  })
})

describe('utils.typeNameFromRef()', function () {
  it('should get type name from $ref string', function () {
    expect(utils.typeNameFromRef('foo')).to.be.equal('Foo')
    expect(utils.typeNameFromRef('#/definitions/address'))
        .to.be.equal('Address')
  })
})

describe('utils.cloneObj()', function () {
  it('should clone object', function () {
    var obj = {'a': 1}
    var res = utils.cloneObj(obj)
    expect(res).to.be.not.equal(obj)
    expect(res).to.be.deep.equal(obj)
  })
})
