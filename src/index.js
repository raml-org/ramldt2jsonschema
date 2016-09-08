var yaml = require('yaml-js');
var fs = require('fs');
var dtexp = require('datatype-expansion');

// Get RAML Data Types context from a file named "fileName".
function getRAMLContext(fileName) {
  let content = fs.readFileSync(fileName).toString();
  let yaml_content = yaml.load(content);
  return yaml_content.types;
}

// Convert type named "typeName" from RAML file named "fileName"
// into JSON schema and call callback "cb" with error if any and
// result of conversion.
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

module.exports.dt2js = dt2js;