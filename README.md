# ramldt2jsonschema

[![Greenkeeper badge](https://badges.greenkeeper.io/raml-org/ramldt2jsonschema.svg)](https://greenkeeper.io/)
[![NPM version][npm-image]][npm-url]
[![NPM downloads][downloads-image]][downloads-url]
[![Build status][travis-image]][travis-url]
[![Test coverage][coveralls-image]][coveralls-url]

CLI & Library to convert a RAML 1.0 DataType to a JSON Schema Draft 4, and back. Uses [webapi-parser](https://github.com/raml-org/webapi-parser) under the hood.

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
dt2js <ramlFile> <ramlTypeName> --draft=[version] [--validate]
```

**Options**

* `<ramlFile>` Path to a file containing at least one RAML data type (e.g. `path/to/api.raml`)
* `<ramlTypeName>` RAML type name to convert to JSON schema
* `--draft` Optional JSON Shema draft version to convert to. Supported values are: `04`, `06` and `07` (default)
* `--validate` Validate output JSON Schema with Ajv. Throws an error if schema is invalid. Requires "ajv" to be installed. (default: false)

#### js2dt

```
js2dt <jsonFile> <ramlTypeName> [--validate]
```

**Options**

* `<jsonFile>` Path to a JSON schema file (e.g. `path/to/schema.json`)
* `<ramlTypeName>` RAML type name to give to the exported RAML data type
* `--validate` Validate output RAML with webapi-parser. Throws an error if it is invalid. (default: false)

### Locally (JavaScript)

```
npm install ramldt2jsonschema --save
```

#### dt2js

```js
const r2j = require('ramldt2jsonschema')
const join = require('path').join
const fs = require('fs')

const filePath = join(__dirname, 'complex_cat.raml')
const ramlData = fs.readFileSync(filePath).toString()

async function main () {
  let schema
  try {
    schema = await r2j.dt2js(ramlData, 'Cat')
  } catch (err) {
    console.log(err)
    return
  }
  console.log(JSON.stringify(schema, null, 2))
}

main()
```

#### js2dt

```js
const r2j = require('ramldt2jsonschema')
const join = require('path').join
const fs = require('fs')
const yaml = require('js-yaml')

const filePath = join(__dirname, 'complex_cat.json')
const jsonData = fs.readFileSync(filePath).toString()

async function main () {
  let raml
  try {
    raml = await r2j.js2dt(jsonData, 'Cat')
  } catch (err) {
    console.log(err)
    return
  }
  console.log('#%RAML 1.0 Library\n')
  console.log(yaml.safeDump(raml, { 'noRefs': true }))
}

main()
```

#### Resolving references

When the input contains external references (`!include`, `uses:`, `$ref`, etc.) and the referred files are not in the same directory as the script it is being ran from, you may provide a third argument to both `dt2js` and `js2dt`. The argument must be an object with a `basePath` key. All references will then be resolved relative to that base path.

Example of using `basePath` argument in dt2js:
```js
// Script below ran from /home/john/where/ever/
// Reference is located at /home/john/schemas/simple_person.json
const raml2json = require('ramldt2jsonschema')

const ramlStr = `
  #%RAML 1.0 Library

  types:
    Person: !include simple_person.json
`
const basePath = '/home/john/schemas/' // or '../../schemas/'
const schema = raml2json.dt2js(ramlStr, 'Person', { basePath: basePath })
console.log(JSON.stringify(schema, null, 2))
```

### Limitations

- in js2dt
  - the following JSON Schema properties are not supported and as a result, may not be converted as expected:
    > dependencies, exclusiveMaximum, exclusiveMinimum, items (array value), allOf, oneOf, not, format (email, hostname, ipv4, ipv6, uri), readOnly
  - the following JSON Schema properties won't be converted at all:
    > $schema, additionalItems, contains, id, $id, propertyNames, definitions, links, fragmentResolution, media, pathStart, targetSchema
  - array `items` property is not properly converted to RAML when it's value is an array of schemas (see #111)


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
