FOUR.SelectionController = (function () {

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
  function SelectionController (config) {
    THREE.EventDispatcher.call(this);
    config = config || {};
    var self = this;

    self.KEY = {ALT: 18, CTRL: 17, SHIFT: 16};
    self.MOUSE_STATE = {DOWN: 0, UP: 1};
    self.SINGLE_CLICK_TIMEOUT = 400; // milliseconds

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

  SelectionController.prototype = Object.create(THREE.EventDispatcher.prototype);

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
    self.enabled = true;
  };

  SelectionController.prototype.getSelected = function () {
    // update the picking ray with the camera and mouse position
    this.raycaster.setFromCamera(this.mouse.end, this.viewport.camera);
    // calculate objects intersecting the picking ray
    this.intersects = this.raycaster.intersectObjects(this.viewport.scene.model.children, true); // TODO this is FOUR specific use of children
    // update the selection set using only the nearest selected object
    return this.intersects && this.intersects.length > 0 ? this.intersects[0] : null;
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

  SelectionController.prototype.onKeyDown = function (event) {
    if (!this.enabled) {
      return;
    } else if (event.keyCode === this.KEY.ALT || event.keyCode === this.KEY.CTRL || event.keyCode === this.KEY.SHIFT) {
      this.modifiers[event.keyCode] = true;
    }
  };

  SelectionController.prototype.onKeyUp = function (event) {
    if (!this.enabled) {
      return;
    } else if (event.keyCode === this.KEY.ALT || event.keyCode === this.KEY.CTRL || event.keyCode === this.KEY.SHIFT) {
      this.modifiers[event.keyCode] = false;
    }
  };

  SelectionController.prototype.onMouseDown = function (event) {
    event.preventDefault();
    if (this.enabled && event.button === THREE.MOUSE.LEFT) {
      this.mouse.state = this.MOUSE_STATE.DOWN;
      // calculate mouse position in normalized device coordinates (-1 to +1)
      this.mouse.start.x = (event.offsetX / this.domElement.clientWidth) * 2 - 1;
      this.mouse.start.y = -(event.offsetY / this.domElement.clientHeight) * 2 + 1;
      this.mouse.end.copy(this.mouse.start);
    }
  };

  SelectionController.prototype.onMouseMove = function (event) {
    if (this.enabled && this.mouse.state === this.MOUSE_STATE.DOWN) {
      // calculate mouse position in normalized device coordinates (-1 to +1)
      this.mouse.end.x = (event.offsetX / this.domElement.clientWidth) * 2 - 1;
      this.mouse.end.y = -(event.offsetY / this.domElement.clientHeight) * 2 + 1;
      // on mouse over object
      // this.dispatchEvent({type:'hover',items:objs});
    }
  };

  SelectionController.prototype.onMouseUp = function (event) {
    var self = this;
    event.preventDefault();
    if (self.enabled) {
      self.mouse.state = self.MOUSE_STATE.UP;
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
        }, self.SINGLE_CLICK_TIMEOUT);
      }
    }
  };

  SelectionController.prototype.onSingleClick = function () {
    var selected = this.getSelected();
    if (selected) {
      // add objects
      if (this.modifiers[this.KEY.SHIFT] === true) {
        this.dispatchEvent({type:'add', object: selected.object});
      }
      // remove objects
      else if (this.modifiers[this.KEY.ALT] === true) {
        this.dispatchEvent({type:'remove', object: selected.object});
      }
      // toggle selection state
      else {
        this.dispatchEvent({type:'toggle', object: selected.object});
      }
    }
  };

  SelectionController.prototype.setFilter = function () {};

  SelectionController.prototype.update = function () {}; // do nothing

  return SelectionController;

}());
