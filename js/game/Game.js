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
