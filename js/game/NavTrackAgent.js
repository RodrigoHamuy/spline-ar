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

}

module.exports = NavTrackAgent;
