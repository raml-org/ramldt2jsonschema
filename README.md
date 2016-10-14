# ramldt2jsonschema

[![NPM version][npm-image]][npm-url]
[![NPM downloads][downloads-image]][downloads-url]
[![Build status][travis-image]][travis-url]
[![Test coverage][coveralls-image]][coveralls-url]

This repository contains a node implementation that converts a RAML data type into JSON schema, and back.

## Usage

### Global (CLI)

```
npm install -g ramldt2jsonschema
```

This will install two command-line tools:
- `dt2js`: RAML data type <> JSON schema
- `js2dt`: JSON schema <> RAML data type

#### dt2js

```
dt2js <ramlFile> <ramlTypeName>
```

**Options**

* `<ramlFile>` Path to a file containing at least one RAML data type (e.g. `path/to/api.raml`)
* `<ramlTypeName>` RAML type name to convert to JSON schema

#### js2dt

```
js2dt <jsonFile> <ramlTypeName>
```

**Options**

* `<jsonFile>` Path to a JSON schema file (e.g. `path/to/schema.json`)
* `<ramlTypeName>` RAML type name to give to the exported RAML data type

### Locally (JavaScript)

```
npm install ramldt2jsonschema --save
```

#### dt2js

```js
var raml2json = require('ramldt2jsonschema')
var join = require('path').join
var fs = require('fs')

var filePath = join(__dirname, 'api.raml')
var ramlData = fs.readFileSync(filePath).toString()

raml2json.dt2js(ramlData, 'Cat', function (err, schema) {
  if (err) {
    console.log(err)
    return
  }
  console.log(JSON.stringify(schema, null, 2))
})
```

#### js2dt

```js
var raml2json = require('ramldt2jsonschema')
var join = require('path').join
var fs = require('fs')

var filePath = join(__dirname, 'schema.json')
var jsonData = fs.readFileSync(filePath).toString()

raml2json.js2dt(jsonData, 'Person', function (err, raml) {
  if (err) {
    console.log(err)
    return
  }
  console.log('#%RAML 1.0 Library\n')
  console.log(raml)
})
```

### Limitations

- in js2dt, the following JSON schema properties are not supported and as a result, won't be converted:
    - `format`, `title`, `not`
    - number and integer's `exclusiveMaximum` and `exclusiveMinimum`
    - object's `patternProperties` and `dependencies`
    - array's `additionalItems`

- in dt2js, the following RAML properties are not supported/converted:
    - RAML pattern properties
    - `displayName`

## License

Apache 2.0

[npm-image]: https://img.shields.io/npm/v/ramldt2jsonschema.svg?style=flat
[npm-url]: https://npmjs.org/package/ramldt2jsonschema
[downloads-image]: https://img.shields.io/npm/dm/ramldt2jsonschema.svg?style=flat
[downloads-url]: https://npmjs.org/package/ramldt2jsonschema
[travis-image]: https://img.shields.io/travis/raml-org/ramldt2jsonschema.svg?style=flat
[travis-url]: https://travis-ci.org/raml-org/ramldt2jsonschema
[coveralls-image]: https://img.shields.io/coveralls/raml-org/ramldt2jsonschema.svg?style=flat
[coveralls-url]: https://coveralls.io/r/raml-org/ramldt2jsonschema?branch=master
