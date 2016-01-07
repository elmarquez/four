FOUR.SelectionSet = (function () {

  /**
   * A collection of selected scene objects. Selections are maintained in the
   * order in which they are added, and are identified by the selected scene
   * object's UUID and child element index.
   *
   * {
   *   "uuid": "4165B92A-BC24-4A74-8EFA-3DED7E2E84E7",
   *   "type": "THREE.Object3D",
   *   "element": -1
   * }

   * {
   *   "uuid": "0DCC2D0B-D95C-4833-8222-7DDB7ED35E30",
   *   "type": "THREE.Points",
   *   "element": 2
   * }
   *
   * UUID is the THREE.Object3D scene entity id. Type is the class name. The
   * element field is used to identify a selected subelement of a THREE.Points
   * object. When the selection is of a non THREE.Points type object, the
   * element field can be left out.
   *
   * @param {Object} config Configuration
   * @constructor
   */
  function SelectionSet (config) {
    THREE.EventDispatcher.call(this);
    config = config || {};

    var self = this;
    self.index = [];
    self.items = [];
    self.name = 'default-selection-set';
    Object.keys(config).forEach(function (key) {
      self[key] = config[key];
    });
  }

  SelectionSet.prototype = Object.create(THREE.EventDispatcher.prototype);

  SelectionSet.prototype.constructor = SelectionSet;

  /**
   * Add object to the selection set.
   * @param {Object3D} obj Scene object
   * @param {Boolean} update Rebuild index and emit update event
   */
  SelectionSet.prototype.add = function (obj, update) {
    update = typeof update === 'undefined' ? true : update;
    // add the object if it is not already present in the selection set
    if (!this.contains(obj)) {
      this.items.push(obj);
    }
    if (update) {
      this.updateIndex();
      this.dispatchEvent({type:'update', added:[obj], removed:[], selected:this.items});
    }
  };

  /**
   * Add all objects to the selection set.
   * @param {Array} objects List of intersecting scene objects
   * @param {Boolean} update Emit update event
   */
  SelectionSet.prototype.addAll = function (objects, update) {
    update = typeof update === 'undefined' ? true : update;
    var self = this;
    objects.forEach(function (obj) {
      self.add(obj, false);
    });
    if (update) {
      self.updateIndex();
      self.dispatchEvent({type:'update', added:objects, removed:[], selected:self.items});
    }
  };

  /**
   * Determine if the selection set contains the object.
   * @param {Object} obj Object record comprising a uuid and index field.
   * @returns {boolean} True if the object is contained in the selection set.
   */
  SelectionSet.prototype.contains = function (obj) {
    var id = this.getObjectIndexId(obj);
    return this.index.indexOf(id) > -1;
  };

  /**
   * Get the index identifier for the object.
   * @param {Object} obj Object record comprising a uuid and index field.
   * @returns {string} Index identifier
   */
  SelectionSet.prototype.getObjectIndexId = function (obj) {
    return obj.uuid + ',' + (typeof obj.index !== 'undefined' ? obj.index : '-1');
  };

  /**
   * Remove object from the selection set.
   * @param {Object3D} obj Scene object
   * @param {Boolean} update Emit update event
   */
  SelectionSet.prototype.remove = function (obj, update) {
    update = typeof update === 'undefined' ? true : update;
    var removed = [];
    this.items = this.items.filter(function (el) {
      if (el.uuid === obj.uuid) {
        removed.push(el);
        return false;
      }
      return true;
    });
    if (update) {
      this.updateIndex();
      this.dispatchEvent({type:'update', added:[], removed:removed, selected:this.items});
    }
    return removed;
  };

  /**
   * Remove all objects from the selection set.
   * @param {Array} objects List of scene objects
   * @param {Boolean} update Emit update event
   */
  SelectionSet.prototype.removeAll = function (objects, update) {
    update = typeof update === 'undefined' ? true : update;
    var ids = [], removed = [];
    if (objects && objects.length > 0) {
      // remove the identified objects
      ids = objects.map(function (item) {
        return item.uuid;
      });
      this.items = this.items.filter(function (el) {
        if (ids.indexOf(el.uuid) > -1) {
          removed.push(el);
          return false;
        }
        return true;
      });
    } else {
      // remove everything
      removed = this.items;
      this.items = [];
    }
    if (update) {
      this.updateIndex();
      this.dispatchEvent({type:'update', added:[], removed:removed, selected: this.items});
    }
  };

  /**
   * Update the selection set to include only those objects provided.
   * @param {Object|Array} selection Selected item or list of items.
   */
  SelectionSet.prototype.select = function (selection) {
    selection = Array.isArray(selection) ? selection : [selection];
    this.index = [];
    this.items = [];
    this.addAll(selection);
  };

  /**
   * Toggle entity selection state.
   * @param {Object} object Scene object
   * @param {Boolean} update Emit update event
   */
  SelectionSet.prototype.toggle = function (object, update) {
    update = typeof update === 'undefined' ? true : update;
    var added = [], removed = [];
    if (!this.contains(object)) {
      this.add(object, false);
      added.push(object);
    } else {
      this.remove(object, false);
      removed.push(object);
    }
    this.updateIndex();
    if (update) {
      this.dispatchEvent({type:'update', added:added, removed:removed, selected:this.items});
    }
  };

  /**
   * Update the index of selected entity IDs.
   */
  SelectionSet.prototype.updateIndex = function () {
    var self = this;
    self.index = self.items.map(function (item) {
      return self.getObjectIndexId(item);
    });
  };

  return SelectionSet;

}());
