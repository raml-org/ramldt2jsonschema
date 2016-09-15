JS2DT TODO/Notes/Algorithm

Input: JSON object representing valid json schema and describing single RAML data type.

Output: RAML file with one RAML data type.

0. Iterate over `[propname, propval]` pairs of object.
1. If propval is array:
  1. Apply algorithm to each element of array and store results in new array variable `conv_array`.
  2. Replace original array with propval of variable `conv_array`.
2. If propval is an object:
  1. Apply algorithm to propval and store result in variable `conv_obj`.
  2. Replace original object with `conv_obj`.
3. If propkey is 'type', propvalue should be converted::
  1. If propvalue is 'object' and object holding propkey has param 'anyOf', convert it to 'union'. Actions on 'anyOf' are described further.
  2. If propvalue is 'null', convert it to 'nil'.
  3. If propvalue is 'string' and object holding propkey has param 'media', convert it to 'file'. Remove 'media' param. (What if it wasn't a file originally?)
  4. If propvalue is 'string' and object holding propkey has param 'pattern' (What if originally it was just a string with 'pattern'?):
    1. Pop 'pattern' into variable.
    2. If pattern matches `^(\d{4})-(\d{2})-(\d{2})$`, convert to 'date-only'.
    3. If pattern matches `^(\d{2})(:)(\d{2})(:)(\d{2})(\.\d+)?$`, convert to 'time-only'.
    4. If pattern matches `^(\d{4})-(\d{2})-(\d{2})T(\d{2})(:)(\d{2})(:)(\d{2})(\.\d+)?$`, convert to 'datetime-only'.
    5. If pattern contains 'Monday' and 'Jan', convert to 'datetime' with 'format' set to 'rfc2616'.
    6. If pattern contains 'T' and 'Z' convert to 'datetime' with 'format' set to 'rfc3339'.
4. If propkey is 'object' and object holding propkey has non-empty 'required' param:
  1. Add 'required: true' to each property with name from 'required' list.
  2. Remove 'required' property from object holding propkey 'object'.
5. Atomic values of propkeys/propvalues should be converted to RAML as is.
6. Handling 'anyOf':
  1. Go through all elements of 'anyOf' array.
  2.

99. Pop root '$schema' keyword.