FOUR.SelectionController = (function () {

  /**
   * Mouse based selection controller. The controller supports LMB based mouse
   * hover, single click, double click and click-drag/marquee based selection.
   * The controller emits the following selection events:
   *
   * add    - add one or more objects to the selection set
   * hover  - mouse over one or more objects
   * remove - remove one or more objects from the selection set
   * select - select the identified objects
   * toggle - toggle the selection state for one or more objects
   * lookat    - look at the specified point
   * settarget - set the camera target to the specified point
   *
   * A selection filter can be assigned to the controller to ensure selection
   * of specific types of entities.
   *
   * @param {Object} config Configuration
   * @constructor
   */
  function SelectionController (config) {
    THREE.EventDispatcher.call(this);
    config = config || {};
    var self = this;

    // the maximum number of pixels the mouse can move before the selection
    // mode changes from CLICK to MARQUEE
    self.EPS = 2;

    // wait for the timeout to expire before indexing the scene
    self.INDEX_TIMEOUT = 500;

    self.KEY = {ALT: 18, CTRL: 17, SHIFT: 16};
    self.MOUSE_STATE = {DOWN: 0, UP: 1};
    self.SELECT_ACTION = {ADD:0, REMOVE:1, SELECT:2};
    self.SELECT_MODE = {CLICK: 0, MARQUEE: 1};

    // the minimum number of milliseconds of mouse button inactivity for a
    // single click event
    self.SINGLE_CLICK_TIMEOUT = 400;

    self.camera = config.camera;
    self.clickTimeout = null;
    self.domElement = config.viewport.domElement;
    self.enabled = false;
    self.filter = null;
    self.filters = {
      all: self.selectAll,
      nearest: self.selectNearest,
      objects: self.selectObjects,
      points: self.selectPoints
    };
    self.frustum = new THREE.Frustum();
    self.indexingTimeout = null;
    self.intersects = [];
    self.listeners = {};
    self.marquee = document.getElementById('marquee');
    self.mode = self.SELECT_MODE.CLICK;
    self.modifiers = {};
    self.mouse = {
      end: new THREE.Vector2(),
      start: new THREE.Vector2(),
      state: self.MOUSE_STATE.UP
    };
    self.quadtree = new Quadtree({height: 1, width: 1});
    self.raycaster = new THREE.Raycaster();
    self.sceneRoot = config.viewport.scene.model.children;
    self.selection = [];
    self.selectAction = self.SELECT_ACTION.SELECT;
    self.viewport = config.viewport;

    // selection thresholds
    self.raycaster.params.Points.threshold = 0.1;

    Object.keys(self.KEY).forEach(function (key) {
      self.modifiers[self.KEY[key]] = false;
    });
  }

  SelectionController.prototype = Object.create(THREE.EventDispatcher.prototype);

  /**
   * Add selection filter.
   * @param {String} key Key
   * @param {Function} fn Filter
   */
  SelectionController.prototype.addFilter = function (key, fn) {
    this.filters[key] = fn;
  };

  SelectionController.prototype.contextMenu = function (event) {
    event.preventDefault();
  };

  SelectionController.prototype.disable = function () {
    var self = this;
    self.enabled = false;
    Object.keys(self.listeners).forEach(function (key) {
      var listener = self.listeners[key];
      listener.element.removeEventListener(listener.event, listener.fn);
    });
  };

  SelectionController.prototype.enable = function () {
    var self = this;
    function addListener(element, event, fn) {
      self.listeners[event] = {
        element: element,
        event: event,
        fn: fn.bind(self)
      };
      element.addEventListener(event, self.listeners[event].fn, false);
    }
    addListener(self.viewport.domElement, 'contextmenu', self.onContextMenu);
    addListener(self.viewport.domElement, 'mousedown', self.onMouseDown);
    addListener(self.viewport.domElement, 'mousemove', self.onMouseMove);
    addListener(self.viewport.domElement, 'mouseup', self.onMouseUp);
    addListener(window, 'keydown', self.onKeyDown);
    addListener(window, 'keyup', self.onKeyUp);
    self.filter = self.filter || self.selectNearest;
    self.enabled = true;
  };

  /**
   * Get the list of selected scene elements.
   * @returns {Array.<T>}
   */
  SelectionController.prototype.getSelected = function () {
    // update the picking ray with the camera and mouse position
    this.raycaster.setFromCamera(this.mouse.end, this.viewport.camera);
    // calculate objects intersecting the picking ray
    this.intersects = this.raycaster.intersectObjects(this.sceneRoot, true) || [];
    // filter the intersects list
    return this.intersects.filter(this.filter);
  };

  SelectionController.prototype.onContextMenu = function () {};

  SelectionController.prototype.onDoubleClick = function () {
    var selected = this.getSelected();
    if (selected) {
      // CTRL double click rotates the camera toward the selected point
      if (this.modifiers[this.KEY.CTRL]) {
        this.dispatchEvent({type:'lookat', position:selected.point, object:selected.object});
      }
      // double click navigates the camera to the selected point
      else {
        this.dispatchEvent({type:'settarget', position:selected.point, object:selected.object});
      }
    }
  };

  /**
   * Handle key down event.
   * @param {Object} event Keyinput event
   */
  SelectionController.prototype.onKeyDown = function (event) {
    if (event.keyCode === this.KEY.ALT) {
      this.selectAction = this.SELECT_ACTION.REMOVE;
    } else if (event.keyCode === this.KEY.SHIFT) {
      this.selectAction = this.SELECT_ACTION.ADD;
    }
  };

  /**
   * Handle key up event.
   * @param {Object} event Keyinput event
   */
  SelectionController.prototype.onKeyUp = function (event) {
    if (event.keyCode === this.KEY.ALT) {
      this.selectAction = this.SELECT_ACTION.SELECT;
    } else if (event.keyCode === this.KEY.SHIFT) {
      this.selectAction = this.SELECT_ACTION.SELECT;
    }
  };

  SelectionController.prototype.onMouseDown = function (event) {
    event.preventDefault();
    if (event.button === THREE.MOUSE.LEFT) {
      this.mouse.state = this.MOUSE_STATE.DOWN;
      // calculate mouse position in normalized device coordinates (-1 to +1)
      this.mouse.start.x = (event.offsetX / this.domElement.clientWidth) * 2 - 1;
      this.mouse.start.y = -(event.offsetY / this.domElement.clientHeight) * 2 + 1;
      this.mouse.end.copy(this.mouse.start);
    }
  };

  SelectionController.prototype.onMouseMove = function (event) {
    var diff = new THREE.Vector2(event.offsetX, event.offsetY);
    if (this.mouse.state === this.MOUSE_STATE.DOWN) {
      // single, double click selection
      if (diff.length() <= this.EPS) {
        // calculate mouse position in normalized device coordinates (-1 to +1)
        this.mouse.end.x = (event.offsetX / this.domElement.clientWidth) * 2 - 1;
        this.mouse.end.y = -(event.offsetY / this.domElement.clientHeight) * 2 + 1;
      }
      // marquee selection
      else {
        console.info('marquee selection mode');
      }
    } else {
      // on mouse over object
      // this.dispatchEvent({type:'hover',items:objs});
    }
  };

  SelectionController.prototype.onMouseUp = function (event) {
    event.preventDefault();
    var self = this;
    // TODO check the current selection mode
    if (self.clickTimeout !== null) {
      // handle double click event
      clearTimeout(self.clickTimeout);
      self.clickTimeout = null;
      self.onDoubleClick();
    } else {
      // handle single click event
      self.clickTimeout = setTimeout(function () {
        clearTimeout(self.clickTimeout);
        self.clickTimeout = null;
        self.onSingleClick();
      }, self.SINGLE_CLICK_TIMEOUT);
    }
    self.mouse.state = self.MOUSE_STATE.UP;
  };

  SelectionController.prototype.onSingleClick = function () {
    var selected = this.getSelected();
    if (selected) {
      // add objects
      if (this.modifiers[this.KEY.SHIFT] === true) {
        this.dispatchEvent({type:'add', selection: selected.object});
      }
      // remove objects
      else if (this.modifiers[this.KEY.ALT] === true) {
        this.dispatchEvent({type:'remove', selection: selected.object});
      }
      // toggle selection state
      else {
        this.dispatchEvent({type:'select', selection: selected.object});
        this.dispatchEvent({type:'toggle', selection: selected.object});
      }
    }
  };

  /**
   * Select all intersected objects.
   * @param {THREE.Object3D} obj Scene object
   * @param {Number} index Index in intersects list
   * @returns {boolean}
   */
  SelectionController.prototype.selectAll = function (obj, index) {
    return true;
  };

  /**
   * Select all intersected Object3Ds.
   * @param {THREE.Object3D} obj Scene object
   * @param {Number} index Index in intersects list
   * @returns {boolean}
   */
  SelectionController.prototype.selectObjects = function (obj, index) {
    return true;
  };

  /**
   * Select the nearest Object3D.
   * @param {THREE.Object3D} obj Scene object
   * @param {Number} index Index in intersects list
   * @returns {boolean}
   */
  SelectionController.prototype.selectNearest = function (obj, index) {
    // return the nearest intersection
    return index === 0 ? true : false;
  };

  /**
   * Select all intersected points.
   * @param {THREE.Object3D} obj Scene object
   * @param {Number} index Index in intersects list
   * @returns {boolean}
   */
  SelectionController.prototype.selectPoints = function (obj, index) {
    return true;
  };

  /**
   * Set the active selection filter.
   * @param {String} key Filter key
   */
  SelectionController.prototype.setFilter = function (key) {
    this.filter = this.filters[key];
  };

  SelectionController.prototype.update = function () {}; // do nothing

  return SelectionController;

}());
