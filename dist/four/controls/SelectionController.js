/* global THREE */
/* jshint unused:false */
'use strict';

var FOUR = FOUR || {};

FOUR.SelectionController = (function () {

  /**
   * Mouse based selection controller. Emits 'update' event when the associated
   * selection set changes. Emits 'lookat' event when a lookat point is
   * selected. Emits 'navigate' when a point is selected for the camera to
   * navigate toward for close inspection.
   * @param {Object} config Configuration
   * @constructor
   */
  function SelectionController (config) {
    THREE.EventDispatcher.call(this);
    config = config || {};
    var self = this;

    self.SINGLE_CLICK_TIMEOUT = 500; // milliseconds
    self.KEY = {ALT: 18, CTRL: 17, SHIFT: 16};
    self.SELECTION_MODE = {
      POINT: 0,
      FACE: 1,
      MESH: 2,
      OBJECT: 3,
      CAMERA: 4,
      LIGHT: 5
    };

    self.enabled = false;
    self.listeners = {};
    self.modifiers = {};
    self.mouse = new THREE.Vector2();
    self.raycaster = new THREE.Raycaster();
    self.selection = config.selection;
    self.viewport = config.viewport;

    Object.keys(self.KEY).forEach(function (key) {
      self.modifiers[self.KEY[key]] = false;
    });
  }

  SelectionController.prototype = Object.create(THREE.EventDispatcher.prototype);

  //SelectionController.prototype.constructor = SelectionController;

  SelectionController.prototype.contextMenu = function (event) {
    event.preventDefault();
  };

  SelectionController.prototype.count = function () {
    return this.selection.getObjects().length;
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
    addListener(self.selection, 'update', self.update);
    addListener(self.viewport.domElement, 'contextmenu', self.contextMenu);
    addListener(self.viewport.domElement, 'mousedown', self.onMouseDown);
    addListener(self.viewport.domElement, 'mousemove', self.onMouseMove);
    addListener(self.viewport.domElement, 'mouseover', self.onMouseOver);
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
      //console.info('key down', event.keyCode);
      self.modifiers[event.keyCode] = true;
    }
  };

  SelectionController.prototype.onKeyUp = function (event) {
    var self = this;
    if (!self.enabled) {
      return;
    } else if (event.keyCode === self.KEY.ALT || event.keyCode === self.KEY.CTRL || event.keyCode === self.KEY.SHIFT) {
      //console.info('key up', event.keyCode);
      self.modifiers[event.keyCode] = false;
    }
  };

  SelectionController.prototype.onMouseDown = function (event) {
    event.stopPropagation();
  };

  SelectionController.prototype.onMouseMove = function (event) {};

  SelectionController.prototype.onMouseOver = function (event) {};

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
      // add objects
      if (self.modifiers[self.KEY.SHIFT] === true) {
        self.selection.addAll(objs);
      }
      // remove objects
      else if (self.modifiers[self.KEY.ALT] === true) {
        self.selection.removeAll(objs);
      }
      // toggle selection state
      else {
        self.selection.toggle(objs);
      }
    }
  };

  SelectionController.prototype.selectByFilter = function (filter) {
    console.log('select by filter');
    var objs = [], self = this;
    self.viewport.scene.traverse(function (obj) {
      if (filter(obj)) {
        objs.push(obj);
      }
    });
    self.selection.addAll(objs);
  };

  SelectionController.prototype.selectByMarquee = function (event) {
    console.log('select by marquee');
    throw new Error('not implemented');
  };

  SelectionController.prototype.update = function () {
    this.dispatchEvent({type: 'update'});
  };

  return SelectionController;

}());
