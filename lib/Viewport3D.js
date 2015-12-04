/**
 * Renders the view from a scene camera to a canvas element in the DOM. Emits
 * the following change events:
 *
 *  backgroundChange:
 *  cameraChange:
 *  controllerChange: active controller changed
 */
FOUR.Viewport3D = (function () {

  /**
   * Viewport3D constructor.
   * @param {Object} config Configuration
   * @constructor
   */
  function Viewport3D(config) {
    THREE.EventDispatcher.call(this);
    config = config || {};
    var self = this;
    self.EVENT = {
      BACKGROUND_CHANGE: {type:'background-change'},
      CAMERA_CHANGE: {type:'camera-change'},
      CONTROLLER_CHANGE: {type:'controller-change'}
    };
    self.backgroundColor = config.backgroundColor || new THREE.Color(0x000, 1.0);
    self.camera = config.camera;
    self.clock = new THREE.Clock();
    self.continuousUpdate = false;
    self.controller = null; // the active controller
    self.controllers = {};
    self.delta = 0;
    self.domElement = config.domElement;
    self.listeners = {};
    self.renderer = new THREE.WebGLRenderer({antialias: true});
    self.renderer.setClearColor(self.backgroundColor);
    self.renderer.setSize(self.domElement.clientWidth, self.domElement.clientHeight);
    self.renderer.shadowMap.enabled = true;
    self.scene = config.scene;
    // add the viewport to the DOM
    self.domElement.appendChild(self.renderer.domElement);
    // listen for events
    self.domElement.addEventListener('contextmenu', self.onContextMenu.bind(self));
    self.scene.addEventListener('update', self.render.bind(self), false);
    window.addEventListener('resize', self.onWindowResize.bind(self), false);
    Object.keys(config).forEach(function (key) {
      self[key] = config[key];
    });
  }

  Viewport3D.prototype = Object.create(THREE.EventDispatcher.prototype);

  Viewport3D.prototype.constructor = Viewport3D;

  /**
   * Add controller to viewport.
   * @param {FOUR.Controller} controller Controller
   * @param {String} name Name
   */
  Viewport3D.prototype.addController = function (controller, name) {
    this.controllers[name] = controller;
  };

  /**
   * Get the viewport camera.
   * @returns {THREE.Camera}
   */
  Viewport3D.prototype.getCamera = function () {
    return this.camera;
  };

  /**
   * Get the viewport scene.
   * @returns {THREE.Scene}
   */
  Viewport3D.prototype.getScene = function () {
    return this.scene;
  };

  /**
   * Handle context menu event.
   * @param {Object} event Mouse event
   */
  Viewport3D.prototype.onContextMenu = function (event) {
    event.preventDefault();
  };

  /**
   * Handle window resize event.
   */
  Viewport3D.prototype.onWindowResize = function () {
    var ctrl, self = this;
    var height = self.domElement.clientHeight;
    var width = self.domElement.clientWidth;
    self.camera.aspect = width / height;
    self.camera.updateProjectionMatrix();
    Object.keys(self.controllers).forEach(function (key) {
      ctrl = self.controllers[key];
      if (typeof ctrl.handleResize === 'function') {
        ctrl.handleResize();
      }
    });
    self.renderer.setSize(width, height);
    self.render();
  };

  /**
   * Render the viewport once.
   */
  Viewport3D.prototype.render = function () {
    //console.info('render');
    this.renderer.render(this.scene, this.camera);
  };

  /**
   * Set the active viewport controller.
   * @param {String} name Controller name
   */
  Viewport3D.prototype.setActiveController = function (name) {
    var self = this;
    if (self.controller) {
      self.controller.disable();
      self.controller.removeEventListener(self.render);
    }
    console.info('Set active viewport controller to', name);
    self.controller = self.controllers[name];
    self.controller.addEventListener('update', self.render.bind(self), false);
    self.controller.enable();
    self.dispatchEvent(self.EVENT.CONTROLLER_CHANGE);
  };

  /**
   * Set viewport background color.
   * @param {THREE.Color} color Color
   */
  Viewport3D.prototype.setBackgroundColor = function (color) {
    var self = this;
    self.background = color;
    self.renderer.setClearColor(self.backgroundColor);
    self.dispatchEvent(self.EVENT.BACKGROUND_CHANGE);
    self.render();
  };

  /**
   * Set the viewport camera.
   * @param {THREE.Camera} camera Camera
   */
  Viewport3D.prototype.setCamera = function (camera) {
    var self = this;
    self.camera = camera;
    self.camera.aspect = self.domElement.clientWidth / self.domElement.clientHeight;
    self.camera.updateProjectionMatrix();
    self.dispatchEvent(self.EVENT.CAMERA_CHANGE);
    self.render();
  };

  /**
   * Update the controller and global tween state.
   * @param {Boolean} force Force update
   */
  Viewport3D.prototype.update = function (force) {
    var self = this;
    if (self.continuousUpdate || (force && force === true)) {
      // enqueue next update
      requestAnimationFrame(self.update.bind(self));
      // update tween state
      TWEEN.update();
      // update controller state
      if (self.controller) {
        self.delta = self.clock.getDelta();
        self.controller.update(self.delta);
      }
    }
  };

  return Viewport3D;

}());
