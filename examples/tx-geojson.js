var JSONStream = require('JSONStream');

var nwsGauges = require('../index.js');

nwsGauges.stream('tx')
  .pipe(nwsGauges.geojsonify())
  .pipe(JSONStream.stringify())
  .pipe(process.stdout);
