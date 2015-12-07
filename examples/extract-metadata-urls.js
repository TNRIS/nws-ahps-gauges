// stream in nws codes -> stream out "Other Sources" urls from their metadata
// pages as csv

var JSONStream = require('JSONStream');
var es = require('event-stream');
var minimist = require('minimist');

var nwsGauges = require('../index.js');

var ps = es.pause();

process.stdin
  .pipe(es.split())
  .pipe(es.through(function write(id) {
    var that = this;

    // wrapping in timeout is to avoid DDOSing NWS
    setTimeout(function () {
      nwsGauges.metadata(id)
        .pipe(es.map(function (metadata) {
          that.resume();
          var nwsCode = id;
          var name = metadata['name'];
          var href = '';
          if(metadata.otherSources) {
            try {
              href = metadata.otherSources.reverse().map(function (src) {
                return src.href;
              }).join('","');
            } catch (e) {}
          }
          var string = '"' + nwsCode  + '","' + name  + '","' + href + '"\n';
          that.emit('data', string);
        }));
    }, 100);
    that.pause();
  }))
  .pipe(process.stdout);
