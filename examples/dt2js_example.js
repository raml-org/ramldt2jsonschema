'use strict'

const r2j = require('ramldt2jsonschema')
const join = require('path').join
const fs = require('fs')

const filePath = join(__dirname, '../test/integration/raml/complex_cat.raml')
const ramlData = fs.readFileSync(filePath).toString()

async function main () {
  try {
    const schema = await r2j.dt2js(ramlData, 'Cat')
  } catch (err) {
    console.log(err)
    return
  }
  console.log(JSON.stringify(schema, null, 2))
}

main()
