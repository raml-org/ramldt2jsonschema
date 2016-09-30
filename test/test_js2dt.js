/* global describe, it, context */

var expect = require('chai').expect
var yaml = require('js-yaml')
var join = require('path').join
var rewire = require("rewire");
var js2dt = rewire('../src/js2dt')
var constants = require('../src/constants')

var JSON_FILE_NAME = join(__dirname, 'test_files/schema_example.json')

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

describe('js2dt._processDefinitions()', function () {
  var _processDefinitions = js2dt.__get__('_processDefinitions')
  context('when input has false value', function () {
    it('should return empty object', function () {
      expect(_processDefinitions(undefined))
        .to.be.deep.equal({})
    })
  })
  context('when input is not empty', function () {
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
      var res = _processDefinitions(defs)
      expect(res)
        .to.have.deep.property('Address.properties.street.required').and
        .to.be.true
      expect(res).to.have.deep.property(
        'Address.properties.city.type', 'nil')
      expect(res).to.not.have.deep.property('Address.required')
    })
  })
})

describe('js2dt.processArray()', function () {
  var processArray = js2dt.__get__('processArray')
  it('should transform each element of array', function () {
    var result = processArray(
      [{'type': 'null'}, {'type': 'string', 'media': 'adasd'}], [])
    expect(result).to.have.lengthOf(2)
    expect(result).to.have.deep.property('[0].type', 'nil')
    expect(result).to.have.deep.property('[1].type', 'file')
  })
})

describe('js2dt.changeType()', function () {
  var changeType = js2dt.__get__('changeType')
  it('should change type `null` to `nil`', function () {
    var obj = changeType({'type': 'null'})
    expect(obj).to.deep.equal({'type': 'nil'})
  })
  it('should change type `string` with `media` keyword to `file`', function () {
    var obj = changeType({'type': 'string', 'media': 'asd'})
    expect(obj).to.deep.equal({'type': 'file'})
  })
  context('when does not match any type', function () {
    it('should return object not changed', function () {
      var obj = changeType({'type': 'foobar'})
      expect(obj).to.deep.equal({'type': 'foobar'})
    })
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

describe('js2dt.processNested()', function () {
  var processNested = js2dt.__get__('processNested')
  it('should process nested arrays', function () {
    var data = {'foo': [{'type': 'null'}]}
    var result = processNested(data, [])
    expect(result)
      .to.have.property('foo').and
      .to.have.lengthOf(1)
    expect(result).to.have.deep.property('foo[0].type', 'nil')
  })
  it('should process nested objects', function () {
    var data = {'foo': {'type': 'null'}}
    var result = processNested(data, [])
    expect(result)
      .to.have.property('foo').and
      .to.have.all.keys('type')
    expect(result).to.have.deep.property('foo.type', 'nil')
  })
  it('should return empty object if no nesting is present', function () {
    var result = processNested({'type': 'null'}, [])
    expect(result).to.be.deep.equal({})
  })
})

describe('js2dt.ramlForm()', function () {
  var ramlForm = js2dt.__get__('ramlForm')
  context('when input is not an Object', function () {
    it('should return data unchanged', function () {
      var result = ramlForm('foo')
      expect(result).to.be.equal('foo')
    })
  })
  it('should spread `required` root value across properties', function () {
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
    var raml = ramlForm(data, [])
    expect(raml)
      .to.have.deep.property('properties.name.required').and
      .to.be.true
    expect(raml)
      .to.have.deep.property('properties.address.required').and
      .to.be.true
  })
  it('should make properties not present in `required` required=false', function () {
    var data = {
      'type': 'object',
      'properties': {
        'address': {
          'type': 'string'
        }
      },
      'required': []
    }
    var raml = ramlForm(data, [])
    expect(raml)
      .to.have.deep.property('properties.address.required').and
      .to.be.false
  })
  it('should remove root `required` keyword while hoisting', function () {
    var data = {
      'type': 'object',
      'required': ['name'],
      'properties': {
        'name': {
          'type': 'string'
        }
      }
    }
    var raml = ramlForm(data, [])
    expect(raml).to.not.have.property('required')
  })
  it('should not spread non-property names', function () {
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
    var raml = ramlForm(data, [])
    expect(raml).to.not.have.property('required')
    expect(raml).to.not.have.deep.property(
      'properties.name.xml.required')
  })
  it('should process nested', function () {
    var data = {
      'type': 'object',
      'properties': {
        'bio': {
          'type': 'object',
          'properties': {
            'event': {'type': 'string', 'media': 'asd'}
          }
        },
        'siblings': {
          'anyOf': [{'type': 'null'}]
        }
      }
    }
    var raml = ramlForm(data, [])
    expect(raml).to.have.deep.property(
      'properties.bio.properties.event.type', 'file')
    expect(raml).to.not.have.deep.property(
      'properties.bio.properties.event.media')
    expect(raml).to.have.deep.property(
      'properties.siblings.anyOf[0].type', 'nil')
  })
  context('when $ref IS present in input data', function () {
    it('should replace $ref with defined type name', function () {
      var data = {'$ref': '#/definitions/username'}
      var raml = ramlForm(data, [])
      expect(raml).to.be.deep.equal({'type': 'Username'})
    })
  })
  context('when $ref IS NOT present in input data', function () {
    it('should change types', function () {
      var data = {
        'properties': {
          'name': {'type': 'null'},
          'photo': {'type': 'string', 'media': 'asd'},
          'dob': {'type': 'string', 'pattern': constants.dateOnlyPattern}
        }
      }
      var raml = ramlForm(data, [])
      expect(raml).to.have.deep.property('properties.name.type', 'nil')
      expect(raml).to.have.deep.property('properties.photo.type', 'file')
      expect(raml).to.not.have.deep.property('properties.photo.media')
      expect(raml).to.have.deep.property('properties.dob.type', 'date-only')
      expect(raml).to.not.have.deep.property('properties.dob.pattern')
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
