FOUR.MarqueeSelectionController = (function () {

  /**
   * Marquee selection controller. A reimplementation of Josh Staples' cached
   * marquee selection control.
   * @see http://blog.tempt3d.com/2013/12/cached-marquee-selection-with-threejs.html
   * @see http://tempt3d.com/webgl-code-samples/canvas-interaction/marquee-select-with-cache.html
   * @param {Object} config Configuration
   * @constructor
   */
  function MarqueeSelectionController (config) {
    THREE.EventDispatcher.call(this);
    config = config || {};
    var self = this;

    self.KEY = {ALT: 18, CTRL: 17, SHIFT: 16};
    self.MOUSE_STATE = {DOWN: 0, UP: 1};

    self.cache = new FOUR.SelectionCache({scene:config.viewport.scene, viewport:config.viewport});
    self.domElement = config.viewport.domElement;
    self.enabled = false;
    self.filter = function () { return true; };
    self.filters = {};
    self.frustum = new THREE.Frustum();
    self.intersects = [];
    self.listeners = {};
    self.marquee = document.getElementById('marquee');
    self.modifiers = {};
    self.mouse = {
      end: new THREE.Vector2(),
      start: new THREE.Vector2(),
      state: self.MOUSE_STATE.UP
    };
    self.offset = {};
    self.quadtree = new Quadtree({height: 1, width: 1});
    self.raycaster = new THREE.Raycaster();
    self.timeout = null;
    self.viewport = config.viewport;

    Object.keys(self.KEY).forEach(function (key) {
      self.modifiers[self.KEY[key]] = false;
    });
  }

  MarqueeSelectionController.prototype = Object.create(THREE.EventDispatcher.prototype);

  /**
   * Build a quadtree from the set of objects that are contained within the
   * camera frustum. Index each object by its projected screen coordinates.
   * @see https://github.com/mrdoob/three.js/issues/1209
   * @see http://stackoverflow.com/questions/17624021/determine-if-a-mesh-is-visible-on-the-viewport-according-to-current-camera
   */
  MarqueeSelectionController.prototype.buildCache = function () {
    var self = this;
    // TODO defer this operation for some time period, to ensure that the camera has stopped moving
    // clear the current index
    self.quadtree = new Quadtree({height: 1, width: 1});

    // build a frustum for the current camera view
    var camera = self.viewport.getCamera();
    //var matrix = new THREE.Matrix4().multiply(camera.projectionMatrix, camera.matrixWorldInverse);
    //self.frustum.setFromMatrix(matrix);

    // alternate frustum construction approach
    var cameraViewProjectionMatrix = new THREE.Matrix4();
    camera.updateMatrixWorld(); // make sure the camera matrix is updated
    camera.matrixWorldInverse.getInverse(camera.matrixWorld);
    cameraViewProjectionMatrix.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
    self.frustum.setFromMatrix(cameraViewProjectionMatrix);

    // traverse the scene and add all entities within the frustum to the index
    var total = 0;
    self.viewport.getScene().getModelObjects().forEach(function (child) {
      if (self.frustum.intersectsObject(child)) {
        total += 1;
        var p = self.getObjectScreenCoordinates(child);
        self.quadtree.push({x: p.x, y: p.y, id: child.id});
      }
    });
    console.info('Found %s objects in the view', total);
  };

  MarqueeSelectionController.prototype.contextMenu = function (event) {
    event.preventDefault();
  };

  MarqueeSelectionController.prototype.disable = function () {
    var self = this;
    self.enabled = false;
    Object.keys(self.listeners).forEach(function (key) {
      var listener = self.listeners[key];
      listener.element.removeEventListener(listener.event, listener.fn);
    });
  };

  MarqueeSelectionController.prototype.enable = function () {
    var self = this;
    self.offset.x = self.domElement.clientLeft;
    self.offset.y = self.domElement.clientTop;
    function addListener(element, event, fn) {
      self.listeners[event] = {
        element: element,
        event: event,
        fn: fn.bind(self)
      };
      element.addEventListener(event, self.listeners[event].fn, false);
    }
    addListener(self.viewport.domElement, 'mousedown', self.onMouseDown);
    addListener(self.viewport.domElement, 'mousemove', self.onMouseMove);
    addListener(self.viewport.domElement, 'mouseup', self.onMouseUp);
    addListener(window, 'keydown', self.onKeyDown);
    addListener(window, 'keyup', self.onKeyUp);
    self.buildCache();
    self.enabled = true;
  };

  /**
   * Transform screen coordinates to normalized device coordinates (0,0 to 1,1).
   * @param {Number} x Screen X coordinate
   * @param {Number} y Screen Y coordinate
   * @param {Element} element DOM element
   * @returns {THREE.Vector2}
   */
  MarqueeSelectionController.prototype.getNormalizedDeviceCoordinates = function (x, y, element) {
    var nx = (x - element.clientLeft) / element.clientWidth;
    var ny = (y - element.clientTop) / element.clientHeight;
    return new THREE.Vector2(nx, ny);
  };

  /**
   * @see http://zachberry.com/blog/tracking-3d-objects-in-2d-with-three-js/
   * @param {THREE.Object3D} obj Object
   * @returns {THREE.Vector2} Screen coordinates
   */
  MarqueeSelectionController.prototype.getObjectScreenCoordinates = function (obj) {
    return new THREE.Vector2();
  };

  MarqueeSelectionController.prototype.hideMarquee = function () {
    this.marquee.setAttribute('style', 'display:none;height:0;width:0;');
  };

  /**
   * Invalidate the cache when the camera position changes.
   */
  MarqueeSelectionController.prototype.onCameraMove = function () {
    this.buildCache();
  };

  MarqueeSelectionController.prototype.onContextMenu = function () {};

  MarqueeSelectionController.prototype.onKeyDown = function (event) {
    // TODO add, remove elements from selection set depending on pressed keys
  };

  MarqueeSelectionController.prototype.onKeyUp = function (event) {};

  MarqueeSelectionController.prototype.onMouseDown = function (event) {
    event.preventDefault();
    this.mouse.state = this.MOUSE_STATE.DOWN;
    this.mouse.start.set(event.pageX, event.pageY);
    this.mouse.end.copy(event.pageX, event.pageY);
  };

  MarqueeSelectionController.prototype.onMouseMove = function (event) {
    event.preventDefault();
    event.stopPropagation();
    if (this.mouse.state === this.MOUSE_STATE.DOWN) {
      this.mouse.end.set(event.pageX, event.pageY);
      // draw the selection marquee
      // drawn from top level to bottom right
      var width = Math.abs(this.mouse.end.x - this.mouse.start.x);
      var height = Math.abs(this.mouse.end.y - this.mouse.start.y);
      if (this.mouse.end.x > this.mouse.start.x && this.mouse.end.y > this.mouse.start.y) {
        this.setMarqueePosition(this.mouse.start.x, this.mouse.start.y, width, height);
      }
      // draw from the top right to the bottom left
      else if (this.mouse.end.x < this.mouse.start.x && this.mouse.end.y > this.mouse.start.y) {
        this.setMarqueePosition(this.mouse.end.x, this.mouse.start.y, width, height);
      }
      // draw from the bottom left to the top right
      else if (this.mouse.end.x > this.mouse.start.x && this.mouse.end.y < this.mouse.start.y) {
        this.setMarqueePosition(this.mouse.start.x, this.mouse.end.y, width, height);
      }
      // draw from the bottom right to the top left
      else if (this.mouse.end.x < this.mouse.start.x && this.mouse.end.y < this.mouse.start.y) {
        this.setMarqueePosition(this.mouse.end.x, this.mouse.end.y, width, height);
      }
      // update the selection set
      this.updateSelection();
    }
  };

  MarqueeSelectionController.prototype.onMouseUp = function (event) {
    event.preventDefault();
    event.stopPropagation();
    this.mouse.state = this.MOUSE_STATE.UP;
    this.hideMarquee();
  };

  MarqueeSelectionController.prototype.setFilter = function () {};

  MarqueeSelectionController.prototype.setMarqueePosition = function (x, y, w, h) {
    this.marquee.setAttribute('style', 'display:block;left:' + x + 'px;top:' + y + 'px;width:' + w + 'px;height:' + h + 'px;');
  };

  MarqueeSelectionController.prototype.update = function () {}; // noop

  MarqueeSelectionController.prototype.updateSelection = function () {
    var selected = this.findObjectsByVertex({x: event.clientX, y: event.clientY});
  };

  /**
   * Checks to see if the unprojected vertex position is within the bounds of
   * the marquee selection.
   */
  MarqueeSelectionController.prototype.withinBounds = function (pos, bounds) {
    var ox = bounds.origin.x,
      dx = bounds.origin.x + bounds.delta.x,
      oy = bounds.origin.y,
      dy = bounds.origin.y + bounds.delta.y;
    if((pos.x >= ox) && (pos.x <= dx)) {
      if((pos.y >= oy) && (pos.y <= dy)) {
        return true;
      }
    }
    return false;
  };

  return MarqueeSelectionController;

}());
