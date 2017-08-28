"use strict";

function LinearTranstition( points ) {

  this.points = points;

}

Object.assign( LinearTranstition.prototype, {

  getPointAt: function ( at ) {

    var maxIndex = this.points.length - 1;

    var i = parseInt( at * maxIndex );

    var i2 = ( i < maxIndex - 1 ) ? i +1 : i ;

    var rest = ( at * maxIndex ) % 1;

    var point1 = new THREE.Vector3()
    .copy( this.points[ i ] )
    .multiplyScalar( 1 - rest );

    var point2 = new THREE.Vector3()
    .copy( this.points[ i2 ] )
    .multiplyScalar( rest );

    var pointAt = new THREE.Vector3()
    .addVectors( point1, point2 )
    .normalize();

    return pointAt;

  }

} );


function PathBufferGeometry( ctrlPoints, ctrlNormals, width, segments ){

  this.type = 'PathBufferGeometry';
  this.ctrlPoints = ctrlPoints;
  this.ctrlNormals = ctrlNormals;
  this.width = width;
  this.segments = segments;

  this.getPointAt = getPointAt;
  this.getNormalAt = getNormalAt;
  this.updateControlPoints = updateControlPoints;
  this.generateVertices = generateVertices;
  this.getLength = getLength;
  this.getTangent = getTangent;

  let
  centerSpline = new THREE.CatmullRomCurve3( ctrlPoints ),
  normalSpline = new LinearTranstition(ctrlNormals),
  scope = this;

  normalSpline.tension = 0;

  THREE.BufferGeometry.call( this );

  generateVertices();

  function generateVertices(){
    // buffers

    var indices = [];
    var vertices = [];
    var normals = [];
    var uvs = [];

    // Generate vertices

    var centerLine = centerSpline.getPoints( scope.segments );
    let leftV = [],
    rightV = [],
    normals2 = []
    ;

    for (var i = 0; i < scope.segments +1; i++) {
      var forward = centerSpline.getTangent(i/ scope.segments );
      var up = normalSpline.getPointAt(i/ scope.segments );

      var right = new THREE.Vector3()
      .crossVectors(forward, up)
      .normalize()
      .multiplyScalar(scope.width*0.5);

      var rightPoint = new THREE.Vector3()
      .addVectors(centerLine[i], right);

      var leftPoint = new THREE.Vector3()
      .subVectors(centerLine[i], right);

      leftV.push(leftPoint.toArray());

      rightV.push(rightPoint.toArray());

      var normal = new THREE.Vector3().crossVectors(right, forward).normalize();

      normals.push(normal.toArray());

    }
    var totalDistance = 0;


    for (i = 0; i < scope.segments; i++) {

      vertices.push(...leftV[i], ...rightV[i], ...leftV[i+1]);
      vertices.push(...leftV[i+1], ...rightV[i], ...rightV[i+1]);

      normals2.push(...normals[i], ...normals[i], ...normals[i+1]);
      normals2.push(...normals[i+1], ...normals[i], ...normals[i+1]);

      var distance = centerLine[i].distanceTo(centerLine[i+1]) / scope.width;
      totalDistance += distance;
      uvs.push(
        0,0,
        1,0,
        0,totalDistance
      );
      uvs.push(
        0,totalDistance,
        1,0,
        1,totalDistance
      );
    }


    scope.addAttribute( 'position', new THREE.Float32BufferAttribute( vertices, 3 ) );

    scope.addAttribute( 'normal', new THREE.Float32BufferAttribute( normals2, 3 ) );

    scope.addAttribute( 'uv', new THREE.Float32BufferAttribute( uvs, 2 ) );

  }

  function getNormalAt(t){
    return normalSpline.getPointAt(t);
  }
  function getPointAt(t){
    return centerSpline.getPointAt(t);
  }

  function getLength(){

    return centerSpline.getLength();

  }

  function getTangent( t ){

    return centerSpline.getTangent( t );

  }

  function updateControlPoints(ctrlPoints, normalPoints){
    centerSpline = new THREE.CatmullRomCurve3( ctrlPoints );
    if (typeof normalPoints != 'undefined') {
      normalSpline = new LinearTranstition(normalPoints);
      normalSpline.tension = 0;
    }
    generateVertices();
  }
}


PathBufferGeometry.prototype = Object.create( THREE.BufferGeometry.prototype );

module.exports = {
  PathBufferGeometry: PathBufferGeometry
};
