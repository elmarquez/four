/* global THREE */
/* jshint unused:false */
'use strict';

var FOUR = FOUR || {};

FOUR.SelectionController = (function () {

  /**
   * Mouse based selection controller. The controller emits the following
   * events:
   *
   * add    - add one or more objects to the selection set
   * hover  - mouse over one or more objects
   * remove - remove one or more objects from the selection set
   * toggle - toggle the selection state for one or more objects
   *
   * @param {Object} config Configuration
   * @constructor
   */
  function SelectionController (config) {
    THREE.EventDispatcher.call(this);
    config = config || {};
    var self = this;

    self.KEY = {ALT: 18, CTRL: 17, SHIFT: 16};
    self.SINGLE_CLICK_TIMEOUT = 400; // milliseconds

    self.enabled = false;
    self.filter = function () { return true; };
    self.filters = {};
    self.listeners = {};
    self.modifiers = {};
    self.mouse = new THREE.Vector2();
    self.raycaster = new THREE.Raycaster();
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
    addListener(self.viewport.domElement, 'contextmenu', self.contextMenu);
    addListener(self.viewport.domElement, 'mousedown', self.onMouseDown);
    addListener(self.viewport.domElement, 'mousemove', self.onMouseMove);
    addListener(self.viewport.domElement, 'mouseup', self.onMouseUp);
    addListener(window, 'keydown', self.onKeyDown);
    addListener(window, 'keyup', self.onKeyUp);
    self.enabled = true;
  };

  SelectionController.prototype.onKeyDown = function (event) {
    var self = this;
    if (!self.enabled) {
      return;
    } else if (event.keyCode === self.KEY.ALT || event.keyCode === self.KEY.CTRL || event.keyCode === self.KEY.SHIFT) {
      self.modifiers[event.keyCode] = true;
    }
  };

  SelectionController.prototype.onKeyUp = function (event) {
    var self = this;
    if (!self.enabled) {
      return;
    } else if (event.keyCode === self.KEY.ALT || event.keyCode === self.KEY.CTRL || event.keyCode === self.KEY.SHIFT) {
      self.modifiers[event.keyCode] = false;
    }
  };

  SelectionController.prototype.onMouseDown = function (event) {
    event.stopPropagation();
  };

  SelectionController.prototype.onMouseMove = function (event) {
    // on mouse over object
    // self.dispatchEvent({type:'hover',items:objs});
  };

  SelectionController.prototype.onMouseUp = function (event) {
    event.preventDefault();
    event.stopPropagation();
    var intersects, objs, self = this;
    if (self.enabled) {
      // calculate mouse position in normalized device coordinates (-1 to +1)
      self.mouse.x = (event.offsetX / self.viewport.domElement.clientWidth) * 2 - 1;
      self.mouse.y = -(event.offsetY / self.viewport.domElement.clientHeight) * 2 + 1;
      // update the picking ray with the camera and mouse position
      self.raycaster.setFromCamera(self.mouse, self.viewport.camera);
      // calculate objects intersecting the picking ray
      intersects = self.raycaster.intersectObjects(self.viewport.scene.model.children, true); // TODO this is FOUR specific use of children
      // update the selection set using only the nearest selected object
      objs = intersects && intersects.length > 0 ? [intersects[0].object] : [];
      if (self.modifiers[self.KEY.SHIFT] === true) {
        // add objects
        self.dispatchEvent({type:'add', items: objs});
      }
      else if (self.modifiers[self.KEY.ALT] === true) {
        // remove objects
        self.dispatchEvent({type:'remove', items: objs});
      }
      else {
        // toggle selection state
        self.dispatchEvent({type:'toggle', items: objs});
      }
    }
  };

  SelectionController.prototype.setFilter = function () {};

  SelectionController.prototype.update = function () {}; // do nothing

  return SelectionController;

}());
