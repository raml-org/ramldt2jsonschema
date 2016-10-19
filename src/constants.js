'use strict'

module.exports.RFC3339 = 'rfc3339'
module.exports.RFC2616 = 'rfc2616'

module.exports.dateOnlyPattern = '^(\\d{4})-(\\d{2})-(\\d{2})$'
module.exports.timeOnlyPattern = '^(\\d{2})(:)(\\d{2})(:)(\\d{2})(\\.\\d+)?$'
module.exports.dateTimeOnlyPattern = '^(\\d{4})-(\\d{2})-(\\d{2})T(\\d{2})(:)' +
                                     '(\\d{2})(:)(\\d{2})(\\.\\d+)?$'
module.exports.RFC3339DatetimePattern = '^(\\d{4})-(\\d{2})-(\\d{2})T(\\d{2})(:)(\\d{2})' +
                                 '(:)(\\d{2})(\\.\\d+)?(Z|([+-])(\\d{2})(:)?(\\d{2}))$'
module.exports.RFC2616DatetimePattern = '(?:(?:Mon|Tue|Wed|Thu|Fri|Sat|Sun), ' +
                                 '(?:[0-2][0-9]|3[01]) ' +
                                 '(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) ' +
                                 '\\d{4} (?:[01][0-9]|2[0-3]):[012345][0-9]:[012345][0-9] ' +
                                 'GMT|(?:Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday), ' +
                                 '(?:[0-2][0-9]|3[01])-(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)' +
                                 '-\\d{2} (?:[01][0-9]|2[0-3]):[012345][0-9]:[012345][0-9] ' +
                                 'GMT|(?:Mon|Tue|Wed|Thu|Fri|Sat|Sun) ' +
                                 '(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) ' +
                                 '(?:[ 1-2][0-9]|3[01]) (?:[01][0-9]|2[0-3]):[012345][0-9]:[012345][0-9] \\d{4})'
