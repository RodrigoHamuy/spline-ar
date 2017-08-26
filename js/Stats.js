"use strict";

module.exports = {
  create: create
};

let
Stats = require('stats.js');
let stats;

function create() {

  stats = new Stats();
  stats.showPanel( 1 ); // 0: fps, 1: ms, 2: mb, 3+: custom
  document.body.appendChild( stats.dom );
  return stats;
}
