/* global describe, it, context */

var expect = require('chai').expect
var join = require('path').join
var index = require('../src/index')

var RAML_FILE_NAME = join(__dirname, 'test_files/types_example.raml')

describe('getRAMLContext()', function () {
  it('should get raml data types context from file', function () {
    var ctx = index.getRAMLContext(RAML_FILE_NAME)
    expect(ctx).to.be.an('object').and.contain.keys('Cat')
  })
})

describe('dt2js()', function () {
  context('when applied to valid type', function () {
    it('should produce valid JSON schema', function () {
      index.dt2js(RAML_FILE_NAME, 'Cat', function (err, schema) {
        expect(schema)
          .to.have.property(
            '$schema', 'http://json-schema.org/draft-04/schema#').and
          .to.have.property('type', 'object')
        expect(err).to.be.nil
      })
    })
  })
  context('when applied to invalid type', function () {
    it('should not produce valid JSON schema', function () {
      index.dt2js(RAML_FILE_NAME, 'InvalidCat', function (err, schema) {
        expect(schema).to.be.nil
        expect(err).to.be.an(Error)
      })
    })
  })
})

describe('addRootKeywords()', function () {
  it('should add missing root keywords', function () {
    var schema = index.addRootKeywords({})
    expect(schema)
      .to.be.an('object').and
      .to.have.property(
        '$schema', 'http://json-schema.org/draft-04/schema#')
  })
})

describe('processArray()', function () {
  it('should transform each element of array', function () {
    var result = index.processArray(
      [{'type': 'union'}, {'type': 'nil'}], [])
    expect(result).to.have.lengthOf(2)
    expect(result).to.have.deep.property('[0].type', 'object')
    expect(result).to.have.deep.property('[1].type', 'null')
  })
})

describe('updateObjWith()', function () {
  it('should update first object with second', function () {
    var obj = index.updateObjWith(
      {'a': 1, 'b': 2}, {'a': 3, 'c': 4})
    expect(obj).to.have.property('a', 3)
    expect(obj).to.have.property('b', 2)
    expect(obj).to.have.property('c', 4)
  })
})

describe('changeType()', function () {
  it('should change type `union` to `object`', function () {
    var obj = index.changeType({'type': 'union'})
    expect(obj).to.deep.equal({'type': 'object'})
  })
  it('should change type `nil` to `null`', function () {
    var obj = index.changeType({'type': 'nil'})
    expect(obj).to.deep.equal({'type': 'null'})
  })
  it('should change type `file` to `string` with `media` keyword', function () {
    var obj = index.changeType({'type': 'file'})
    expect(obj).to.deep.equal(
      {'type': 'string', 'media': {'binaryEncoding': 'binary'}})
  })
  context('when does not match any type', function () {
    it('should return object not changed', function () {
      var obj = index.changeType({'type': 'foobar'})
      expect(obj).to.deep.equal({'type': 'foobar'})
    })
  })
})

describe('changeDateType()', function () {
  it('should change type `date-only` to `string` with pattern', function () {
    var obj = index.changeDateType({'type': 'date-only'})
    expect(obj).to.have.property('type', 'string')
    expect(obj).to.have.property('pattern', '^(\d{4})-(\d{2})-(\d{2})$')
  })
  it('should change type `time-only` to `string` with pattern', function () {
    var obj = index.changeDateType({'type': 'time-only'})
    expect(obj).to.have.property('type', 'string')
    expect(obj).to.have.property(
      'pattern', '^(\d{2})(:)(\d{2})(:)(\d{2})(\.\d+)?$')
  })
  it('should change type `time-only` to `string` with pattern', function () {
    var obj = index.changeDateType({'type': 'datetime-only'})
    expect(obj).to.have.property('type', 'string')
    expect(obj).to.have.property(
      'pattern',
      '^(\d{4})-(\d{2})-(\d{2})T(\d{2})(:)(\d{2})(:)(\d{2})(\.\d+)?$')
  })
  context('when type is `datetime`', function () {
    var data = [
      {
        'setTo': 'undefined',
        'input': {'type': 'datetime'},
        'contain': 'Z'
      }, {
        'setTo': 'rfc3339',
        'input': {'type': 'datetime', 'format': 'rfc3339'},
        'contain': 'Z'
      }, {
        'setTo': 'rfc2616',
        'input': {'type': 'datetime', 'format': 'rfc2616'},
        'contain': 'Mon'
      }
    ]
    data.forEach(function (el) {
      context('when `format` is set to ' + el.setTo, function () {
        it('should change type to `string` with pattern', function () {
          var obj = index.changeDateType(el.input)
          expect(obj).to.have.property('type', 'string')
          expect(obj)
            .to.have.property('pattern').and
            .contain(el.contain)
          expect(obj).to.not.have.property('format')
        })
      })
    })
  })
  context('when does not match any type', function () {
    it('should return object not changed', function () {
      var obj = index.changeDateType({'type': 'foobar'})
      expect(obj).to.deep.equal({'type': 'foobar'})
    })
  })
})
