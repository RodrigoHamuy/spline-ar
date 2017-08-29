let
OrbitControls = require( '../controls/OrbitControls' );

class CameraManager {

  constructor() {

    let
    viewAngle = 45,
    aspectRatio = window.innerWidth / window.innerHeight,
    near = 1,
    far = 10000;

    this.camera = new THREE.PerspectiveCamera(
      viewAngle, aspectRatio, near, far
    );
    this.camera.position.z = 300;

    let controls = new OrbitControls( this.camera );

  }

}

module.exports = CameraManager;
