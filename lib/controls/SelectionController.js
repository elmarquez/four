/* global THREE */
/* jshint unused:false */
'use strict';

var FOUR = FOUR || {};

FOUR.SelectionController = (function () {

  /**
   * Scene object selection control. Emits 'update' events when the selection
   * set changes.
   * @param {Object} config Configuration
   * @constructor
   */
  function SelectionController (config) {
    THREE.EventDispatcher.call(this);
    config = config || {};
    var self = this;
    self.KEY = {
      SHIFT: 16, // SHIFT
      CTRL: 17,
      ALT: 18 // ALT
    };
    self.MODE = {
      POINT: 0,
      FACE: 1,
      MESH: 2,
      OBJECT: 3
    };
    self.MODIFIERS = {
      ALT: 'alt',
      CTRL: 'ctrl',
      META: 'meta',
      SHIFT: 'shift'
    };

    self.enabled = config.enabled || false;
    self.modifiers = {};
    self.mouse = new THREE.Vector2();
    self.raycaster = new THREE.Raycaster();
    self.selection = config.viewport.scene.selection;
    self.viewport = config.viewport;

    Object.keys(self.MODIFIERS).forEach(function (key) {
      self.modifiers[self.MODIFIERS[key]] = false;
    });

    // listen for mouse events
    self.selection.addEventListener('update', self.update.bind(self), false);
    self.viewport.domElement.addEventListener('contextmenu', self.onContextMenu.bind(self), false);
    self.viewport.domElement.addEventListener('mousedown', self.onMouseDown.bind(self), false);
    self.viewport.domElement.addEventListener('mousemove', self.onMouseMove.bind(self), false);
    self.viewport.domElement.addEventListener('mouseover', self.onMouseOver.bind(self), false);
    self.viewport.domElement.addEventListener('mouseup', self.onMouseUp.bind(self), false);
  }

  SelectionController.prototype = Object.create(THREE.EventDispatcher.prototype);

  SelectionController.prototype.constructor = SelectionController;

  SelectionController.prototype.count = function () {
    // TODO consider implementing this as a property
    return this.selection.getObjects().length;
  };

  SelectionController.prototype.disable = function () {
    this.enabled = false;
  };

  SelectionController.prototype.enable = function () {
    this.enabled = true;
  };

  SelectionController.prototype.onContextMenu = function (event) {
    event.preventDefault();
    event.stopPropagation();
  };

  SelectionController.prototype.onKeyDown = function (event) {
    var self = this;
    if (!self.enabled) {
      return;
    } else if (event.keyCode === self.KEY.ALT || event.keyCode === self.KEY.CTRL || event.keyCode === self.KEY.SHIFT) {
      this.modifiers[event.keyCode] = true;
    }
  };

  SelectionController.prototype.onKeyUp = function (event) {
    var self = this;
    if (!self.enabled) {
      return;
    } else if (event.keyCode === self.KEY.ALT || event.keyCode === self.KEY.CTRL || event.keyCode === self.KEY.SHIFT) {
      this.modifiers[event.keyCode] = false;
    } else if (event.key === 'ctrl+a') {
      this.selectAll();
    } else if (event.key === 'ctrl+n') {
      this.selectNone();
    }
  };

  SelectionController.prototype.onMouseDown = function (event) {
    //console.log('mouse down');
  };

  SelectionController.prototype.onMouseMove = function (event) {
    //console.log('mouse move');
    //var self = this;
    //// calculate mouse position in normalized device coordinates (-1 to +1)
    //self.mouse.x = (event.clientX / self.viewport.domElement.clientWidth) * 2 - 1;
    //self.mouse.y = -(event.clientY / self.viewport.domElement.clientHeight) * 2 + 1;
  };

  SelectionController.prototype.onMouseOver = function (event) {
    //console.log('mouse over');
  };

  SelectionController.prototype.onMouseUp = function (event) {
    event.preventDefault();
    event.stopPropagation();
    var self = this;
    if (self.enabled) {
      // calculate mouse position in normalized device coordinates (-1 to +1)
      self.mouse.x = (event.offsetX / self.viewport.domElement.clientWidth) * 2 - 1;
      self.mouse.y = -(event.offsetY / self.viewport.domElement.clientHeight) * 2 + 1;
      // update the picking ray with the camera and mouse position
      self.raycaster.setFromCamera(self.mouse, self.viewport.camera);
      // calculate objects intersecting the picking ray
      var intersects = self.raycaster.intersectObjects(self.viewport.scene.model.children, true) || [];
      // update the selection set using only the nearest selected object
      var objs = intersects && intersects.length > 0 ? [intersects[0].object] : [];
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

  SelectionController.prototype.selectAll = function () {
    console.log('select all');
    this.selection.addAll(this.viewport.scene.model.children);
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

  SelectionController.prototype.selectNone = function () {
    console.log('select none');
    this.selection.removeAll();
  };

  SelectionController.prototype.update = function () {
    this.dispatchEvent({type: 'update'});
  };

  return SelectionController;

}());
