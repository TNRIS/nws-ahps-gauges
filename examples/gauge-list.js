// write gauge id's matching a given search searchCode (for example a NWS office searchCode
// or state searchCode)

var JSONStream = require('JSONStream');
var es = require('event-stream');
var minimist = require('minimist');

var nwsGauges = require('../index.js');

var argv = minimist(process.argv.slice(2));

var searchCode;
try {
  searchCode = argv['_'][0];
} catch (e) {
  searchCode = undefined;
}

nwsGauges.stream(searchCode)
  .pipe(es.map(function(data, callback) {
    callback(null, data['lid'] + '\n')
  }))
  .pipe(process.stdout);
