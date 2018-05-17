# ramldt2jsonschema

[![Greenkeeper badge](https://badges.greenkeeper.io/raml-org/ramldt2jsonschema.svg)](https://greenkeeper.io/)
[![NPM version][npm-image]][npm-url]
[![NPM downloads][downloads-image]][downloads-url]
[![Build status][travis-image]][travis-url]
[![Test coverage][coveralls-image]][coveralls-url]

CLI & Library to convert a RAML 1.0 DataType to a JSON Schema Draft 6, and back. (dt2js can still be used to produce draft04 documents if used programatically)

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
const raml2json = require('ramldt2jsonschema')
const join = require('path').join
const fs = require('fs')

const filePath = join(__dirname, 'api.raml')
const ramlData = fs.readFileSync(filePath).toString()

const schema = raml2json.dt2js(ramlData, 'Cat')
console.log(JSON.stringify(schema, null, 2))
```

NOTE: when the inputed RAML contains `!include`s and those includes are not in the same directory as the script it is being ran from, you can use `dt2js.setBasePath()` to specify a different base path.

```js
const raml2json = require('ramldt2jsonschema')
const join = require('path').join
const fs = require('fs')

const filePath = join(__dirname, 'api.raml')
const includesPath = '/different/path/to/includes/'
const ramlData = fs.readFileSync(filePath).toString()

raml2json.dt2js.setBasePath(includesPath)
const schema = raml2json.dt2js(ramlData, 'Cat')
console.log(JSON.stringify(schema, null, 2))
```

#### js2dt

```js
const raml2json = require('ramldt2jsonschema')
const join = require('path').join
const fs = require('fs')

const filePath = join(__dirname, 'schema.json')
const jsonData = fs.readFileSync(filePath).toString()

const raml = raml2json.js2dt(jsonData, 'Person')

console.log(`#%RAML 1.0 Library\n${yaml.safeDump({ types: raml }, {'noRefs': true})}`)
```

### Limitations

- in js2dt,
  - the following JSON schema properties are not supported and as a result, will not be converted:
    - `not` (or `false` when used as a schema boolean)
    - object's `dependencies`
    - array's `additionalItems`
    - the `propertyNames` keyword
    - the `contains` keyword
  - JSON schema number and integer's `exclusiveMaximum` and `exclusiveMinimum` properties are converted to raml 'maximum' and 'minimum'
  - the JSON schema `oneOf` property is processed the same way as the JSON schema `anyOf` property, it is converted to the RAML `union` type
  - the JSON schema `type: 'string'` with `media` and `binaryEncoding: 'binary'` is converted to the RAML `file` type
  - the JSON schema `type: string` with a `pattern` that matches exactly one of the RAML date types will be converted in the matching RAML date type
  - the JSON schema `media` property with `anyOf`, elements of which have the property `mediaType` will be converted to `fileTypes` in RAML

- in dt2js,
  - the following RAML properties are not supported/converted:
    - annotations

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
