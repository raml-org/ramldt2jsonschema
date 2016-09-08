var raml2json = require("ramldt2jsonschema");

raml2json.dt2js('types.raml', 'Song', function(err, schema) {
  console.log(JSON.stringify(schema, null, 2));
});
