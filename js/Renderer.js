"use strict";

module.exports = {
  create : create
}

let
THREE = require('three');
let renderer;

function create(container) {

  renderer = new THREE.WebGLRenderer();
  resize();
  window.addEventListener('resize', resize, false);

  container.appendChild(renderer.domElement);

  return renderer;
}

function resize() {
  renderer.setSize( window.innerWidth, window.innerHeight );
}
