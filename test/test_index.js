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

describe('processNested()', function () {
  it('should process nested arrays', function () {
    var data = {'foo': [{'type': 'union'}]}
    var result = index.processNested(data, [])
    expect(result)
      .to.have.property('foo').and
      .to.have.lengthOf(1)
    expect(result).to.have.deep.property('foo[0].type', 'object')
  })
  it('should process nested objects', function () {
    var data = {'foo': {'type': 'union'}}
    var result = index.processNested(data, [])
    expect(result)
      .to.have.property('foo').and
      .to.have.all.keys('type')
    expect(result).to.have.deep.property('foo.type', 'object')
  })
  it('should return empty object if no nesting is present', function () {
    var result = index.processNested({'type': 'union'}, [])
    expect(result).to.be.deep.equal({})
  })
})

describe('schemaForm()', function () {
  it('should return data unchanged if it is not Object', function () {
    var result = index.schemaForm('foo')
    expect(result).to.be.equal('foo')
  })
  it('should hoist `required` properties param to object root', function () {
    var data = {
      'type': 'object',
      'properties': {
        'name': {
          'type': 'string',
          'required': true
        },
        'age': {
          'type': 'integer',
          'required': true
        },
        'address': {
          'type': 'string'
        }
      }
    }
    var schema = index.schemaForm(data, [])
    expect(schema)
      .to.have.property('required').and
      .to.be.deep.equal(['name', 'age'])
  })
  it('should remove `required` properties param while hoisting', function () {
    var data = {
      'type': 'object',
      'properties': {
        'name': {
          'type': 'string',
          'required': true
        }
      }
    }
    var schema = index.schemaForm(data, [])
    expect(schema)
      .to.have.property('required').and
      .to.be.deep.equal(['name'])
    expect(schema).to.not.have.deep.property('properties.name.required')
  })
  context('when `required` param is not used properly', function () {
    it('should not hoist `required` properties param', function () {
      var data = {
        'type': 'object',
        'properties': {
          'names': {
            'type': 'array',
            'items': [{
              'type': 'object',
              'required': true
            }]
          }
        }
      }
      var schema = index.schemaForm(data, [])
      expect(schema)
        .to.have.property('required').and
        .to.be.deep.empty
    })
  })
  it('should process nested', function () {
    var data = {
      'type': 'object',
      'properties': {
        'bio': {
          'type': 'object',
          'properties': {
            'event': {'type': 'date-only'}
          }
        },
        'siblings': {
          'anyOf': [{'type': 'nil'}]
        }
      }
    }
    var schema = index.schemaForm(data, [])
    expect(schema).to.have.deep.property(
      'properties.bio.properties.event.type', 'string')
    expect(schema).to.have.deep.property(
      'properties.siblings.anyOf[0].type', 'null')
  })
  it('should change types', function () {
    var data = {
      'type': 'union',
      'properties': {
        'name': {'type': 'nil'},
        'photo': {'type': 'file'},
        'dob': {'type': 'date-only'}
      }
    }
    var schema = index.schemaForm(data, [])
    expect(schema).to.have.property('type', 'object')
    expect(schema).to.have.deep.property('properties.name.type', 'null')
    expect(schema).to.have.deep.property('properties.photo.type', 'string')
    expect(schema).to.have.deep.property('properties.photo.media')
    expect(schema).to.have.deep.property('properties.dob.type', 'string')
  })
})
