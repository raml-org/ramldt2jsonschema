/* global describe, it, context, before, after */

const { expect, assert } = require('chai')
const join = require('path').join
const rewire = require('rewire')
const dt2js = rewire('../src/dt2js')
const constants = require('../src/constants')
const fs = require('fs')

const RAML_FILE = join(__dirname, 'examples/types_example.raml')
const INVALID_RAML_FILE = join(__dirname, 'examples/invalid.raml')
const ARRAY_OF_UNION_TEST = join(__dirname, 'examples/union_test.raml')
const UNION_TEST = join(__dirname, 'examples/union_test2.raml')
const DUPLICATE_REQUIRED_ENTRY = join(__dirname, 'examples/duplicate_required_entry_test.raml')
const TYPE_CONVERSION_TEST = join(__dirname, 'examples/type_conversion_test.raml')

describe('dt2js.getRAMLContext()', function () {
  const ramlData = fs.readFileSync(RAML_FILE).toString()
  const getRAMLContext = dt2js.__get__('getRAMLContext')
  it('should load included json example file', function () {
    const ctx = getRAMLContext(ramlData, 'test/examples')
    expect(ctx.CatWithRating.example.rating).to.equal(50)
  })
  it('should load libraries defined under `use:`', function () {
    const ctx = getRAMLContext(ramlData, 'test/examples')
    expect(ctx.Cat.type.properties).to.have.property('address', 'string')
    expect(ctx.CatWithRating.type.properties.rating).to.have.property('type', 'integer')
  })
  it('should get raml data types context from RAML content', function () {
    const ctx = getRAMLContext(ramlData, 'test/examples')
    expect(ctx).to.be.an('object').and.contain.keys('Cat')
  })
})

describe('dt2js.dt2js()', function () {
  const ramlData = fs.readFileSync(RAML_FILE).toString()
  context('when applied to valid type', function () {
    it('should produce valid JSON schema', function () {
      dt2js.setBasePath('test/examples')
      const schema = dt2js.dt2js(ramlData, 'Cat')
      expect(schema).to.have.property('$schema', 'http://json-schema.org/draft-06/schema#')
      expect(schema).to.have.property('type', 'object')
    })
  })
  context('when applied to invalid type', function () {
    const ramlData = fs.readFileSync(INVALID_RAML_FILE).toString()
    it('should not produce valid JSON schema', function () {
      assert.throws(() => dt2js.dt2js(ramlData, 'InvalidCat'), Error, 'Consistency check failure for property length and values [123 1]')
    })
  })
  context('when applied to invalid RAML data', function () {
    it('should return error and null', function () {
      assert.throws(() => dt2js.dt2js('asdasdasdasd', 'Cat'), Error, 'Invalid RAML data')
    })
  })
  context('when given an invalid type name', function () {
    it('should return error and null', function () {
      assert.throws(() => dt2js.dt2js(ramlData, 'Ant'), Error, 'type Ant does not exist')
    })
  })
  context('when given a pattern property', function () {
    const raml = [
      '#%RAML 1.0',
      '    title: My API With Types',
      '    types:',
      '      Person:',
      '        properties:',
      '          name:',
      '            type: string',
      '          age:',
      '            required: false',
      '            type: number',
      '          /^note\\d+$/:',
      '            type: string'
    ].join('\n')
    it('should omit it from required array', function () {
      const schema = dt2js.dt2js(raml, 'Person')
      expect(schema).to.have.property('required').and.to.deep.equal(['name'])
    })
  })
})

describe('dt2js.destringify()', function () {
  const destringify = dt2js.__get__('destringify')
  it('should change a string to an int where possible', function () {
    const val = destringify('100')
    expect(val).to.equal(100)
  })
  it('should leave non int/ non boolean as a string', function () {
    const val = destringify('foo')
    expect(val).to.equal('foo')
  })
  it('should convert the string "true" to boolean true', function () {
    const val = destringify('true')
    expect(val).to.equal(true)
  })
  it('should convert the string "false" to boolean false', function () {
    const val = destringify('false')
    expect(val).to.equal(false)
  })
})

describe('dt2js.addRootKeywords()', function () {
  const addRootKeywords = dt2js.__get__('addRootKeywords')
  it('should add missing root keywords', function () {
    const schema = addRootKeywords({})
    expect(schema)
      .to.be.an('object').and
      .to.have.property(
        '$schema', 'http://json-schema.org/draft-06/schema#')
  })
})

describe('dt2js.processArray()', function () {
  const processArray = dt2js.__get__('processArray')
  it('should transform each element of array', function () {
    const result = processArray(
      [{'type': 'union'}, {'type': 'nil'}], [])
    expect(result).to.have.lengthOf(2)
    expect(result).to.have.nested.property('[0].type', 'object')
    expect(result).to.have.nested.property('[1].type', 'null')
  })
})

describe('dt2js.convertType()', function () {
  const convertType = dt2js.__get__('convertType')
  it('should change type `union` to `object`', function () {
    const obj = convertType({'type': 'union'})
    expect(obj).to.deep.equal({'type': 'object'})
  })
  it('should change type `nil` to `null`', function () {
    const obj = convertType({'type': 'nil'})
    expect(obj).to.deep.equal({'type': 'null'})
  })
  it('should change type `file` to `string` with `media` keyword', function () {
    const obj = convertType({'type': 'file'})
    expect(obj).to.deep.equal(
      {'type': 'string', 'media': {'binaryEncoding': 'binary'}})
  })
  context('when does not match any type', function () {
    it('should return object not changed', function () {
      const obj = convertType({'type': 'foobar'})
      expect(obj).to.deep.equal({'type': 'foobar'})
    })
  })
})

describe('dt2js.convertFileType()', function () {
  const convertFileType = dt2js.__get__('convertFileType')
  it('should change type `file` to `string` with `media` keyword', function () {
    const expected = {'type': 'string', 'media': {'binaryEncoding': 'binary'}}
    const obj = convertFileType({'type': 'file'})
    expect(obj).to.deep.equal(expected)
  })
  context('when data contains `fileTypes` param', function () {
    it('should move its elements to anyOf and delete `fileTypes`', function () {
      const expected = {
        'type': 'string',
        'media': {
          'binaryEncoding': 'binary',
          'anyOf': [
            {'mediaType': 'image/jpeg'},
            {'mediaType': 'image/png'}
          ]
        }
      }
      const obj = convertFileType({
        'type': 'file',
        'fileTypes': ['image/jpeg', 'image/png']
      })
      expect(obj).to.deep.equal(expected)
    })
  })
})

describe('dt2js.convertDateType()', function () {
  const convertDateType = dt2js.__get__('convertDateType')
  it('should change type `date-only` to `string` with pattern', function () {
    const obj = convertDateType({'type': 'date-only'})
    expect(obj).to.have.property('type', 'string')
    expect(obj).to.have.property('pattern', constants.dateOnlyPattern)
  })
  it('should change type `time-only` to `string` with pattern', function () {
    const obj = convertDateType({'type': 'time-only'})
    expect(obj).to.have.property('type', 'string')
    expect(obj).to.have.property('pattern', constants.timeOnlyPattern)
  })
  it('should change type `time-only` to `string` with pattern', function () {
    const obj = convertDateType({'type': 'datetime-only'})
    expect(obj).to.have.property('type', 'string')
    expect(obj).to.have.property('pattern', constants.dateTimeOnlyPattern)
  })
  context('when type is `datetime`', function () {
    const data = [
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
          const obj = convertDateType(el.input)
          expect(obj).to.have.property('type', 'string')
          expect(obj).to.have.property('pattern', el.pattern)
          expect(obj).to.not.have.property('format')
        })
      })
    })
  })
  context('when does not match any type', function () {
    it('should return object not changed', function () {
      const obj = convertDateType({'type': 'foobar'})
      expect(obj).to.deep.equal({'type': 'foobar'})
    })
  })
})

describe('dt2js.convertPatternProperties()', function () {
  const convertPatternProperties = dt2js.__get__('convertPatternProperties')
  context('When pattern properties are found', function () {
    it('should replace it with a JSON Schema patternProperties', function () {
      const obj = convertPatternProperties({
        properties: {
          beep: 'boop',
          '/^note\\d+$/': {type: 'string'}
        }
      })
      expect(obj).to.not.have.deep.property('properties./^note\\d+$/')
      expect(obj).to.deep.equal({
        properties: {beep: 'boop'},
        patternProperties: {
          '^note\\d+$': { type: 'string' }
        }
      })
    })
  })
})

describe('dt2js.convertDisplayName()', function () {
  const convertDisplayName = dt2js.__get__('convertDisplayName')
  context('When a RAML displayName is given', function () {
    it('should replace it with a JSON Schema title', function () {
      const obj = convertDisplayName({type: 'beep boop', displayName: 'Beep Boop'})
      expect(obj).to.have.property('title', 'Beep Boop')
      expect(obj).to.not.have.property('displayName')
    })
  })
})

describe('dt2js.processNested()', function () {
  const processNested = dt2js.__get__('processNested')
  it('should process nested arrays', function () {
    const data = {'foo': [{'type': 'union'}]}
    const result = processNested(data, [])
    expect(result)
      .to.have.property('foo').and
      .to.have.lengthOf(1)
    expect(result).to.have.nested.property('foo[0].type', 'object')
  })
  it('should process nested objects', function () {
    const data = {'foo': {'type': 'union'}}
    const result = processNested(data, [])
    expect(result)
      .to.have.property('foo').and
      .to.have.all.keys('type')
    expect(result).to.have.nested.property('foo.type', 'object')
  })
  it('should return empty object if no nesting is present', function () {
    const result = processNested({'type': 'union'}, [])
    expect(result).to.be.deep.equal({})
  })
})

describe('dt2js.schemaForm()', function () {
  const schemaForm = dt2js.__get__('schemaForm')
  it('should return data unchanged if it is not Object', function () {
    const result = schemaForm('foo')
    expect(result).to.be.equal('foo')
  })
  it('should hoist `required` properties param to object root', function () {
    const data = {
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
    const schema = schemaForm(data, [])
    expect(schema)
      .to.have.property('required').and
      .to.be.deep.equal(['name', 'age'])
  })
  it('should remove `required` properties param while hoisting', function () {
    const data = {
      'type': 'object',
      'properties': {
        'name': {
          'type': 'string',
          'required': true
        }
      }
    }
    const schema = schemaForm(data, [])
    expect(schema)
      .to.have.property('required').and
      .to.be.deep.equal(['name'])
    expect(schema).to.not.have.deep.property('properties.name.required')
  })
  context.skip('when `required` param is not used properly', function () {
    it('should not hoist `required` properties param', function () {
      const data = {
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
      const schema = schemaForm(data, [])
      expect(schema)
        .to.have.property('required').and
        .to.be.deep.empty
    })
  })
  it('should process nested', function () {
    const data = {
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
    const schema = schemaForm(data, [])
    expect(schema).to.have.nested.property(
      'properties.bio.properties.event.type', 'string')
    expect(schema).to.have.nested.property(
      'properties.siblings.anyOf[0].type', 'null')
  })
  it('should change types', function () {
    const data = {
      'type': 'union',
      'properties': {
        'name': {'type': 'nil'},
        'photo': {'type': 'file'},
        'dob': {'type': 'date-only'}
      }
    }
    const schema = schemaForm(data, [])
    expect(schema).to.have.property('type', 'object')
    expect(schema).to.have.nested.property('properties.name.type', 'null')
    expect(schema).to.have.nested.property('properties.photo.type', 'string')
    expect(schema).to.have.nested.property('properties.photo.media')
    expect(schema).to.have.nested.property('properties.dob.type', 'string')
  })
})

describe('dt2js.schemaForm()', function () {
  const schemaForm = dt2js.__get__('schemaForm')
  it('should interpret absence of `required` as required: true', function () {
    const data = {
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
    const schema = schemaForm(data, [])
    expect(schema)
      .to.have.property('required').and
      .to.be.deep.equal(['key1', 'key3'])
    expect(schema)
      .to.have.nested.property('properties.key1.default', 1)
    expect(schema)
      .to.have.nested.property('properties.key3.default', true)
  })
})
describe('Converting an array of union type', function () {
  it('should result in an array type, with anyOf on the items level', function () {
    const ramlData = fs.readFileSync(ARRAY_OF_UNION_TEST).toString()
    const schema = dt2js.dt2js(ramlData, 'Devices')
    const expected = require(join(__dirname, 'examples/union_test_result.json'))
    expect(schema).to.deep.equal(expected)
  })
})
describe('Converting a plain union type', function () {
  it('should result in an array of schemas', function () {
    const ramlData = fs.readFileSync(UNION_TEST).toString()
    const schema = dt2js.dt2js(ramlData, 'Animal')
    const expected = require(join(__dirname, 'examples/union_test_result2.json'))
    expect(schema).to.deep.equal(expected)
  })
})
describe('Type conversion & destringify function', function () {
  it('should be skipped for values of type string', function () {
    const ramlData = fs.readFileSync(TYPE_CONVERSION_TEST).toString()
    const schema = dt2js.dt2js(ramlData, 'SearchQuery')
    const expected = require(join(__dirname, 'examples/type_conversion_test.json'))
    expect(schema).to.deep.equal(expected)
  })
})
describe('When property with name "items".', function () {
  it('should only have one entry in required array.', function (cb) {
    const ramlData = fs.readFileSync(DUPLICATE_REQUIRED_ENTRY).toString()
    const schema = dt2js.dt2js(ramlData, 'Foo')
    expect(schema.required).to.deep.equal(['items', 'total_count'])
    return cb()
  })
})
describe('When setDraft04() is used.', function () {
  var convert
  before(function () {
    dt2js.setDraft04()
    convert = dt2js.__get__('dt2js')
  })
  after(function () {
    dt2js.__set__({draft: '06'})
  })
  it('should have a draft04 schema declaration.', function () {
    var ramlData = fs.readFileSync(DUPLICATE_REQUIRED_ENTRY).toString()
    const schema = convert(ramlData, 'Foo')
    expect(schema['$schema']).to.equal('http://json-schema.org/draft-04/schema#')
  })
})
