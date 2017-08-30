(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/**
 * @author qiao / https://github.com/qiao
 * @author mrdoob / http://mrdoob.com
 * @author alteredq / http://alteredqualia.com/
 * @author WestLangley / http://github.com/WestLangley
 * @author erich666 / http://erichaines.com
*/

// This set of controls performs orbiting, dollying (zooming), and panning.
// Unlike TrackballControls, it maintains the "up" direction object.up (+Y by default).
//
//    Orbit - left mouse / touch: one finger move
//    Zoom - middle mouse, or mousewheel / touch: two finger spread or squish
//    Pan - right mouse, or arrow keys / touch: three finter swipe

function OrbitControls( object, domElement ) {

	this.object = object;

	this.domElement = ( domElement !== undefined ) ? domElement : document;

	// Set to false to disable this control
	this.enabled = true;

	// "target" sets the location of focus, where the object orbits around
	this.target = new THREE.Vector3();

	// How far you can dolly in and out ( PerspectiveCamera only )
	this.minDistance = 0;
	this.maxDistance = Infinity;

	// How far you can zoom in and out ( OrthographicCamera only )
	this.minZoom = 0;
	this.maxZoom = Infinity;

	// How far you can orbit vertically, upper and lower limits.
	// Range is 0 to Math.PI radians.
	this.minPolarAngle = 0; // radians
	this.maxPolarAngle = Math.PI; // radians

	// How far you can orbit horizontally, upper and lower limits.
	// If set, must be a sub-interval of the interval [ - Math.PI, Math.PI ].
	this.minAzimuthAngle = - Infinity; // radians
	this.maxAzimuthAngle = Infinity; // radians

	// Set to true to enable damping (inertia)
	// If damping is enabled, you must call controls.update() in your animation loop
	this.enableDamping = false;
	this.dampingFactor = 0.25;

	// This option actually enables dollying in and out; left as "zoom" for backwards compatibility.
	// Set to false to disable zooming
	this.enableZoom = true;
	this.zoomSpeed = 1.0;

	// Set to false to disable rotating
	this.enableRotate = true;
	this.rotateSpeed = 1.0;

	// Set to false to disable panning
	this.enablePan = true;
	this.keyPanSpeed = 7.0;	// pixels moved per arrow key push

	// Set to true to automatically rotate around the target
	// If auto-rotate is enabled, you must call controls.update() in your animation loop
	this.autoRotate = false;
	this.autoRotateSpeed = 2.0; // 30 seconds per round when fps is 60

	// Set to false to disable use of the keys
	this.enableKeys = true;

	// The four arrow keys
	this.keys = { LEFT: 37, UP: 38, RIGHT: 39, BOTTOM: 40 };

	// Mouse buttons
	this.mouseButtons = { ORBIT: THREE.MOUSE.LEFT, ZOOM: THREE.MOUSE.MIDDLE, PAN: THREE.MOUSE.RIGHT };

	// for reset
	this.target0 = this.target.clone();
	this.position0 = this.object.position.clone();
	this.zoom0 = this.object.zoom;

	//
	// public methods
	//

	this.getPolarAngle = function () {

		return spherical.phi;

	};

	this.getAzimuthalAngle = function () {

		return spherical.theta;

	};

	this.reset = function () {

		scope.target.copy( scope.target0 );
		scope.object.position.copy( scope.position0 );
		scope.object.zoom = scope.zoom0;

		scope.object.updateProjectionMatrix();
		scope.dispatchEvent( changeEvent );

		scope.update();

		state = STATE.NONE;

	};

	// this method is exposed, but perhaps it would be better if we can make it private...
	this.update = function() {

		var offset = new THREE.Vector3();

		// so camera.up is the orbit axis
		var quat = new THREE.Quaternion().setFromUnitVectors( object.up, new THREE.Vector3( 0, 1, 0 ) );
		var quatInverse = quat.clone().inverse();

		var lastPosition = new THREE.Vector3();
		var lastQuaternion = new THREE.Quaternion();

		return function update () {

			var position = scope.object.position;

			offset.copy( position ).sub( scope.target );

			// rotate offset to "y-axis-is-up" space
			offset.applyQuaternion( quat );

			// angle from z-axis around y-axis
			spherical.setFromVector3( offset );

			if ( scope.autoRotate && state === STATE.NONE ) {

				rotateLeft( getAutoRotationAngle() );

			}

			spherical.theta += sphericalDelta.theta;
			spherical.phi += sphericalDelta.phi;

			// restrict theta to be between desired limits
			spherical.theta = Math.max( scope.minAzimuthAngle, Math.min( scope.maxAzimuthAngle, spherical.theta ) );

			// restrict phi to be between desired limits
			spherical.phi = Math.max( scope.minPolarAngle, Math.min( scope.maxPolarAngle, spherical.phi ) );

			spherical.makeSafe();


			spherical.radius *= scale;

			// restrict radius to be between desired limits
			spherical.radius = Math.max( scope.minDistance, Math.min( scope.maxDistance, spherical.radius ) );

			// move target to panned location
			scope.target.add( panOffset );

			offset.setFromSpherical( spherical );

			// rotate offset back to "camera-up-vector-is-up" space
			offset.applyQuaternion( quatInverse );

			position.copy( scope.target ).add( offset );

			scope.object.lookAt( scope.target );

			if ( scope.enableDamping === true ) {

				sphericalDelta.theta *= ( 1 - scope.dampingFactor );
				sphericalDelta.phi *= ( 1 - scope.dampingFactor );

			} else {

				sphericalDelta.set( 0, 0, 0 );

			}

			scale = 1;
			panOffset.set( 0, 0, 0 );

			// update condition is:
			// min(camera displacement, camera rotation in radians)^2 > EPS
			// using small-angle approximation cos(x/2) = 1 - x^2 / 8

			if ( zoomChanged ||
				lastPosition.distanceToSquared( scope.object.position ) > EPS ||
				8 * ( 1 - lastQuaternion.dot( scope.object.quaternion ) ) > EPS ) {

				scope.dispatchEvent( changeEvent );

				lastPosition.copy( scope.object.position );
				lastQuaternion.copy( scope.object.quaternion );
				zoomChanged = false;

				return true;

			}

			return false;

		};

	}();

	this.dispose = function() {

		scope.domElement.removeEventListener( 'contextmenu', onContextMenu, false );
		scope.domElement.removeEventListener( 'mousedown', onMouseDown, false );
		scope.domElement.removeEventListener( 'wheel', onMouseWheel, false );

		scope.domElement.removeEventListener( 'touchstart', onTouchStart, false );
		scope.domElement.removeEventListener( 'touchend', onTouchEnd, false );
		scope.domElement.removeEventListener( 'touchmove', onTouchMove, false );

		document.removeEventListener( 'mousemove', onMouseMove, false );
		document.removeEventListener( 'mouseup', onMouseUp, false );

		window.removeEventListener( 'keydown', onKeyDown, false );

		//scope.dispatchEvent( { type: 'dispose' } ); // should this be added here?

	};

	//
	// internals
	//

	var scope = this;

	var changeEvent = { type: 'change' };
	var startEvent = { type: 'start' };
	var endEvent = { type: 'end' };

	var STATE = { NONE : - 1, ROTATE : 0, DOLLY : 1, PAN : 2, TOUCH_ROTATE : 3, TOUCH_DOLLY : 4, TOUCH_PAN : 5 };

	var state = STATE.NONE;

	var EPS = 0.000001;

	// current position in spherical coordinates
	var spherical = new THREE.Spherical();
	var sphericalDelta = new THREE.Spherical();

	var scale = 1;
	var panOffset = new THREE.Vector3();
	var zoomChanged = false;

	var rotateStart = new THREE.Vector2();
	var rotateEnd = new THREE.Vector2();
	var rotateDelta = new THREE.Vector2();

	var panStart = new THREE.Vector2();
	var panEnd = new THREE.Vector2();
	var panDelta = new THREE.Vector2();

	var dollyStart = new THREE.Vector2();
	var dollyEnd = new THREE.Vector2();
	var dollyDelta = new THREE.Vector2();

	function getAutoRotationAngle() {

		return 2 * Math.PI / 60 / 60 * scope.autoRotateSpeed;

	}

	function getZoomScale() {

		return Math.pow( 0.95, scope.zoomSpeed );

	}

	function rotateLeft( angle ) {

		sphericalDelta.theta -= angle;

	}

	function rotateUp( angle ) {

		sphericalDelta.phi -= angle;

	}

	var panLeft = function() {

		var v = new THREE.Vector3();

		return function panLeft( distance, objectMatrix ) {

			v.setFromMatrixColumn( objectMatrix, 0 ); // get X column of objectMatrix
			v.multiplyScalar( - distance );

			panOffset.add( v );

		};

	}();

	var panUp = function() {

		var v = new THREE.Vector3();

		return function panUp( distance, objectMatrix ) {

			v.setFromMatrixColumn( objectMatrix, 1 ); // get Y column of objectMatrix
			v.multiplyScalar( distance );

			panOffset.add( v );

		};

	}();

	// deltaX and deltaY are in pixels; right and down are positive
	var pan = function() {

		var offset = new THREE.Vector3();

		return function pan ( deltaX, deltaY ) {

			var element = scope.domElement === document ? scope.domElement.body : scope.domElement;

			if ( scope.object instanceof THREE.PerspectiveCamera ) {

				// perspective
				var position = scope.object.position;
				offset.copy( position ).sub( scope.target );
				var targetDistance = offset.length();

				// half of the fov is center to top of screen
				targetDistance *= Math.tan( ( scope.object.fov / 2 ) * Math.PI / 180.0 );

				// we actually don't use screenWidth, since perspective camera is fixed to screen height
				panLeft( 2 * deltaX * targetDistance / element.clientHeight, scope.object.matrix );
				panUp( 2 * deltaY * targetDistance / element.clientHeight, scope.object.matrix );

			} else if ( scope.object instanceof THREE.OrthographicCamera ) {

				// orthographic
				panLeft( deltaX * ( scope.object.right - scope.object.left ) / scope.object.zoom / element.clientWidth, scope.object.matrix );
				panUp( deltaY * ( scope.object.top - scope.object.bottom ) / scope.object.zoom / element.clientHeight, scope.object.matrix );

			} else {

				// camera neither orthographic nor perspective
				console.warn( 'WARNING: OrbitControls.js encountered an unknown camera type - pan disabled.' );
				scope.enablePan = false;

			}

		};

	}();

	function dollyIn( dollyScale ) {

		if ( scope.object instanceof THREE.PerspectiveCamera ) {

			scale /= dollyScale;

		} else if ( scope.object instanceof THREE.OrthographicCamera ) {

			scope.object.zoom = Math.max( scope.minZoom, Math.min( scope.maxZoom, scope.object.zoom * dollyScale ) );
			scope.object.updateProjectionMatrix();
			zoomChanged = true;

		} else {

			console.warn( 'WARNING: OrbitControls.js encountered an unknown camera type - dolly/zoom disabled.' );
			scope.enableZoom = false;

		}

	}

	function dollyOut( dollyScale ) {

		if ( scope.object instanceof THREE.PerspectiveCamera ) {

			scale *= dollyScale;

		} else if ( scope.object instanceof THREE.OrthographicCamera ) {

			scope.object.zoom = Math.max( scope.minZoom, Math.min( scope.maxZoom, scope.object.zoom / dollyScale ) );
			scope.object.updateProjectionMatrix();
			zoomChanged = true;

		} else {

			console.warn( 'WARNING: OrbitControls.js encountered an unknown camera type - dolly/zoom disabled.' );
			scope.enableZoom = false;

		}

	}

	//
	// event callbacks - update the object state
	//

	function handleMouseDownRotate( event ) {

		//console.log( 'handleMouseDownRotate' );

		rotateStart.set( event.clientX, event.clientY );

	}

	function handleMouseDownDolly( event ) {

		//console.log( 'handleMouseDownDolly' );

		dollyStart.set( event.clientX, event.clientY );

	}

	function handleMouseDownPan( event ) {

		//console.log( 'handleMouseDownPan' );

		panStart.set( event.clientX, event.clientY );

	}

	function handleMouseMoveRotate( event ) {

		//console.log( 'handleMouseMoveRotate' );

		rotateEnd.set( event.clientX, event.clientY );
		rotateDelta.subVectors( rotateEnd, rotateStart );

		var element = scope.domElement === document ? scope.domElement.body : scope.domElement;

		// rotating across whole screen goes 360 degrees around
		rotateLeft( 2 * Math.PI * rotateDelta.x / element.clientWidth * scope.rotateSpeed );

		// rotating up and down along whole screen attempts to go 360, but limited to 180
		rotateUp( 2 * Math.PI * rotateDelta.y / element.clientHeight * scope.rotateSpeed );

		rotateStart.copy( rotateEnd );

		scope.update();

	}

	function handleMouseMoveDolly( event ) {

		//console.log( 'handleMouseMoveDolly' );

		dollyEnd.set( event.clientX, event.clientY );

		dollyDelta.subVectors( dollyEnd, dollyStart );

		if ( dollyDelta.y > 0 ) {

			dollyIn( getZoomScale() );

		} else if ( dollyDelta.y < 0 ) {

			dollyOut( getZoomScale() );

		}

		dollyStart.copy( dollyEnd );

		scope.update();

	}

	function handleMouseMovePan( event ) {

		//console.log( 'handleMouseMovePan' );

		panEnd.set( event.clientX, event.clientY );

		panDelta.subVectors( panEnd, panStart );

		pan( panDelta.x, panDelta.y );

		panStart.copy( panEnd );

		scope.update();

	}

	function handleMouseUp( event ) {

		//console.log( 'handleMouseUp' );

	}

	function handleMouseWheel( event ) {

		//console.log( 'handleMouseWheel' );

		if ( event.deltaY < 0 ) {

			dollyOut( getZoomScale() );

		} else if ( event.deltaY > 0 ) {

			dollyIn( getZoomScale() );

		}

		scope.update();

	}

	function handleKeyDown( event ) {

		//console.log( 'handleKeyDown' );

		switch ( event.keyCode ) {

			case scope.keys.UP:
				pan( 0, scope.keyPanSpeed );
				scope.update();
				break;

			case scope.keys.BOTTOM:
				pan( 0, - scope.keyPanSpeed );
				scope.update();
				break;

			case scope.keys.LEFT:
				pan( scope.keyPanSpeed, 0 );
				scope.update();
				break;

			case scope.keys.RIGHT:
				pan( - scope.keyPanSpeed, 0 );
				scope.update();
				break;

		}

	}

	function handleTouchStartRotate( event ) {

		//console.log( 'handleTouchStartRotate' );

		rotateStart.set( event.touches[ 0 ].pageX, event.touches[ 0 ].pageY );

	}

	function handleTouchStartDolly( event ) {

		//console.log( 'handleTouchStartDolly' );

		var dx = event.touches[ 0 ].pageX - event.touches[ 1 ].pageX;
		var dy = event.touches[ 0 ].pageY - event.touches[ 1 ].pageY;

		var distance = Math.sqrt( dx * dx + dy * dy );

		dollyStart.set( 0, distance );

	}

	function handleTouchStartPan( event ) {

		//console.log( 'handleTouchStartPan' );

		panStart.set( event.touches[ 0 ].pageX, event.touches[ 0 ].pageY );

	}

	function handleTouchMoveRotate( event ) {

		//console.log( 'handleTouchMoveRotate' );

		rotateEnd.set( event.touches[ 0 ].pageX, event.touches[ 0 ].pageY );
		rotateDelta.subVectors( rotateEnd, rotateStart );

		var element = scope.domElement === document ? scope.domElement.body : scope.domElement;

		// rotating across whole screen goes 360 degrees around
		rotateLeft( 2 * Math.PI * rotateDelta.x / element.clientWidth * scope.rotateSpeed );

		// rotating up and down along whole screen attempts to go 360, but limited to 180
		rotateUp( 2 * Math.PI * rotateDelta.y / element.clientHeight * scope.rotateSpeed );

		rotateStart.copy( rotateEnd );

		scope.update();

	}

	function handleTouchMoveDolly( event ) {

		//console.log( 'handleTouchMoveDolly' );

		var dx = event.touches[ 0 ].pageX - event.touches[ 1 ].pageX;
		var dy = event.touches[ 0 ].pageY - event.touches[ 1 ].pageY;

		var distance = Math.sqrt( dx * dx + dy * dy );

		dollyEnd.set( 0, distance );

		dollyDelta.subVectors( dollyEnd, dollyStart );

		if ( dollyDelta.y > 0 ) {

			dollyOut( getZoomScale() );

		} else if ( dollyDelta.y < 0 ) {

			dollyIn( getZoomScale() );

		}

		dollyStart.copy( dollyEnd );

		scope.update();

	}

	function handleTouchMovePan( event ) {

		//console.log( 'handleTouchMovePan' );

		panEnd.set( event.touches[ 0 ].pageX, event.touches[ 0 ].pageY );

		panDelta.subVectors( panEnd, panStart );

		pan( panDelta.x, panDelta.y );

		panStart.copy( panEnd );

		scope.update();

	}

	function handleTouchEnd( event ) {

		//console.log( 'handleTouchEnd' );

	}

	//
	// event handlers - FSM: listen for events and reset state
	//

	function onMouseDown( event ) {

		if ( scope.enabled === false ) return;

		event.preventDefault();

		if ( event.button === scope.mouseButtons.ORBIT ) {

			if ( scope.enableRotate === false ) return;

			handleMouseDownRotate( event );

			state = STATE.ROTATE;

		} else if ( event.button === scope.mouseButtons.ZOOM ) {

			if ( scope.enableZoom === false ) return;

			handleMouseDownDolly( event );

			state = STATE.DOLLY;

		} else if ( event.button === scope.mouseButtons.PAN ) {

			if ( scope.enablePan === false ) return;

			handleMouseDownPan( event );

			state = STATE.PAN;

		}

		if ( state !== STATE.NONE ) {

			document.addEventListener( 'mousemove', onMouseMove, false );
			document.addEventListener( 'mouseup', onMouseUp, false );

			scope.dispatchEvent( startEvent );

		}

	}

	function onMouseMove( event ) {

		if ( scope.enabled === false ) return;

		event.preventDefault();

		if ( state === STATE.ROTATE ) {

			if ( scope.enableRotate === false ) return;

			handleMouseMoveRotate( event );

		} else if ( state === STATE.DOLLY ) {

			if ( scope.enableZoom === false ) return;

			handleMouseMoveDolly( event );

		} else if ( state === STATE.PAN ) {

			if ( scope.enablePan === false ) return;

			handleMouseMovePan( event );

		}

	}

	function onMouseUp( event ) {

		if ( scope.enabled === false ) return;

		handleMouseUp( event );

		document.removeEventListener( 'mousemove', onMouseMove, false );
		document.removeEventListener( 'mouseup', onMouseUp, false );

		scope.dispatchEvent( endEvent );

		state = STATE.NONE;

	}

	function onMouseWheel( event ) {

		if ( scope.enabled === false || scope.enableZoom === false || ( state !== STATE.NONE && state !== STATE.ROTATE ) ) return;

		event.preventDefault();
		event.stopPropagation();

		handleMouseWheel( event );

		scope.dispatchEvent( startEvent ); // not sure why these are here...
		scope.dispatchEvent( endEvent );

	}

	function onKeyDown( event ) {

		if ( scope.enabled === false || scope.enableKeys === false || scope.enablePan === false ) return;

		handleKeyDown( event );

	}

	function onTouchStart( event ) {

		if ( scope.enabled === false ) return;

		switch ( event.touches.length ) {

			case 1:	// one-fingered touch: rotate

				if ( scope.enableRotate === false ) return;

				handleTouchStartRotate( event );

				state = STATE.TOUCH_ROTATE;

				break;

			case 2:	// two-fingered touch: dolly

				if ( scope.enableZoom === false ) return;

				handleTouchStartDolly( event );

				state = STATE.TOUCH_DOLLY;

				break;

			case 3: // three-fingered touch: pan

				if ( scope.enablePan === false ) return;

				handleTouchStartPan( event );

				state = STATE.TOUCH_PAN;

				break;

			default:

				state = STATE.NONE;

		}

		if ( state !== STATE.NONE ) {

			scope.dispatchEvent( startEvent );

		}

	}

	function onTouchMove( event ) {

		if ( scope.enabled === false ) return;

		event.preventDefault();
		event.stopPropagation();

		switch ( event.touches.length ) {

			case 1: // one-fingered touch: rotate

				if ( scope.enableRotate === false ) return;
				if ( state !== STATE.TOUCH_ROTATE ) return; // is this needed?...

				handleTouchMoveRotate( event );

				break;

			case 2: // two-fingered touch: dolly

				if ( scope.enableZoom === false ) return;
				if ( state !== STATE.TOUCH_DOLLY ) return; // is this needed?...

				handleTouchMoveDolly( event );

				break;

			case 3: // three-fingered touch: pan

				if ( scope.enablePan === false ) return;
				if ( state !== STATE.TOUCH_PAN ) return; // is this needed?...

				handleTouchMovePan( event );

				break;

			default:

				state = STATE.NONE;

		}

	}

	function onTouchEnd( event ) {

		if ( scope.enabled === false ) return;

		handleTouchEnd( event );

		scope.dispatchEvent( endEvent );

		state = STATE.NONE;

	}

	function onContextMenu( event ) {

		event.preventDefault();

	}

	//

	scope.domElement.addEventListener( 'contextmenu', onContextMenu, false );

	scope.domElement.addEventListener( 'mousedown', onMouseDown, false );
	scope.domElement.addEventListener( 'wheel', onMouseWheel, false );

	scope.domElement.addEventListener( 'touchstart', onTouchStart, false );
	scope.domElement.addEventListener( 'touchend', onTouchEnd, false );
	scope.domElement.addEventListener( 'touchmove', onTouchMove, false );

	window.addEventListener( 'keydown', onKeyDown, false );

	// force an update at start

	this.update();

};

OrbitControls.prototype = Object.create( THREE.EventDispatcher.prototype );
OrbitControls.prototype.constructor = OrbitControls;

Object.defineProperties( OrbitControls.prototype, {

	center: {

		get: function () {

			console.warn( 'THREE.OrbitControls: .center has been renamed to .target' );
			return this.target;

		}

	},

	// backward compatibility

	noZoom: {

		get: function () {

			console.warn( 'THREE.OrbitControls: .noZoom has been deprecated. Use .enableZoom instead.' );
			return ! this.enableZoom;

		},

		set: function ( value ) {

			console.warn( 'THREE.OrbitControls: .noZoom has been deprecated. Use .enableZoom instead.' );
			this.enableZoom = ! value;

		}

	},

	noRotate: {

		get: function () {

			console.warn( 'THREE.OrbitControls: .noRotate has been deprecated. Use .enableRotate instead.' );
			return ! this.enableRotate;

		},

		set: function ( value ) {

			console.warn( 'THREE.OrbitControls: .noRotate has been deprecated. Use .enableRotate instead.' );
			this.enableRotate = ! value;

		}

	},

	noPan: {

		get: function () {

			console.warn( 'THREE.OrbitControls: .noPan has been deprecated. Use .enablePan instead.' );
			return ! this.enablePan;

		},

		set: function ( value ) {

			console.warn( 'THREE.OrbitControls: .noPan has been deprecated. Use .enablePan instead.' );
			this.enablePan = ! value;

		}

	},

	noKeys: {

		get: function () {

			console.warn( 'THREE.OrbitControls: .noKeys has been deprecated. Use .enableKeys instead.' );
			return ! this.enableKeys;

		},

		set: function ( value ) {

			console.warn( 'THREE.OrbitControls: .noKeys has been deprecated. Use .enableKeys instead.' );
			this.enableKeys = ! value;

		}

	},

	staticMoving : {

		get: function () {

			console.warn( 'THREE.OrbitControls: .staticMoving has been deprecated. Use .enableDamping instead.' );
			return ! this.enableDamping;

		},

		set: function ( value ) {

			console.warn( 'THREE.OrbitControls: .staticMoving has been deprecated. Use .enableDamping instead.' );
			this.enableDamping = ! value;

		}

	},

	dynamicDampingFactor : {

		get: function () {

			console.warn( 'THREE.OrbitControls: .dynamicDampingFactor has been renamed. Use .dampingFactor instead.' );
			return this.dampingFactor;

		},

		set: function ( value ) {

			console.warn( 'THREE.OrbitControls: .dynamicDampingFactor has been renamed. Use .dampingFactor instead.' );
			this.dampingFactor = value;

		}

	}

} );

module.exports = OrbitControls;

},{}],2:[function(require,module,exports){
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

},{"../controls/OrbitControls":1}],3:[function(require,module,exports){
let
WindowManager = require( './WindowManager.js' ),
Player = require( './Player.js' ),
SceneManager = require( './SceneManager.js' ),
CameraManager = require( './CameraManager' ),
TrackManager = require( './TrackManager' ),
NavTrackAgent = require( './NavTrackAgent' ),
PlayerCamera = require( './PlayerCamera' );

class Game {

  constructor() {

    this.trackManager = new TrackManager();
    this.windowManager = new WindowManager();
    this.sceneManager = new SceneManager();
    let cameraManager = new CameraManager();
    this.clock = new THREE.Clock();

    this.windowManager.scene = this.sceneManager.scene;
    this.windowManager.camera = cameraManager.camera;

    this.trackManager.requestTrackData()
    .then( this.onTrackLoad.bind( this ) );

  }

  onTrackLoad() {

    this.navTrackAgent = new NavTrackAgent( this );
    this.player = new Player( this.navTrackAgent );
    this.playerCamera = new PlayerCamera( this );

    this.player.track = this.trackManager.mesh;
    this.player.updatePosition();

    this.sceneManager.scene.add( this.trackManager.mesh );
    this.sceneManager.scene.add( this.player.mesh );

    this.windowManager.render();

  }

  getDeltaTime() {

    return this.clock.getDelta();

  }

}

module.exports = Game;

},{"./CameraManager":2,"./NavTrackAgent":4,"./Player.js":5,"./PlayerCamera":6,"./SceneManager.js":7,"./TrackManager":9,"./WindowManager.js":10}],4:[function(require,module,exports){
let EventDispatcher = require( '../../vendor/EventDispatcher.js' );

class NavTrackAgent extends EventDispatcher {

  constructor( game ) {

    super();

    this.game = game;
    this.track = game.trackManager;
    this._currentDistance = 0;

    this.speed = 150;

    game.windowManager.addEventListener( 'onPreRender', this.update.bind( this ) );

  }

  update() {

    this.currentDistance = (
      this._currentDistance + this.speed * this.game.getDeltaTime()
    ) % this.track.getLength();

  }

  get currentDistance() {

    return this._currentDistance;

  }

  set currentDistance( value ) {

    this._currentDistance = value;
    this.dispatchEvent( { type: 'change' } );

  }

  get amountTraveled() {

    return this._currentDistance / this.track.getLength();

  }

  nextAmountTraveled( add ) {

    var next = ( this._currentDistance + add ) / this.track.getLength();

    return next < 1 ? next : 1;

  }

}

module.exports = NavTrackAgent;

},{"../../vendor/EventDispatcher.js":12}],5:[function(require,module,exports){
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

},{}],6:[function(require,module,exports){
class PlayerCamera {

  constructor( game ) {

    this.margin = {
      back: -20,
      top: 20
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

    var scope = this;
    var amountTraveled = this.navTrackAgent.amountTraveled;
    var pos = this.track.geometry.getPointAt( amountTraveled );
    var normal = this.track.geometry.getNormalAt( amountTraveled );
    var forward = this.track.geometry.getTangent( amountTraveled );
    var next = this.navTrackAgent.nextAmountTraveled( 75 );
    var lookAtPos = this.track.geometry.getPointAt( next );

    updateCameraPos();
    updateCameraRotation();

    function updateCameraPos() {

      var cameraPosition = new THREE.Vector3().copy( pos )
      .addScaledVector( forward, scope.margin.back )
      .addScaledVector( normal, scope.margin.top );

      scope.position.copy( cameraPosition );

    }

    function updateCameraRotation() {

      scope.helperCameraMesh.lookAt( lookAtPos );

    }

  }

}

module.exports = PlayerCamera;

},{}],7:[function(require,module,exports){
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

},{}],8:[function(require,module,exports){
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

},{}],9:[function(require,module,exports){
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

},{"./TrackGeometry.js":8}],10:[function(require,module,exports){
let EventDispatcher = require( '../../vendor/EventDispatcher.js' );

class WindowManager extends EventDispatcher {

  constructor() {

    super();

    this.createWindow();

  }

  createWindow() {

    var dom = document.getElementById( 'container' );
    this.renderer = new THREE.WebGLRenderer();
    this.renderer.setClearColor( 0xf0f0f0 );
    dom.appendChild( this.renderer.domElement );
    this.resize();

  }

  resize() {

    this.renderer.setSize( window.innerWidth, window.innerHeight );

  }

  render() {

    this.dispatchEvent( { type: 'onPreRender' } );
    this.renderer.render( this.scene, this.camera );
    window.requestAnimationFrame( this.render.bind( this ) );

  }

}

module.exports = WindowManager;

},{"../../vendor/EventDispatcher.js":12}],11:[function(require,module,exports){
let
Game = require( './game/Game.js' );

(function () {

  'use strict';

  var game = new Game();

})();

},{"./game/Game.js":3}],12:[function(require,module,exports){
/**
 * @author mrdoob / http://mrdoob.com/
 */

function EventDispatcher() {}

Object.assign( EventDispatcher.prototype, {

	addEventListener: function ( type, listener ) {

		if ( this._listeners === undefined ) this._listeners = {};

		var listeners = this._listeners;

		if ( listeners[ type ] === undefined ) {

			listeners[ type ] = [];

		}

		if ( listeners[ type ].indexOf( listener ) === - 1 ) {

			listeners[ type ].push( listener );

		}

	},

	hasEventListener: function ( type, listener ) {

		if ( this._listeners === undefined ) return false;

		var listeners = this._listeners;

		return listeners[ type ] !== undefined && listeners[ type ].indexOf( listener ) !== - 1;

	},

	removeEventListener: function ( type, listener ) {

		if ( this._listeners === undefined ) return;

		var listeners = this._listeners;
		var listenerArray = listeners[ type ];

		if ( listenerArray !== undefined ) {

			var index = listenerArray.indexOf( listener );

			if ( index !== - 1 ) {

				listenerArray.splice( index, 1 );

			}

		}

	},

	dispatchEvent: function ( event ) {

		if ( this._listeners === undefined ) return;

		var listeners = this._listeners;
		var listenerArray = listeners[ event.type ];

		if ( listenerArray !== undefined ) {

			event.target = this;

			var array = listenerArray.slice( 0 );

			for ( var i = 0, l = array.length; i < l; i ++ ) {

				array[ i ].call( this, event );

			}

		}

	}

} );

module.exports = EventDispatcher;

},{}]},{},[11])

//# sourceMappingURL=script.js.map
