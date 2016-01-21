FOUR.ClickSelectionController = (function () {

  /**
   * Mouse based selection controller. The controller emits the following
   * selection events:
   *
   * add    - add one or more objects to the selection set
   * hover  - mouse over one or more objects
   * remove - remove one or more objects from the selection set
   * toggle - toggle the selection state for one or more objects
   *
   * The controller emits the following camera realted events:
   *
   * lookat    - look at the specified point
   * settarget - move the camera target to the specified point
   *
   * @param {Object} config Configuration
   * @constructor
   */
  function ClickSelectionController (config) {
    THREE.EventDispatcher.call(this);
    config = config || {};
    var self = this;

    // single clicking can be interpreted in one of two ways: as indicating that
    // the clicked entity and only that entity should be selected, or as
    // indicating that we should toggle the selection state of the clicked object.
    self.SINGLE_CLICK_ACTION = {
      SELECT: 0,
      TOGGLE: 1
    };

    // the maximum number of pixels that the mouse can move before we interpret
    // the mouse event as not being a click action
    self.EPS = 2;
    self.KEY = {ALT: 18, CTRL: 17, SHIFT: 16};
    self.MOUSE_STATE = {DOWN: 0, UP: 1};

    self.click = self.SINGLE_CLICK_ACTION.SELECT;
    self.domElement = config.viewport.domElement;
    self.enabled = false;
    self.filter = function () { return true; };
    self.filters = {};
    self.intersects = [];
    self.listeners = {};
    self.modifiers = {};
    self.mouse = {
      end: new THREE.Vector2(),
      start: new THREE.Vector2(),
      state: self.MOUSE_STATE.UP
    };
    self.raycaster = new THREE.Raycaster();
    self.timeout = null;
    self.viewport = config.viewport;

    Object.keys(self.KEY).forEach(function (key) {
      self.modifiers[self.KEY[key]] = false;
    });
  }

  ClickSelectionController.prototype = Object.create(THREE.EventDispatcher.prototype);

  ClickSelectionController.prototype.contextMenu = function (event) {
    event.preventDefault();
  };

  ClickSelectionController.prototype.disable = function () {
    var self = this;
    self.enabled = false;
    Object.keys(self.listeners).forEach(function (key) {
      var listener = self.listeners[key];
      listener.element.removeEventListener(listener.event, listener.fn);
    });
  };

  ClickSelectionController.prototype.enable = function () {
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
    self.enabled = true;
  };

  ClickSelectionController.prototype.getSelected = function () {
    // update the picking ray with the camera and mouse position
    this.raycaster.setFromCamera(this.mouse.end, this.viewport.camera);
    // calculate objects intersecting the picking ray
    this.intersects = this.raycaster.intersectObjects(this.viewport.scene.model.children, true); // TODO this is FOUR specific use of children
    // update the selection set using only the nearest selected object
    return this.intersects && this.intersects.length > 0 ? this.intersects[0] : null;
  };

  ClickSelectionController.prototype.onContextMenu = function () {};

  ClickSelectionController.prototype.onDoubleClick = function () {
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

  ClickSelectionController.prototype.onKeyDown = function (event) {
    if (event.keyCode === this.KEY.ALT || event.keyCode === this.KEY.CTRL || event.keyCode === this.KEY.SHIFT) {
      this.modifiers[event.keyCode] = true;
    }
  };

  ClickSelectionController.prototype.onKeyUp = function (event) {
    if (event.keyCode === this.KEY.ALT || event.keyCode === this.KEY.CTRL || event.keyCode === this.KEY.SHIFT) {
      this.modifiers[event.keyCode] = false;
    }
  };

  ClickSelectionController.prototype.onMouseDown = function (event) {
    event.preventDefault();
    if (event.button === THREE.MOUSE.LEFT) {
      this.mouse.state = this.MOUSE_STATE.DOWN;
      // TODO store both screen and ndc coordinates
      // calculate mouse position in normalized device coordinates (-1 to +1)
      this.mouse.start.x = (event.offsetX / this.domElement.clientWidth) * 2 - 1;
      this.mouse.start.y = -(event.offsetY / this.domElement.clientHeight) * 2 + 1;
      this.mouse.end.copy(this.mouse.start);
    }
  };

  ClickSelectionController.prototype.onMouseMove = function (event) {
    var delta = new THREE.Vector2(event.offsetX, event.offsetY).sub(this.mouse.start).length();
    // TODO store both screen and ndc coordinates
    //console.info('click delta', delta);
    if (this.mouse.state === this.MOUSE_STATE.DOWN && delta <= this.EPS) {
      // calculate mouse position in normalized device coordinates (-1 to +1)
      this.mouse.end.x = (event.offsetX / this.domElement.clientWidth) * 2 - 1;
      this.mouse.end.y = -(event.offsetY / this.domElement.clientHeight) * 2 + 1;
      // on mouse over object
      // this.dispatchEvent({type:'hover',items:objs});
    } else {
      this.mouse.state = this.MOUSE_STATE.UP;
    }
  };

  ClickSelectionController.prototype.onMouseUp = function (event) {
    var self = this;
    if (event.button === THREE.MOUSE.LEFT && self.mouse.state === this.MOUSE_STATE.DOWN) {
      if (self.timeout !== null) {
        // handle double click event
        clearTimeout(self.timeout);
        self.timeout = null;
        self.onDoubleClick();
      } else {
        // handle single click event
        self.timeout = setTimeout(function () {
          clearTimeout(self.timeout);
          self.timeout = null;
          self.onSingleClick();
        }, FOUR.SINGLE_CLICK_TIMEOUT);
      }
      self.mouse.state = self.MOUSE_STATE.UP;
      event.preventDefault();
    }
  };

  ClickSelectionController.prototype.onSingleClick = function () {
    // TODO rename selection field to match what is returned by marquee (selected?)
    var selection = this.getSelected().map(function (item) {
      return item.object;
    });
    // TODO we need to check for exclusive SHIFT, ALT, etc. keydown
    if (this.modifiers[this.KEY.SHIFT] === true) {
      this.dispatchEvent({type:'add', selection: selection});
    } else if (this.modifiers[this.KEY.ALT] === true) {
      this.dispatchEvent({type:'remove', selection: selection});
    } else if (this.click === this.SINGLE_CLICK_ACTION.SELECT) {
      this.dispatchEvent({type:'select', selection: selection});
    } else if (this.click === this.SINGLE_CLICK_ACTION.TOGGLE) {
      this.dispatchEvent({type: 'toggle', selection: selection});
    }
  };

  ClickSelectionController.prototype.setFilter = function () {};

  ClickSelectionController.prototype.update = function () {}; // do nothing

  return ClickSelectionController;

}());