/* global describe, it, context */

var expect = require('chai').expect
var yaml = require('js-yaml')
var join = require('path').join
var rewire = require('rewire')
var js2dt = rewire('../src/js2dt')
var constants = require('../src/constants')

var JSON_FILE_NAME = join(__dirname, 'examples/schema_example.json')
var RAMLEmitter = js2dt.__get__('RAMLEmitter')

describe('js2dt.js2dt()', function () {
  context('when applied to valid schema', function () {
    it('should produce valid RAML type library', function () {
      js2dt.js2dt(JSON_FILE_NAME, 'Product', function (err, raml) {
        expect(err).to.be.nil
        expect(raml).to.be.a('string')
        var data = yaml.safeLoad(raml)
        expect(data).to.have.deep.property('types.Product')
        expect(data).to.not.have.property('$schema')
      })
    })
    it('should handle JSON definitions and refs', function () {
      js2dt.js2dt(JSON_FILE_NAME, 'Product', function (err, raml) {
        expect(err).to.be.nil
        var data = yaml.safeLoad(raml)
        expect(data).to.have.deep.property(
          'types.Address.properties.planet.type', 'nil')
        expect(data).to.have.deep.property(
          'types.Product.properties.madeIn.type', 'Address')
        expect(data).to.not.have.property('definitions')
      })
    })
  })
  context('when type name is not provided', function () {
    it('should infer type name', function () {
      js2dt.js2dt(JSON_FILE_NAME, undefined, function (err, raml) {
        expect(raml).to.be.a('string')
        expect(err).to.be.nil
        var data = yaml.safeLoad(raml)
        expect(data).to.have.deep.property('types.Schema_example')
        expect(data).to.not.have.property('$schema')
      })
    })
  })
  context('when error occurs while schema processing', function () {
    it('should not produce valid RAML type library', function () {
      js2dt.js2dt('foobar.json', 'Product', function (err, raml) {
        expect(raml).to.be.nil
        expect(err).to.not.be.nil
      })
    })
  })
})

describe('js2dt.changeType()', function () {
  var changeType = js2dt.__get__('changeType')
  it('should change type `null` to `nil`', function () {
    var obj = changeType({'type': 'null'})
    expect(obj).to.deep.equal({'type': 'nil'})
  })
  it('should change type `string` with `media` keyword to `file`', function () {
    var obj = changeType({
      'type': 'string',
      'media': {'binaryEncoding': 'binary'}
    })
    expect(obj).to.deep.equal({'type': 'file'})
  })
  context('when does not match any type', function () {
    it('should return object not changed', function () {
      var obj = changeType({'type': 'foobar'})
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

describe('js2dt.changeFileType()', function () {
  var changeFileType = js2dt.__get__('changeFileType')
  it('should just change type to `file` and remove media', function () {
    var res = changeFileType({'type': 'foo', 'media': 1})
    expect(res).to.be.deep.equal({'type': 'file'})
  })
  context('when anyOf contains data', function () {
    it('should move mediaTypes to fileTypes', function () {
      var res = changeFileType({
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
        var res = changeFileType({
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

describe('js2dt.loadJSONFile()', function () {
  var loadJSONFile = js2dt.__get__('loadJSONFile')
  it('should load and parse JSON file', function () {
    var data = loadJSONFile(JSON_FILE_NAME)
    expect(data).to.be.an('object').and.contain.keys('$schema')
  })
})

describe('js2dt.inferRAMLTypeName()', function () {
  var inferRAMLTypeName = js2dt.__get__('inferRAMLTypeName')
  it('should infer type name from file name', function () {
    var name = inferRAMLTypeName('docs/json/cat.json')
    expect(name).to.be.equal('Cat')
  })
})

describe('js2dt.changeDateType()', function () {
  var changeDateType = js2dt.__get__('changeDateType')
  context('when type is `string` and `pattern` is present', function () {
    context('when pattern matches date-only', function () {
      it('should change type to `date-only` and remove pattern', function () {
        var obj = changeDateType({
          'type': 'string', 'pattern': constants.dateOnlyPattern})
        expect(obj).to.have.property('type', 'date-only')
        expect(obj).to.not.have.property('pattern')
      })
    })
    context('when pattern matches time-only', function () {
      it('should change type to `time-only` and remove pattern', function () {
        var obj = changeDateType({
          'type': 'string', 'pattern': constants.timeOnlyPattern})
        expect(obj).to.have.property('type', 'time-only')
        expect(obj).to.not.have.property('pattern')
      })
    })
    context('when pattern matches datetime-only', function () {
      it('should change type to `datetime-only` and remove pattern', function () {
        var obj = changeDateType({
          'type': 'string', 'pattern': constants.dateTimeOnlyPattern})
        expect(obj).to.have.property('type', 'datetime-only')
        expect(obj).to.not.have.property('pattern')
      })
    })
    context('when pattern matches datetime and format is rfc3339', function () {
      it('should change type to `datetime` with `format` of rfc3339 and del pattern', function () {
        var obj = changeDateType({
          'type': 'string', 'pattern': constants.RFC3339DatetimePattern})
        expect(obj).to.have.property('type', 'datetime')
        expect(obj).to.have.property('format', constants.RFC3339)
        expect(obj).to.not.have.property('pattern')
      })
    })
    context('when pattern matches datetime and format is rfc2616', function () {
      it('should change type to `datetime` with `format` of rfc2616 and del pattern', function () {
        var obj = changeDateType({
          'type': 'string', 'pattern': constants.RFC2616DatetimePattern})
        expect(obj).to.have.property('type', 'datetime')
        expect(obj).to.have.property('format', constants.RFC2616)
        expect(obj).to.not.have.property('pattern')
      })
    })
  })
  context('when type is not string', function () {
    it('should return object not changed', function () {
      var obj = changeDateType({'type': 'foobar', 'pattern': 'asd'})
      expect(obj).to.deep.equal({'type': 'foobar', 'pattern': 'asd'})
    })
  })
  context('when no pattern present', function () {
    it('should return object not changed', function () {
      var obj = changeDateType({'type': 'string'})
      expect(obj).to.deep.equal({'type': 'string'})
    })
  })
  context('pattern does not match date[time]', function () {
    it('should return object not changed', function () {
      var obj = changeDateType({'type': 'string', 'pattern': 'asd'})
      expect(obj).to.deep.equal({'type': 'string', 'pattern': 'asd'})
    })
  })
})

describe('js2dt.replaceRef()', function () {
  var replaceRef = js2dt.__get__('replaceRef')
  it('should replace $ref with type name', function () {
    var data = {'$ref': '#/definitions/username'}
    var raml = replaceRef(data)
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

describe('js2dt.RAMLEmitter._processDefinitions()', function () {
  context('when input has false value', function () {
    var emitter = new RAMLEmitter()
    it('should return empty object', function () {
      expect(emitter._processDefinitions(undefined))
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
      var res = emitter._processDefinitions(defs)
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

describe('js2dt.addCombinationsType()', function () {
  var addCombinationsType = js2dt.__get__('addCombinationsType')
  it('should add object type to all combination schemas missing type', function () {
    var data = {
      'type': 'string',
      'anyOf': [
        {'pattern': 'x'},
        {'type': 'number'}
      ]
    }
    var res = addCombinationsType(data, 'anyOf')
    expect(res).to.have.property('type', 'string')
    expect(res).to.have.deep.property('anyOf[0].type', 'string')
    expect(res).to.have.deep.property('anyOf[1].type', 'number')
  })
})

describe('js2dt.addCombinationsType()', function () {
  var getCombinationType = js2dt.__get__('getCombinationType')
  context('when input key is allOf', function () {
    it('should return types as is', function () {
      var res = getCombinationType(['x', 'y'], 'allOf')
      expect(res).to.be.deep.equal(['x', 'y'])
    })
  })
  context('when input key is oneOf', function () {
    it('should return types joined by pipe (|)', function () {
      var res = getCombinationType(['x', 'y'], 'oneOf')
      expect(res).to.be.equal('x | y')
    })
  })
  context('when input key is anyOf', function () {
    it('should return types joined by pipe (|)', function () {
      var res = getCombinationType(['x', 'y'], 'anyOf')
      expect(res).to.be.equal('x | y')
    })
  })
})
