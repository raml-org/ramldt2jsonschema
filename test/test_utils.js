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
