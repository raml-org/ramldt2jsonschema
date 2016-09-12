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
      if (err) {
        console.log(err);
        return;
      }
      var schema = schemaForm(canonical, []);
      schema = addRootKeywords(schema);
      cb(err, schema);
    });
  });
}

function addRootKeywords(schema) {
  schema['$schema'] = 'http://json-schema.org/draft-04/schema#';
  return schema;
}

function processArray(val, reqStack) {
  var accum = [];
  for (var i=0; i<val.length; i++) {
    accum = accum.concat(schemaForm(val[i], reqStack));
  }
  return accum;
}

function mergeObjs(obj, upd) {
  for (var key in upd) {
    obj[key] = upd[key];
  }
  return obj;
}

function changeType(data) {
  switch (data.type) {
    case 'union':
      data['type'] = 'object';
      break;
    case 'nil':
      data['type'] = 'null';
      break;
    case 'file':
      data['type'] = 'string';
      data['media'] = {'binaryEncoding': 'binary'};
      break;
  }
  return data;
}

function changeDateType(data) {
  switch (data.type) {
    case 'date-only':
      data['type'] = 'string';
      data['pattern'] = '^(\d{4})-(\d{2})-(\d{2})$';
      break;
    case 'time-only':
      data['type'] = 'string';
      data['pattern'] = '^(\d{2})(:)(\d{2})(:)(\d{2})(\.\d+)?$';
      break;
    case 'datetime-only':
      data['type'] = 'string';
      data['pattern'] = '^(\d{4})-(\d{2})-(\d{2})T(\d{2})(:)(\d{2})(:)(\d{2})(\.\d+)?$';
      break;
    case 'datetime':
      data['type'] = 'string';
      if (data.format === undefined || data.format.toLowerCase() === 'rfc3339') {
        data['pattern'] = '^(\d{4})-(\d{2})-(\d{2})T(\d{2})(:)(\d{2})(:)(\d{2})(\.\d+)?(Z|([+-])(\d{2})(:)?(\d{2}))$';
      } else if (data.format.toLowerCase() === 'rfc2616') {
        data['pattern'] = '(?:(?:Mon|Tue|Wed|Thu|Fri|Sat|Sun), '+
                          '(?:[0-2][0-9]|3[01]) '+
                          '(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) ' +
                          '\d{4} (?:[01][0-9]|2[0-3]):[012345][0-9]:[012345][0-9] ' +
                          'GMT|(?:Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday), ' +
                          '(?:[0-2][0-9]|3[01])-(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)' +
                          '-\d{2} (?:[01][0-9]|2[0-3]):[012345][0-9]:[012345][0-9] ' +
                          'GMT|(?:Mon|Tue|Wed|Thu|Fri|Sat|Sun) ' +
                          '(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) ' +
                          '(?:[ 1-2][0-9]|3[01]) (?:[01][0-9]|2[0-3]):[012345][0-9]:[012345][0-9] \d{4})';
      }
      delete data.format;
      break;
  }
  return data;
}

function schemaForm(data, reqStack, prop) {
  if (!(data instanceof Object)) {
    return data;
  }
  var lastInd = reqStack.length - 1;
  if (data.required && reqStack[lastInd] && prop) {
    reqStack[lastInd] = reqStack[lastInd].concat(prop);
  }
  delete data.required;
  if (data.properties) {
    reqStack[reqStack.length] = [];
  }

  var updateWith = {};
  for (var key in data) {
    var val = data[key];

    if (val instanceof Array) {
      var accum = processArray(val, reqStack);
      updateWith[key] = accum;
      continue;
    }

    if (val instanceof Object) {
      updateWith[key] = schemaForm(val, reqStack, key);
      continue;
    }
  }
  data = mergeObjs(data, updateWith);
  if (data.properties) {
    data.required = reqStack.pop();
  }

  if (data.type !== undefined) {
    data = changeType(data);
    data = changeDateType(data);
  }
  return data;
}

module.exports.dt2js = dt2js;