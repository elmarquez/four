'use strict';

/**
 * Scene entity selection set.
 * @param {Object} configuration
 * @constructor
 */
function SelectionSet (config) {
  var self = this;
  self.listeners = [];
  self.selectedColor = 0xff5a00;
  self.scene = {};
  self.selection = {};
  Object.keys(config).forEach(function (key) {
    self[key] = config[key];
  });
}

/**
 * Add object to the selection set.
 * @param {Object3D} obj Scene object
 * @param {Function} filter Selection filter
 */
SelectionSet.prototype.add = function (obj, filter) {
  var self = this;
  filter = filter || self.defaultFilter;
  if (filter(obj)) {
    self.selection[obj.uuid] = obj;
    self.select(obj);
  }
};

/**
 * Add all scene entities to the selection set.
 * @param {Function} filter Selection filter
 */
SelectionSet.prototype.addAll = function (filter) {
  var self = this;
  filter = filter || self.defaultFilter;
  self.scene.traverse(function (obj) {
    if (filter(obj)) {
      self.add(obj);
    }
  });
};

/**
 * Register a change event listener.
 * @param {String} event Event name
 * @param {Function} callback Callback
 */
SelectionSet.prototype.addListener = function (event, callback) {
  var self = this;
  // TODO use EventEmitter instead
  self.listeners.push(callback);
};

/**
 * Default object filter.
 * @returns {boolean} True
 */
SelectionSet.prototype.defaultFilter = function () {
  return true;
};

/**
 * Change the object's visual state to deselected.
 * @param {Object3D} obj Scene object
 */
SelectionSet.prototype.deselect = function (obj) {
  if (obj.userData.hasOwnProperty('color')) {
    obj.material.color.set(obj.userData.color);
    obj.userData.color = null;
  }
};

/**
 * Get the list of selected scene objects.
 * @returns {Array} Objects
 */
SelectionSet.prototype.getObjects = function () {
  var objects = [], self = this;
  Object.keys(self.selection).forEach(function (key) {
    objects.push(self.selection[key]);
  });
  return objects;
};

/**
 * Remove object from the selection set.
 * @param {Object3D} obj Scene object
 */
SelectionSet.prototype.remove = function (obj) {
  var self = this;
  self.deselect(obj);
  self.selection[obj.uuid] = null;
};

/**
 * Remove all objects from the selection set.
 */
SelectionSet.prototype.removeAll = function () {
  var self = this;
  Object.keys(self.selection).forEach(function (key) {
    var obj = self.selection[key];
    self.remove(obj);
  });
};

/**
 * Change the object's visual state to selected.
 * @param {Object3D} obj Scene object
 */
SelectionSet.prototype.select = function (obj) {
  var self = this;
  obj.userData.color = new THREE.Color(obj.material.color.r, obj.material.color.g, obj.material.color.b);
  obj.material.color.set(self.selectedColor);
};

/**
 * Toggle entity selection state.
 * @param {Object3D} obj Object
 */
SelectionSet.prototype.toggle = function (obj) {
  var self = this;
  if (self.selection[obj.uuid]) {
    self.remove(obj);
  } else {
    self.add(obj);
  }
};

/**
 * Update the selection set to remove any objects that no longer exist in the
 * scene.
 */
SelectionSet.prototype.update = function () {
};
