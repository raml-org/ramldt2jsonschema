/* global describe, it, context */

var expect = require('chai').expect
var yaml = require('js-yaml')
var join = require('path').join
var rewire = require('rewire')
var js2dt = rewire('../src/js2dt')
var constants = require('../src/constants')
var fs = require('fs')

var JSON_FILE_NAME = join(__dirname, 'examples/schema_example.json')
var RAMLEmitter = js2dt.__get__('RAMLEmitter')

describe('js2dt.js2dt()', function () {
  var jsonData = fs.readFileSync(JSON_FILE_NAME).toString()
  context('when applied to valid schema', function () {
    it('should produce valid RAML type library', function (done) {
      js2dt.js2dt(jsonData, 'Product', function (err, raml) {
        expect(err).to.be.nil
        expect(raml).to.be.a('string')
        var data = yaml.safeLoad(raml)
        expect(data).to.have.deep.property('types.Product')
        expect(data).to.not.have.property('$schema')
        done()
      })
    })
    it('should retain boolean additionalProperties as boolean', function (done) {
      var jsdata = {
        '$schema': 'http://json-schema.org/draft-04/schema#',
        'title': 'SomethingWithAList',
        'type': 'object',
        'properties': {
          'list': {
            'type': 'array',
            'items': [
              {
                'type': 'string',
                'enum': ['NW', 'NE', 'SW', 'SE']
              }
            ]
          }
        },
        'additionalProperties': false
      }
      js2dt.js2dt(JSON.stringify(jsdata), 'Product', function (err, raml) {
        expect(err).to.be.nil
        var data = yaml.safeLoad(raml)
        expect(data).to.have.deep.property(
          'types.Product.additionalProperties.', false)
        done()
      })
    })
    it('should change additionalProperties: {} to true', function (done) {
      var jsdata = {
        '$schema': 'http://json-schema.org/draft-04/schema#',
        'title': 'SomethingWithAList',
        'type': 'object',
        'properties': {
          'list': {
            'type': 'array',
            'items': [
              {
                'type': 'string',
                'enum': ['NW', 'NE', 'SW', 'SE']
              }
            ]
          }
        },
        'additionalProperties': {}
      }
      js2dt.js2dt(JSON.stringify(jsdata), 'Product', function (err, raml) {
        expect(err).to.be.nil
        var data = yaml.safeLoad(raml)
        expect(data).to.have.deep.property(
          'types.Product.additionalProperties.', true)
        done()
      })
    })
    it('should correctly handle additionalProperties: json SCHEMA', function (done) {
      var jsdata = {
        '$schema': 'http://json-schema.org/draft-04/schema#',
        'title': 'SomethingWithAList',
        'type': 'object',
        'properties': {
          'list': {
            'type': 'array',
            'items': [
              {
                'type': 'string',
                'enum': ['NW', 'NE', 'SW', 'SE']
              }
            ]
          }
        },
        'additionalProperties': { type: 'string' }
      }
      js2dt.js2dt(JSON.stringify(jsdata), 'Product', function (err, raml) {
        expect(err).to.be.nil
        var data = yaml.safeLoad(raml)
        expect(data).to.have.deep.property(
          'types.Product.properties.//.type', 'string')
        expect(data).to.have.deep.property(
          'types.Product.additionalProperties', false)
        done()
      })
    })
    it('should handle JSON definitions and refs', function (done) {
      js2dt.js2dt(jsonData, 'Product', function (err, raml) {
        expect(err).to.be.nil
        var data = yaml.safeLoad(raml)
        expect(data).to.have.deep.property(
          'types.Address.properties.planet.type', 'nil')
        expect(data).to.have.deep.property(
          'types.Product.properties.madeIn.type', 'Address')
        expect(data).to.not.have.property('definitions')
        done()
      })
    })
    it('should handle anyOf in files properly', function (done) {
      js2dt.js2dt(jsonData, 'Product', function (err, raml) {
        expect(err).to.be.nil
        var data = yaml.safeLoad(raml)
        expect(data).to.have.deep.property(
          'types.Product.properties.photo.type', 'file')
        expect(data).to.not.have.deep.property(
          'types.Product.properties.photo.media')
        expect(data)
          .to.have.deep.property(
            'types.Product.properties.photo.fileTypes').and
          .be.equal(['image/jpeg', 'image/png'])
        done()
      })
    })
    it('should drop json schema keyword additionalItems', function (done) {
      var jsdata = {
        '$schema': 'http://json-schema.org/draft-04/schema#',
        'title': 'SomethingWithAList',
        'type': 'object',
        'properties': {
          'list': {
            'type': 'array',
            'items': [
              {
                'type': 'number'
              },
              {
                'type': 'string'
              },
              {
                'type': 'string',
                'enum': ['Street', 'Avenue', 'Boulevard']
              },
              {
                'type': 'string',
                'enum': ['NW', 'NE', 'SW', 'SE']
              }
            ],
            'additionalItems': false
          }
        },
        'required': [
          'start',
          'end'
        ],
        'additionalProperties': false
      }
      js2dt.js2dt(JSON.stringify(jsdata), 'Something', function (err, raml) {
        expect(err).to.be.nil
        var data = yaml.safeLoad(raml)
        expect(data).to.not.have.deep.property(
          'types.SomethingWithAList.properties.list.additionalItems')
        done()
      })
    })
    it('should drop json schema keywords exclusiveMinimum & exclusiveMaximum', function (done) {
      var jsdata = {
        '$schema': 'http://json-schema.org/draft-04/schema#',
        'title': 'RandomNumber',
        'type': 'object',
        'properties': {
          'count': {
            'type': 'number',
            'minimum': 3,
            'maximum': 100,
            'exclusiveMinimum': true,
            'exclusiveMaximum': true
          }
        },
        'required': [
          'start',
          'end'
        ],
        'additionalProperties': false
      }
      js2dt.js2dt(JSON.stringify(jsdata), 'Product', function (err, raml) {
        expect(err).to.be.nil
        var data = yaml.safeLoad(raml)
        expect(data).to.not.have.deep.property(
          'types.RandomNumber.properties.count.exclusiveMinimum')
        expect(data).to.not.have.deep.property(
          'types.RandomNumber.properties.count.exclusiveMaximum')
        done()
      })
    })
    it('should drop json schema keyword "required"', function (done) {
      var jsdata = {
        '$schema': 'http://json-schema.org/draft-04/schema#',
        'type': 'object',
        'title': 'Location',
        'required': [
          'id',
          'label'
        ],
        'additionalProperties': false,
        'properties': {
          'id': {
            'type': 'string'
          },
          'label': {
            'type': 'string'
          },
          'latitude': {
            'type': 'number',
            'minimum': -90,
            'maximum': 90
          },
          'longitude': {
            'type': 'number',
            'minimum': -180,
            'maximum': 180
          }
        },
        'dependencies': {
          'latitude': [ 'longitude' ],
          'longitude': [ 'latitude' ]
        }
      }
      js2dt.js2dt(JSON.stringify(jsdata), 'Location', function (err, raml) {
        expect(err).to.be.nil
        var data = yaml.safeLoad(raml)
        expect(data).to.not.have.deep.property(
          'types.Location.required')
        expect(data).to.not.have.deep.property(
          'types.RandomNumber.properties.count.exclusiveMaximum')
        done()
      })
    })
    it('should change js schema title to raml displayName', function (done) {
      var jsondata = {
        '$schema': 'http://json-schema.org/draft-04/schema#',
        'title': 'Basis period',
        'type': 'object',
        'properties': {
          'title': {
            'title': 'Title',
            'description': 'Title of your basis period',
            'type': 'string',
            'format': 'date'
          },
          'start': {
            'title': 'Start date',
            'description': 'Date your basis period began',
            'type': 'string',
            'format': 'date'
          },
          'end': {
            'title': 'End date',
            'description': 'Date your basis period ended',
            'type': 'string',
            'format': 'date'
          }
        },
        'required': [
          'start',
          'end'
        ],
        'additionalProperties': false
      }
      js2dt.js2dt(JSON.stringify(jsondata), 'Product', function (err, raml) {
        expect(err).to.be.nil
        var data = yaml.safeLoad(raml)
        expect(data).to.have.deep.property(
          'types.Product.displayName')
        expect(data).to.not.have.deep.property(
          'types.Product.title')
        expect(data).to.have.deep.property(
          'types.Product.properties.title.displayName')
        expect(data).to.not.have.deep.property(
          'types.Product.properties.title.title')
        expect(data).to.have.deep.property(
          'types.Product.properties.start.displayName')
        expect(data).to.not.have.deep.property(
          'types.Product.properties.start.title')
        expect(data).to.have.deep.property(
          'types.Product.properties.end.displayName')
        expect(data).to.not.have.deep.property(
          'types.Product.properties.end.title')
        done()
      })
    })
  })
  context('when error occurs while schema processing', function () {
    it('should not produce valid RAML type library', function (done) {
      js2dt.js2dt('foobar.json', 'Product', function (err, raml) {
        expect(raml).to.be.nil
        expect(err).to.have.property('message')
        expect(err.message).to.have.string('Unexpected token o')
        done()
      })
    })
  })
})

describe('js2dt.convertType()', function () {
  var convertType = js2dt.__get__('convertType')
  it('should change type `null` to `nil`', function () {
    var obj = convertType({'type': 'null'})
    expect(obj).to.deep.equal({'type': 'nil'})
  })
  context('when does not match any type', function () {
    it('should return object not changed', function () {
      var obj = convertType({'type': 'foobar'})
      expect(obj).to.deep.equal({'type': 'foobar'})
    })
  })
})

describe('js2dt.isFileType()', function () {
  var isFileType = js2dt.__get__('isFileType')
  it('should return true for valid file types', function () {
    var data = {
      'type': 'string',
      'media': {'binaryEncoding': 'binary'}
    }
    expect(isFileType(data)).to.be.true
  })
  context('when type is not string', function () {
    it('should return false', function () {
      var data = {
        'type': 'asd',
        'media': {'binaryEncoding': 'binary'}
      }
      expect(isFileType(data)).to.be.false
    })
  })
  context('when no media is set', function () {
    it('should return false', function () {
      var data = {
        'type': 'string'
      }
      expect(isFileType(data)).to.be.false
    })
  })
  context('when binaryEncoding is not `binary`', function () {
    it('should return false', function () {
      var data = {
        'type': 'asd',
        'media': {'binaryEncoding': 'asdasd'}
      }
      expect(isFileType(data)).to.be.false
    })
  })
})

describe('js2dt.convertFileType()', function () {
  var convertFileType = js2dt.__get__('convertFileType')
  it('should just change type to `file` and remove media', function () {
    var res = convertFileType({'type': 'foo', 'media': 1})
    expect(res).to.be.deep.equal({'type': 'file'})
  })
  context('when anyOf contains data', function () {
    it('should move mediaTypes to fileTypes', function () {
      var res = convertFileType({
        'type': 'foo',
        'media': {
          'anyOf': [
            {'mediaType': 'image/png'},
            {'mediaType': 'image/jpeg'},
            {'foo': 'bar'}
          ]
        }
      })
      expect(res).to.be.deep.equal({
        'type': 'file',
        'fileTypes': ['image/png', 'image/jpeg']
      })
    })
    context('when no medaiTypes were moved to fileTypes', function () {
      it('should remove fileTypes', function () {
        var res = convertFileType({
          'type': 'foo',
          'media': {
            'anyOf': [
              {'foo': 'bar'}
            ]
          }
        })
        expect(res).to.be.deep.equal({'type': 'file'})
      })
    })
  })
})

describe('js2dt.convertDateType()', function () {
  var convertDateType = js2dt.__get__('convertDateType')
  context('when type is `string` and `pattern` is present', function () {
    context('when pattern matches date-only', function () {
      it('should change type to `date-only` and remove pattern', function () {
        var obj = convertDateType({
          'type': 'string', 'pattern': constants.dateOnlyPattern})
        expect(obj).to.have.property('type', 'date-only')
        expect(obj).to.not.have.property('pattern')
      })
    })
    context('when pattern matches time-only', function () {
      it('should change type to `time-only` and remove pattern', function () {
        var obj = convertDateType({
          'type': 'string', 'pattern': constants.timeOnlyPattern})
        expect(obj).to.have.property('type', 'time-only')
        expect(obj).to.not.have.property('pattern')
      })
    })
    context('when pattern matches datetime-only', function () {
      it('should change type to `datetime-only` and remove pattern', function () {
        var obj = convertDateType({
          'type': 'string', 'pattern': constants.dateTimeOnlyPattern})
        expect(obj).to.have.property('type', 'datetime-only')
        expect(obj).to.not.have.property('pattern')
      })
    })
    context('when pattern matches datetime and format is rfc3339', function () {
      it('should change type to `datetime` with `format` of rfc3339 and del pattern', function () {
        var obj = convertDateType({
          'type': 'string', 'pattern': constants.RFC3339DatetimePattern})
        expect(obj).to.have.property('type', 'datetime')
        expect(obj).to.have.property('format', constants.RFC3339)
        expect(obj).to.not.have.property('pattern')
      })
    })
    context('when pattern matches datetime and format is rfc2616', function () {
      it('should change type to `datetime` with `format` of rfc2616 and del pattern', function () {
        var obj = convertDateType({
          'type': 'string', 'pattern': constants.RFC2616DatetimePattern})
        expect(obj).to.have.property('type', 'datetime')
        expect(obj).to.have.property('format', constants.RFC2616)
        expect(obj).to.not.have.property('pattern')
      })
    })
  })
  context('when type is not string', function () {
    it('should return object not changed', function () {
      var obj = convertDateType({'type': 'foobar', 'pattern': 'asd'})
      expect(obj).to.deep.equal({'type': 'foobar', 'pattern': 'asd'})
    })
  })
  context('when no pattern present', function () {
    it('should return object not changed', function () {
      var obj = convertDateType({'type': 'string'})
      expect(obj).to.deep.equal({'type': 'string'})
    })
  })
  context('pattern does not match date[time]', function () {
    it('should return object not changed', function () {
      var obj = convertDateType({'type': 'string', 'pattern': 'asd'})
      expect(obj).to.deep.equal({'type': 'string', 'pattern': 'asd'})
    })
  })
})

describe('js2dt.convertDefinedFormat()', function () {
  var convertDefinedFormat = js2dt.__get__('convertDefinedFormat')
  context('when format is string "date-time"', function () {
    it('should replace value of format with regexp RFC3339DatetimePattern', function () {
      var obj = convertDefinedFormat({
        'type': 'string',
        'format': 'date-time'
      })
      expect(obj).to.deep.equal({
        'type': 'string',
        'pattern': constants.FORMAT_REGEXPS['date-time']
      })
    })
  })
  context('when format is string "email"', function () {
    it('should replace value of format with regexp RFC5332Email', function () {
      var obj = convertDefinedFormat({
        'type': 'string',
        'format': 'email'
      })
      expect(obj).to.deep.equal({
        'type': 'string',
        'pattern': constants.FORMAT_REGEXPS['email']
      })
    })
  })
  context('when format is string "hostname"', function () {
    it('should replace value of format with regexp for hostname', function () {
      var obj = convertDefinedFormat({
        'type': 'string',
        'format': 'hostname'
      })
      expect(obj).to.deep.equal({
        'type': 'string',
        'pattern': constants.FORMAT_REGEXPS['hostname']
      })
    })
  })
  context('when format is string "ipv4"', function () {
    it('should replace value of format with regexp for ipv4', function () {
      var obj = convertDefinedFormat({
        'type': 'string',
        'format': 'ipv4'
      })
      expect(obj).to.deep.equal({
        'type': 'string',
        'pattern': constants.FORMAT_REGEXPS['ipv4']
      })
    })
  })
  context('when format is string "ipv6"', function () {
    it('should replace value of format with regexp for ipv6', function () {
      var obj = convertDefinedFormat({
        'type': 'string',
        'format': 'ipv6'
      })
      expect(obj).to.deep.equal({
        'type': 'string',
        'pattern': constants.FORMAT_REGEXPS['ipv6']
      })
    })
  })
  context('when format is string "uri"', function () {
    it('should replace value of format with regexp for uri', function () {
      var obj = convertDefinedFormat({
        'type': 'string',
        'format': 'uri'
      })
      expect(obj).to.deep.equal({
        'type': 'string',
        'pattern': constants.FORMAT_REGEXPS['uri']
      })
    })
  })
})
describe('js2dt.convertPatternProperties()', function () {
  var convertPatternProperties = js2dt.__get__('convertPatternProperties')
  context('when a jsonSchema patternProperties keyword is found', function () {
    it('should convert it to a RAML pattern property', function () {
      var raml = convertPatternProperties({
        'properties': {
          '/': {}
        },
        'patternProperties': {
          '^(/[^/]+)+$': {type: 'string'},
          'p': {}
        }
      })
      expect(raml).to.deep.equal({
        'properties': {
          '/': {},
          '/^(/[^/]+)+$/': {type: 'string'},
          '/p/': {}
        }
      })
    })
  })
})

describe('js2dt.convertRef()', function () {
  var convertRef = js2dt.__get__('convertRef')
  it('should replace $ref with type name', function () {
    var data = {'$ref': '#/definitions/username'}
    var raml = convertRef(data)
    expect(raml).to.be.deep.equal({'type': 'Username'})
  })
})

describe('js2dt.RAMLEmitter.ramlForm()', function () {
  context('when input is not an Object', function () {
    var emitter = new RAMLEmitter()
    it('should return data unchanged', function () {
      var result = emitter.ramlForm('foo')
      expect(result).to.be.equal('foo')
    })
  })
  it('should spread `required` root value across properties', function () {
    var emitter = new RAMLEmitter()
    var data = {
      'type': 'object',
      'properties': {
        'name': {
          'type': 'string'
        },
        'address': {
          'type': 'string'
        }
      },
      'required': ['name', 'address']
    }
    var raml = emitter.ramlForm(data, [])
    expect(raml)
      .to.have.deep.property('properties.name.required').and
      .to.be.true
    expect(raml)
      .to.have.deep.property('properties.address.required').and
      .to.be.true
  })
  it('should make properties not present in `required` required=false', function () {
    var emitter = new RAMLEmitter()
    var data = {
      'type': 'object',
      'properties': {
        'address': {
          'type': 'string'
        }
      },
      'required': []
    }
    var raml = emitter.ramlForm(data, [])
    expect(raml)
      .to.have.deep.property('properties.address.required').and
      .to.be.false
  })
  it('should remove root `required` keyword while hoisting', function () {
    var emitter = new RAMLEmitter()
    var data = {
      'type': 'object',
      'required': ['name'],
      'properties': {
        'name': {
          'type': 'string'
        }
      }
    }
    var raml = emitter.ramlForm(data, [])
    expect(raml).to.not.have.property('required')
  })
  it('should not spread non-property names', function () {
    var emitter = new RAMLEmitter()
    var data = {
      'type': 'object',
      'required': ['xml'],
      'properties': {
        'name': {
          'type': 'string',
          'xml': {}
        }
      }
    }
    var raml = emitter.ramlForm(data, [])
    expect(raml).to.not.have.property('required')
    expect(raml).to.not.have.deep.property(
      'properties.name.xml.required')
  })
  it('should process nested', function () {
    var emitter = new RAMLEmitter()
    var data = {
      'type': 'object',
      'properties': {
        'bio': {
          'type': 'object',
          'properties': {
            'event': {
              'type': 'string',
              'media': {'binaryEncoding': 'binary'}
            }
          }
        },
        'siblings': {
          'foo': [{'type': 'null'}]
        }
      }
    }
    var raml = emitter.ramlForm(data, [])
    expect(raml).to.have.deep.property(
      'properties.bio.properties.event.type', 'file')
    expect(raml).to.not.have.deep.property(
      'properties.bio.properties.event.media')
    expect(raml).to.have.deep.property(
      'properties.siblings.foo[0].type', 'nil')
  })
  context('when $ref IS present in input data', function () {
    var emitter = new RAMLEmitter()
    it('should replace $ref with defined type name', function () {
      var data = {'$ref': '#/definitions/username'}
      var raml = emitter.ramlForm(data, [])
      expect(raml).to.be.deep.equal({'type': 'Username'})
    })
  })
  context('when $ref IS NOT present in input data', function () {
    var emitter = new RAMLEmitter()
    it('should change types', function () {
      var data = {
        'properties': {
          'name': {'type': 'null'},
          'photo': {
            'type': 'string',
            'media': {'binaryEncoding': 'binary'}
          },
          'dob': {'type': 'string', 'pattern': constants.dateOnlyPattern}
        }
      }
      var raml = emitter.ramlForm(data, [])
      expect(raml).to.have.deep.property('properties.name.type', 'nil')
      expect(raml).to.have.deep.property('properties.photo.type', 'file')
      expect(raml).to.not.have.deep.property('properties.photo.media')
      expect(raml).to.have.deep.property('properties.dob.type', 'date-only')
      expect(raml).to.not.have.deep.property('properties.dob.pattern')
    })
  })
  context('when combinations (allOf/anyOf/oneOf) are used', function () {
    var emitter = new RAMLEmitter()
    it('should convert then properly', function () {
      var data = {
        'type': 'string',
        'anyOf': [
          {'pattern': 'foo'},
          {'pattern': 'bar'}
        ]
      }
      expect(emitter)
        .to.have.property('types').and
        .to.be.deep.equal({})
      var raml = emitter.ramlForm(data, [], 'foo')
      expect(raml).to.have.property('type', 'FooParentType0 | FooParentType1')
      expect(raml).to.not.have.property('anyOf')
      expect(emitter).to.have.deep.property(
        'types.FooParentType0.type', 'string')
      expect(emitter).to.have.deep.property(
        'types.FooParentType0.pattern', 'foo')
      expect(emitter).to.have.deep.property(
        'types.FooParentType1.type', 'string')
      expect(emitter).to.have.deep.property(
        'types.FooParentType1.pattern', 'bar')
    })
  })
})

describe('js2dt.RAMLEmitter.translateDefinitions()', function () {
  context('when input has false value', function () {
    var emitter = new RAMLEmitter()
    it('should return empty object', function () {
      expect(emitter.translateDefinitions(undefined))
        .to.be.deep.equal({})
    })
  })
  context('when input is not empty', function () {
    var emitter = new RAMLEmitter()
    it('should convert definitions to RAML data types', function () {
      var defs = {
        'address': {
          'type': 'object',
          'properties': {
            'street': {'type': 'string'},
            'city': {'type': 'null'}
          },
          'required': ['street']
        }
      }
      var res = emitter.translateDefinitions(defs)
      expect(res)
        .to.have.deep.property('Address.properties.street.required').and
        .to.be.true
      expect(res).to.have.deep.property(
        'Address.properties.city.type', 'nil')
      expect(res).to.not.have.deep.property('Address.required')
    })
  })
})

describe('js2dt.RAMLEmitter.processArray()', function () {
  var emitter = new RAMLEmitter()
  it('should transform each element of array', function () {
    var result = emitter.processArray(
      [{'type': 'null'},
       {'type': 'string', 'media': {'binaryEncoding': 'binary'}}], [])
    expect(result).to.have.lengthOf(2)
    expect(result).to.have.deep.property('[0].type', 'nil')
    expect(result).to.have.deep.property('[1].type', 'file')
  })
})

describe('js2dt.RAMLEmitter.processNested()', function () {
  it('should process nested arrays', function () {
    var emitter = new RAMLEmitter()
    var data = {'foo': [{'type': 'null'}]}
    var result = emitter.processNested(data, [])
    expect(result)
      .to.have.property('foo').and
      .to.have.lengthOf(1)
    expect(result).to.have.deep.property('foo[0].type', 'nil')
  })
  it('should process nested objects', function () {
    var emitter = new RAMLEmitter()
    var data = {'foo': {'type': 'null'}}
    var result = emitter.processNested(data, [])
    expect(result)
      .to.have.property('foo').and
      .to.have.all.keys('type')
    expect(result).to.have.deep.property('foo.type', 'nil')
  })
  it('should return empty object if no nesting is present', function () {
    var emitter = new RAMLEmitter()
    var result = emitter.processNested({'type': 'null'}, [])
    expect(result).to.be.deep.equal({})
  })
})

describe('js2dt.RAMLEmitter() init', function () {
  it('should assign properties properly', function () {
    var emitter = new RAMLEmitter({'foo': 1}, 'Bar')
    expect(emitter).to.have.property('mainTypeName', 'Bar')
    expect(emitter)
      .to.have.property('types').and
      .to.be.deep.equal({})
    expect(emitter)
      .to.have.property('data').and
      .to.be.deep.equal({'foo': 1})
  })
})

describe('js2dt.RAMLEmitter.processDefinitions()', function () {
  it('should process definitions and update types', function () {
    var data = {
      'definitions': {
        'address': {
          'type': 'object',
          'properties': {
            'city': {'type': 'null'}
          }
        }
      }
    }
    var emitter = new RAMLEmitter(data)
    expect(emitter)
      .to.have.property('types').and
      .to.be.deep.equal({})
    expect(emitter).to.have.deep.property('data.definitions')
    emitter.processDefinitions()
    expect(emitter).to.have.deep.property(
      'types.Address.properties.city.type', 'nil')
    expect(emitter).to.not.have.deep.property('data.definitions')
  })
})

describe('js2dt.RAMLEmitter.processMainData()', function () {
  it('should delete $schema, process main data and update types', function () {
    var data = {
      '$schema': '23123123',
      'type': 'object',
      'properties': {
        'city': {'type': 'null'}
      }
    }
    var emitter = new RAMLEmitter(data, 'Address')
    emitter.processMainData()
    expect(emitter).to.have.deep.property(
      'types.Address.properties.city.type', 'nil')
    expect(emitter).to.not.have.deep.property(
      'types.Address.$schema')
  })
})

describe('js2dt.RAMLEmitter.emit()', function () {
  it('should run convertion process and return results', function () {
    var data = {
      'type': 'object',
      'properties': {
        'city': {'type': 'null'}
      }
    }
    var emitter = new RAMLEmitter(data, 'Address')
    var types = emitter.emit()
    expect(types).to.have.deep.property(
      'types.Address.properties.city.type', 'nil')
  })
})

describe('js2dt.RAMLEmitter.processCombinations()', function () {
  it('should convert anyOf into RAML union', function () {
    var data = {
      'anyOf': [
        {'type': 'string'},
        {'type': 'number'}
      ]
    }
    var emitter = new RAMLEmitter(data)
    expect(emitter)
      .to.have.property('types').and
      .to.be.deep.equal({})
    var newData = emitter.processCombinations(data, 'anyOf', 'cat')
    expect(newData).to.have.property('type', 'CatParentType0 | CatParentType1')
    expect(newData).to.not.have.property('anyOf')
    expect(emitter).to.have.deep.property(
      'types.CatParentType0.type', 'string')
    expect(emitter).to.have.deep.property(
      'types.CatParentType1.type', 'number')
  })
  it('should convert oneOf into RAML union', function () {
    var data = {
      'oneOf': [
        {'type': 'string'},
        {'type': 'number'}
      ]
    }
    var emitter = new RAMLEmitter(data)
    expect(emitter)
      .to.have.property('types').and
      .to.be.deep.equal({})
    var newData = emitter.processCombinations(data, 'oneOf', 'cat')
    expect(newData).to.have.property('type', 'CatParentType0 | CatParentType1')
    expect(newData).to.not.have.property('oneOf')
    expect(emitter).to.have.deep.property(
      'types.CatParentType0.type', 'string')
    expect(emitter).to.have.deep.property(
      'types.CatParentType1.type', 'number')
  })
  it('should convert allOf into RAML multiple inheritance', function () {
    var data = {
      'allOf': [
        {'type': 'string'},
        {'type': 'number'}
      ]
    }
    var emitter = new RAMLEmitter(data)
    expect(emitter)
      .to.have.property('types').and
      .to.be.deep.equal({})
    var newData = emitter.processCombinations(data, 'allOf', 'cat')
    expect(newData)
      .to.have.property('type').and
      .to.be.deep.equal(['CatParentType0', 'CatParentType1'])
    expect(newData).to.not.have.property('allOf')
    expect(emitter).to.have.deep.property(
      'types.CatParentType0.type', 'string')
    expect(emitter).to.have.deep.property(
      'types.CatParentType1.type', 'number')
  })
  context('when prop name is not provided', function () {
    it('should use main type name', function () {
      var data = {
        'anyOf': [
          {'type': 'string'},
          {'type': 'number'}
        ]
      }
      var emitter = new RAMLEmitter(data, 'Cat')
      expect(emitter)
        .to.have.property('types').and
        .to.be.deep.equal({})
      var newData = emitter.processCombinations(data, 'anyOf')
      expect(newData).to.have.property('type', 'CatParentType0 | CatParentType1')
      expect(newData).to.not.have.property('anyOf')
      expect(emitter).to.have.deep.property(
        'types.CatParentType0.type', 'string')
      expect(emitter).to.have.deep.property(
        'types.CatParentType1.type', 'number')
    })
  })
})

describe('js2dt.getCombinationsKey()', function () {
  var getCombinationsKey = js2dt.__get__('getCombinationsKey')
  it('should return proper combinations key', function () {
    expect(getCombinationsKey({'anyOf': 1})).to.be.equal('anyOf')
    expect(getCombinationsKey({'allOf': 1})).to.be.equal('allOf')
    expect(getCombinationsKey({'oneOf': 1})).to.be.equal('oneOf')
  })
  context('when object does not contain any combinations prop', function () {
    it('should return undefined', function () {
      expect(getCombinationsKey({})).to.be.undefined
    })
  })
})

describe('js2dt.setCombinationsTypes()', function () {
  var setCombinationsTypes = js2dt.__get__('setCombinationsTypes')
  it('should add object type to all combination schemas missing type', function () {
    var data = {
      'type': 'string',
      'anyOf': [
        {'pattern': 'x'},
        {'type': 'number'}
      ]
    }
    var res = setCombinationsTypes(data, 'anyOf')
    expect(res).to.have.property('type', 'string')
    expect(res).to.have.deep.property('anyOf[0].type', 'string')
    expect(res).to.have.deep.property('anyOf[1].type', 'number')
  })
})

describe('js2dt.getCombinationTypes()', function () {
  var getCombinationTypes = js2dt.__get__('getCombinationTypes')
  context('when input key is allOf', function () {
    it('should return types as is', function () {
      var res = getCombinationTypes(['x', 'y'], 'allOf')
      expect(res).to.be.deep.equal(['x', 'y'])
    })
  })
  context('when input key is oneOf', function () {
    it('should return types joined by pipe (|)', function () {
      var res = getCombinationTypes(['x', 'y'], 'oneOf')
      expect(res).to.be.equal('x | y')
    })
  })
  context('when input key is anyOf', function () {
    it('should return types joined by pipe (|)', function () {
      var res = getCombinationTypes(['x', 'y'], 'anyOf')
      expect(res).to.be.equal('x | y')
    })
  })
})
