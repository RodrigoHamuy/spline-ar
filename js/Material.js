"use strict";
module.exports = {
  create: create,
  update: update
};

let
$ =     require("jquery"),
THREE = require('three');

let
shaderMaterial,
uniforms,
shaderSource = {};

function create(vertexLocation, fragLocation) {
  return new Promise((resolve) => {
    getShaderSources()
    .then(function () {
      createMaterial();
      resolve(shaderMaterial);
    });
  });
}

function createMaterial() {
  uniforms = {
    deltaTime: {
      type: 'f',
      value: 0
    },
    posFactor: {
      type: 'f',
      value: 0.05
    },
    yFactor: {
      type: 'f',
      value: 5.0
    },
    resize: {
      type: 'i',
      value: 1
    }
  };
  shaderMaterial = new THREE.ShaderMaterial({
    uniforms:       uniforms,
    vertexShader:   shaderSource.vertex,
    fragmentShader: shaderSource.fragment
  });
}

function getShaderSources(){
  return Promise.all([
    getShaderSource('shaders/shader.vert'),
    getShaderSource('shaders/shader.frag')
  ]).then((shaders) =>{
    shaderSource.vertex = shaders[0];
    shaderSource.fragment = shaders[1];
  });
}

function getShaderSource(shaderLocation) {
  return new Promise((resolve, reject) =>{
    $.get(shaderLocation, (shaderString) =>{
      resolve(shaderString);
    });
  });
}

function update(deltaTime) {
  uniforms.deltaTime.value += deltaTime;
  if (uniforms.deltaTime.value>Math.PI*2) {
    uniforms.deltaTime.value -= Math.PI*2;
  }
}
