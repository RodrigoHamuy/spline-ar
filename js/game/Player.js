class Player {

  constructor ( navTrackAgent ) {

    this.navTrackAgent = navTrackAgent;

    var geometry = new THREE.BoxGeometry( 1, 3, 10 );
    var material = new THREE.MeshBasicMaterial( {color: 0x00ff00} );
    this.mesh = new THREE.Mesh( geometry, material );

    this.mesh.add( new THREE.AxisHelper( 20 ) );

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

    this.mesh.position.copy( pos )
    .add(
      new THREE.Vector3()
      .addScaledVector( normal, 10 )
    );

    this.mesh.up = normal;

    var m1 = new THREE.Matrix4();
    m1.lookAt( forward, new THREE.Vector3(), normal );
    this.mesh.quaternion.setFromRotationMatrix( m1 );

  }

}

module.exports = Player;
