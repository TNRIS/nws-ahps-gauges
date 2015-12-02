// write metadata out for a given gauge ID

var JSONStream = require('JSONStream');
var es = require('event-stream');
var minimist = require('minimist');

var nwsGauges = require('../index.js');

var argv = minimist(process.argv.slice(2));
var id;
try {
  id = argv['_'][0];
} catch (e) {
  id = undefined;
}

nwsGauges.metadata(id)
  .pipe(JSONStream.stringify())
  .pipe(process.stdout);
