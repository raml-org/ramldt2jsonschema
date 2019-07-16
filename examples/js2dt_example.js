'use strict'

const r2j = require('ramldt2jsonschema')
const join = require('path').join
const fs = require('fs')
const yaml = require('js-yaml')

const filePath = join(__dirname, '../test/integration/json/complex_cat.json')
const jsonData = fs.readFileSync(filePath).toString()

async function main () {
  try {
    const raml = await r2j.js2dt(jsonData, 'Cat')
  } catch (err) {
    console.log(err)
    return
  }
  console.log('#%RAML 1.0 Library\n')
  console.log(yaml.safeDump(raml, { 'noRefs': true }))
}

main()
