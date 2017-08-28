class SceneManager {

  constructor(){

    this.createScene();
    // this.addHelpers();
    this.addLights();

  }

  createScene() {

    this.scene = new THREE.Scene();

  }

  addHelpers() {

    this.scene.add( new THREE.AxisHelper( 20 ) );

  }

  addLights() {

    var light = new THREE.SpotLight( 0xffffff, 1.5 );
    light.position.set( 0, 1500, 200 );
    light.castShadow = true;
    light.shadow = new THREE.LightShadow( new THREE.PerspectiveCamera( 70, 1, 200, 2000 ) );
    light.shadow.bias = -0.000222;
    light.shadow.mapSize.width = 1024;
    light.shadow.mapSize.height = 1024;

    this.scene.add( light );

  }

}

module.exports = SceneManager;
