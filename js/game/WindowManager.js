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
