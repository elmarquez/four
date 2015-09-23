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
 * @param {Boolean} update Emit update event
 */
SelectionSet.prototype.add = function (obj, filter, update) {
  var self = this;
  filter = filter || self.defaultFilter;
  if (filter(obj)) {
    self.selection[obj.uuid] = obj;
    self.select(obj);
  }
  if (update && update === true) {
    self.emit('update');
  }
};

/**
 * Add all objects to the selection set.
 * @param {Array} objects List of intersecting scene objects
 */
SelectionSet.prototype.addAll = function (objects) {
  if (objects.length < 1) {
    return;
  }
  var self = this;
  objects.forEach(function (obj) {
    self.add(obj, null, false);
  });
  self.emit('update');
};

/**
 * Register a change event listener.
 * @param {String} event Event name
 * @param {Function} callback Callback
 */
SelectionSet.prototype.addListener = function (event, callback) {
  // TODO use EventEmitter instead
  var self = this;
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

SelectionSet.prototype.emit = function (event) {
  this.listeners.forEach(function (fn) {
    fn.call(event);
  });
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
 * @param {Boolean} update Emit update event
 */
SelectionSet.prototype.remove = function (obj, update) {
  var self = this;
  self.deselect(obj);
  delete self.selection[obj.uuid];
  if (update && update === true) {
    self.emit('update');
  }
};

/**
 * Remove all objects from the selection set. If a list of objects is not
 * provided then remove all objects from the selection set.
 * @param {Array} objects List of scene objects
 */
SelectionSet.prototype.removeAll = function (objects) {
  var self = this;
  if (!objects) {
    // remove everything
    Object.keys(self.selection).forEach(function (uuid) {
      self.remove(self.selection[uuid], false);
    });
  } else if (objects.length > 0) {
    // remove the specified objects
    objects.forEach(function (obj) {
      self.remove(obj, false);
    });
  } else {
    // do nothing
    return;
  }
  self.emit('update');
};

/**
 * Change the object's visual state to selected.
 * @param {Object3D} obj Scene object
 */
SelectionSet.prototype.select = function (obj) {
  var self = this;
  // TODO it should never be the case that we select non-geometric objects, but ...
  if (obj.material && obj.material.color) {
    obj.userData.color = new THREE.Color(obj.material.color.r, obj.material.color.g, obj.material.color.b);
    obj.material.color.set(self.selectedColor);
  }
};

/**
 * Toggle entity selection state.
 * @param {Array} objects List of intersecting scene objects
 */
SelectionSet.prototype.toggle = function (objects) {
  var self = this;
  var selected = objects.reduce(function (map, obj) {
    map[obj.uuid] = obj;
    return map;
  }, {});
  if (Object.keys(selected).length > 0) {
    // remove all objects that are not in the selection list
    Object.keys(self.selection).forEach(function (uuid) {
      if (!selected[uuid]) {
        self.remove(self.selection[uuid], false);
      }
    });
    // toggle the selection state for all remaining objects
    Object.keys(selected).forEach(function (uuid) {
      if (self.selection[uuid]) {
        self.remove(self.selection[uuid], false);
      } else {
        self.add(selected[uuid], null, false);
      }
    });
  } else {
    // if no objects were intersected, then remove all selections
    var objs = Object.keys(self.selection).reduce(function (list, uuid) {
      list.push(self.selection[uuid]);
      return list;
    }, []);
    self.removeAll(objs);
  }
  self.emit('update');
};
