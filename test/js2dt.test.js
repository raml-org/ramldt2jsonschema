/* global describe, it, context */

const { expect, assert } = require('chai')
const join = require('path').join
const rewire = require('rewire')
const js2dt = rewire('../src/js2dt')
const constants = require('../src/constants')
const fs = require('fs')

const JSON_FILE_NAME = join(__dirname, 'examples/schema_example.json')
const RamlConverter = js2dt.__get__('RamlConverter')

describe('js2dt.js2dt()', function () {
  const jsonData = fs.readFileSync(JSON_FILE_NAME).toString()
  context('when applied to valid schema', function () {
    it('should produce valid RAML type library', function () {
      const data = js2dt.js2dt(jsonData, 'Product')
      expect(data).to.be.a('object')
      expect(data).to.have.nested.property('Product')
      expect(data).to.have.nested.property('Address.properties.state.enum.0', 'AA')
      expect(data).to.not.have.property('$schema')
    })
    it('should retain boolean additionalProperties as boolean', function () {
      const jsdata = {
        '$schema': 'http://json-schema.org/draft-06/schema#',
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
      const data = js2dt.js2dt(JSON.stringify(jsdata), 'Product')
      expect(data).to.have.nested.deep.property('Product.properties.list?.items.0.enum', ['NW', 'NE', 'SW', 'SE'])
      expect(data).to.have.nested.property('Product.additionalProperties.', false)
    })
    it('should change additionalProperties: {} to true', function () {
      const jsdata = {
        '$schema': 'http://json-schema.org/draft-06/schema#',
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
      const data = js2dt.js2dt(JSON.stringify(jsdata), 'Product')
      expect(data).to.have.nested.property(
        'Product.additionalProperties.', true)
    })
    it('should correctly handle additionalProperties: json SCHEMA', function () {
      const jsdata = {
        '$schema': 'http://json-schema.org/draft-06/schema#',
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
      const data = js2dt.js2dt(JSON.stringify(jsdata), 'Product')
      expect(data).to.have.nested.property(
        'Product.properties.//.type', 'string')
      expect(data).to.have.nested.property(
        'Product.additionalProperties', false)
    })
    it('should handle JSON definitions and refs', function () {
      const data = js2dt.js2dt(jsonData, 'Product')
      expect(data).to.have.nested.property(
        'Address.properties.planet?', 'nil')
      expect(data).to.have.nested.property(
        'Product.properties.madeIn?', 'Address')
      expect(data).to.not.have.property('definitions')
    })
    it('should handle anyOf in files properly', function () {
      const data = js2dt.js2dt(jsonData, 'Product')
      expect(data).to.have.nested.property(
        'Product.properties.photo?.type', 'file')
      expect(data).to.not.have.nested.property(
        'Product.properties.photo?.media')
      expect(data).to.have.nested.property(
        'Product.properties.photo?.fileTypes[0]', 'image/jpeg')
      expect(data).to.have.nested.property(
        'Product.properties.photo?.fileTypes[1]', 'image/png')
    })
    it('should drop json schema keyword additionalItems', function () {
      const jsdata = {
        '$schema': 'http://json-schema.org/draft-06/schema#',
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
      const data = js2dt.js2dt(JSON.stringify(jsdata), 'Something')
      expect(data).to.not.have.nested.property(
        'SomethingWithAList.properties.list.additionalItems')
    })
    it('should convert exclusiveMinimum & exclusiveMaximum keywords to minimum and maximum', function () {
      const jsdata = {
        '$schema': 'http://json-schema.org/draft-06/schema#',
        'title': 'RandomNumber',
        'type': 'object',
        'properties': {
          'count': {
            'type': 'number',
            'exclusiveMinimum': 3,
            'exclusiveMaximum': 100
          }
        },
        'required': [
          'count'
        ],
        'additionalProperties': false
      }
      const data = js2dt.js2dt(JSON.stringify(jsdata), 'Product')
      expect(data).to.have.nested.property(
        'Product.properties.count.minimum').and
        .to.equal(3)
      expect(data).to.have.nested.property(
        'Product.properties.count.maximum').and
        .to.equal(100)
    })
    it('should drop json schema keyword "required"', function () {
      const jsdata = {
        '$schema': 'http://json-schema.org/draft-06/schema#',
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
      const data = js2dt.js2dt(JSON.stringify(jsdata), 'Location')
      expect(data).to.not.have.nested.property(
        'Location.required')
      expect(data).to.not.have.nested.property(
        'Location.properties.count.exclusiveMaximum')
    })
    it('should shorten properties with only type defined', function () {
      const jsdata = {
        '$schema': 'http://json-schema.org/draft-04/schema#',
        'type': 'object',
        'title': 'Location',
        'required': [
          'id',
          'label',
          'latitude',
          'longitude'
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
      const data = js2dt.js2dt(JSON.stringify(jsdata), 'Location')
      expect(data).to.have.nested.property(
        'Location.properties.id').and
        .to.equal('string')
      expect(data).to.have.nested.property(
        'Location.properties.label').and
        .to.equal('string')
      expect(data).to.have.nested.property(
        'Location.properties.latitude.type').and
        .to.equal('number')
    })
    it('should change js schema title to raml displayName', function () {
      const jsondata = {
        '$schema': 'http://json-schema.org/draft-06/schema#',
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
      const data = js2dt.js2dt(JSON.stringify(jsondata), 'Product')
      expect(data).to.have.nested.property(
        'Product.displayName')
      expect(data).to.not.have.nested.property(
        'Product.title')
      expect(data).to.have.nested.property(
        'Product.properties.title?.displayName')
      expect(data).to.not.have.nested.property(
        'Product.properties.title?.title')
      expect(data).to.have.nested.property(
        'Product.properties.start.displayName')
      expect(data).to.not.have.nested.property(
        'Product.properties.start.title')
      expect(data).to.have.nested.property(
        'Product.properties.end.displayName')
      expect(data).to.not.have.nested.property(
        'Product.properties.end.title')
    })
  })
  context('when error occurs while schema processing', function () {
    it('should not produce valid RAML type library', function () {
      assert.throws(() => js2dt.js2dt('foobar.json', 'Product'), Error, 'Unexpected token o')
    })
  })
})

describe('js2dt.convertType()', function () {
  const convertType = js2dt.__get__('convertType')
  it('should change type `null` to `nil`', function () {
    const obj = convertType({ 'type': 'null' })
    expect(obj).to.deep.equal({ 'type': 'nil' })
  })
  context('when does not match any type', function () {
    it('should return object not changed', function () {
      const obj = convertType({ 'type': 'foobar' })
      expect(obj).to.deep.equal({ 'type': 'foobar' })
    })
  })
})

describe('js2dt.isFileType()', function () {
  const isFileType = js2dt.__get__('isFileType')
  it('should return true for valid file types', function () {
    const data = {
      'type': 'string',
      'media': { 'binaryEncoding': 'binary' }
    }
    expect(isFileType(data)).to.equal(true)
  })
  context('when type is not string', function () {
    it('should return false', function () {
      const data = {
        'type': 'asd',
        'media': { 'binaryEncoding': 'binary' }
      }
      expect(isFileType(data)).to.equal(false)
    })
  })
  context('when no media is set', function () {
    it('should return false', function () {
      const data = {
        'type': 'string'
      }
      expect(isFileType(data)).to.equal(false)
    })
  })
  context('when binaryEncoding is not `binary`', function () {
    it('should return false', function () {
      const data = {
        'type': 'asd',
        'media': { 'binaryEncoding': 'asdasd' }
      }
      expect(isFileType(data)).to.equal(false)
    })
  })
})

describe('js2dt.convertFileType()', function () {
  const convertFileType = js2dt.__get__('convertFileType')
  it('should just change type to `file` and remove media', function () {
    const res = convertFileType({ 'type': 'foo', 'media': 1 })
    expect(res).to.be.deep.equal({ 'type': 'file' })
  })
  context('when anyOf contains data', function () {
    it('should move mediaTypes to fileTypes', function () {
      const res = convertFileType({
        'type': 'foo',
        'media': {
          'anyOf': [
            { 'mediaType': 'image/png' },
            { 'mediaType': 'image/jpeg' },
            { 'foo': 'bar' }
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
        const res = convertFileType({
          'type': 'foo',
          'media': {
            'anyOf': [
              { 'foo': 'bar' }
            ]
          }
        })
        expect(res).to.be.deep.equal({ 'type': 'file' })
      })
    })
  })
})

describe('js2dt.convertDateType()', function () {
  const convertDateType = js2dt.__get__('convertDateType')
  context('when type is `string` and `pattern` is present', function () {
    context('when pattern matches date-only', function () {
      it('should change type to `date-only` and remove pattern', function () {
        const obj = convertDateType({
          'type': 'string', 'pattern': constants.dateOnlyPattern })
        expect(obj).to.have.property('type', 'date-only')
        expect(obj).to.not.have.property('pattern')
      })
    })
    context('when pattern matches time-only', function () {
      it('should change type to `time-only` and remove pattern', function () {
        const obj = convertDateType({
          'type': 'string', 'pattern': constants.timeOnlyPattern })
        expect(obj).to.have.property('type', 'time-only')
        expect(obj).to.not.have.property('pattern')
      })
    })
    context('when pattern matches datetime-only', function () {
      it('should change type to `datetime-only` and remove pattern', function () {
        const obj = convertDateType({
          'type': 'string', 'pattern': constants.dateTimeOnlyPattern })
        expect(obj).to.have.property('type', 'datetime-only')
        expect(obj).to.not.have.property('pattern')
      })
    })
    context('when pattern matches datetime and format is rfc3339', function () {
      it('should change type to `datetime` with `format` of rfc3339 and del pattern', function () {
        const obj = convertDateType({
          'type': 'string', 'pattern': constants.RFC3339DatetimePattern })
        expect(obj).to.have.property('type', 'datetime')
        expect(obj).to.have.property('format', constants.RFC3339)
        expect(obj).to.not.have.property('pattern')
      })
    })
    context('when pattern matches datetime and format is rfc2616', function () {
      it('should change type to `datetime` with `format` of rfc2616 and del pattern', function () {
        const obj = convertDateType({
          'type': 'string', 'pattern': constants.RFC2616DatetimePattern })
        expect(obj).to.have.property('type', 'datetime')
        expect(obj).to.have.property('format', constants.RFC2616)
        expect(obj).to.not.have.property('pattern')
      })
    })
  })
  context('when type is not string', function () {
    it('should return object not changed', function () {
      const obj = convertDateType({ 'type': 'foobar', 'pattern': 'asd' })
      expect(obj).to.deep.equal({ 'type': 'foobar', 'pattern': 'asd' })
    })
  })
  context('when no pattern present', function () {
    it('should return object not changed', function () {
      const obj = convertDateType({ 'type': 'string' })
      expect(obj).to.deep.equal({ 'type': 'string' })
    })
  })
  context('pattern does not match date[time]', function () {
    it('should return object not changed', function () {
      const obj = convertDateType({ 'type': 'string', 'pattern': 'asd' })
      expect(obj).to.deep.equal({ 'type': 'string', 'pattern': 'asd' })
    })
  })
})

describe('js2dt.convertDefinedFormat()', function () {
  const convertDefinedFormat = js2dt.__get__('convertDefinedFormat')
  context('when format is string "date-time"', function () {
    it('should replace value of format with regexp RFC3339DatetimePattern', function () {
      const obj = convertDefinedFormat({
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
      const obj = convertDefinedFormat({
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
      const obj = convertDefinedFormat({
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
      const obj = convertDefinedFormat({
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
      const obj = convertDefinedFormat({
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
      const obj = convertDefinedFormat({
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
  const convertPatternProperties = js2dt.__get__('convertPatternProperties')
  context('when a jsonSchema patternProperties keyword is found', function () {
    it('should convert it to a RAML pattern property', function () {
      const raml = convertPatternProperties({
        'properties': {
          '/': {}
        },
        'patternProperties': {
          '^(/[^/]+)+$': { type: 'string' },
          'p': {}
        }
      })
      expect(raml).to.deep.equal({
        'properties': {
          '/': {},
          '/^(/[^/]+)+$/': { type: 'string' },
          '/p/': {}
        }
      })
    })
  })
})

describe('js2dt.convertRef()', function () {
  const convertRef = js2dt.__get__('convertRef')
  it('should replace $ref with type name', function () {
    const data = { '$ref': '#/definitions/username' }
    const raml = convertRef(data)
    expect(raml).to.be.deep.equal({ 'type': 'Username' })
  })
})

describe('js2dt.RamlConverter.parseType()', function () {
  context.skip('when input is not an Object', function () {
    const emitter = new RamlConverter()
    it('should return data unchanged', function () {
      const result = emitter.parseType('foo')
      expect(result).to.be.equal('foo')
    })
  })
  it('should spread `required` root value across properties', function () {
    const emitter = new RamlConverter()
    const data = {
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
    const raml = emitter.parseType(data, false)
    expect(raml)
      .to.not.have.nested.property('properties.name.required')
    expect(raml)
      .to.not.have.nested.property('properties.address.required')
  })
  it('should make properties not present in `required` <prop>?', function () {
    const data = {
      'type': 'object',
      'properties': {
        'address': {
          'type': 'string'
        }
      },
      'required': []
    }
    const raml = new RamlConverter(data, []).parseType(data, false)
    expect(raml)
      .to.have.nested.property('properties.address?')
  })
  it('should remove root `required` keyword while hoisting', function () {
    const data = {
      'type': 'object',
      'required': ['name'],
      'properties': {
        'name': {
          'type': 'string'
        }
      }
    }
    const raml = new RamlConverter(data, []).parseType(data, false)
    expect(raml).to.not.have.property('required')
  })
  it('should not spread non-property names', function () {
    const emitter = new RamlConverter()
    const data = {
      'type': 'object',
      'required': ['xml'],
      'properties': {
        'name': {
          'type': 'string',
          'xml': {}
        }
      }
    }
    const raml = emitter.parseType(data, false)
    expect(raml).to.not.have.property('required')
    expect(raml).to.not.have.nested.property(
      'properties.name.xml.required')
  })
  // this is invalid
  it.skip('should process nested', function () {
    const emitter = new RamlConverter()
    const data = {
      'type': 'object',
      'properties': {
        'bio': {
          'type': 'object',
          'properties': {
            'event': {
              'type': 'string',
              'media': { 'binaryEncoding': 'binary' }
            }
          }
        },
        'siblings': {
          'foo': [{ 'type': 'null' }]
        }
      }
    }
    const raml = emitter.parseType(data, false)
    expect(raml).to.have.nested.property(
      'properties.bio?.properties.event?', 'file')
    expect(raml).to.not.have.nested.property(
      'properties.bio?.properties.event?.media')
    expect(raml).to.have.nested.property(
      'properties.siblings?.foo[0]', 'nil')
  })
  context('when $ref IS present in input data', function () {
    const emitter = new RamlConverter()
    it('should replace $ref with defined type name', function () {
      const data = { '$ref': '#/definitions/username' }
      const raml = emitter.parseType(data, false)
      expect(raml).to.be.deep.equal({ type: 'Username' })
    })
  })
  context('when $ref IS NOT present in input data', function () {
    const emitter = new RamlConverter()
    it('should change types', function () {
      const data = {
        'properties': {
          'name': { 'type': 'null' },
          'photo': {
            'type': 'string',
            'media': { 'binaryEncoding': 'binary' }
          },
          'dob': { 'type': 'string', 'pattern': constants.dateOnlyPattern }
        }
      }
      const raml = emitter.parseType(data, false)
      expect(raml).to.have.nested.property('properties.name?', 'nil')
      expect(raml).to.have.nested.property('properties.photo?', 'file')
      expect(raml).to.not.have.nested.property('properties.photo.media')
      expect(raml).to.have.nested.property('properties.dob?', 'date-only')
      expect(raml).to.not.have.nested.property('properties.dob.pattern')
    })
  })
  context('when combinations (allOf/anyOf/oneOf) are used', function () {
    const emitter = new RamlConverter()
    it('should convert them properly', function () {
      const data = {
        'type': 'string',
        'anyOf': [
          { 'pattern': 'foo' },
          { 'pattern': 'bar' }
        ]
      }
      expect(emitter)
        .to.have.property('types').and
        .to.be.deep.equal({})
      const raml = emitter.parseType(data, false, 'foo')
      expect(raml).to.have.nested.property('type', 'FooParentType0 | FooParentType1')
      expect(raml).to.not.have.property('anyOf')
      expect(emitter).to.have.nested.property(
        'types.FooParentType0.type', 'string')
      expect(emitter).to.have.nested.property(
        'types.FooParentType0.pattern', 'foo')
      expect(emitter).to.have.nested.property(
        'types.FooParentType1.type', 'string')
      expect(emitter).to.have.nested.property(
        'types.FooParentType1.pattern', 'bar')
    })
  })
})

describe('js2dt.RamlConverter.translateDefinitions()', function () {
  context('when input has false value', function () {
    const emitter = new RamlConverter()
    it('should return empty object', function () {
      expect(emitter.parseDefinitions(undefined))
        .to.be.deep.equal({})
    })
  })
  context('when input is not empty', function () {
    const emitter = new RamlConverter()
    it('should convert definitions to RAML data types', function () {
      const defs = {
        'address': {
          'type': 'object',
          'properties': {
            'street': { 'type': 'string' },
            'city': { 'type': 'null' }
          },
          'required': ['street']
        }
      }
      const res = emitter.parseDefinitions(defs)
      expect(res)
        .to.have.nested.property('Address.properties.street')
      expect(res).to.have.nested.property(
        'Address.properties.city?', 'nil')
      expect(res).to.not.have.nested.property('Address.required')
    })
  })
})

describe.skip('js2dt.RamlConverter.processArray()', function () {
  const emitter = new RamlConverter()
  it('should transform each element of array', function () {
    const result = emitter.processArray([
      { 'type': 'null' },
      { 'type': 'string', 'media': { 'binaryEncoding': 'binary' } }
    ], [])
    console.log(result)
    expect(result).to.have.lengthOf(2)
    expect(result).to.have.nested.property('[0]', 'nil')
    expect(result).to.have.nested.property('[1]', 'file')
  })
})

// this is invalid
describe.skip('js2dt.RamlConverter.processNested()', function () {
  it('should process nested arrays', function () {
    const emitter = new RamlConverter()
    const data = { 'foo': [{ 'type': 'null' }] }
    const result = emitter.processNested(null, data, [])
    expect(result)
      .to.have.property('foo').and
      .to.have.lengthOf(1)
    expect(result).to.have.nested.property('foo[0]', 'nil')
  })
  it('should process nested objects', function () {
    const emitter = new RamlConverter()
    const data = { 'foo': { 'type': 'null' } }
    const result = emitter.processNested(null, data, [])
    expect(result)
      .to.have.property('foo').and
      .to.equal('nil')
    expect(result).to.have.nested.property('foo', 'nil')
  })
  it('should return empty object if no nesting is present', function () {
    const emitter = new RamlConverter()
    const result = emitter.processNested({ 'type': 'null' }, [])
    expect(result).to.be.deep.equal({})
  })
})

describe('js2dt.RamlConverter() init', function () {
  it('should assign properties properly', function () {
    const emitter = new RamlConverter({ 'foo': 1 }, 'Bar')
    expect(emitter).to.have.property('typeName', 'Bar')
    expect(emitter)
      .to.have.property('types').and
      .to.be.deep.equal({})
    expect(emitter)
      .to.have.property('data').and
      .to.be.deep.equal({ 'foo': 1 })
  })
})

describe('js2dt.RamlConverter.processDefinitions()', function () {
  it('should process definitions and update types', function () {
    const data = {
      'definitions': {
        'address': {
          'type': 'object',
          'properties': {
            'city': { 'type': 'null' }
          }
        }
      }
    }
    const emitter = new RamlConverter(data)
    expect(emitter)
      .to.have.property('types').and
      .to.be.deep.equal({})
    expect(emitter).to.have.nested.property('data.definitions')
    emitter.toRaml()
    expect(emitter).to.have.nested.property(
      'types.Address.properties.city?', 'nil')
  })
})

describe('js2dt.RamlConverter.processMainData()', function () {
  it('should delete $schema, process main data and update types', function () {
    const data = {
      '$schema': '23123123',
      'type': 'object',
      'properties': {
        'city': { 'type': 'null' }
      }
    }
    const emitter = new RamlConverter(data, 'Address')
    emitter.toRaml()
    expect(emitter).to.have.nested.property(
      'types.Address.properties.city?', 'nil')
    expect(emitter).to.not.have.nested.property(
      'types.Address.$schema')
  })
})

describe('js2dt.RamlConverter.emit()', function () {
  it('should run convertion process and return results', function () {
    const data = {
      'type': 'object',
      'properties': {
        'city': { 'type': 'null' }
      }
    }
    const emitter = new RamlConverter(data, 'Address')
    const types = emitter.toRaml()
    expect(types).to.have.nested.property('Address.properties.city?', 'nil')
  })
})

describe('js2dt.RamlConverter.processCombinations()', function () {
  it('should convert anyOf into RAML union', function () {
    const data = {
      'anyOf': [
        { 'type': 'string' },
        { 'type': 'number' }
      ]
    }
    const emitter = new RamlConverter(data)
    expect(emitter)
      .to.have.property('types').and
      .to.be.deep.equal({})
    const newData = emitter.processCombinations(data, 'anyOf', 'cat')
    expect(newData).to.have.property('type', 'CatParentType0 | CatParentType1')
    expect(newData).to.not.have.property('anyOf')
    expect(emitter).to.have.nested.property(
      'types.CatParentType0.type', 'string')
    expect(emitter).to.have.nested.property(
      'types.CatParentType1.type', 'number')
  })
  it('should convert oneOf into RAML union', function () {
    const data = {
      'oneOf': [
        { 'type': 'string' },
        { 'type': 'number' }
      ]
    }
    const emitter = new RamlConverter(data)
    expect(emitter)
      .to.have.property('types').and
      .to.be.deep.equal({})
    const newData = emitter.processCombinations(data, 'oneOf', 'cat')
    expect(newData).to.have.property('type', 'CatParentType0 | CatParentType1')
    expect(newData).to.not.have.property('oneOf')
    expect(emitter).to.have.nested.property(
      'types.CatParentType0.type', 'string')
    expect(emitter).to.have.nested.property(
      'types.CatParentType1.type', 'number')
  })
  it('should convert allOf into RAML multiple inheritance', function () {
    const data = {
      'allOf': [
        { 'type': 'string' },
        { 'type': 'number' }
      ]
    }
    const emitter = new RamlConverter(data)
    expect(emitter)
      .to.have.property('types').and
      .to.be.deep.equal({})
    const newData = emitter.processCombinations(data, 'allOf', 'cat')
    expect(newData)
      .to.have.property('type').and
      .to.be.deep.equal(['CatParentType0', 'CatParentType1'])
    expect(newData).to.not.have.property('allOf')
    expect(emitter).to.have.nested.property(
      'types.CatParentType0.type', 'string')
    expect(emitter).to.have.nested.property(
      'types.CatParentType1.type', 'number')
  })
  context('when prop name is not provided', function () {
    it('should use main type name', function () {
      const data = {
        'anyOf': [
          { 'type': 'string' },
          { 'type': 'number' }
        ]
      }
      const emitter = new RamlConverter(data, 'Cat')
      expect(emitter)
        .to.have.property('types').and
        .to.be.deep.equal({})
      const newData = emitter.processCombinations(data, 'anyOf')
      expect(newData).to.have.property('type', 'CatParentType0 | CatParentType1')
      expect(newData).to.not.have.property('anyOf')
      expect(emitter).to.have.nested.property(
        'types.CatParentType0.type', 'string')
      expect(emitter).to.have.nested.property(
        'types.CatParentType1.type', 'number')
    })
  })
})

describe('js2dt.getCombinationsKey()', function () {
  const getCombinationsKey = js2dt.__get__('getCombinationsKey')
  it('should return proper combinations key', function () {
    expect(getCombinationsKey({ 'anyOf': 1 })).to.be.equal('anyOf')
    expect(getCombinationsKey({ 'allOf': 1 })).to.be.equal('allOf')
    expect(getCombinationsKey({ 'oneOf': 1 })).to.be.equal('oneOf')
  })
  context('when object does not contain any combinations prop', function () {
    it('should return undefined', function () {
      expect(getCombinationsKey({})).to.equal(undefined)
    })
  })
})

describe('js2dt.setCombinationsTypes()', function () {
  const setCombinationsTypes = js2dt.__get__('setCombinationsTypes')
  it('should add object type to all combination schemas missing type', function () {
    const data = {
      'type': 'string',
      'anyOf': [
        { 'pattern': 'x' },
        { 'type': 'number' }
      ]
    }
    const res = setCombinationsTypes(data, 'anyOf')
    expect(res).to.have.property('type', 'string')
    expect(res).to.have.nested.property('anyOf[0].type', 'string')
    expect(res).to.have.nested.property('anyOf[1].type', 'number')
  })
})

describe('js2dt.getCombinationTypes()', function () {
  const getCombinationTypes = js2dt.__get__('getCombinationTypes')
  context('when input key is allOf', function () {
    it('should return types as is', function () {
      const res = getCombinationTypes(['x', 'y'], 'allOf')
      expect(res).to.be.deep.equal(['x', 'y'])
    })
  })
  context('when input key is oneOf', function () {
    it('should return types joined by pipe (|)', function () {
      const res = getCombinationTypes(['x', 'y'], 'oneOf')
      expect(res).to.be.equal('x | y')
    })
  })
  context('when input key is anyOf', function () {
    it('should return types joined by pipe (|)', function () {
      const res = getCombinationTypes(['x', 'y'], 'anyOf')
      expect(res).to.be.equal('x | y')
    })
  })
})

describe('exclusiveMinimum/exclusiveMaximum', function () {
  context('JSON Schema draft04', function () {
    it('should be stripped', function () {
      const jsdata = {
        '$id': 'some id',
        '$schema': 'http://json-schema.org/draft-04/schema#',
        'title': 'Product',
        'type': 'object',
        'properties': {
          'list': {
            'type': 'array'
          },
          'price': {
            'type': 'number',
            'minimum': 0,
            'exclusiveMinimum': true
          }
        },
        'required': ['price'],
        'additionalProperties': false
      }
      const data = js2dt.js2dt(JSON.stringify(jsdata), 'Product')
      expect(data).to.have.nested.property(
        'Product.properties.price.minimum', 0)
      expect(data).not.to.nested.deep.property(
        'Product.properties.price.exclusiveMinimum')
    })
  })
  context('JSON Schema draft06', function () {
    it('should be replaced with minimum or maximum', function () {
      const jsdata = {
        '$id': 'some id',
        '$schema': 'http://json-schema.org/draft-06/schema#',
        'title': 'Product',
        'type': 'object',
        'properties': {
          'list': {
            'type': 'array'
          },
          'price': {
            'type': 'number',
            'exclusiveMinimum': 0
          }
        },
        'required': ['price'],
        'additionalProperties': false
      }
      const data = js2dt.js2dt(JSON.stringify(jsdata), 'Product')
      expect(data).to.have.nested.property(
        'Product.properties.price.minimum', 0)
    })
  })
})
describe('draft06 changes', function () {
  context('$id keyword', function () {
    it('should get dropped', function () {
      const jsdata = {
        '$id': 'some id',
        '$schema': 'http://json-schema.org/draft-06/schema#',
        'title': 'Product',
        'type': 'object',
        'properties': {
          'list': {
            'type': 'array'
          }
        },
        'additionalProperties': false
      }
      const data = js2dt.js2dt(JSON.stringify(jsdata), 'Product')
      expect(data).not.to.have.nested.property(
        'Product.$id')
    })
  })
  context('$ref keyword', function () {
    it('should be ignored as a property name', function () {
      const jsdata = {
        '$schema': 'http://json-schema.org/draft-06/schema#',
        'title': 'Product',
        'type': 'object',
        'properties': {
          'list': {
            'type': 'array'
          },
          'price': {
            '$ref': '#/definitions/price'
          },
          '$ref': {
            'type': 'string'
          }
        },
        'required': ['list', 'price', '$ref'],
        'additionalProperties': false
      }
      const data = js2dt.js2dt(JSON.stringify(jsdata), 'Product')
      expect(data).to.have.nested.property(
        'Product.properties.price', 'Price')
      expect(data).to.have.nested.property(
        'Product.properties.$ref', 'string')
    })
  })
  context('booleans as schemas', function () {
    it('should convert to type `any`', function () {
      const jsdata = {
        '$schema': 'http://json-schema.org/draft-06/schema#',
        'title': 'Product',
        'type': 'object',
        'properties': {
          'list': true,
          // 'forbiden': false,
          'description': {},
          'forSale': {
            'type': 'boolean',
            'default': true
          }
        },
        'required': ['list', 'description'],
        'additionalProperties': false
      }
      const data = js2dt.js2dt(JSON.stringify(jsdata), 'Product')
      expect(data).to.have.nested.property(
        'Product.properties.list', 'any')
      expect(data).to.have.nested.property(
        'Product.properties.description', 'any')
    })
  })
  context('propertyNames', function () {
    it('should be dropped', function () {
      const jsdata = {
        '$schema': 'http://json-schema.org/draft-06/schema#',
        'title': 'Product',
        'type': 'object',
        'properties': {
          'foo_list': {
            'type': 'array'
          },
          'foo_description': {
            'type': 'string'
          }
        },
        'required': ['list', 'description'],
        'propertyNames': {
          'pattern': 'foo[A-Z][a-z0-9]*'
        }
      }
      const data = js2dt.js2dt(JSON.stringify(jsdata), 'Product')
      expect(data).not.to.have.nested.property(
        'Product.propertyNames')
    })
  })
  context('const', function () {
    it('should be converted to an enum with one element', function () {
      const jsdata = {
        '$schema': 'http://json-schema.org/draft-06/schema#',
        'title': 'Task',
        'type': 'object',
        'properties': {
          'difficulty': {
            'type': 'string',
            'enum': ['easy', 'hard']
          },
          'type': {
            'type': 'string',
            'const': 'list'
          }
        }
      }
      const data = js2dt.js2dt(JSON.stringify(jsdata), 'Task')
      expect(data).not.to.have.nested.property(
        'Product.properties.type.enum').and
        .to.deep.equal(['list'])
    })
  })
  context('contains', function () {
    it('should be dropped', function () {
      const jsdata = {
        '$schema': 'http://json-schema.org/draft-06/schema#',
        'title': 'Product',
        'type': 'object',
        'properties': {
          'foo_list': {
            'type': 'array',
            'contains': {
              'type': 'string'
            }
          },
          'foo_description': {
            'type': 'string'
          }
        },
        'required': ['list', 'description']
      }
      const data = js2dt.js2dt(JSON.stringify(jsdata), 'Product')
      expect(data).not.to.have.nested.property(
        'Product.properties.foo_list.contains')
    })
  })
  context('empty required array', function () {
    it('should mark all properties optional', function () {
      const jsdata = {
        '$schema': 'http://json-schema.org/draft-06/schema#',
        'title': 'Product',
        'type': 'object',
        'properties': {
          'list': {
            'type': 'array'
          }
        },
        'required': []
      }
      const data = js2dt.js2dt(JSON.stringify(jsdata), 'Product')
      expect(data).to.not.have.nested.property('Product.properties.list.required')
    })
  })
  context('format reference-uri', function () {
    it('should be converted to a pattern', function () {
      const jsdata = {
        '$schema': 'http://json-schema.org/draft-06/schema#',
        'title': 'Product',
        'type': 'object',
        'properties': {
          'webURI': {
            'type': 'string',
            'format': 'uri-reference'
          }
        },
        'required': ['webURI']
      }
      const data = js2dt.js2dt(JSON.stringify(jsdata), 'Product')
      expect(data).to.have.nested.property(
        'Product.properties.webURI.pattern')
    })
    it('should validate a global uri', function () {
      const pattern = new RegExp(constants.FORMAT_REGEXPS['uri-reference'])
      const uris = [
        'http://user:password@example.com:8080/some/path/to/somewhere?search=regex&order=desc#fragment',
        '/some/path/to/somewhere',
        '/?foo=bar',
        '#hash',
        '66.7 is a number'
      ]
      const matches = uris.map(function (uri) {
        return uri.match(pattern)
      })
      expect(matches[0][1]).to.equal('http')
      expect(matches[1][7]).to.equal('some/path/to/somewhere')
      expect(matches[2][9]).to.equal('foo=bar')
      expect(matches[3][10]).to.equal('hash')
      expect(matches[4][8]).to.equal('66.7')
    })
  })
})
