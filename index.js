var debug = require('debug')('mbt:server');
var http = require('http');
var cluster = require('cluster');
var numCPUs = require('os').cpus().length;
var EventEmitter = require('events');
var minimist = require('minimist');

var Conf = require('./conf/conf');
var Bounds = require('./model/bounds');
var mbTilesGeneratorService = require('./service/mbtiles-generator-service');
var mbTilesStatusService = require('./service/mbtiles-status-service');

var workers = [];


if (cluster.isMaster) {
  // Fork workers.
  for(var i = 0; i < numCPUs; i++) {
    var worker = cluster.fork();
    workers[i] = worker;

    // Listen to messages on workers
    worker.on('message', function (msg) {
      // MBTiles status dispatch to workers
      if(msg.tag === 'mbtiles-status-broadcast') {
        debug('Received message from master: ' + JSON.stringify(msg));
        msg.tag = 'mbtiles-status-push';
        
        workers.forEach(function (w) {
          w.send(msg);
        });

        mbTilesStatusService.receiveUpdate(msg);
      }
    });
  }

  cluster.on('listening', function (worker, address) {
    debug('PID(' + worker.process.pid + ') Cluster worker now connected');
  });

  cluster.on('exit', function (worker, code, signal) {
    console.log('worker ' + worker.process.pid + ' died');
  });

  console.log('Application is running, connected to endpoint ' + Conf.tileServer.endpoint + '. Pretty cool huh?');
}





var argv = minimist(process.argv.slice(2));

if (argv['min-zoom']) {
  Conf.minZoom = argv['min-zoom'];
}
if (argv['max-zoom']) {
  Conf.maxZoom = argv['max-zoom'];
}
var left = argv['left'];
var bottom = argv['bottom'];
var right = argv['right'];
var top = argv['top'];
var layer = argv['layer'];
var bounds = new Bounds(left, bottom, right, top);
var proxy = (argv['proxy-host'] && argv['proxy-port']) ? {host: argv['proxy-host'], port: argv['proxy-port']} : null;

// Dirty wait for modules to init.
setTimeout(function() {
  mbTilesGeneratorService.requestMBTilesSync(bounds, layer, proxy)
      .then(function () {
        process.exit();
      }, function (result) {
        console.error('Process will exit with error: ' + result);
        process.exit(-1);
      });
}, 1000);