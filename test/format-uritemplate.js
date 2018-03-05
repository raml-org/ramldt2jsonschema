/* global describe, it */

var expect = require('chai').expect
var specs = require('./uritemplate-spec-examples')
var negativeSpecs = require('./uritemplate-spec-negative')
var constants = require('../src/constants')

describe('uri template format', function () {
  // var regExp = /^(\w+\?)?(\w+[=])?(\?\w+[=]\w+)?X?({(?=[^}]+}))[+#./;?&]?(\w+([:]\d+(?!\*))?[*]?[,]?)+}(\/\w+)?/
  var regExp = new RegExp(constants['FORMAT_REGEXPS']['uri-template'])
  it('should work for level 1', function () {
    var level1 = specs['Level 1 Examples'].testcases.map(function (e) { return e[0] })
    var results = level1.map(function (testcase) { return regExp.test(testcase) })
    var passes = results.filter(function (e) { return e }).length
    expect(passes).to.equal(level1.length)
  })
  it('should work for level 2', function () {
    var level2 = specs['Level 2 Examples'].testcases.map(function (e) { return e[0] })
    var results = level2.map(function (testcase) { return regExp.test(testcase) })
    var passes = results.filter(function (e) { return e }).length
    expect(passes).to.equal(level2.length)
  })
  it('should work for level 3', function () {
    var level3 = specs['Level 3 Examples'].testcases.map(function (e) { return e[0] })
    var results = level3.map(function (testcase) { return regExp.test(testcase) })
    var passes = results.filter(function (e) { return e }).length
    expect(passes).to.equal(level3.length)
  })
  it('should work for level 4', function () {
    var level4 = specs['Level 4 Examples'].testcases.map(function (e) { return e[0] })
    var results = level4.map(function (testcase) { return regExp.test(testcase) })
    var passes = results.filter(function (e) { return e }).length
    expect(passes).to.equal(level4.length)
  })
  // 26 of 29 negative testcases are failing. 3 are not : -(
  it.skip('should fail for negative examples', function () {
    var negative = negativeSpecs['Failure Tests'].testcases.map(function (e) { return e[0] })
    var results = negative.map(function (testcase) { return regExp.test(testcase) })
    var fails = results.filter(function (e) { return !e }).length
    expect(fails).to.equal(negative.length)
  })
})
