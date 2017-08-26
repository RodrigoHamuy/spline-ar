let
$ =     require("jquery"),
dat =   require('dat.gui').default,
THREE = require('three'),
SplineModel = require('./Spline/splineModel.js')($, THREE),
SplineEditor = require('./controls/splineEditor.js')(dat, THREE, $);

THREE.OrbitControls = require('three-orbit-controls')(THREE);

require('./controls/TransformControls.js');
require('./controls/DragControls.js');

(()=>{
  "use strict";

  let
  Renderer = require('./Renderer.js'),
  Camera = require('./Camera.js'),
  Stats = require('./Stats.js'),
  PathBufferGeometry = require('./Spline/PathGeometry.js').PathBufferGeometry;



  let
  $container = $('#container'),
  renderer,
  stats,
  clock = new THREE.Clock(),
  camera,
  scene,
  controls,
  pathGeometry,
  pathMesh,
  cubeCtrlPoints,
  timer = 0,
  splineModel = new SplineModel(),
  splineEditor,
  currDistance = 0,
  speed = 150,
  player;

  init();

  function init() {

    stats = Stats.create();
    scene = new THREE.Scene();
    camera = Camera.create();
    controls = new THREE.OrbitControls(camera);
    renderer = Renderer.create($container[0]);
    renderer.setClearColor( 0xf0f0f0 );
    scene.add( new THREE.AxisHelper( 20 ) );

    scene.add( new THREE.AmbientLight( 0xf0f0f0 ) );
    var light = new THREE.SpotLight( 0xffffff, 1.5 );
    light.position.set( 0, 1500, 200 );
    light.castShadow = true;
    light.shadow = new THREE.LightShadow( new THREE.PerspectiveCamera( 70, 1, 200, 2000 ) );
    light.shadow.bias = -0.000222;
    light.shadow.mapSize.width = 1024;
    light.shadow.mapSize.height = 1024;
    scene.add( light );

    let transformControl = new THREE.TransformControls( camera, renderer.domElement );
    // transformControl.addEventListener( 'change', render );
    scene.add( transformControl );

    splineModel.getLevel(()=>{

      createPath();
      splineEditor = new SplineEditor( splineModel, scene, camera, renderer, controls, pathMesh );
      addPlayer();
      render();

    });


  }

  function addPlayer() {

    var geometry = new THREE.BoxGeometry( 10, 10, 1 );
    var material = new THREE.MeshBasicMaterial( {color: 0x00ff00} );
    player = new THREE.Mesh( geometry, material );
    scene.add( player );
    var pos = pathMesh.geometry.getPointAt( 0 );
    var normal = pathMesh.geometry.getNormalAt( 0 );
    updatePlayerPosition( pos, normal );

  }


  function render() {

  	stats.begin();

    var deltaTime = clock.getDelta();
    timer += deltaTime;

    if (splineModel.mode === splineModel.MODE_EDIT) {
      controls.update( deltaTime );
    }else{

      var pathDistance = pathMesh.geometry.getLength();

      currDistance = (currDistance + speed * deltaTime) % pathDistance;

      var pointAt = currDistance / pathDistance;

      var normal = pathMesh.geometry.getNormalAt( pointAt );

      var pos = pathMesh.geometry.getPointAt( pointAt );

      updateCameraPosition( pos.clone(), normal.clone(), pathDistance );

      updatePlayerPosition( pos.clone(), normal.clone() );

    }

    renderer.render(scene, camera);

  	stats.end();

    requestAnimationFrame( render );
  }

  function updatePlayerPosition( pos, normal ) {

    player.position.copy( pos )
    .add( new THREE.Vector3().addScaledVector( normal, -10 ) );
    player.lookAt( new THREE.Vector3().addVectors( pos, normal) );

  }

  function updateCameraPosition( pos, normal, pathDistance ) {

    var distanceFromPlayer = -100;

    var forward = pathMesh.geometry.getTangent( currDistance / pathDistance );
    console.log( forward );

    camera.up.copy( normal ).negate();

    pos.add( normal.multiplyScalar( -2 ) );

    camera.position.copy( pos );//.sub( forward.addScalar( distanceFromPlayer ) );

    var next = ( currDistance + 75 ) / pathDistance;

    if ( next > 1 ) {

      next = 1;

    }

    camera.lookAt( pathMesh.geometry.getPointAt( next ), normal );

  }

  function createPath() {

    pathGeometry = new PathBufferGeometry( splineModel.ctrlPoints, splineModel.ctrlNormals, 10, 30);
    var material = new THREE.MeshNormalMaterial();
    material.side = THREE.DoubleSide;
    // material.wireframe = true;
    pathMesh = new THREE.Mesh(pathGeometry, material);
    scene.add(pathMesh);

  }

})();
