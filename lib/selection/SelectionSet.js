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
    function SelectionSet(config) {
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
     * @param {Object} obj THREE.Raycaster intersection record or FOUR.MarqueeSelectionController selection record
     * @param {Boolean} update Rebuild index and emit update event
     */
    SelectionSet.prototype.add = function (obj, update) {
        update = typeof update === 'undefined' ? true : update;
        // add the object if it is not already present in the selection set
        var id = this.getObjectIndexId(obj);
        if (this.index.indexOf(id) === -1) {
            // TODO we should only be storing the selection record
            var selection = {};
            // normalize selection record format
            if (!obj.uuid) {
                obj.index = obj.index || -1;
                obj.type = obj.type || this.getType(obj);
                obj.uuid = obj.object.uuid;
            }
            this.index.push(id);
            this.items.push(obj);
            if (update) {
                this.updateIndex();
                this.dispatchEvent({type: FOUR.EVENT.UPDATE, added: [obj], removed: [], selected: this.items});
            }
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
            self.dispatchEvent({type: FOUR.EVENT.UPDATE, added: objects, removed: [], selected: self.items});
        }
    };

    /**
     * Build an identifier to selection record index.
     * @param {Array} objects List of selection records.
     * @returns {Object} Id to selection record map
     */
    SelectionSet.prototype.buildIndex = function (objects) {
        var self = this;
        return objects.reduce(function (map, obj) {
            map[self.getObjectIndexId(obj)] = obj;
            return map;
        }, {});
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
        var uuid = obj.uuid ? obj.uuid : obj.object.uuid;
        return uuid + ',' + (typeof obj.index !== 'undefined' ? obj.index : '-1');
    };

    /**
     * Get the list of selected scene objects.
     * It should return the selection record with the object reference in a field.
     * @param {THREE.Scene} scene Scene
     * @returns {Array}
     */
    SelectionSet.prototype.getSelectedObjects = function (scene) {
        return [];
    };

    /**
     * Get type of object.
     * @param {Object} obj Object
     * @returns {String} Type
     */
    SelectionSet.prototype.getType = function (obj) {
        // this is very hackish but unfortunately necessary since the THREE types
        // can't be easily resolved
        var type = 'undefined';
        var types = {
            'THREE.Face3': THREE.Face3,
            'THREE.Line': THREE.Line,
            'THREE.LineSegments': THREE.LineSegments,
            'THREE.Mesh': THREE.Mesh,
            'THREE.Points': THREE.Points
        };
        try {
            Object.keys(types).forEach(function (key) {
                if (obj.object instanceof types[key]) {
                    type = key;
                }
            });
        } finally {
            return type;
        }
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
            this.dispatchEvent({type: FOUR.EVENT.UPDATE, added: [], removed: removed, selected: this.items});
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
            this.index = [];
            this.items = [];
        }
        if (update) {
            this.updateIndex();
            this.dispatchEvent({type: FOUR.EVENT.UPDATE, added: [], removed: removed, selected: this.items});
        }
    };

    /**
     * Update the selection set to include only those objects provided.
     * @param {Array} selection Selected items.
     */
    SelectionSet.prototype.select = function (selection) {
        var added = [], id, removed = [], self = this;
        // a map of entities that should be selected at the end of the operation
        var selected = self.buildIndex(selection);
        var ids = Object.keys(selected);
        // entities in the selection set that are not in the select list
        self.items.forEach(function (obj) {
            id = self.getObjectIndexId(obj);
            if (ids.indexOf(id) === -1) {
                removed.push(obj);
            }
        });
        // entities in the select list that are not in the selection set
        selection.forEach(function (obj) {
            if (!self.contains(obj)) {
                added.push(obj);
            }
        });
        // update the selection set
        this.removeAll(removed, false);
        this.addAll(added, false);
        this.dispatchEvent({type: FOUR.EVENT.UPDATE, added: added, removed: removed, selected: this.items});
    };

    /**
     * Toggle entity selection state.
     * @param {Array|Object} selection Selection
     * @param {Boolean} update Emit update event
     */
    SelectionSet.prototype.toggle = function (selection, update) {
        selection = Array.isArray(selection) ? selection : [selection];
        update = typeof update === 'undefined' ? true : update;
        var added = [], removed = [], self = this;
        selection.forEach(function (obj) {
            if (!self.contains(obj)) {
                self.add(obj, false);
                added.push(obj);
            } else {
                self.remove(obj, false);
                removed.push(obj);
            }
        });
        this.updateIndex();
        if (update) {
            this.dispatchEvent({type: FOUR.EVENT.UPDATE, added: added, removed: removed, selected: this.items});
        }
    };

    /**
     * Update the index of selected entity IDs.
     */
    SelectionSet.prototype.updateIndex = function () {
        this.index = Object.keys(this.buildIndex(this.items));
    };

    return SelectionSet;

}());
