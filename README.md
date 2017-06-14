# nws-ahps-gauges
get river flood gauge data from the [National Weather Service (NWS) Advanced Hydrologic Prediction Service (AHPS)](https://water.weather.gov/ahps/).


3 accessible functions:
* stream(key, options)
    * key - @{String}, Required. Can be a two-letter state code (ex: "tx") or an NWS office code (ex: "ewx")
    * options - @{Object}. Optional. Applied default options are: 
```javascript
    var defaults = {
        fcst_type: 'obs',
        percent: 50,
        current_type: 'all',
        populate_viewport: 1,
        timeframe: 0,
    };
```

* geojsonify(options)
    * options - @{Object}. Optional. An object which will be merged with each features' "properties". Used if you would like to apply additional `feature.properties` to the output features.

* metadata(id)
    * id - @{String}. Required. String of the flood gage LID. A 5 digital acronym of the gage name. Can be found at the [NWS AHPS website](https://water.weather.gov/ahps/). (ex: "PRKT2" for the gage Concho River at Paint Rock, TX)

### example

```
// write out all texas gauges as a geojson feature collection

var JSONStream = require('JSONStream');
var featurecollection = require('turf-featurecollection')
var es = require('event-stream');

var nwsGauges = require('../index.js');

nwsGauges.stream('tx')
  .pipe(nwsGauges.geojsonify({style: true}))
  .pipe(es.writeArray(function(err, features) {
    var fc = featurecollection(features);
    es.readArray([fc])
      .pipe(JSONStream.stringify(false))
      .pipe(process.stdout);
  }));
```
for more functional examples, see the 'examples' directory of this repo.
