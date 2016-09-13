/* global describe, it */

var expect = require('chai').expect
var join = require('path').join
var index = require('../src/index')

describe('getRAMLContext', function () {
  it('should get raml data types context from file', function () {
    var ramlFile = join(__dirname, 'test_files/types_example.raml')
    var ctx = index.getRAMLContext(ramlFile)
    expect(ctx).to.be.an('object').and.contain.keys('Cat')
  })
})
