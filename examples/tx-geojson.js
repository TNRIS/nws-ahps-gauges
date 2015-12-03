// write out all texas gauges as a geojson feature collection

var JSONStream = require('JSONStream');
var featurecollection = require('turf-featurecollection')
var es = require('event-stream');

var nwsGauges = require('../index.js');

nwsGauges.stream('tx')
  .pipe(nwsGauges.geojsonify())
  .pipe(es.writeArray(function(err, features) {
    var fc = featurecollection(features);
    es.readArray([fc])
      .pipe(JSONStream.stringify(false))
      .pipe(process.stdout);
  }));
