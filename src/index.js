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

function processArray(val) {
  let accum = [];
  for (var i=0; i<val.length; i++) {
    accum = accum.concat(schemaForm(val[i]));
  }
  return accum;
}

function mergeObjs(obj, upd) {
  for (let key in upd) {
    obj[key] = upd[key];
  }
  return obj;
}

function changeType(typeName, updateWith) {
  switch (typeName) {
    case 'union':
      updateWith['type'] = 'object';
      break;
    case 'nil':
      updateWith['type'] = 'null';
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
  return updateWith;
}

function schemaForm(data) {
  if (!(data instanceof Object)) {
    return data;
  }
  let updateWith = {};
  for (let key in data) {
    let val = data[key];

    if (val instanceof Array) {
      let accum = processArray(val);
      updateWith[key] = accum;
      continue;
    }

    if (val instanceof Object) {
      updateWith[key] = schemaForm(val);
      continue;
    }

    if (key === 'type') {
      updateWith = changeType(val, updateWith);
    }
  }
  return mergeObjs(data, updateWith);
}

module.exports.dt2js = dt2js;