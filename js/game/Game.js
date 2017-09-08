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

    this.cubes = [];

    THREE.ARUtils.getARDisplay().then(this.init.bind(this));

    this.trackManager = new TrackManager();
    this.trackManager.addEventListener('newSpline', this.newCubeGroup.bind(this));
    // this.windowManager = new WindowManager();
    // this.sceneManager = new SceneManager();
    // let cameraManager = new CameraManager();
    // this.clock = new THREE.Clock();
    //
    // this.windowManager.scene = this.sceneManager.scene;
    // this.windowManager.camera = cameraManager.camera;
    //
    // this.trackManager.requestTrackData()
    // .then( this.onTrackLoad.bind( this ) );

  }

  newCubeGroup(){
    this.cubes = [];
  }

  init(display){

    if (display === null) {
      THREE.ARUtils.displayUnsupportedMessage();
      return;
    }
    var dom = document.getElementById( 'container' );
    this.vrDisplay = display;
    this.renderer = new THREE.WebGLRenderer({ alpha: true });
    this.scene = new THREE.Scene();
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.autoClear = false;
    dom.appendChild( this.renderer.domElement );
    window.addEventListener('resize', this.onWindowResize.bind(this), false);

    this.vrFrameData = new VRFrameData();

    this.arView = new THREE.ARView(this.vrDisplay, this.renderer);
    this.camera = new THREE.ARPerspectiveCamera(
      this.vrDisplay,
      60,
      window.innerWidth / window.innerHeight,
      this.vrDisplay.depthNear,
      this.vrDisplay.depthFar
    );
    this.vrControls = new THREE.VRControls(this.camera);

    this.createBoxTemplate();

    this.renderer.domElement.addEventListener('touchstart', this.onClick.bind(this), false);

    this.update();
  }

  createBoxTemplate(){

    var colors = [
      new THREE.Color( 0xffffff ),
      new THREE.Color( 0xffff00 ),
      new THREE.Color( 0xff00ff ),
      new THREE.Color( 0xff0000 ),
      new THREE.Color( 0x00ffff ),
      new THREE.Color( 0x00ff00 ),
      new THREE.Color( 0x0000ff ),
      new THREE.Color( 0x000000 )
    ];

    var geometry = new THREE.BoxGeometry( 0.025, 0.05, 0.025 );
    var faceIndices = ['a', 'b', 'c'];
    for (var i = 0; i < geometry.faces.length; i++) {
      var f  = geometry.faces[i];
      for (var j = 0; j < 3; j++) {
        var vertexIndex = f[faceIndices[ j ]];
        f.vertexColors[j] = colors[vertexIndex];
      }
    }
    var material = new THREE.MeshBasicMaterial({ vertexColors: THREE.VertexColors });
    this.cube = new THREE.Mesh(geometry, material);

  }

  onClick(){
    // Fetch the pose data from the current frame
    var pose = this.vrFrameData.pose;

    // Convert the pose orientation and position into
    // THREE.Quaternion and THREE.Vector3 respectively
    var ori = new THREE.Quaternion(
      pose.orientation[0],
      pose.orientation[1],
      pose.orientation[2],
      pose.orientation[3]
    );

    var pos = new THREE.Vector3(
      pose.position[0],
      pose.position[1],
      pose.position[2]
    );

    var dirMtx = new THREE.Matrix4();
    dirMtx.makeRotationFromQuaternion(ori);

    var push = new THREE.Vector3(0, 0, -1.0);
    push.transformDirection(dirMtx);
    pos.addScaledVector(push, 0.125);

    // Clone our cube object and place it at the camera's
    // current position
    var clone = this.cube.clone();

    clone.position.copy(pos);
    clone.quaternion.copy(ori);
    this.cubes.push(clone);

    if(this.cubes.length < 4){
      this.scene.add(clone);

    }else if (this.cubes.length === 4){
      for (var i = 0; i < this.cubes.length-1; i++) {
        var cube = this.cubes[i];
        this.scene.remove( this.scene.getObjectById(cube.id));
      }
    }

    this.updateSpline();

  }

  updateSpline(){
    console.log(this.cubes[this.cubes.length-1].position);
    if(this.cubes.length > 3){

      this.trackManager.updateCtrlPoints( this.cubes );

      if( this.trackManager.mesh === undefined ){

        this.trackManager.createPath();
        this.scene.add( this.trackManager.mesh );

      }else{

        this.trackManager.updatePath();

      }
      // this.trackManager.requestTrackData()
      // .then( ()=>{
      //   this.scene.add( this.trackManager.mesh );
      // } );
    }
  }

  update(){
    this.arView.render();
    this.camera.updateProjectionMatrix();
    this.vrDisplay.getFrameData(this.vrFrameData);
    this.vrControls.update();
    this.renderer.clearDepth();
    this.renderer.render(this.scene, this.camera);
    this.vrDisplay.requestAnimationFrame(this.update.bind(this));
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

  onWindowResize(){
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

}

module.exports = Game;
