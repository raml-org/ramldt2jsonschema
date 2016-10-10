/* global describe, it */

var expect = require('chai').expect
var rewire = require('rewire')
var js2dtCli = rewire('../src/js2dt_cli')

describe('js2dt_cli.inferRAMLTypeName()', function () {
  var inferRAMLTypeName = js2dtCli.__get__('inferRAMLTypeName')
  it('should infer type name from file name', function () {
    var name = inferRAMLTypeName('docs/json/cat.json')
    expect(name).to.be.equal('Cat')
  })
})
