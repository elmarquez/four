FOUR.SelectionSet = (function () {

  /**
   * Selection set. Emits 'update' event when the selection set changes.
   * @param {Object} config Configuration
   * @constructor
   * TODO selection set should retain the order in which elements were selected
   */
  function SelectionSet (config) {
    THREE.EventDispatcher.call(this);
    config = config || {};
    var self = this;
    self.boundingBox = new FOUR.BoundingBox(); // TODO update the bounding box when the selection set changes
    self.count = 0;
    self.name = 'default-selection-set';
    self.selectedColor = 0xff5a00;
    self.selection = {};
    Object.keys(config).forEach(function (key) {
      self[key] = config[key];
    });
  }

  SelectionSet.prototype = Object.create(THREE.EventDispatcher.prototype);

  SelectionSet.prototype.constructor = SelectionSet;

  /**
   * Add object to the selection set.
   * @param {THREE.Object3D} obj Scene object
   * @param {Function} filter Selection filter
   * @param {Boolean} update Emit update event
   */
  SelectionSet.prototype.add = function (obj, filter, update) {
    if (!obj) {
      return;
    }
    var self = this;
    filter = filter || self.defaultFilter;
    if (filter(obj)) {
      self.selection[obj.uuid] = obj;
      self.count = Object.keys(self.selection).length;
      if (update && update === true) {
        self.dispatchEvent({type:'update', added:[obj], removed:[], selected:self.getSelected()});
      }
      return obj;
    }
  };

  /**
   * Add all objects to the selection set.
   * @param {Array} objects List of intersecting scene objects
   * @param {Function} filter Selection filter
   */
  SelectionSet.prototype.addAll = function (objects, filter) {
    if (!objects) {
      return;
    }
    var self = this;
    objects.forEach(function (obj) {
      self.add(obj, filter, false);
    });
    self.dispatchEvent({type:'update', added:objects, removed:[], selected:self.getSelected()});
  };

  /**
   * Default object filter.
   * @returns {Boolean} True
   */
  SelectionSet.prototype.defaultFilter = function () {
    return true;
  };

  /**
   * Get bounding box for all selected objects.
   */
  SelectionSet.prototype.getBoundingBox = function () {
    var self = this;
    var objs = self.getSelected();
    var bbox = new FOUR.BoundingBox();
    bbox.name = self.name + '-bounding-box';
    bbox.update(objs);
    return bbox;
  };

  /**
   * Get the list of selected scene objects.
   * @returns {Array} Objects
   */
  SelectionSet.prototype.getSelected = function () {
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
  SelectionSet.prototype.remove = function (obj, filter, update) {
    var self = this;
    filter = filter || self.defaultFilter;
    if (filter(obj)) {
      delete self.selection[obj.uuid];
      self.count = Object.keys(self.selection).length;
      if (update && update === true) {
        self.dispatchEvent({type:'update', added:[], removed:[obj], selected:[]});
      }
    }
  };

  /**
   * Remove all objects from the selection set. If a list of objects is not
   * provided then remove all objects from the selection set.
   * @param {Array} objects List of scene objects
   */
  SelectionSet.prototype.removeAll = function (objects) {
    var removed = [], self = this;
    if (!objects) {
      // remove everything
      Object.keys(self.selection).forEach(function (uuid) {
        removed.push(self.selection[uuid]);
        self.remove(self.selection[uuid], null, false);
      });
    } else if (objects.length > 0) {
      // remove the specified objects
      objects.forEach(function (obj) {
        removed.push(obj);
        self.remove(obj, null, false);
      });
    } else {
      // do nothing
      return;
    }
    self.dispatchEvent({type:'update', added:[], removed: objects || [], selected: self.getSelected()});
  };

  /**
   * Toggle entity selection state.
   * @param {Array} objects List of intersecting scene objects
   */
  SelectionSet.prototype.toggle = function (objects) {
    if (!objects || !Array.isArray(objects)){
      return;
    }
    var added = [], removed = [], self = this;
    var selected = objects.reduce(function (map, obj) {
      map[obj.uuid] = obj;
      return map;
    }, {});
    if (Object.keys(selected).length > 0) {
      // remove all objects that are not in the selection list
      Object.keys(self.selection).forEach(function (uuid) {
        if (!selected[uuid]) {
          removed.push(self.selection[uuid]);
          self.remove(self.selection[uuid], null, false);
        }
      });
      // toggle the selection state for all remaining objects
      Object.keys(selected).forEach(function (uuid) {
        if (self.selection[uuid]) {
          removed.push(self.selection[uuid]);
          self.remove(self.selection[uuid], null, false);
        } else {
          added.push(selected[uuid]);
          self.add(selected[uuid], null, false);
        }
      });
    } else {
      // if no objects were intersected, then remove all selections
      var objs = Object.keys(self.selection).reduce(function (list, uuid) {
        list.push(self.selection[uuid]);
        return list;
      }, []);
      removed = objs;
      self.removeAll(objs);
    }
    self.dispatchEvent({type:'update', added:added, removed:removed, selected:self.getSelected()});
  };

  return SelectionSet;

}());
