var es = require('event-stream');
var JSONStream = require('JSONStream');
var R = require('ramda');
var request = require('request');
var point = require('turf-point')

var MAP_POINTS_URL = 'http://water.weather.gov/ahps/get_map_points.php'


function stream(key, options) {
  if (key === undefined) {
    throw new Error ('a key is required - it can be a two-letter state code (ex: "tx") or an NWS office code (ex: "ewx")');
  }

  // normalize options
  var defaults = {
    fcst_type: 'obs',
    percent: 50,
    current_type: 'all',
    populate_viewport: 1,
    timeframe: 0,
  };
  var form = R.merge(defaults, options);
  form.key = key;

  return request.post(MAP_POINTS_URL)
    .form(form)
    .pipe(JSONStream.parse())
    .pipe(es.through(function write(data) {
      for (var i = 0, len = data.points.length; i < len; i++) {
        this.emit('data', data.points[i]);
      }
    }));
};

function geojsonify(options) {
  var throughStream = es.map(function(data, callback) {
    var coordinates = [data.longitude, data.latitude];
    var properties = R.omit(['latitude', 'longitude'], data);

    var feature = point(coordinates, properties);
    feature.id = properties.lid;

    callback(null, feature);
  });

  return throughStream;
}

module.exports = {
  stream: stream,
  geojsonify: geojsonify,
}
