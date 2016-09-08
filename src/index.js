var yaml = require('yaml-js');
var fs = require('fs');
var dtexp = require('datatype-expansion');


function getRAMLContext(fileName) {
  let content = fs.readFileSync(fileName).toString();
  let yaml_content = yaml.load(content);
  return yaml_content.types;
}

function dt2js(fileName, typeName, cb) {
  let ctx = getRAMLContext(fileName);
  dtexp.expandedForm(ctx[typeName], ctx, function(err, expanded) {
    if (err) {
      console.log(err);
      return;
    }
    dtexp.canonicalForm(expanded, cb);
  });
}

function writeToFile(err, schema) {
  console.log(schema);
}

function dt2jsCLI(fileName, typeName) {
  dt2js(fileName, typeName, writeToFile);
}

module.exports.dt2js = dt2js;