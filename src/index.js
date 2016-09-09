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
    dtexp.canonicalForm(expanded, function(err, canonical) {
      cb(err, schemaForm(canonical));
    });
  });
}

function _processArray(val) {
  let accum = [];
  for (var i=0; i<val.length; i++) {
    accum = accum.concat(schemaForm(val[i]));
  }
  return accum;
}

function schemaForm(data) {
  if (!(data instanceof Object)) {
    return data;
  }
  for (let key in data) {
    let val = data[key];

    if (val instanceof Array) {
      let accum = _processArray(val);
      data[key] = accum;
      continue;
    }

    if (val instanceof Object) {
      data[key] = schemaForm(val);
      continue;
    }

    if (key === 'type') {
      switch (val) {
        case 'union':
          data[key] = 'object';
          break;
        case 'nil':
          data[key] = 'null';
          break;
        case 'date-only':
          break;
        case 'time-only':
          break;
        case 'datetime-only':
          break;
        case 'datetime':
          break;
        case 'file':
          break;
      }
    }

  }
  return data;
}

module.exports.dt2js = dt2js;