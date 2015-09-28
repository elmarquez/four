'use strict';

// perhaps only the viewport should be listening for mouse and keyboard events
// it can then pass the event down to the individual controllers to act upon

/**
 * Scene object selection control.
 * @param {Object} configuration
 * @constructor
 */
function SelectionControl (config) {
  config = config || {};
  var self = this;
  self.enabled = false;
  self.selectionset = new SelectionSet();
  self.viewport = null;
  Object.keys(config).forEach(function (key) {
    self[key] = config[key];
  });
  if (self.enabled) {
    self.enable();
  }
}

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
  throw new Error('not implemented');
};

SelectionControl.prototype.onMouseOver = function (event) {
  throw new Error('not implemented');
};

SelectionControl.prototype.onMouseUp = function (event) {
  event.preventDefault();
  event.stopPropagation();
  // calculate mouse position in normalized device coordinates (-1 to +1)
  self.mouse.x = (event.clientX / self.domElement.clientWidth) * 2 - 1;
  self.mouse.y = -(event.clientY / self.domElement.clientHeight) * 2 + 1;
  // update the picking ray with the camera and mouse position
  self.raycaster.setFromCamera(self.mouse, self.camera);
  // calculate objects intersecting the picking ray
  // TODO filter self.scene.children to prevent selection of a non-geometric objects
  var intersects = self.raycaster.intersectObjects(self.scene.children, true) || [];
  // update the selection set using only the nearest selected object
  var objs = intersects && intersects.length > 0 ? [intersects[0].object] : [];
  // add objects
  if (self.modifiers.SHIFT) {
    self.selection.addAll(objs);
  }
  // remove objects
  else if (self.modifiers.ALT) {
    self.selection.removeAll(objs);
  }
  // toggle selection state
  else {
    self.selection.toggle(objs);
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
