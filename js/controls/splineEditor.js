let
Clipboard = require('clipboard'),
PathBufferGeometry = require('../Spline/PathGeometry.js').PathBufferGeometry;

module.exports = function( dat, THREE, $ ) {

  "use strict";

  function SplineEditor(splineModel, scene, camera, renderer, orbitControl, mesh){

    let
    ctrlPointGeometry = new THREE.SphereGeometry( 5, 32, 32 ),
    ctrlNormalGeometry = new THREE.BoxGeometry( 5, 20, 5 ),
    ctrlPointsHelper = [],
    ctrlNormalHelper = [],
    draggableObjs = [],
    transformControl = new THREE.TransformControls( camera, renderer.domElement );


    scene.add( transformControl );

    let guiModel = {
      play : false,
      addCtrlPoint: addCtrlPoint,
      addCtrlNormal: addCtrlNormal,
      removeCtrlPoint: removeCtrlPoint,
      save: save,
      x: 0,
      y: 0,
      z: 0
      // speed: 0.8
    };

    var gui = new dat.GUI();

    gui
    .addFolder('Camera')
    .add(guiModel, 'play')
    .name('Navigate spline')
    .onChange(setPlayMode);

    setPlayMode(false);

    var splineGUI = gui.addFolder('Spline');
    splineGUI.add(guiModel, 'addCtrlPoint').name('+ Point');
    splineGUI.add(guiModel, 'addCtrlNormal').name('+ Normal');
    splineGUI.add(guiModel, 'removeCtrlPoint').name('Remove selected');

    splineGUI.add({width:mesh.geometry.width}, 'width', 10, 100)
    .name('Width')
    .onChange(function(value){

      mesh.geometry.width = value;
      mesh.geometry.generateVertices();

    });

    splineGUI.add({segments:mesh.geometry.segments}, 'segments', 10, 800)
    .name('Segments')
    .onChange(function(value){

      mesh.geometry.segments = parseInt(value);
      updateGeometry();

    });

    splineGUI.add(mesh.material, 'wireframe').name('Wireframe');

    splineGUI.open();

    var positionGUI = gui.addFolder('Control position');
    positionGUI.add( guiModel, 'x' ).onChange( updateCtrlPointPosition );
    positionGUI.add( guiModel, 'y' ).onChange( updateCtrlPointPosition );
    positionGUI.add( guiModel, 'z' ).onChange( updateCtrlPointPosition );


    var saveBtn = gui.add({ save:()=>{}}, 'save').name('Save');

    var saveBtnContainer = $(saveBtn.domElement).parents('.function')[0];

    new Clipboard(saveBtnContainer, {
      text: save
    });

    initCtrlPointsEditor();

    function updateCtrlPointPosition() {

      var position = transformControl.object.position;

      var needUpdate = (
        (position.x !== guiModel.x) ||
        (position.y !== guiModel.y) ||
        (position.z !== guiModel.z)
      );

      position.x = guiModel.x;
      position.y = guiModel.y;
      position.z = guiModel.z;

      if( needUpdate ){

        updateSpline();
        updateNormals();

      }

    }

    function save(){
      var splineModelJSON = splineModel.asJSON();
      localStorage.setItem('splineModel', splineModelJSON);
      console.log(splineModelJSON);
      return splineModelJSON;
    }

    function setPlayMode(value){
      console.log(value);
      if(value){
        orbitControl.enable = false;
        splineModel.mode = splineModel.MODE_PLAY;
      }else{
        console.log('disable');
        camera.up.set(0,1,0);
        orbitControl.enable = true;
        splineModel.mode = splineModel.MODE_EDIT;
      }
    }

    function initCtrlPointsEditor(){

      ctrlNormalGeometry.applyMatrix(
        new THREE.Matrix4().makeTranslation(0,-10,0)
      );

      splineModel.ctrlPoints.forEach((ctrl)=>{
        addCtrlPoint(ctrl, false);
      });

      splineModel.ctrlNormals.forEach((normal, i)=>{
        addCtrlNormal(normal, false);
      });

      setTimeout(function () {
        updateSpline();
        updateNormals();
      }, 0);


      var dragcontrols = new THREE.DragControls( draggableObjs, camera, renderer.domElement );
  		dragcontrols.enabled = false;
      transformControl.setSpace('local');

  		dragcontrols.addEventListener( 'dragstart', function ( event ) {

        var targetObj = event.object;

        guiModel.x = targetObj.position.x;
        guiModel.y = targetObj.position.y;
        guiModel.z = targetObj.position.z;
        gui.updateDisplay();

        if(targetObj != transformControl.object){
          transformControl.detach( transformControl.object );
          transformControl.attach( targetObj );
          transformControl.setMode(targetObj.controlMode);
        }
      });

  		transformControl.addEventListener( 'objectChange', function( e ) {
  			updateSpline();
        updateNormals();
  		});

      window.addEventListener('keydown', (e)=>{
        switch (e.keyCode) {
          case 82: // R
            transformControl.setMode('translate');
            break;
          case 70: // F
            focusOnSelected();
            break;
        }
      });


    }

    function focusOnSelected() {

      orbitControl.target.copy( transformControl.object.position );

    }

    function addCtrlPoint(position, update = true){

      var material = new THREE.MeshLambertMaterial({color : Math.random() * 0xffffff});
      var sphere = new THREE.Mesh( ctrlPointGeometry, material );


      if (typeof position === 'undefined'){

        var ctrlP1 = ctrlPointsHelper[ ctrlPointsHelper.length - 1 ].position;
        var ctrlP2 = ctrlPointsHelper[ ctrlPointsHelper.length - 2 ].position;
        var ctrlP3 = new THREE.Vector3()
        .subVectors( ctrlP1, ctrlP2 )
        .add(ctrlP1)
        ;

        sphere.position.copy(
          ctrlP3
        );

        sphere.position.x += Math.random() * 100 - 50;
        sphere.position.y += Math.random() * 20;
        sphere.position.z += Math.random() * 100 - 50;

      }else{
        sphere.position.copy(position);
      }

      sphere.type = "ctrlPoint";


      scene.add( sphere );
      sphere.controlMode = 'translate';

      ctrlPointsHelper.push(sphere);
      draggableObjs.push(sphere);

      if(update === true){
        updateSpline();
        updateNormals();
      }
    }

    function addCtrlNormal( normal = new THREE.Vector3(0,1,0), update = true){


      var right = new THREE.Vector3(1,0,0);

      var material = new THREE.MeshLambertMaterial({color : Math.random() * 0xffffff});
      var cube = new THREE.Mesh( ctrlNormalGeometry, material );
      cube.controlMode = 'rotate';
      scene.add( cube );
      cube.lookAt(normal.add(cube.position));
      cube.rotateOnAxis( right, (-90 * Math.PI) / 180 );

      cube.type = "ctrlNormal";

      ctrlNormalHelper.push(cube);
      draggableObjs.push(cube);

      if(update){
  			updateSpline();
        updateNormals();
      }
    }

    function removeCtrlPoint(){
      let
      obj = transformControl.object,
      i;

      transformControl.detach( transformControl.object );
      scene.remove(obj);

      switch (obj.type) {
        case 'ctrlPoint':
          i = ctrlPointsHelper.indexOf(obj);
          ctrlPointsHelper.splice(i, 1);
          break;
        case 'ctrlNormal':
          i = ctrlNormalHelper.indexOf(obj);
          ctrlNormalHelper.splice(i, 1);
          break;
      }
      i = draggableObjs.indexOf(obj);
      draggableObjs.splice(i, 1);

  		updateSpline();
      updateNormals();
    }

    function updateSpline(){
      let ctrlPoints = [],
      normalPoints = [];

      splineModel.ctrlPoints = [];
      splineModel.ctrlNormals = [];

      for (var i = 0; i < ctrlPointsHelper.length; i++) {

        var p = ctrlPointsHelper[ i ];
        ctrlPoints.push( p.position );
        splineModel.ctrlPoints.push( p.position );

      }

      for (i = 0; i < ctrlNormalHelper.length; i++) {

        var n = ctrlNormalHelper[ i ];
        var matrix = new THREE.Matrix4();
        matrix.extractRotation( n.matrix );

        var direction = new THREE.Vector3( 0, 1, 0 ).applyMatrix4(matrix);
        normalPoints.push(direction);
        splineModel.ctrlNormals.push(direction);

      }

      mesh.geometry.ctrlPoints = ctrlPoints;
      updateGeometry();

    }

    function updateGeometry(){

      mesh.geometry.dispose();

      mesh.geometry = new PathBufferGeometry(
        splineModel.ctrlPoints,
        splineModel.ctrlNormals,
        mesh.geometry.width,
        mesh.geometry.segments
      );

    }

    function updateNormals(){
      ctrlNormalHelper.forEach((cube, i)=>{
        var position = mesh.geometry.getPointAt(i/(ctrlNormalHelper.length-1));
        // var matrix = new THREE.Matrix4();
        // matrix.extractRotation( cube.matrix );
        // var up = new THREE.Vector3(0, 1, 0).applyMatrix4(matrix);
        cube.position.copy( position ); //.sub(up.multiplyScalar(-20*0.5));
      });
    }
  }

  return SplineEditor;
};
