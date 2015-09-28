'use strict';

// perhaps only the viewport should be listening for mouse and keyboard events
// it can then pass the event down to the individual controllers to act upon

/**
 * Scene object selection control.
 * @param {Object} configuration
 * @constructor
 */
function SelectionControl (config) {
  THREE.EventDispatcher.call(this);
  config = config || {};
  var self = this;

  self.enabled = false;
  self.selectionset = null;
  self.viewport = null;

  Object.keys(config).forEach(function (key) {
    self[key] = config[key];
  });

  self.selectionset = new SelectionSet({scene: self.viewport.scene});
  if (self.enabled) {
    self.enable();
  }
}

SelectionControl.prototype = Object.create(THREE.EventDispatcher.prototype);

SelectionControl.prototype.constructor = SelectionControl;

SelectionControl.prototype.count = function () {}; // TODO this should be a property

SelectionControl.prototype.disable = function () {
  var self = this;
  self.enabled = false;
  self.viewport.domElement.removeEventListener('mousedown', self.onMouseDown.bind(self), false);
  self.viewport.domElement.removeEventListener('mouseover', self.onMouseOver.bind(self), false);
  self.viewport.domElement.removeEventListener('mouseup', self.onMouseUp.bind(self), false);
};

SelectionControl.prototype.enable = function () {
  var self = this;
  self.enabled = true;
  self.viewport.domElement.addEventListener('mousedown', self.onMouseDown.bind(self), false);
  self.viewport.domElement.addEventListener('mouseover', self.onMouseOver.bind(self), false);
  self.viewport.domElement.addEventListener('mouseup', self.onMouseUp.bind(self), false);
};

SelectionControl.prototype.onMouseDown = function (event) {
  //throw new Error('not implemented');
};

SelectionControl.prototype.onMouseOver = function (event) {
  //throw new Error('not implemented');
};

SelectionControl.prototype.onMouseUp = function (event) {
  var self = this;
  event.preventDefault();
  event.stopPropagation();
  // calculate mouse position in normalized device coordinates (-1 to +1)
  var mouse = new THREE.Vector2();
  mouse.x = (event.clientX / self.viewport.domElement.clientWidth) * 2 - 1;
  mouse.y = -(event.clientY / self.viewport.domElement.clientHeight) * 2 + 1;
  // update the picking ray with the camera and mouse position
  self.viewport.raycaster.setFromCamera(mouse, self.viewport.camera);
  // calculate objects intersecting the picking ray
  // TODO filter self.scene.children to prevent selection of a non-geometric objects
  var intersects = self.viewport.raycaster.intersectObjects(self.viewport.scene.children, true) || [];
  // update the selection set using only the nearest selected object
  var objs = intersects && intersects.length > 0 ? [intersects[0].object] : [];
  // add objects
  if (self.viewport.modifiers.SHIFT) {
    self.selectionset.addAll(objs);
  }
  // remove objects
  else if (self.viewport.modifiers.ALT) {
    self.selectionset.removeAll(objs);
  }
  // toggle selection state
  else {
    self.selectionset.toggle(objs);
  }
};

SelectionControl.prototype.selectAll = function () {
  throw new Error('not implemented');
};

SelectionControl.prototype.selectByFilter = function (filter) {
  throw new Error('not implemented');
};

SelectionControl.prototype.selectByMarquee = function (event) {
  throw new Error('not implemented');
};

SelectionControl.prototype.selectNone = function () {
  throw new Error('not implemented');
};
