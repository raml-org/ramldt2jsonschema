'use strict';

var yaml = require('yaml-js');
var fs = require('fs');
var dtexp = require('datatype-expansion');

// Get RAML Data Types context from a file named "fileName".
function getRAMLContext(fileName) {
  var content = fs.readFileSync(fileName).toString();
  var yaml_content = yaml.load(content);
  return yaml_content.types;
}

// Convert type named "typeName" from RAML file named "fileName"
// into JSON schema and call callback "cb" with error if any and
// result of conversion.
function dt2js(fileName, typeName, cb) {
  var ctx = getRAMLContext(fileName);
  dtexp.expandedForm(ctx[typeName], ctx, function(err, expanded) {
    if (err) {
      console.log(err);
      return;
    }
    dtexp.canonicalForm(expanded, function(err, canonical) {
      var schema = schemaForm(canonical);
      schema = addRootKeywords(schema);
      cb(err, schema);
    });
  });
}

function addRootKeywords(schema) {
  schema['$schema'] = 'http://json-schema.org/draft-04/schema#';
  return schema;
}

function processArray(val) {
  var accum = [];
  for (var i=0; i<val.length; i++) {
    accum = accum.concat(schemaForm(val[i]));
  }
  return accum;
}

function mergeObjs(obj, upd) {
  for (var key in upd) {
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
  var updateWith = {};
  for (var key in data) {
    var val = data[key];

    if (val instanceof Array) {
      var accum = processArray(val);
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