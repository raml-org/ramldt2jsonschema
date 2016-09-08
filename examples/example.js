var raml2json = require("ramldt2jsonschema");

raml2json.dt2js('types.raml', 'Song', function(err, schema) {
  console.log(schema);
});
