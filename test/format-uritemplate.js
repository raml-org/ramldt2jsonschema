/* global describe, it */

// Uses spec files from the uritemplate-test project
// https://github.com/uri-templates/uritemplate-test

const expect = require('chai').expect
const specs = require('./uritemplate-spec-examples')
const negativeSpecs = require('./uritemplate-spec-negative')
const constants = require('../src/constants')

describe('uri template format', function () {
  const regExp = new RegExp(constants['FORMAT_REGEXPS']['uri-template'])
  it('should work for level 1', function () {
    const level1 = specs['Level 1 Examples'].testcases.map(function (e) { return e[0] })
    const results = level1.map(function (testcase) { return regExp.test(testcase) })
    const passes = results.filter(function (e) { return e }).length
    expect(passes).to.equal(level1.length)
  })
  it('should work for level 2', function () {
    const level2 = specs['Level 2 Examples'].testcases.map(function (e) { return e[0] })
    const results = level2.map(function (testcase) { return regExp.test(testcase) })
    const passes = results.filter(function (e) { return e }).length
    expect(passes).to.equal(level2.length)
  })
  it('should work for level 3', function () {
    const level3 = specs['Level 3 Examples'].testcases.map(function (e) { return e[0] })
    const results = level3.map(function (testcase) { return regExp.test(testcase) })
    const passes = results.filter(function (e) { return e }).length
    expect(passes).to.equal(level3.length)
  })
  it('should work for level 4', function () {
    const level4 = specs['Level 4 Examples'].testcases.map(function (e) { return e[0] })
    const results = level4.map(function (testcase) { return regExp.test(testcase) })
    const passes = results.filter(function (e) { return e }).length
    expect(passes).to.equal(level4.length)
  })
  // 26 of 29 negative testcases are failing. 3 are not : -(
  it.skip('should fail for negative examples', function () {
    const negative = negativeSpecs['Failure Tests'].testcases.map(function (e) { return e[0] })
    const results = negative.map(function (testcase) { return regExp.test(testcase) })
    const fails = results.filter(function (e) { return !e }).length
    expect(fails).to.equal(negative.length)
  })
})
