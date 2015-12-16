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
    self.name = 'default-selection-set';
    self.selectedColor = 0xff5a00;
    self.selection = [];
    Object.keys(config).forEach(function (key) {
      self[key] = config[key];
    });
  }

  SelectionSet.prototype = Object.create(THREE.EventDispatcher.prototype);

  SelectionSet.prototype.constructor = SelectionSet;

  /**
   * Add object to the selection set. The set contains only the object UUID in
   * the case of instances of Object3D. For instances of THREE.Points, we
   * record the parent UUID and the point's index within the geometry
   * collection.
   * @param {THREE.Object3D} obj Scene object
   * @param {Boolean} update Emit update event
   */
  SelectionSet.prototype.add = function (obj, update) {
    if (!obj) {
      return;
    }
    update = typeof update === 'undefined' ? true : update;
    var self = this;
    // check for THREE.Object3D, THREE.Points
    self.selection.push({uuid:obj.uuid.slice(), index:0, type:'THREE.Object3D'});
    if (update) {
      self.dispatchEvent({type:'update', added:[obj], removed:[], selected:self.getSelected()});
    }
  };

  /**
   * Add all objects to the selection set.
   * @param {Array} objects List of intersecting scene objects
   * @param {Boolean} update Emit update event
   */
  SelectionSet.prototype.addAll = function (objects, update) {
    if (!objects) {
      return;
    }
    update = typeof update === 'undefined' ? true : update;
    var self = this;
    objects.forEach(function (obj) {
      self.add(obj, false);
    });
    if (update) {
      self.dispatchEvent({type:'update', added:objects, removed:[], selected:self.getSelected()});
    }
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
   * @returns {Array} List of scene objects
   */
  SelectionSet.prototype.getSelected = function () {
    var objects = [], self = this;
    //Object.keys(self.selection).forEach(function (key) {
    //  objects.push(self.selection[key]);
    //});
    return self.selection;
  };

  /**
   * Remove object from the selection set.
   * @param {Object3D} obj Scene object
   * @param {Boolean} update Emit update event
   */
  SelectionSet.prototype.remove = function (obj, update) {
    update = typeof update === 'undefined' ? true : update;
    var self = this;
    delete self.selection[obj.uuid];
    if (update) {
      self.dispatchEvent({type:'update', added:[], removed:[obj], selected:[]});
    }
  };

  /**
   * Remove all objects from the selection set. If a list of objects is not
   * provided then remove all objects from the selection set.
   * @param {Array} objects List of scene objects
   * @param {Boolean} update Emit update event
   */
  SelectionSet.prototype.removeAll = function (objects, update) {
    update = typeof update === 'undefined' ? true : update;
    var removed = [], self = this;
    if (!objects) {
      // remove everything
      //removed = self.selection.slice();
      //Object.keys(self.selection).forEach(function (uuid) {
      //  removed.push(self.selection[uuid]);
      //  self.remove(self.selection[uuid], false);
      //});
    } else if (objects.length > 0) {
      // remove the specified objects
      objects.forEach(function (obj) {
        removed.push(obj);
        self.remove(obj, false);
      });
    }
    if (update) {
      self.dispatchEvent({type:'update', added:[], removed: removed, selected: self.getSelected()});
    }
  };

  /**
   * Update the selection set to include only those objects provided.
   * @param {Array} objects List of scene objects.
   */
  SelectionSet.prototype.select = function (objects) {
    this.removeAll(null, false);
    this.toggle(objects);
  };

  /**
   * Toggle entity selection state.
   * @param {Array} objects List of scene objects
   * @param {Boolean} update Emit update event
   */
  SelectionSet.prototype.toggle = function (objects, update) {
    if (!objects || !Array.isArray(objects)){
      return;
    }
    update = typeof update === 'undefined' ? true : update;
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
          self.remove(self.selection[uuid], false);
        }
      });
      // toggle the selection state for all remaining objects
      Object.keys(selected).forEach(function (uuid) {
        if (self.selection[uuid]) {
          removed.push(self.selection[uuid]);
          self.remove(self.selection[uuid], false);
        } else {
          added.push(selected[uuid]);
          self.add(selected[uuid], false);
        }
      });
    } else {
      // if no objects were intersected, then remove all selections
      var objs = Object.keys(self.selection).reduce(function (list, uuid) {
        list.push(self.selection[uuid]);
        return list;
      }, []);
      removed = objs;
      self.removeAll(objs, false);
    }
    if (update) {
      self.dispatchEvent({type:'update', added:added, removed:removed, selected:self.getSelected()});
    }
  };

  return SelectionSet;

}());
