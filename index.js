var es = require('event-stream');
var JSONStream = require('JSONStream');
var R = require('ramda');
var request = require('request');

var MAP_POINTS_URL = 'http://water.weather.gov/ahps/get_map_points.php'


function stream(key, options) {
  if (key === undefined) {
    throw new Error ('a key is required - it can be a two-letter state code (ex: "tx") or an NWS office code (ex: "ewx")');
  }
  var form = normalize(options);

  return request.post(MAP_POINTS_URL)
    .form({
      key: key,
      fcst_type: 'obs',
      percent: 50,
      current_type: 'all',
      populate_viewport: 1,
      timeframe: 0,
    })
    .pipe(JSONStream.parse())
    .pipe(es.map(function (data, callback) {
      callback(null, data.points);
    }));
};

function normalize(options) {
  var defaults = {
    fcst_type: 'obs',
    percent: 50,
    current_type: 'all',
    populate_viewport: 1,
    timeframe: 0,
  };

  return R.merge(defaults, options);
};


module.exports = {
  stream: stream,
}
