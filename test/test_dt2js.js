/* global describe, it, context */

var expect = require('chai').expect
var join = require('path').join
var rewire = require('rewire')
var dt2js = rewire('../src/dt2js')
var constants = require('../src/constants')
var fs = require('fs')

var RAML_FILE = join(__dirname, 'examples/types_example.raml')
var INVALID_RAML_FILE = join(__dirname, 'examples/invalid.raml')
var ARRAY_OF_UNION_TEST = join(__dirname, 'examples/union_test.raml')

describe('dt2js.getRAMLContext()', function () {
  var ramlData = fs.readFileSync(RAML_FILE).toString()
  var getRAMLContext = dt2js.__get__('getRAMLContext')
  it('should load included json example file', function () {
    var ctx = getRAMLContext(ramlData, 'test/examples')
    expect(ctx.CatWithRating.example.rating).to.equal(50)
  })
  it('should load libraries defined under `use:`', function () {
    var ctx = getRAMLContext(ramlData, 'test/examples')
    expect(ctx.Cat.type.properties).to.have.property('address', 'string')
    expect(ctx.CatWithRating.type.properties.rating).to.have.property('type', 'integer')
  })
  it('should get raml data types context from RAML content', function () {
    var ctx = getRAMLContext(ramlData, 'test/examples')
    expect(ctx).to.be.an('object').and.contain.keys('Cat')
  })
})

describe('dt2js.dt2js()', function () {
  var ramlData = fs.readFileSync(RAML_FILE).toString()
  context('when applied to valid type', function () {
    it('should produce valid JSON schema', function (done) {
      dt2js.setBasePath('test/examples')
      dt2js.dt2js(ramlData, 'Cat', function (err, schema) {
        expect(schema).to.have.property(
            '$schema', 'http://json-schema.org/draft-04/schema#').and
        expect(schema).to.have.property('type', 'array')
        expect(err).to.be.nil
        done()
      })
    })
  })
  context('when applied to invalid type', function () {
    var ramlData = fs.readFileSync(INVALID_RAML_FILE).toString()
    it('should not produce valid JSON schema', function (done) {
      dt2js.dt2js(ramlData, 'InvalidCat', function (err, schema) {
        expect(schema).to.be.nil
        expect(err).to.have.property('message', 'Consistency check failure for property length and values [123 1]')
        done()
      })
    })
  })
  context('when applied to invalid RAML data', function () {
    it('should return error and null', function (done) {
      dt2js.dt2js('asdasdasdasd', 'Cat', function (err, schema) {
        expect(schema).to.be.nil
        expect(err).to.have.property('message', 'Invalid RAML data')
        done()
      })
    })
  })
  context('when given an invalid type name', function () {
    it('should return error and null', function (done) {
      dt2js.dt2js(ramlData, 'Ant', function (err, schema) {
        expect(schema).to.be.nil
        expect(err).to.have.property('message', 'type Ant does not exist')
        done()
      })
    })
  })
})

describe('dt2js.destringify()', function () {
  var destringify = dt2js.__get__('destringify')
  it('should change a string to an int where possible', function () {
    var val = destringify('100')
    expect(val).to.equal(100)
  })
  it('should leave non int/ non boolean as a string', function () {
    var val = destringify('foo')
    expect(val).to.equal('foo')
  })
  it('should convert the string "true" to boolean true', function () {
    var val = destringify('true')
    expect(val).to.equal(true)
  })
  it('should convert the string "false" to boolean false', function () {
    var val = destringify('false')
    expect(val).to.equal(false)
  })
})

describe('dt2js.addRootKeywords()', function () {
  var addRootKeywords = dt2js.__get__('addRootKeywords')
  it('should add missing root keywords', function () {
    var schema = addRootKeywords({})
    expect(schema)
      .to.be.an('object').and
      .to.have.property(
        '$schema', 'http://json-schema.org/draft-04/schema#')
  })
})

describe('dt2js.processArray()', function () {
  var processArray = dt2js.__get__('processArray')
  it('should transform each element of array', function () {
    var result = processArray(
      [{'type': 'union'}, {'type': 'nil'}], [])
    expect(result).to.have.lengthOf(2)
    expect(result).to.have.deep.property('[0].type', 'object')
    expect(result).to.have.deep.property('[1].type', 'null')
  })
})

describe('dt2js.convertType()', function () {
  var convertType = dt2js.__get__('convertType')
  it('should change type `union` to `object`', function () {
    var obj = convertType({'type': 'union'})
    expect(obj).to.deep.equal({'type': 'object'})
  })
  it('should change type `nil` to `null`', function () {
    var obj = convertType({'type': 'nil'})
    expect(obj).to.deep.equal({'type': 'null'})
  })
  it('should change type `file` to `string` with `media` keyword', function () {
    var obj = convertType({'type': 'file'})
    expect(obj).to.deep.equal(
      {'type': 'string', 'media': {'binaryEncoding': 'binary'}})
  })
  context('when does not match any type', function () {
    it('should return object not changed', function () {
      var obj = convertType({'type': 'foobar'})
      expect(obj).to.deep.equal({'type': 'foobar'})
    })
  })
})

describe('dt2js.convertFileType()', function () {
  var convertFileType = dt2js.__get__('convertFileType')
  it('should change type `file` to `string` with `media` keyword', function () {
    var expected = {'type': 'string', 'media': {'binaryEncoding': 'binary'}}
    var obj = convertFileType({'type': 'file'})
    expect(obj).to.deep.equal(expected)
  })
  context('when data contains `fileTypes` param', function () {
    it('should move its elements to anyOf and delete `fileTypes`', function () {
      var expected = {
        'type': 'string',
        'media': {
          'binaryEncoding': 'binary',
          'anyOf': [
            {'mediaType': 'image/jpeg'},
            {'mediaType': 'image/png'}
          ]
        }
      }
      var obj = convertFileType({
        'type': 'file',
        'fileTypes': ['image/jpeg', 'image/png']
      })
      expect(obj).to.deep.equal(expected)
    })
  })
})

describe('dt2js.convertDateType()', function () {
  var convertDateType = dt2js.__get__('convertDateType')
  it('should change type `date-only` to `string` with pattern', function () {
    var obj = convertDateType({'type': 'date-only'})
    expect(obj).to.have.property('type', 'string')
    expect(obj).to.have.property('pattern', constants.dateOnlyPattern)
  })
  it('should change type `time-only` to `string` with pattern', function () {
    var obj = convertDateType({'type': 'time-only'})
    expect(obj).to.have.property('type', 'string')
    expect(obj).to.have.property('pattern', constants.timeOnlyPattern)
  })
  it('should change type `time-only` to `string` with pattern', function () {
    var obj = convertDateType({'type': 'datetime-only'})
    expect(obj).to.have.property('type', 'string')
    expect(obj).to.have.property('pattern', constants.dateTimeOnlyPattern)
  })
  context('when type is `datetime`', function () {
    var data = [
      {
        'setTo': 'undefined',
        'input': {'type': 'datetime'},
        'pattern': constants.RFC3339DatetimePattern
      }, {
        'setTo': 'rfc3339',
        'input': {'type': 'datetime', 'format': 'rfc3339'},
        'pattern': constants.RFC3339DatetimePattern
      }, {
        'setTo': 'rfc2616',
        'input': {'type': 'datetime', 'format': 'rfc2616'},
        'pattern': constants.RFC2616DatetimePattern
      }
    ]
    data.forEach(function (el) {
      context('when `format` is set to ' + el.setTo, function () {
        it('should change type to `string` with pattern', function () {
          var obj = convertDateType(el.input)
          expect(obj).to.have.property('type', 'string')
          expect(obj).to.have.property('pattern', el.pattern)
          expect(obj).to.not.have.property('format')
        })
      })
    })
  })
  context('when does not match any type', function () {
    it('should return object not changed', function () {
      var obj = convertDateType({'type': 'foobar'})
      expect(obj).to.deep.equal({'type': 'foobar'})
    })
  })
})
describe('dt2js.convertDisplayName()', function () {
  var convertDisplayName = dt2js.__get__('convertDisplayName')
  context('When a RAML displayName is given', function () {
    it('should replace it with a JSON Schema title', function () {
      var obj = convertDisplayName({type: 'beep boop', displayName: 'Beep Boop'})
      expect(obj).to.have.property('title', 'Beep Boop')
      expect(obj).to.not.have.property('displayName')
    })
  })
})

describe('dt2js.processNested()', function () {
  var processNested = dt2js.__get__('processNested')
  it('should process nested arrays', function () {
    var data = {'foo': [{'type': 'union'}]}
    var result = processNested(data, [])
    expect(result)
      .to.have.property('foo').and
      .to.have.lengthOf(1)
    expect(result).to.have.deep.property('foo[0].type', 'object')
  })
  it('should process nested objects', function () {
    var data = {'foo': {'type': 'union'}}
    var result = processNested(data, [])
    expect(result)
      .to.have.property('foo').and
      .to.have.all.keys('type')
    expect(result).to.have.deep.property('foo.type', 'object')
  })
  it('should return empty object if no nesting is present', function () {
    var result = processNested({'type': 'union'}, [])
    expect(result).to.be.deep.equal({})
  })
})

describe('dt2js.schemaForm()', function () {
  var schemaForm = dt2js.__get__('schemaForm')
  it('should return data unchanged if it is not Object', function () {
    var result = schemaForm('foo')
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
          'type': 'string',
          'required': false
        }
      }
    }
    var schema = schemaForm(data, [])
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
    var schema = schemaForm(data, [])
    expect(schema)
      .to.have.property('required').and
      .to.be.deep.equal(['name'])
    expect(schema).to.not.have.deep.property('properties.name.required')
  })
  context.skip('when `required` param is not used properly', function () {
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
      var schema = schemaForm(data, [])
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
    var schema = schemaForm(data, [])
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
    var schema = schemaForm(data, [])
    expect(schema).to.have.property('type', 'object')
    expect(schema).to.have.deep.property('properties.name.type', 'null')
    expect(schema).to.have.deep.property('properties.photo.type', 'string')
    expect(schema).to.have.deep.property('properties.photo.media')
    expect(schema).to.have.deep.property('properties.dob.type', 'string')
  })
})

describe('dt2js.schemaForm()', function () {
  var schemaForm = dt2js.__get__('schemaForm')
  it('should interpret absence of `required` as required: true', function () {
    var data = {
      'type': 'object',
      'properties': {
        'key1': {
          'type': 'integer',
          'default': 1,
          'required': true
        },
        'key2': {
          'type': 'string',
          'required': false
        },
        'key3': {
          'type': 'boolean',
          'default': true
        }
      }
    }
    var schema = schemaForm(data, [])
    expect(schema)
      .to.have.property('required').and
      .to.be.deep.equal(['key1', 'key3'])
    expect(schema)
      .to.have.deep.property('properties.key1.default').and
      .to.equal(1)
    expect(schema)
      .to.have.deep.property('properties.key3.default').and
      .to.equal(true)
  })
})
describe('Converting an array of union type', function () {
  var convert = dt2js.__get__('dt2js')
  it('should result in an array type, with anyOf on the items level', function (cb) {
    var ramlData = fs.readFileSync(ARRAY_OF_UNION_TEST).toString()
    convert(ramlData, 'Devices', function (e, r) {
      var expected = require(join(__dirname, 'examples/union_test_result.json'))
      expect(r).to.deep.equal(expected)
      expect(r.items.anyOf[0].properties.manufacturer.type).to.equal('string')
      return cb()
    })
  })
})
