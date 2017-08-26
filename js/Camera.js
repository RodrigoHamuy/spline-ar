"use strict";

module.exports = {
  create: create
};

let
THREE = require('three');

let
camera,
VIEW_ANGLE = 45,
ASPECT = window.innerWidth / window.innerHeight,
NEAR = 1,
FAR = 10000;

function create() {
  camera = new THREE.PerspectiveCamera(
    VIEW_ANGLE, ASPECT, NEAR, FAR
  );
  camera.position.z = 300;

  window.addEventListener('resize', resize, false);

  return camera;
}

function resize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
}
