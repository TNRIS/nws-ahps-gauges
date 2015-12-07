var cheerio = require('cheerio')
var es = require('event-stream');
var JSONStream = require('JSONStream');
var point = require('turf-point')
var R = require('ramda');
var request = require('request');


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

  return request.post('http://water.weather.gov/ahps/get_map_points.php')
    .form(form)
    .pipe(JSONStream.parse())
    .pipe(es.through(function write(data) {
      for (var i = 0, len = data.points.length; i < len; i++) {
        this.emit('data', data.points[i]);
      }
    }));
};

function geojsonify(options) {
  options = options || {};
  options = R.merge({
    style: false,
    links: true,
  }, options);

  var throughStream = es.map(function(data, callback) {
    var coordinates = [Number(data.longitude), Number(data.latitude)];
    var properties = R.omit(['latitude', 'longitude'], data);

    var feature = point(coordinates, properties);
    feature.id = properties.lid;

    if(options.style) {
      var style = {
        'marker-size': 'medium',
      };

      if (properties.obs_status) {
        style['marker-color'] = '#' + properties.obs_status;
      }

      if (properties.icon) {
        var icon = properties.icon.split('-')[0];

        if (icon === 'ci') {
          style['marker-symbol'] = 'circle';
        } else if (icon === 'di') {
          style['marker-symbol'] = 'triangle';
        } else if (icon === 'sq') {
          style['marker-symbol'] = 'square';
        }
      }

      if (properties.name && properties.lid) {
        style.title = properties.lid.toUpperCase() + ': ' + properties.name;
      }

      feature.properties = R.merge(style, feature.properties);
    }

    if (options.links) {
      feature.properties.hydrograph_link = 'http://water.weather.gov/ahps2/hydrograph.php?wfo=' + properties.wfo + '&gage=' + properties.lid;
      feature.properties.hydrograph_image = 'http://water.weather.gov/resources/hydrographs/' + properties.lid + '_hg.png';
    }

    callback(null, feature);
  });

  return throughStream;
}

// returns metadata for a ga(u)ge
function metadata(id) {
  var url = 'http://water.weather.gov/ahps2/metadata.php?wfo=fwd&gage=' + String(id);

  return request.get(url)
    .pipe(es.wait())
    .pipe(es.map(function (data, callback) {
      var obj = {};
      var $ = cheerio.load(data.toString());

      var h2text = $('h2').text();
      obj.name = h2text.split('Metadata for ')[1].split('(')[0].trim();
      obj.code = h2text.split('(')[1].split(')')[0].trim();

      var locationText = $('table table tr td').first().text();
      try {
        var latitudeString = locationText.split('Latitude: ')[1].split('°')[0];
        var latitudeDirection = locationText.split('Latitude: ')[1].split('°')[1].split(',')[0].trim();
        var latitudeMultiplier = latitudeDirection && latitudeDirection === 'S' ? -1 : 1;
        obj.latitude = Number(latitudeString) * latitudeMultiplier;
      } catch (e) {}
      try {
        var longitudeString = locationText.split('Longitude: ')[1].split('°')[0];
        var longitudeDirection = locationText.split('Longitude: ')[1].split('°')[1].split(',')[0].trim();
        var longitudeMultiplier = longitudeDirection && longitudeDirection === 'W' ? -1 : 1;
        obj.longitude = Number(longitudeString) * longitudeMultiplier;
      } catch (e) {}
      try {
        obj.horizontalDatum = locationText.split('Horizontal Datum:')[1].split('\n')[1].trim();
      } catch (e) {}

      var referenceTable = $('table table table').first();

      function getRowCol(row, col) {
        return $($(referenceTable.find('tr').get(row)).find('td').get(col)).text().trim();
      }

      var reference = {}
      referenceTable.find('tr').each(function (idx, element) {
        try {
          var referenceName = $($(element).find('td').get(0)).text().trim();
          if (referenceName && referenceName !== 'Vertical Datum') {
            reference[referenceName] = {};
            try {
              reference[referenceName].base = $($(element).find('td').get(1)).text().trim();
            } catch (e) {}
            try {
              reference[referenceName].flood = $($(element).find('td').get(2)).text().trim();
            } catch (e) {}
          }
        } catch (e) {}
      });
      obj['reference'] = reference;

      var otherSources = [];
      var otherSourcesTable = $('table table table').last();
      otherSourcesTable.find('a').each(function (idx, element) {
        var source = {};
        source.name = $(element).text();
        source.href = $(element).attr('href');
        otherSources.push(source);
      });
      if(otherSources.length) {
        obj['otherSources'] = otherSources;
      }

      callback(null, obj);
    }));
}

module.exports = {
  geojsonify: geojsonify,
  metadata: metadata,
  stream: stream,
}
