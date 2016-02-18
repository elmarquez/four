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

    self.backgroundColor = config.backgroundColor || new THREE.Color(0x000, 1.0);
    self.camera = config.camera;
    self.clock = new THREE.Clock();
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
    self.tasks = [];

    // add the viewport to the DOM
    self.domElement.appendChild(self.renderer.domElement);

    // listen for events
    self.domElement.addEventListener('contextmenu', self.onContextMenu.bind(self));
    self.scene.addEventListener(FOUR.EVENT.UPDATE, self.render.bind(self), false);
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
   * Disable interactions with the viewport.
   */
  Viewport3D.prototype.disable = function () {
    if (this.controller) {
      this.controller.disable();
    }
  };

  /**
   * Clear all rendering tasks.
   */
  Viewport3D.prototype.clearTasks = function () {
    this.tasks.length = 0;
  };

  /**
   * Enable interactions with the viewport.
   */
  Viewport3D.prototype.enable = function () {
    if (this.controller) {
      this.controller.enable();
    }
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
   * Remove rendering task.
   * @param {Object} event
   */
  Viewport3D.prototype.onContinuousUpdateEnd = function (event) {
    console.info('render task end', event);
    event.id = event.id || 'anonymous';
    // remove the first task found with a matching id value
    for (var i = this.tasks.length - 1; i >= 0; i--) {
      if (this.tasks[i].id === event.id) {
        this.tasks.splice(i,1);
        return;
      }
    }
  };

  /**
   * Create new rendering task, start rendering and updating controller states
   * continuously. We currently keep track of
   * @param {Object} event
   */
  Viewport3D.prototype.onContinuousUpdateStart = function (event) {
    console.info('render task start', event);
    this.tasks.push({id:event.id || 'anonymous', task:event.task||null});
    this.update();
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
    this.renderer.render(this.scene, this.camera);
  };

  /**
   * Set the active viewport controller.
   * @param {String} name Controller name
   */
  Viewport3D.prototype.setActiveController = function (name) {
    // TODO need to enable/disable the controller event listeners as we do with navigation
    if (this.controller) {
      this.controller.disable();
      this.controller.removeEventListener(this.render);
    }
    console.info('Set active viewport controller to', name);
    this.controller = this.controllers[name];
    this.controller.addEventListener(FOUR.EVENT.UPDATE, this.render.bind(this), false);
    this.controller.addEventListener(FOUR.EVENT.CONTINUOUS_UPDATE_START, this.onContinuousUpdateStart.bind(this), false);
    this.controller.addEventListener(FOUR.EVENT.CONTINUOUS_UPDATE_END, this.onContinuousUpdateEnd.bind(this), false);
    this.controller.enable();
    this.dispatchEvent({type:FOUR.EVENT.CONTROLLER_CHANGE});
  };

  /**
   * Set viewport background color.
   * @param {THREE.Color} color Color
   */
  Viewport3D.prototype.setBackgroundColor = function (color) {
    this.background = color;
    this.renderer.setClearColor(this.backgroundColor);
    this.dispatchEvent({type:FOUR.EVENT.BACKGROUND_CHANGE});
    this.render();
  };

  /**
   * Set the viewport camera.
   * @param {THREE.Camera} camera Camera
   */
  Viewport3D.prototype.setCamera = function (camera) {
    this.camera = camera;
    this.camera.aspect = this.domElement.clientWidth / this.domElement.clientHeight;
    this.camera.updateProjectionMatrix();
    this.dispatchEvent({type:FOUR.EVENT.CAMERA_CHANGE});
    this.render();
  };

  /**
   * Update the controller and global tween state.
   * @param {Boolean} force Force update
   */
  Viewport3D.prototype.update = function (force) {
    if (this.tasks.length > 0 || (typeof force === 'boolean' && force)) {
      this.updateOnce();
      requestAnimationFrame(this.update.bind(this));
    }
  };

  /**
   * Update controller state once.
   */
  Viewport3D.prototype.updateOnce = function () {
    TWEEN.update();
    if (this.controller) {
      this.delta = this.clock.getDelta();
      this.controller.update(this.delta);
    }
  };

  return Viewport3D;

}());
