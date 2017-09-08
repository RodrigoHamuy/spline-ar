const TrackGeometry = require( './TrackGeometry.js' );

class TrackManager extends THREE.EventDispatcher {

  constructor(){
    super();
    this._width = 0.01;
    this.segments = 300;
    this.editor = true;
  }

  get width(){
    return this._width;
  }

  set width(value){
    this._width = value;
    this.updatePath();
  }

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

    var pathGeometry = new TrackGeometry(
      this.ctrlPoints,
      this.ctrlNormals,
      this._width,
      this.segments
    );
    var material = new THREE.MeshNormalMaterial();
    material.side = THREE.DoubleSide;
    // material.wireframe = true;
    this.mesh = new THREE.Mesh( pathGeometry, material );

    if( this.editor ){
      this.addEditor();
    }

  }

  addEditor(){
    this.gui = new dat.GUI();
    this.gui.add(this, 'width', 0.000001, 0.5);
    this.gui.add(this, 'startNewSpline');
  }

  startNewSpline(){
    var meshCopy = this.mehs;
    this.mesh = undefined;
    this.gui.destroy();
    this.dispatchEvent( { type: 'newSpline' } );
  }

  updatePath(){
    this.mesh.geometry.dispose();

    this.mesh.geometry = new TrackGeometry(
      this.ctrlPoints,
      this.ctrlNormals,
      this._width,
      this.segments
    );
  }

  updateCtrlPoints(points){
    this.ctrlPoints = [];
    this.ctrlNormals = [];
    for (var i = 0; i < points.length; i++) {
      var point = points[i];
      this.ctrlPoints.push(point.position);

      var matrix = new THREE.Matrix4();
      matrix.extractRotation( point.matrix );
      var direction = new THREE.Vector3( 0, 1, 0 ).applyMatrix4(matrix);
      this.ctrlNormals.push(direction);
    }

  }

  getLength() {

    return this.mesh.geometry.getLength();

  }

}

module.exports = TrackManager;
