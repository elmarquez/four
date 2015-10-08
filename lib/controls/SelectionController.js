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

    self.DOUBLE_CLICK_TIMEOUT = 500; // milliseconds
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
    self.modifiers = {};
    self.mouse = new THREE.Vector2();
    self.raycaster = new THREE.Raycaster();
    self.selection = config.selection;
    self.timeout = null;
    self.viewport = config.viewport;

    Object.keys(self.KEY).forEach(function (key) {
      self.modifiers[self.KEY[key]] = false;
    });
  }

  SelectionController.prototype = Object.create(THREE.EventDispatcher.prototype);

  //SelectionController.prototype.constructor = SelectionController;

  SelectionController.prototype.count = function () {
    return this.selection.getObjects().length;
  };

  SelectionController.prototype.disable = function () {
    var self = this;
    self.enabled = false;
    self.selection.removeEventListener('update', self.update);
    self.viewport.domElement.removeEventListener('mousedown', self.onMouseDown);
    self.viewport.domElement.removeEventListener('mousemove', self.onMouseMove);
    self.viewport.domElement.removeEventListener('mouseover', self.onMouseOver);
    self.viewport.domElement.removeEventListener('mouseup', self.onMouseUp);
  };

  SelectionController.prototype.enable = function () {
    var self = this;
    self.enabled = true;
    self.selection.addEventListener('update', self.update.bind(self), false);
    self.viewport.domElement.addEventListener('mousedown', self.onMouseDown.bind(self), false);
    self.viewport.domElement.addEventListener('mousemove', self.onMouseMove.bind(self), false);
    self.viewport.domElement.addEventListener('mouseover', self.onMouseOver.bind(self), false);
    self.viewport.domElement.addEventListener('mouseup', self.onMouseUp.bind(self), false);
  };

  SelectionController.prototype.handleDoubleClick = function (obj) {
    var self = this;
    // CTRL double click rotates the camera toward the selected point
    if (self.modifiers[self.KEY.CTRL]) {
      self.dispatchEvent({type:'lookat', position:obj.point});
    }
    // double click navigates the camera to the selected point
    else {
      self.dispatchEvent({type:'navigate', position:obj.point});
    }
  };

  SelectionController.prototype.handleSingleClick = function (objs) {
    var self = this;
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

  SelectionController.prototype.onMouseDown = function (event) {};

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
      // handle double or single click event
      if (self.timeout !== null) {
        // if the user clicks twice within the timeout period then treat the
        // event as a double click
        clearTimeout(self.timeout);
        self.timeout = null;
        // FIXME find the nearest ground plane face
        // calculate objects intersecting the picking ray
        intersects = self.raycaster.intersectObjects(self.viewport.scene.model.children, true); // TODO this is FOUR specific use of children
        // update the selection set using only the nearest selected object
        if (intersects && intersects.length > 0) {
          self.handleDoubleClick(intersects[0]);
        }
      } else {
        // if the user does not click again within the timeout period then
        // treat the event as a single click
        self.timeout = setTimeout(function () {
          clearTimeout(self.timeout);
          self.timeout = null;
          // calculate objects intersecting the picking ray
          intersects = self.raycaster.intersectObjects(self.viewport.scene.model.children, true); // TODO this is FOUR specific use of children
          // update the selection set using only the nearest selected object
          objs = intersects && intersects.length > 0 ? [intersects[0].object] : [];
          self.handleSingleClick(objs);
        }, self.DOUBLE_CLICK_TIMEOUT);
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
