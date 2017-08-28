class LinearTranstition {

  constructor( points ) {

    this.points = points;

  }

  getPointAt ( at ) {

    let maxIndex = this.points.length - 1;

    let i = parseInt( at * maxIndex );

    let i2 = ( i < maxIndex - 1 ) ? i + 1 : i;

    let rest = ( at * maxIndex ) % 1;

    let point1 = new THREE.Vector3()
    .copy( this.points[ i ] )
    .multiplyScalar( 1 - rest );

    let point2 = new THREE.Vector3()
    .copy( this.points[ i2 ] )
    .multiplyScalar( rest );

    let pointAt = new THREE.Vector3()
    .addVectors( point1, point2 )
    .normalize();

    return pointAt;

  }

}

class TrackGeometry extends THREE.BufferGeometry {

  constructor( ctrlPoints, ctrlNormals, width, segments ) {

    super();

    this.type = 'TrackGeometry';
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
    normalSpline = new LinearTranstition( ctrlNormals ),
    scope = this;

    normalSpline.tension = 0;

    generateVertices();

    function generateVertices() {

      // buffers

      let
      indices = [],
      vertices = [],
      normals = [],
      uvs = [];

      // Generate vertices

      let
      centerLine = centerSpline.getPoints( scope.segments ),
      leftV = [],
      rightV = [],
      normals2 = [];

      for ( let i = 0; i < scope.segments + 1; i ++ ) {

        let forward = centerSpline.getTangent( i / scope.segments );
        let up = normalSpline.getPointAt( i / scope.segments );

        let right = new THREE.Vector3()
        .crossVectors( forward, up )
        .normalize()
        .multiplyScalar( scope.width * 0.5 );

        let rightPoint = new THREE.Vector3()
        .addVectors( centerLine[ i ], right );

        let leftPoint = new THREE.Vector3()
        .subVectors( centerLine[ i ], right );

        leftV.push( leftPoint.toArray() );

        rightV.push( rightPoint.toArray() );

        let normal = new THREE.Vector3().crossVectors( right, forward ).normalize();

        normals.push( normal.toArray() );

      }

      let totalDistance = 0;


      for ( let i = 0; i < scope.segments; i ++ ) {

        vertices.push( ...leftV[ i ], ...rightV[ i ], ...leftV[ i + 1 ] );
        vertices.push( ...leftV[ i + 1 ], ...rightV[ i ], ...rightV[ i + 1 ] );

        normals2.push( ...normals[ i ], ...normals[ i ], ...normals[ i + 1 ] );
        normals2.push( ...normals[ i + 1 ], ...normals[ i ], ...normals[ i + 1 ] );

        let distance = centerLine[ i ].distanceTo( centerLine[ i + 1 ] ) / scope.width;
        totalDistance += distance;
        uvs.push(
          0, 0,
          1, 0,
          0, totalDistance
        );
        uvs.push(
          0, totalDistance,
          1, 0,
          1, totalDistance
        );

      }

      scope.addAttribute( 'position', new THREE.Float32BufferAttribute( vertices, 3 ) );

      scope.addAttribute( 'normal', new THREE.Float32BufferAttribute( normals2, 3 ) );

      scope.addAttribute( 'uv', new THREE.Float32BufferAttribute( uvs, 2 ) );

    }

    function getNormalAt( t ) {

      return normalSpline.getPointAt( t );

    }

    function getPointAt( t ) {

      return centerSpline.getPointAt( t );

    }

    function getLength() {

      return centerSpline.getLength();

    }

    function getTangent( t ) {

      return centerSpline.getTangent( t );

    }

    function updateControlPoints( ctrlPoints, normalPoints ) {

      centerSpline = new THREE.CatmullRomCurve3( ctrlPoints );
      if ( typeof normalPoints != 'undefined' ) {

        normalSpline = new LinearTranstition( normalPoints );
        normalSpline.tension = 0;

      }
      generateVertices();

    }

  }

}

module.exports = TrackGeometry;
