class PlayerCamera {

  constructor( game ) {

    this.margin = {
      back: -10,
      top: 10
    };

    this.game = game;
    this.scene = game.sceneManager.scene;
    this.track = game.trackManager.mesh;
    this.navTrackAgent = game.navTrackAgent;

    var geometry = new THREE.BoxGeometry( 1, 3, 10 );
    var material = new THREE.MeshBasicMaterial( {color: 0x0000ff} );

    this.helperCameraMesh = new THREE.Mesh( geometry, material );
    this.helperCameraMesh.add( new THREE.AxisHelper( 10 ) );
    this.position = this.helperCameraMesh.position;

    material = new THREE.MeshBasicMaterial( {color: 0xff0000} );
    geometry = new THREE.BoxGeometry( 3, 3, 3 );

    this.helperTargetMesh = new THREE.Mesh( geometry, material );
    this.helperTargetMesh.add( new THREE.AxisHelper( 10 ) );
    this.targetPosition = this.helperTargetMesh.position;

    this.scene.add( this.helperCameraMesh );
    this.scene.add( this.helperTargetMesh );

    this.navTrackAgent.addEventListener(
      'change',
      this.updatePosition.bind( this )
    );

  }

  updatePosition() {

    var amountTraveled = this.navTrackAgent.amountTraveled;

    var pos = this.track.geometry.getPointAt( amountTraveled );

    var normal = this.track.geometry.getNormalAt( amountTraveled );

    var forward = this.track.geometry.getTangent( amountTraveled );

    var cameraPosition = new THREE.Vector3().copy( pos )
    .addScaledVector( forward, this.margin.back )
    .addScaledVector( normal, this.margin.top );

    console.log( cameraPosition );

    this.position.copy( cameraPosition );

  }

}

module.exports = PlayerCamera;
