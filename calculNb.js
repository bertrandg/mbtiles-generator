const minimist = require('minimist');

const Bounds = require('./model/bounds');
const ProjectionUtils = require('./util/projection-utils');


const argv = minimist(process.argv.slice(2));

const minZoom = argv['min-zoom'] || console.error('missing arg min-zoom !');
const maxZoom = argv['max-zoom'] || console.error('missing arg max-zoom !');

const left = argv['l'] || console.error('missing arg l !');
const bottom = argv['b'] || console.error('missing arg b !');
const right = argv['r'] || console.error('missing arg r !');
const top = argv['t'] || console.error('missing arg t !');

const bounds = new Bounds(left, bottom, right, top);

console.log('Tiles count: ' + getNbTiles(bounds, minZoom, maxZoom));

function getNb(left, bottom, right, top, minZoom, maxZoom) {
    return getNbTiles(new Bounds(left, bottom, right, top), minZoom, maxZoom);
}

function getNbTiles(bounds, minZoom, maxZoom) {
  var nbTiles = 0;
  for (var z = minZoom; z <= maxZoom; z++) {
    var coords1 = ProjectionUtils.latLngToTileXYForZoom(bounds.top, bounds.left, z);
    var coords2 = ProjectionUtils.latLngToTileXYForZoom(bounds.bottom, bounds.right, z);

    // Adjust to process at least one tile for each zoom (lower zoom levels)
    if (coords1[0] === coords2[0]) {
      coords2[0] += 1;
    }
    if (coords1[1] === coords2[1]) {
      coords2[1] += 1;
    }

    for (var x = Math.min(coords1[0], coords2[0]); x <= Math.max(coords1[0], coords2[0]); x++) {
      for (var y = Math.min(coords1[1], coords2[1]); y <= Math.max(coords1[1], coords2[1]); y++) {
        nbTiles++;
      }
    }
  }
  return nbTiles;
};


