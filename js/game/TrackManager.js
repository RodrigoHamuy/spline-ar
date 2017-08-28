let TrackGeometry = require( './TrackGeometry.js' );

class TrackManager {

  requestTrackData() { return new Promise( ( resolve ) => {

    $.getJSON( 'data/level01.json')
    .done( (data ) =>{

      this.onTrackDataResponse( data );
      resolve();

    } );

  } ); }

  onTrackDataResponse( data ) {

    this.ctrlPoints = [];
    this.ctrlNormals = [];

    let i = 0;

    for ( i = 0; i < data.ctrlPoints.length; i++ ) {

      let pointArray = data.ctrlPoints[i];
      let pointVector = new THREE.Vector3().fromArray( pointArray );
      this.ctrlPoints.push( pointVector );

    }

    for ( i = 0; i < data.ctrlNormals.length; i++ ) {

      let pointArray = data.ctrlNormals[i];
      let pointVector = new THREE.Vector3().fromArray( pointArray );
      this.ctrlNormals.push( pointVector );

    }

    this.createPath();

  }

  createPath() {

    var pathGeometry = new TrackGeometry( this.ctrlPoints, this.ctrlNormals, 10, 30 );
    var material = new THREE.MeshNormalMaterial();
    material.side = THREE.DoubleSide;
    // material.wireframe = true;
    this.mesh = new THREE.Mesh( pathGeometry, material );
    this.mesh.add( new THREE.AxisHelper( 20 ) );

  }

  getLength() {

    return this.mesh.geometry.getLength();

  }

}

module.exports = TrackManager;
