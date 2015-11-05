/* global THREE */
'use strict';

var FOUR = FOUR || {};

FOUR.BoundingBox = (function () {

  /**
   * Bounding box object.
   * @param {String} name Bounding box name
   * @constructor
   */
  function BoundingBox (name) {
    THREE.Object3D.call(this);
    this.depth = 0;
    this.envelope = null;
    this.height = 0;
    this.name = name;
    this.width = 0;
    this.visible = false;
    this.reset();
  }

  BoundingBox.prototype = Object.create(THREE.Object3D.prototype);

  BoundingBox.prototype.constructor = BoundingBox;

  BoundingBox.prototype.getCenter = function () {
    return this.position;
  };

  /**
   * Get the bounding box envelope.
   * @returns {THREE.Box3}
   */
  BoundingBox.prototype.getEnvelope = function () {
    return this.envelope;
  };

  /**
   * Get the bounding sphere radius.
   * @returns {Number} Radius
   */
  BoundingBox.prototype.getRadius = function () {
    return this.helper.geometry.boundingSphere.radius;
  };

  BoundingBox.prototype.getXDimension = function () {
    return this.width;
  };

  BoundingBox.prototype.getYDimension = function () {
    return this.depth;
  };

  BoundingBox.prototype.getZDimension = function () {
    return this.height;
  };

  BoundingBox.prototype.reset = function () {
    var self = this;
    self.position.set(0,0,0);
    self.envelope = new THREE.Box3(new THREE.Vector3(0,0,0), new THREE.Vector3(0,0,0));
    self.children.forEach(function (obj) {
      self.remove(obj);
    });
    var geom = new THREE.BoxGeometry(1, 1, 1);
    var mesh = new THREE.Mesh(geom);
    self.helper = new THREE.BoxHelper(mesh);
  };

  /**
   * Toggle visibility.
   */
  BoundingBox.prototype.toggleVisibility = function () {
    var self = this;
    self.visible = !self.visible;
  };

  /**
   * Update the bounding box geometry and position.
   * @param {Array} objects List of scene objects
   */
  BoundingBox.prototype.update = function (objects) {
    //console.log('bounding box update');
    var self = this;
    // reset values to base case
    self.reset();
    // update the bounding box geometry
    if (objects && objects.length > 0) {
      // set the starting envelope to be the first object
      self.envelope.setFromObject(objects[0]);
      // expand the envelope to accommodate the remaining objects
      objects.forEach(function (obj) {
        var objEnv = new THREE.Box3(new THREE.Vector3(0,0,0), new THREE.Vector3(0,0,0));
        objEnv.setFromObject(obj);
        self.envelope.union(objEnv);
      });
      // bounding box dimensions
      self.width = self.envelope.max.x - self.envelope.min.x;
      self.depth = self.envelope.max.y - self.envelope.min.y;
      self.height = self.envelope.max.z - self.envelope.min.z;
      // create a mesh to represent the bounding box volume
      var geom = new THREE.BoxGeometry(self.width, self.depth, self.height);
      var mesh = new THREE.Mesh(geom);
      self.helper = new THREE.BoxHelper(mesh);
      self.add(self.helper);
    } else {
      self.visible = false;
    }
    self.position.set(
        self.envelope.min.x + (self.width / 2),
        self.envelope.min.y + (self.depth / 2),
        self.envelope.min.z + (self.height / 2)
    );
    //console.dir(self);
  };

  return BoundingBox;

}());

;'use strict';

var FOUR = FOUR || {};

FOUR.KEY = {};

FOUR.MOUSE_STATE = {
  DOWN: 0,
  MOVE: 1,
  UP: 2
};

FOUR.SINGLE_CLICK_TIMEOUT = 400;

/**
 * Orthographic views
 * @type {Object|String}
 */
FOUR.VIEW = {
  TOP: 'top',
  FRONT: 'front',
  RIGHT: 'right',
  BACK: 'back',
  LEFT: 'left',
  BOTTOM: 'bottom'
};;'use strict';

var FOUR = FOUR || {};

FOUR.KeyInputController = (function () {

  /**
   * Key input controller. Maintains the state of some key combinations and
   * otherwise dispatches key events to listeners.
   * @constructor
   */
  function KeyInputController (config) {
    THREE.EventDispatcher.call(this);
    config = config || {};
    var self = this;
    self.KEYS = {
      ALT: 'alt',
      CTRL: 'ctrl',
      CTRL_A: 'ctrl+a',
      CTRL_N: 'ctrl+n',
      DOWN: 'down',
      LEFT: 'left',
      META: 'meta',
      RIGHT: 'right',
      SHIFT: 'shift',
      UP: 'up'
    };
    self.enabled = config.enabled || false;
    self.modifiers = {}; // map of currently pressed keys

    Object.keys(self.KEYS).forEach(function (key) {
      self.modifiers[self.KEYS[key]] = false;
    });

    // modifier keys
    Mousetrap.bind('alt', function (evt) { self.keydown(self.KEYS.ALT, evt); }, 'keydown');
    Mousetrap.bind('alt', function (evt) { self.keyup(self.KEYS.ALT, evt); }, 'keyup');
    Mousetrap.bind('ctrl', function (evt) { self.keydown(self.KEYS.CTRL, evt); }, 'keydown');
    Mousetrap.bind('ctrl', function (evt) { self.keyup(self.KEYS.CTRL, evt); }, 'keyup');
    Mousetrap.bind('shift', function (evt) { self.keydown(self.KEYS.SHIFT, evt); }, 'keydown');
    Mousetrap.bind('shift', function (evt) { self.keyup(self.KEYS.SHIFT, evt); }, 'keyup');

    // selection
    Mousetrap.bind('ctrl+a', function (evt) { self.keyup(self.KEYS.CTRL_A, evt); });
    Mousetrap.bind('ctrl+n', function (evt) { self.keyup(self.KEYS.CTRL_N, evt); });

    // arrow keys
    Mousetrap.bind('i', function (evt) { self.keydown(self.KEYS.UP, evt); }, 'keydown');
    Mousetrap.bind('i', function (evt) { self.keyup(self.KEYS.UP, evt); }, 'keyup');
    Mousetrap.bind('k', function (evt) { self.keydown(self.KEYS.DOWN, evt); }, 'keydown');
    Mousetrap.bind('k', function (evt) { self.keyup(self.KEYS.DOWN, evt); }, 'keyup');
    Mousetrap.bind('j', function (evt) { self.keydown(self.KEYS.LEFT, evt); }, 'keydown');
    Mousetrap.bind('j', function (evt) { self.keyup(self.KEYS.LEFT, evt); }, 'keyup');
    Mousetrap.bind('l', function (evt) { self.keydown(self.KEYS.RIGHT, evt); }, 'keydown');
    Mousetrap.bind('l', function (evt) { self.keyup(self.KEYS.RIGHT, evt); }, 'keyup');
    Mousetrap.bind('u', function (evt) { self.keydown(self.KEYS.RIGHT, evt); }, 'keydown');
    Mousetrap.bind('u', function (evt) { self.keyup(self.KEYS.RIGHT, evt); }, 'keyup');
    Mousetrap.bind('o', function (evt) { self.keydown(self.KEYS.RIGHT, evt); }, 'keydown');
    Mousetrap.bind('o', function (evt) { self.keyup(self.KEYS.RIGHT, evt); }, 'keyup');
  }

  KeyInputController.prototype = Object.create(THREE.EventDispatcher.prototype);

  KeyInputController.prototype.constructor = KeyInputController;

  KeyInputController.prototype.keydown = function (key, evt) {
    this.modifiers[key] = true;
    this.dispatchEvent({'type': 'keydown', key: key, keyCode: evt ? evt.keyCode : null});
  };

  KeyInputController.prototype.keyup = function (key, evt) {
    this.modifiers[key] = false;
    this.dispatchEvent({'type': 'keyup', key: key, keyCode: evt ? evt.keyCode : null});
  };

  /**
   * Register key event callback.
   * @param {String} command Key command
   * @param {Function} callback Callback
   */
  KeyInputController.prototype.register = function (command, callback) {
    throw new Error('not implemented');
  };

  return KeyInputController;

}());
;/* global THREE */
/* jshint unused:false */
'use strict';

var FOUR = FOUR || {};

FOUR.Scene = (function () {

    /**
     * Scene with predefined layers.
     * @constructor
     */
    function Scene (config) {
        THREE.Scene.call(this);
        config = config || {};

        var self = this;

        self.cameras = new THREE.Object3D();
        self.helpers = new THREE.Object3D();
        self.lights = new THREE.Object3D();
        self.model = new THREE.Object3D();

        self.cameras.name = 'cameras';
        self.lights.name = 'lights';
        self.model.name = 'model';
        self.helpers.name = 'helpers';

        self.add(self.cameras);
        self.add(self.lights);
        self.add(self.model);
        self.add(self.helpers);

        Object.keys(config).forEach(function (key) {
           self[key] = config[key];
        });
    }

    Scene.prototype = Object.create(THREE.Scene.prototype);

    Scene.prototype.constructor = Scene;

    Scene.prototype.emit = function (type, value) {
      this.dispatchEvent({type:type, value: value});
    };

    Scene.prototype.getCamera = function (name) {
        return this.getLayerObject('cameras', name);
    };

    Scene.prototype.getCameras = function () {
        return this.getLayerObjects('cameras');
    };

    Scene.prototype.getHelper = function (name) {
        return this.getLayerObject('helpers', name);
    };

    Scene.prototype.getHelpers = function () {
        return this.getLayerObjects('helpers');
    };

    Scene.prototype.getLayer = function (name) {
      return this.getLayers().reduce(function (last, current) {
          if (current.name === name) {
              last = current;
          }
          return last;
      }, null);
    };

    Scene.prototype.getLayers = function () {
        return this.children.reduce(function (last, current) {
            if (typeof current === THREE.Object3D) {
                last.push(current);
            }
            return last;
        }, []);
    };

    Scene.prototype.getLayerObjects = function (layer) {
        return this.children.reduce(function (last, current) {
            return current.name === layer ? current.children : last;
        }, null);
    };

    Scene.prototype.getLayerObject = function (layer, name) {
        return this
          .getLayerObjects(layer)
          .reduce(function (last, current) {
            return current.name === name ? current : last;
        }, null);
    };

    Scene.prototype.getLight = function (name) {
        return this.getLayerObject('lights', name);
    };

    Scene.prototype.getLights = function () {
        return this.getLayerObjects('lights');
    };

    Scene.prototype.getModelObject = function (name) {
        return this.getLayerObject('model', name);
    };

    Scene.prototype.getModelObjects = function () {
        return this.getLayerObjects('model');
    };

    return Scene;

}());;/* globals THREE */
'use strict';

var FOUR = FOUR || {};

FOUR.SelectionSet = (function () {

  /**
   * Selection set. Emits 'update' event when the selection set changes.
   * @param {Object} config Configuration
   * @constructor
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
    var self = this;
    filter = filter || self.defaultFilter;
    if (filter(obj)) {
      self.selection[obj.uuid] = obj;
      self.select(obj);
    }
    self.count = Object.keys(self.selection).length;
    if (update && update === true) {
      self.dispatchEvent({type:'update'});
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
    self.dispatchEvent({type:'update'});
  };

  /**
   * Default object filter.
   * @returns {Boolean} True
   */
  SelectionSet.prototype.defaultFilter = function () {
    return true;
  };

  /**
   * Change the object's visual state to deselected.
   * @param {Object3D} obj Scene object
   * TODO remove this or provide a user definable function
   */
  SelectionSet.prototype.deselect = function (obj) {
    if (obj.userData.hasOwnProperty('color')) {
      obj.material.color.set(obj.userData.color);
      obj.userData.color = null;
    }
  };

  /**
   * Get bounding box for all selected objects.
   */
  SelectionSet.prototype.getBoundingBox = function () {
    var self = this;
    var objs = self.getObjects();
    var bbox = new FOUR.BoundingBox();
    bbox.name = self.name + '-bounding-box';
    bbox.update(objs);
    return bbox;
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
    self.count = Object.keys(self.selection).length;
    if (update && update === true) {
      self.dispatchEvent({type:'update'});
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
    self.dispatchEvent({type:'update'});
  };

  /**
   * Change the object's visual state to selected.
   * @param {Object3D} obj Scene object
   * TODO remove this or provide a user definable function
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
    self.dispatchEvent({type:'update'});
  };

  return SelectionSet;

}());
;'use strict';

var FOUR = FOUR || {};

FOUR.TargetCamera = (function () {

    /**
     * @todo setters to intercept changes on position, target, distance properties
     * @todo setters to intercept changes on THREE.Camera properties
     */
    function TargetCamera (fov, aspect, near, far) {
        THREE.PerspectiveCamera.call(this);
        var self = this;

        self.VIEWS = {
            TOP: 0,
            LEFT: 1,
            RIGHT: 2,
            FRONT: 3,
            BACK: 4,
            PERSPECTIVE: 5
        };
        self.ZOOM_FACTOR = 1.5;

        self.aspect = aspect;
        self.far = far;
        self.fov = fov;
        self.near = near;
        self.up = new THREE.Vector3(0, 0, 1);
        self.updateProjectionMatrix();

        self.distance = 0;
        self.target = new THREE.Vector3(0, 0, 0);

        // camera motion planner
        self.planner = new FOUR.PathPlanner();

        // set default target and distance values
        self.position.set(0,-1,0);
        self.distance = self.getDistance(self.position, self.target);
        self.lookAt(self.target);
    }

    TargetCamera.prototype = Object.create(THREE.PerspectiveCamera.prototype);

    TargetCamera.prototype.constructor = TargetCamera;

    /**
     * Dispatch event.
     */
    TargetCamera.prototype.emit = function (event) {
        this.dispatchEvent({type: event});
    };

    TargetCamera.prototype.getDistance = function () {
        this.distance = new THREE.Vector3().subVectors(this.position, this.target).length();
        return this.distance;
    };

    TargetCamera.prototype.getTarget = function () {
        return this.target;
    };

    /**
     * Hide the camera frustrum.
     */
    TargetCamera.prototype.hideFrustrum = function () {
        this.frustrum.visible = false;
        this.dispatchEvent({type:'update'});
    };

    /**
     * Hide the camera target.
     */
    TargetCamera.prototype.hideTarget = function () {
        this.targetHelper.visible = false;
        this.dispatchEvent({type:'update'});
    };

    /**
     * Reset camera orientation so that camera.up aligns with +Z.
     * @param {Function} progress Progress callback
     * @param {Boolean} animate Animate the change
     */
    TargetCamera.prototype.resetOrientation = function (progress, animate) {
        var self = this;
        return self.planner.tweenToOrientation(self, new THREE.Vector3(0,0,1), progress || self.emit.bind(self));
    };

    /**
     * Set the distance from the camera to the target. Keep the target position
     * fixed and move the camera position as required.
     * @param {Number} dist Distance from target to camera
     */
    TargetCamera.prototype.setDistance = function (dist) {
        //console.log('update the camera distance from target');
        var offset, next, self = this;
        self.distance = dist;
        // get the offset from the target to the camera
        offset = new THREE.Vector3().subVectors(self.position, self.target);
        if (offset.equals(new THREE.Vector3())) {
            offset.y = 1;
        }
        // compute the new camera position
        offset.setLength(dist);
        next = new THREE.Vector3().addVectors(self.target, offset);
        // set the position and lookAt direction
        self.position.copy(next);
        self.lookAt(self.target);
    };

    TargetCamera.prototype.setUp = function (vec) {
        this.up = vec;
        this.dispatchEvent({type:'update'});
    };

    /**
     * Orient the camera to look at the specified position. Keep the camera
     * distance the same as it currently is. Update the target position as
     * required. Animate the transition to the new orientation.
     * @param {THREE.Vector3} lookAt Look at direction
     * @param {Boolean} animate Animate the change
     * @returns {Promise}
     */
    TargetCamera.prototype.setLookAt = function (lookAt, animate) {
        var offset, self = this;
        // direction from camera to new look at position
        offset = new THREE.Vector3().subVectors(lookAt, self.position);
        offset.setLength(self.distance);
        var target = new THREE.Vector3().addVectors(self.position, offset);
        return self.planner.tweenToPosition(self, self.position, target, self.emit.bind(self));
    };

    /**
     * Move the camera to the specified position. Maintain the current target
     * position.
     * @param {THREE.Vector3} pos Position
     * @param {Boolean} animate Animate the change
     * @returns {Promise}
     */
    TargetCamera.prototype.setPosition = function (pos, animate) {
        var offset, self = this, target;
        // offset from current position to new position
        offset = new THREE.Vector3().subVectors(self.position, pos);
        target = new THREE.Vector3().addVectors(self.target, offset);
        return self.planner.tweenToPosition(self, pos, target, self.emit.bind(self));
    };

    /**
     * Set camera position and target. Animate the transition.
     * @param {THREE.Vector3} pos Camera position
     * @param {THREE.Vector3} target Target position
     * @param {Boolean} animate Animate the change
     * @returns {Promise}
     */
    TargetCamera.prototype.setPositionAndTarget = function (pos, target, animate) {
        var self = this;
        return self.planner.tweenToPosition(self, pos, target, self.emit.bind(self));
    };

    /**
     * Set the camera target. Maintain the distance from the camera to the
     * target.
     * @param {THREE.Vector3} target Target position
     * @param {Boolean} animate Animate the change
     * @returns {Promise}
     */
    TargetCamera.prototype.setTarget = function (target, animate) {
        var offset, next, self = this;
        // get the current direction from the target to the camera
        offset = new THREE.Vector3().subVectors(self.position, self.target);
        offset.length(self.distance);
        // compute the new camera position
        next = new THREE.Vector3().addVectors(target, offset);
        // move the camera to the new position
        return self.planner.tweenToPosition(self, next, target, self.emit.bind(self));
    };

    /**
     * Move the camera to the predefined view position. Ensure that the entire
     * bounding box is visible within the camera view.
     * @param {String} view View
     * @param {BoundingBox} bbox View bounding box
     * @param {Boolean} animate Animate the change
     * @returns {Promise}
     */
    TargetCamera.prototype.setView = function (view, bbox, animate) {
        var dist, height, offset, self = this;
        var center = bbox.getCenter();
        // new camera position and target
        var pos = new THREE.Vector3(center.x, center.y, center.z);
        var target = new THREE.Vector3(center.x, center.y, center.z);
        // reorient the camera relative to the bounding box
        if (view === self.VIEWS.TOP) {
            height = bbox.getYDimension();
            offset = (bbox.getZDimension() / 2);
            dist = height / 2 / Math.tan(Math.PI * self.fov / 360);
            pos.z = center.z + dist + offset;
        }
        else if (view === self.VIEWS.FRONT) {
            height = bbox.getZDimension();
            offset = (bbox.getYDimension() / 2);
            dist = height / 2 / Math.tan(Math.PI * self.fov / 360);
            pos.y = center.y - dist - offset;
        }
        else if (view === self.VIEWS.BACK) {
            height = bbox.getZDimension();
            offset = (bbox.getYDimension() / 2);
            dist = height / 2 / Math.tan(Math.PI * self.fov / 360);
            pos.y = center.y + dist + offset;
        }
        else if (view === self.VIEWS.RIGHT) {
            height = bbox.getZDimension();
            offset = (bbox.getXDimension() / 2);
            dist = height / 2 / Math.tan(Math.PI * self.fov / 360);
            pos.x = center.x + dist + offset;
        }
        else if (view === self.VIEWS.LEFT) {
            height = bbox.getZDimension();
            offset = (bbox.getXDimension() / 2);
            dist = height / 2 / Math.tan(Math.PI * self.fov / 360);
            pos.x = center.x - dist - offset;
        }
        else if (view === self.VIEWS.PERSPECTIVE) {
            pos.set(center.x - 100, center.y - 100, center.z + 100);
        }
        self.planner.tweenToPosition(self, pos, target, self.emit.bind(self));
    };

    /**
     * Show the camera frustrum.
     */
    TargetCamera.prototype.showFrustrum = function () {
        var self = this;
        self.frustrum.visible = true;
        this.dispatchEvent({type:'update'});
    };

    /**
     * Show the camera target.
     */
    TargetCamera.prototype.showTarget = function () {
        this.targetHelper.visible = true;
        this.dispatchEvent({type:'update'});
    };

    TargetCamera.prototype.translate = function (x, y, z) {
        var self = this;
        var pos = new THREE.Vector3(x, y, z);
        var target = new THREE.Vector3(x, y, z);
        self.planner.tweenToPosition(self, pos, target, self.emit.bind(self));
    };

    /**
     * Zoom in incrementally.
     */
    TargetCamera.prototype.zoomIn = function (animate) {
        //console.log('zoom in');
        var offset, distance, next, self = this;
        // get the direction and current distance from the target to the camera
        offset = new THREE.Vector3().subVectors(self.position, self.target);
        distance = offset.length();
        // compute the new camera distance and position
        offset.setLength(distance / self.ZOOM_FACTOR);
        next = new THREE.Vector3().addVectors(self.target, offset);
        // move the camera to the new position
        return self.planner.tweenToPosition(self, next, self.target, self.emit.bind(self));
    };

    /**
     * Zoom out incrementally.
     */
    TargetCamera.prototype.zoomOut = function (animate) {
        //console.log('zoom out');
        var offset, distance, next, self = this;
        // get the direction and current distance from the target to the camera
        offset = new THREE.Vector3().subVectors(self.position, self.target);
        distance = offset.length();
        // compute the new camera distance and position
        offset.setLength(distance * self.ZOOM_FACTOR);
        next = new THREE.Vector3().addVectors(self.target, offset);
        // move the camera to the new position
        return self.planner.tweenToPosition(self, next, self.target, self.emit.bind(self));
    };

    /**
     * Zoom to fit the bounding box.
     * @param {BoundingBox} bbox Bounding box
     */
    TargetCamera.prototype.zoomToFit = function (bbox, animate) {
        //console.log('zoom to fit all or selected items');
        var distance, next, offset, self = this;
        // get the direction from the current target to the camera
        offset = new THREE.Vector3().subVectors(self.position, self.target);
        // get the distance required to fit all entities within the view
        distance = bbox.getRadius() / Math.tan(Math.PI * self.fov / 360);
        // compute the new camera position
        offset.setLength(distance);
        var center = bbox.getCenter();
        next = new THREE.Vector3().addVectors(bbox.getCenter(), offset);
        // move the camera to the new position
        return self.planner.tweenToPosition(self, next, bbox.getCenter(), self.emit.bind(self));
    };

    /**
     * Zoom the view to fit the window selection.
     */
    TargetCamera.prototype.zoomToWindow = function (animate) {
        throw new Error('zoom in to window');
    };

    return TargetCamera;

}());
;/* global THREE */
/* jshint unused:false */
'use strict';

var FOUR = FOUR || {};

FOUR.Utils = (function () {

    /**
     * Utility functions.
     * @constructor
     */
    function Utils (config) {
        config = config || {};
        var self = this;

        // default entity values
        self.DEFAULT = {
            CAMERA: {
                far: 1000,
                fov: 45,
                height: 1,
                name: 'camera',
                near: 0.1,
                width: 1
            }
        };

        Object.keys(config).forEach(function (key) {
            self[key] = config[key];
        });
    }

    ///**
    // * Create a default perspective camera. A camera aspect ratio or DOM height
    // * element and width must be specified.
    // * @param {Object} config Configuration
    // */
    //Utils.prototype.createDefaultCamera = function (config) {
    //    var cfg = {}, config = config || {};
    //    Object.keys(config).forEach(function (key) {
    //        cfg[key] = config[key];
    //    });
    //    var camera = new FOUR.TargetCamera(cfg.fov, cfg.width / cfg.height, cfg.near, cfg.far);
    //    camera.name = cfg.name;
    //    camera.setPositionAndTarget(new THREE.Vector3(-50, -50, 50), new THREE.Vector3()); // use position, target fields
    //    return camera;
    //};

    return Utils;

}());;'use strict';

var FOUR = FOUR || {};

FOUR.ViewAxis = (function () {

    function ViewAxis (config) {
        THREE.EventDispatcher.call(this);

        var self = this;

        self.AXIS_OPACITY = 0.8;
        self.AXIS_THICKNESS = 2.0;
        self.FACE_COLOUR = 0x4a5f70;
        self.FACE_OPACITY_MOUSE_NOT_OVER = 0.0;
        self.FACE_OPACITY_MOUSE_OVER = 0.8;
        self.MODES = {SELECT: 0, READONLY: 1};
        self.ROTATION_0   = 0;
        self.ROTATION_90  = Math.PI / 2;
        self.ROTATION_180 = Math.PI;
        self.ROTATION_270 = Math.PI * 1.5;
        self.ROTATION_360 = Math.PI * 2;

        self.axis = null;
        self.axisXYPlane = null;
        self.camera = null;
        self.control = new THREE.Object3D();
        self.domElement = config.domElement;
        self.enable = {
            axis: true,
            labels: true,
            xyPlane: true
        };
        self.fov = 60; // 50
        self.label = {
            x: null,
            y: null,
            z: null,
        };
        self.labelOffset = 0.1;
        self.labels = new THREE.Object3D();
        self.material = {
            blue: new THREE.LineBasicMaterial({
                color: 0x0000ff,
                linewidth: self.AXIS_THICKNESS,
                opacity: self.AXIS_OPACITY,
                transparent: true
            }),
            green: new THREE.LineBasicMaterial({
                color: 0x00ff00,
                linewidth: self.AXIS_THICKNESS,
                opacity: self.AXIS_OPACITY,
                transparent: true
            }),
            red: new THREE.LineBasicMaterial({
                color: 0xff0000,
                linewidth: self.AXIS_THICKNESS,
                opacity: self.AXIS_OPACITY,
                transparent: true
            })
        };
        self.mouse = new THREE.Vector2();
        self.raycaster = new THREE.Raycaster();
        self.scene = new THREE.Scene();
        self.textCfg = {
            size: 0.35, height:0.01
        };
        self.viewport = config.viewport;
        self.up = new THREE.Vector3(0,0,1);

        Object.keys(config).forEach(function (key) {
            self[key] = config[key];
        });

        // renderer
        self.renderer = new THREE.WebGLRenderer({alpha: true, antialias: true});
        self.renderer.setSize(self.domElement.clientWidth, self.domElement.clientHeight);
        self.renderer.shadowMap.enabled = false;
        self.domElement.appendChild(self.renderer.domElement);

        self.setupCamera();
        self.setupGeometry();
        self.setupLights();
        self.setupNavigation();

        window.addEventListener('mousemove', self.update.bind(self));
        window.addEventListener('mousemove', self.render.bind(self));
    }

    ViewAxis.prototype = Object.create(THREE.EventDispatcher.prototype);

    ViewAxis.prototype.createAxis = function () {
        var axis = new THREE.Object3D(), geometry, line, self = this;
        axis.name = 'axis';

        geometry = new THREE.Geometry();
        geometry.vertices.push(
            new THREE.Vector3(0, 0, 0),
            new THREE.Vector3(1, 0, 0)
        );
        line = new THREE.Line(geometry, self.material.red);
        line.name = 'x';
        axis.add(line);

        geometry = new THREE.Geometry();
        geometry.vertices.push(
            new THREE.Vector3(0, 0, 0),
            new THREE.Vector3(0, 1, 0)
        );
        line = new THREE.Line(geometry, self.material.green);
        line.name = 'y';
        axis.add(line);

        geometry = new THREE.Geometry();
        geometry.vertices.push(
            new THREE.Vector3(0, 0, 0),
            new THREE.Vector3(0, 0, 1)
        );
        line = new THREE.Line(geometry, self.material.blue);
        line.name = 'z';
        axis.add(line);

        return axis;
    };

    ViewAxis.prototype.createLabels = function () {
        var labels = new THREE.Object3D(), geometry, self = this;
        labels.name = 'labels';

        geometry = new THREE.TextGeometry('x', self.textCfg);
        self.label.x = new THREE.Mesh(geometry, self.material.red);
        self.label.x.name = 'x';
        self.label.x.position.set(1 + self.labelOffset,0,0);
        self.labels.add(self.label.x);

        geometry = new THREE.TextGeometry('y', self.textCfg);
        self.label.y = new THREE.Mesh(geometry, self.material.green);
        self.label.y.name = 'y';
        self.label.y.position.set(0,1 + self.labelOffset,0);
        self.labels.add(self.label.y);

        geometry = new THREE.TextGeometry('z', self.textCfg);
        self.label.z = new THREE.Mesh(geometry, self.material.blue);
        self.label.z.name = 'z';
        self.label.z.position.set(0,0,1 + self.labelOffset);
        self.labels.add(self.label.z);

        return labels;
    };

    ViewAxis.prototype.createXYPlane = function () {
        var plane = new THREE.Object3D();
        var geometry = new THREE.PlaneGeometry(0.70,0.70);
        var material = new THREE.MeshBasicMaterial({color: 0xFF00FF, opacity:0.5, transparent:true});
        var mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(0.35, 0.35, 0);
        plane.add(mesh);
        plane.name = 'xy_plane';
        return plane;
    };

    ViewAxis.prototype.onMouseMove = function (event) {
        var self = this;
        // calculate mouse position in normalized device coordinates
        // (-1 to +1) for both components
        self.mouse.x = (event.offsetX / self.domElement.clientWidth) * 2 - 1;
        self.mouse.y = - (event.offsetY / self.domElement.clientHeight) * 2 + 1;
        // update the picking ray with the camera and mouse position
        self.raycaster.setFromCamera(self.mouse, self.camera);
        // reset opacity for all scene objects
        self.scene.traverse(function (obj) {
            if (obj.name !== 'labels' && obj.material) {
                obj.material.opacity = self.FACE_OPACITY_MOUSE_NOT_OVER;
            }
        });
        // calculate objects intersecting the picking ray
        var intersects = self.raycaster.intersectObjects(self.scene.children, true);
        if (intersects.length > 0 && intersects[0].object.name !== 'labels') {
            intersects[0].object.material.opacity = self.FACE_OPACITY_MOUSE_OVER;
        }
    };

    ViewAxis.prototype.onMouseOver = function (event) {
        var self = this;
        // change opacity
    };

    ViewAxis.prototype.onMouseUp = function (event) {
        var self = this;
        // calculate mouse position in normalized device coordinates
        // (-1 to +1) for both components
        self.mouse.x = (event.offsetX / self.domElement.clientWidth) * 2 - 1;
        self.mouse.y = - (event.offsetX / self.domElement.clientWidth) * 2 + 1;
        // update the picking ray with the camera and mouse position
        self.raycaster.setFromCamera(self.mouse, self.camera);
        // calculate objects intersecting the picking ray
        self.selection = [];
        var intersects = self.raycaster.intersectObjects(self.scene.children, true);
        if (intersects.length > 0) {
            self.setView(intersects[0].object.name);
        }
    };

    ViewAxis.prototype.render = function () {
        var self = this;
        self.renderer.render(self.scene, self.camera);
    };

    ViewAxis.prototype.setupCamera = function () {
        var self = this;
        // position and point the camera to the center of the scene
        self.camera = new THREE.PerspectiveCamera(self.fov, self.domElement.clientWidth / self.domElement.clientHeight, 0.1, 1000);
        self.camera.position.x = 2;
        self.camera.position.y = 2;
        self.camera.position.z = 2;
        self.camera.up = new THREE.Vector3(0, 0, 1);
        self.camera.lookAt(new THREE.Vector3(0, 0, 0));
    };

    ViewAxis.prototype.setupGeometry = function () {
        var self = this;
        if (self.enable.axis) {
            self.axis = self.createAxis();
            self.scene.add(self.axis);
        }
        if (self.enable.labels) {
            var labels = self.createLabels();
            self.scene.add(self.labels);
        }
        if (self.enable.xyPlane) {
            self.axisXYPlane = self.createXYPlane();
            self.axis.add(self.axisXYPlane);
        }
    };

    ViewAxis.prototype.setupLights = function () {
        var light = new THREE.AmbientLight(0x404040), self = this;
        self.scene.add(light);

        light = new THREE.DirectionalLight(0xffffff);
        light.position.set(1, 1, 1);
        self.scene.add(light);
    };

    ViewAxis.prototype.setupNavigation = function () {
        // bind click events to views
    };

    ViewAxis.prototype.update = function () {
        var self = this;
        console.info('update');
        Object.keys(self.label).forEach(function (key) {
            self.label[key].lookAt(self.camera.position);
        });
        requestAnimationFrame(self.render.bind(self));
    };

    ViewAxis.prototype.updateOrientation = function () {
        var self = this;
        var euler = new THREE.Euler(
            self.viewport.camera.rotation.x,
            self.viewport.camera.rotation.y,
            self.viewport.camera.rotation.z,
            'XZY'
        );
        self.camera.quaternion.setFromEuler(euler);
        self.render();
    };

    return ViewAxis;

}());
;'use strict';

var FOUR = FOUR || {};

FOUR.Viewcube = (function () {

    /**
     * View orientation controller.
     * @param {Object} config Configurations
     * @constructor
     */
    function Viewcube (config) {
        THREE.EventDispatcher.call(this);
        config = config || {};

        var self = this;

        self.CUBE_FACE_SIZE = 70;
        self.CUBE_EDGE_SIZE = 15;
        self.CUBE_LABEL_SIZE = 99;
        self.COMPASS_COLOR = 0x666666;
        self.COMPASS_OPACITY = 0.8;

        self.FACE_COLOUR = 0x4a5f70;
        self.FACE_OPACITY_MOUSE_OFF = 0;
        self.FACE_OPACITY_MOUSE_NOT_OVER = 0.1;
        self.FACE_OPACITY_MOUSE_OVER = 0.8;
        //self.FACE_COLOUR = 0xff0000;
        //self.FACE_OPACITY_MOUSE_NOT_OVER = 1;
        //self.FACE_OPACITY_MOUSE_OVER = 1;
        self.FACES = {
            TOP: 0,
            FRONT: 1,
            RIGHT: 2,
            BACK: 3,
            LEFT: 4,
            BOTTOM: 5,

            TOP_FRONT_EDGE: 6,
            TOP_RIGHT_EDGE: 7,
            TOP_BACK_EDGE: 8,
            TOP_LEFT_EDGE: 9,

            FRONT_RIGHT_EDGE: 10,
            BACK_RIGHT_EDGE: 11,
            BACK_LEFT_EDGE: 12,
            FRONT_LEFT_EDGE: 13,

            BOTTOM_FRONT_EDGE: 14,
            BOTTOM_RIGHT_EDGE: 15,
            BOTTOM_BACK_EDGE: 16,
            BOTTOM_LEFT_EDGE: 17,

            TOP_FRONT_RIGHT_CORNER: 18,
            TOP_BACK_RIGHT_CORNER: 19,
            TOP_BACK_LEFT_CORNER: 20,
            TOP_FRONT_LEFT_CORNER: 21,

            BOTTOM_FRONT_RIGHT_CORNER: 22,
            BOTTOM_BACK_RIGHT_CORNER: 23,
            BOTTOM_BACK_LEFT_CORNER: 24,
            BOTTOM_FRONT_LEFT_CORNER: 25
        };

        self.LABELS_HOVER_OFF = 0.5;
        self.LABELS_HOVER = 1;
        self.MODES = {SELECT: 0, READONLY: 1};
        self.OFFSET = 1;

        self.ROTATION_0   = 0;
        self.ROTATION_90  = Math.PI / 2;
        self.ROTATION_180 = Math.PI;
        self.ROTATION_270 = Math.PI * 1.5;
        self.ROTATION_360 = Math.PI * 2;

        self.X_AXIS = new THREE.Vector3(1, 0, 0);
        self.Y_AXIS = new THREE.Vector3(0, 1, 0);
        self.Z_AXIS = new THREE.Vector3(0, 0, 1);

        self.camera = null; // viewcube camera
        self.compass = new THREE.Object3D();
        self.control = new THREE.Object3D();
        self.cube = new THREE.Object3D();
        self.display = {
            axis: false,
            compass: true,
            cube: true,
            labels: true,
            normals: false
        };
        self.domElement = config.domElement;
        self.enabled = false;
        self.fov = 60; // 50
        self.frontFace = null;
        self.labelSize = 128;
        self.listeners = {};
        self.materials = {compass: null, face:null, faces:[]};
        self.mouse = new THREE.Vector2();
        self.raycaster = new THREE.Raycaster();
        self.renderContinuous = false;
        self.scene = new THREE.Scene();
        self.view = new THREE.Object3D();
        self.viewport = config.viewport; // target viewport

        self.compass.name = 'compass';
        self.control.name = 'control';
        self.cube.name = 'cube';

        Object.keys(config).forEach(function (key) {
            self[key] = config[key];
        });

        // renderer
        self.renderer = new THREE.WebGLRenderer({alpha: true, antialias: true});
        self.renderer.setSize(self.domElement.clientWidth, self.domElement.clientHeight);
        self.domElement.appendChild(self.renderer.domElement);

        self.scene.add(self.control);
        self.scene.add(self.view);

        self.setupCamera();
        self.setupLights();
        self.setupMaterials();
        self.setupGeometry();

        setTimeout(function () {
            self.updateOrientation();
            self.onMouseLeave();
        },0);
    }

    Viewcube.prototype = Object.create(THREE.EventDispatcher.prototype);

    Viewcube.prototype.disable = function () {
        var self = this;
        self.enabled = false;
        Object.keys(self.listeners).forEach(function (key) {
            var listener = self.listeners[key];
            listener.element.removeEventListener(listener.event, listener.fn);
        });
    };

    Viewcube.prototype.enable = function () {
        var self = this;
        function addListener(element, event, fn) {
            self.listeners[event] = {
                element: element,
                event: event,
                fn: fn.bind(self)
            };
            element.addEventListener(event, self.listeners[event].fn, false);
        }
        addListener(self.domElement, 'contextmenu', self.onContextMenu);
        addListener(self.domElement, 'mouseenter', self.onMouseEnter);
        addListener(self.domElement, 'mouseleave', self.onMouseLeave);
        addListener(self.domElement, 'mousemove', self.onMouseMove);
        addListener(self.domElement, 'mouseover', self.onMouseOver);
        addListener(self.domElement, 'mouseup', self.onMouseUp);
        addListener(window, 'keydown', self.render);
        addListener(window, 'mousemove', self.render);
        self.enabled = true;
    };

    Viewcube.prototype.getFaceLabel = function (val) {
        var match = null, self = this;
        Object.keys(self.FACES).forEach(function (key) {
            if (self.FACES[key] === val) {
                match = key;
            }
        });
        return match;
    };

    Viewcube.prototype.makeCompass = function (name, x, y, z, radius, segments, color, opacity) {
        var obj = new THREE.Object3D();
        var material = new THREE.MeshBasicMaterial({color: color});

        var circleGeometry = new THREE.CircleGeometry(radius, segments);
        var circle = new THREE.Mesh(circleGeometry, material);
        obj.add(circle);
        obj.name = name;
        obj.opacity = opacity;
        obj.position.x = x;
        obj.position.y = y;
        obj.position.z = z;
        return obj;
    };

    Viewcube.prototype.makeCorner = function (name, w, x, y, z, rotations) {
        var face1, face2, face3, geometry, material, obj, self = this;
        obj = new THREE.Object3D();
        material = self.materials.face.clone();
        self.materials.faces.push(material);

        geometry = new THREE.PlaneGeometry(w, w);
        face1 = new THREE.Mesh(geometry, material);
        face1.name = name;
        face1.position.setX(w / 2);
        face1.position.setY(w / 2);

        geometry = new THREE.PlaneGeometry(w, w);
        face2 = new THREE.Mesh(geometry, material);
        face2.name = name;
        face2.position.setX(w / 2);
        face2.position.setZ(-w / 2);
        face2.rotateOnAxis(new THREE.Vector3(1,0,0), Math.PI / 2);

        geometry = new THREE.PlaneGeometry(w, w);
        face3 = new THREE.Mesh(geometry, material);
        face3.name = name;
        face3.position.setY(w / 2);
        face3.position.setZ(-w / 2);
        face3.rotateOnAxis(new THREE.Vector3(0,1,0), -Math.PI / 2);

        obj.add(face1);
        obj.add(face2);
        obj.add(face3);
        obj.name = name;
        obj.position.x = x;
        obj.position.y = y;
        obj.position.z = z;
        rotations.forEach(function (rotation) {
            obj.rotateOnAxis(rotation.axis, rotation.rad);
        });
        return obj;
    };

    Viewcube.prototype.makeEdge = function (name, w, h, x, y, z, rotations) {
        var face1, face2, geometry, material, obj, self = this;
        material = self.materials.face.clone();
        self.materials.faces.push(material);

        obj = new THREE.Object3D();

        geometry = new THREE.PlaneGeometry(w, h);
        face1 = new THREE.Mesh(geometry, material);
        face1.name = name;
        face1.position.setY(h / 2);

        geometry = new THREE.PlaneGeometry(w, h);
        face2 = new THREE.Mesh(geometry, material);
        face2.name = name;
        face2.position.setZ(-h / 2);
        face2.rotateOnAxis(new THREE.Vector3(1,0,0), Math.PI / 2);

        obj.add(face1);
        obj.add(face2);
        obj.name = name;
        obj.position.x = x;
        obj.position.y = y;
        obj.position.z = z;
        rotations.forEach(function (rotation) {
            obj.rotateOnAxis(rotation.axis, rotation.rad);
        });
        return obj;
    };

    Viewcube.prototype.makeFace = function (name, w, x, y, z, rotations) {
        var face, geometry, material, self = this;
        geometry = new THREE.PlaneGeometry(w, w);
        material = self.materials.face.clone();
        self.materials.faces.push(material);

        face = new THREE.Mesh(geometry, material);
        face.name = name;
        face.position.setX(x);
        face.position.setY(y);
        face.position.setZ(z);
        rotations.forEach(function (rotation) {
            face.rotateOnAxis(rotation.axis, rotation.rad);
        });
        return face;
    };

    Viewcube.prototype.onContextMenu = function (event) {
        event.preventDefault();
    };

    Viewcube.prototype.onMouseEnter = function () {
        var self = this;
        self.tweenControlOpacity(self.materials.faces, self.FACE_OPACITY_MOUSE_OFF, self.FACE_OPACITY_MOUSE_NOT_OVER);
        self.tweenControlOpacity(self.materials.labels, self.LABELS_HOVER_OFF, self.LABELS_HOVER);
    };

    Viewcube.prototype.onMouseLeave = function () {
        var self = this;
        self.tweenControlOpacity(self.materials.face, self.FACE_OPACITY_MOUSE_NOT_OVER, self.FACE_OPACITY_MOUSE_OFF);
        self.tweenControlOpacity(self.materials.labels, self.LABELS_HOVER, self.LABELS_HOVER_OFF);
    };

    Viewcube.prototype.onMouseMove = function (event) {
        var self = this;
        //console.info(event);
        self.mouse.x = (event.offsetX / self.domElement.clientWidth) * 2 - 1;
        self.mouse.y = - (event.offsetY / self.domElement.clientHeight) * 2 + 1;
        self.raycaster.setFromCamera(self.mouse, self.camera);
        // reset opacity for all scene objects
        self.scene.traverse(function (obj) {
            if (obj.name !== 'labels' && obj.material) {
                obj.material.opacity = self.FACE_OPACITY_MOUSE_NOT_OVER;
            }
        });
        // calculate objects intersecting the picking ray
        var intersects = self.raycaster.intersectObjects(self.cube.children, true);
        if (intersects.length > 0 && intersects[0].object.name !== 'labels') {
            var label = self.getFaceLabel(intersects[0].object.name);
            console.info('over', label, intersects);
            intersects[0].object.material.opacity = self.FACE_OPACITY_MOUSE_OVER;
        }
    };

    Viewcube.prototype.onMouseOver = function (event) {};

    Viewcube.prototype.onMouseUp = function (event) {
        var self = this;
        //console.info(event);
        // calculate mouse position in normalized device coordinates
        // (-1 to +1) for both components
        self.mouse.x = (event.offsetX / self.domElement.clientWidth) * 2 - 1;
        self.mouse.y = - (event.offsetX / self.domElement.clientWidth) * 2 + 1;
        // update the picking ray with the camera and mouse position
        self.raycaster.setFromCamera(self.mouse, self.camera);
        // calculate objects intersecting the picking ray
        var intersects = self.raycaster.intersectObjects(self.cube.children, true);
        if (intersects.length > 0) {
            var label = self.getFaceLabel(intersects[0].object.name);
            console.info('click', label, intersects);
            self.setView(intersects[0].object.name);
        }
    };

    Viewcube.prototype.render = function () {
        this.renderer.render(this.scene, this.camera);
    };

    Viewcube.prototype.setupCamera = function () {
        var self = this;
        self.camera = new THREE.PerspectiveCamera(self.fov, self.domElement.clientWidth / self.domElement.clientHeight, 0.1, 1000);
        self.camera.name = 'camera';
        self.camera.position.x = 0;
        self.camera.position.y = 0;
        self.camera.position.z = 250;
        self.camera.up = new THREE.Vector3(0, 1, 0);
        self.camera.lookAt(new THREE.Vector3(0, 0, 0));
        self.view.add(self.camera);
    };

    Viewcube.prototype.setupGeometry = function () {
        var self = this;
        // build cube control
        if (self.display.cube) {
            // FIXME this block is a duplicate
            var ROTATE_0 = 0;
            var ROTATE_90 = Math.PI / 2;
            var ROTATE_180 = Math.PI;
            var ROTATE_270 = Math.PI * 1.5;
            var ROTATE_360 = Math.PI * 2;

            if (self.display.labels) {
                var geometry = new THREE.BoxGeometry(self.CUBE_LABEL_SIZE, self.CUBE_LABEL_SIZE, self.CUBE_LABEL_SIZE);
                var labels = new THREE.Mesh(geometry, self.materials.labels);
                labels.name = 'labels';
                self.cube.add(labels);
            }

            // faces
            var topFace    = self.makeFace(self.FACES.TOP,    70,   0,   0,  50, [{axis:self.Z_AXIS, rad:ROTATE_90}]);
            var frontFace  = self.makeFace(self.FACES.FRONT, 70,   0, -50,   0, [{axis:self.X_AXIS, rad:ROTATE_90}]);
            var rightFace  = self.makeFace(self.FACES.RIGHT,  70,  50,   0,   0, [{axis:self.X_AXIS, rad:ROTATE_90},{axis:self.Y_AXIS, rad:ROTATE_90}]);
            var backFace   = self.makeFace(self.FACES.BACK,    70,   0,  50,   0, [{axis:self.X_AXIS, rad:ROTATE_270}]);
            var leftFace   = self.makeFace(self.FACES.LEFT,   70, -50,   0,   0, [{axis:self.Y_AXIS, rad:ROTATE_270},{axis:self.Z_AXIS, rad:ROTATE_90}]);
            var bottomFace = self.makeFace(self.FACES.BOTTOM, 70,   0,   0, -50, [{axis:self.Y_AXIS, rad:ROTATE_180},{axis:self.Z_AXIS, rad:ROTATE_90}]);
            self.frontFace = frontFace;

            // edges
            var topFrontEdge    = self.makeEdge(self.FACES.TOP_FRONT_EDGE, 70, 15,   0, -50, 50, [{axis:self.Z_AXIS, rad:ROTATE_0}]);
            var topRightEdge    = self.makeEdge(self.FACES.TOP_RIGHT_EDGE, 70, 15,  50,   0, 50, [{axis:self.Z_AXIS, rad:ROTATE_90}]);
            var topBackEdge     = self.makeEdge(self.FACES.TOP_BACK_EDGE,  70, 15,   0,  50, 50, [{axis:self.Z_AXIS, rad:ROTATE_180}]);
            var topLeftEdge     = self.makeEdge(self.FACES.TOP_LEFT_EDGE,  70, 15, -50,   0, 50, [{axis:self.Z_AXIS, rad:ROTATE_270}]);

            var bottomFrontEdge = self.makeEdge(self.FACES.BOTTOM_FRONT_EDGE, 70, 15,   0, -50, -50, [{axis:self.Z_AXIS, rad:ROTATE_0}, {axis:self.Y_AXIS, rad:ROTATE_180}]);
            var bottomRightEdge = self.makeEdge(self.FACES.BOTTOM_RIGHT_EDGE, 70, 15,  50,   0, -50, [{axis:self.Z_AXIS, rad:ROTATE_90},{axis:self.Y_AXIS, rad:ROTATE_180}]);
            var bottomBackEdge  = self.makeEdge(self.FACES.BOTTOM_BACK_EDGE,  70, 15,   0,  50, -50, [{axis:self.Z_AXIS, rad:ROTATE_180},{axis:self.Y_AXIS, rad:ROTATE_180}]);
            var bottomLeftEdge  = self.makeEdge(self.FACES.BOTTOM_LEFT_EDGE,  70, 15, -50,   0, -50, [{axis:self.Z_AXIS, rad:ROTATE_270},{axis:self.Y_AXIS, rad:ROTATE_180}]);

            var frontRightEdge  = self.makeEdge(self.FACES.FRONT_RIGHT_EDGE, 70, 15,  50, -50, 0, [{axis:self.X_AXIS, rad:ROTATE_0}, {axis:self.Y_AXIS, rad:ROTATE_90}]);
            var backRightEdge   = self.makeEdge(self.FACES.BACK_RIGHT_EDGE,  70, 15,  50,  50, 0, [{axis:self.X_AXIS, rad:ROTATE_180}, {axis:self.Y_AXIS, rad:ROTATE_90}]);
            var backLeftEdge    = self.makeEdge(self.FACES.BACK_LEFT_EDGE,   70, 15, -50,  50, 0, [{axis:self.X_AXIS, rad:ROTATE_180}, {axis:self.Y_AXIS, rad:ROTATE_270}]);
            var frontLeftEdge   = self.makeEdge(self.FACES.FRONT_LEFT_EDGE,  70, 15, -50, -50, 0, [{axis:self.X_AXIS, rad:ROTATE_0}, {axis:self.Y_AXIS, rad:ROTATE_270}]);

            // corners
            var topFrontLeftCorner  = self.makeCorner(self.FACES.TOP_FRONT_LEFT_CORNER, 15,  -50, -50, 50, [{axis:self.Z_AXIS, rad:ROTATE_0}]);
            var topFrontRightCorner = self.makeCorner(self.FACES.TOP_FRONT_RIGHT_CORNER, 15,  50,  -50, 50, [{axis:self.Z_AXIS, rad:ROTATE_90}]);
            var topBackRightCorner  = self.makeCorner(self.FACES.TOP_BACK_RIGHT_CORNER, 15, 50,  50, 50, [{axis:self.Z_AXIS, rad:ROTATE_180}]);
            var topBackLeftCorner   = self.makeCorner(self.FACES.TOP_BACK_LEFT_CORNER, 15, -50, 50, 50, [{axis:self.Z_AXIS, rad:ROTATE_270}]);

            var bottomFrontLeftCorner   = self.makeCorner(self.FACES.BOTTOM_FRONT_LEFT_CORNER, 15, -50, -50, -50, [{axis:self.Y_AXIS, rad:ROTATE_180},{axis:self.Z_AXIS, rad:ROTATE_90}]);
            var bottomFrontRightCorner  = self.makeCorner(self.FACES.BOTTOM_FRONT_RIGHT_CORNER, 15,  50, -50, -50, [{axis:self.Y_AXIS, rad:ROTATE_180},{axis:self.Z_AXIS, rad:ROTATE_0}]);
            var bottomBackRightCorner  = self.makeCorner(self.FACES.BOTTOM_BACK_RIGHT_CORNER, 15, 50,  50, -50, [{axis:self.Y_AXIS, rad:ROTATE_180},{axis:self.Z_AXIS, rad:ROTATE_270}]);
            var bottomBackLeftCorner   = self.makeCorner(self.FACES.BOTTOM_BACK_LEFT_CORNER, 15, -50, 50, -50, [{axis:self.Y_AXIS, rad:ROTATE_180},{axis:self.Z_AXIS, rad:ROTATE_180}]);

            self.cube.add(topFace);
            self.cube.add(frontFace);
            self.cube.add(rightFace);
            self.cube.add(backFace);
            self.cube.add(leftFace);
            self.cube.add(bottomFace);

            self.cube.add(topFrontEdge);
            self.cube.add(topRightEdge);
            self.cube.add(topBackEdge);
            self.cube.add(topLeftEdge);

            self.cube.add(bottomFrontEdge);
            self.cube.add(bottomRightEdge);
            self.cube.add(bottomBackEdge);
            self.cube.add(bottomLeftEdge);

            self.cube.add(frontRightEdge);
            self.cube.add(backRightEdge);
            self.cube.add(backLeftEdge);
            self.cube.add(frontLeftEdge);

            self.cube.add(topFrontLeftCorner);
            self.cube.add(topFrontRightCorner);
            self.cube.add(topBackRightCorner);
            self.cube.add(topBackLeftCorner);

            self.cube.add(bottomFrontLeftCorner);
            self.cube.add(bottomFrontRightCorner);
            self.cube.add(bottomBackRightCorner);
            self.cube.add(bottomBackLeftCorner);

            self.control.add(self.cube);
        }

        if (self.display.compass) {
            var compass = self.makeCompass('compass', 0, 0, -55, 90, 64, self.COMPASS_COLOR, self.COMPASS_OPACITY);
            self.control.add(compass);
        }

        if (self.display.controlAxis) {
            var controlAxis = new THREE.AxisHelper(100);
            self.cube.add(controlAxis);
        }

        if (self.display.sceneAxis) {
            var sceneAxis = new THREE.AxisHelper(150);
            self.scene.add(sceneAxis);
        }

        if (self.display.cameraAxis) {
            var cameraAxis = new THREE.AxisHelper(100);
            self.view.add(cameraAxis);
        }

        self.scene.add(self.control);
    };

    Viewcube.prototype.setupLights = function () {
        var self = this;

        // ambient light
        var ambientLight = new THREE.AmbientLight(0x545454);
        self.view.add(ambientLight);

        // top, left spotlight
        var topLeftSpot = new THREE.SpotLight(0xffffff);
        topLeftSpot.lookAt(0,0,0);
        topLeftSpot.position.set(250, -250, 250);
        topLeftSpot.intensity = 2;

        // top, right spotlight
        var topRightSpot = new THREE.SpotLight(0xffffff);
        topRightSpot.lookAt(0,0,0);
        topRightSpot.position.set(250, 250, 250);
        topRightSpot.intensity = 0.75;

        self.view.add(topLeftSpot);
        self.view.add(topRightSpot);
    };

    Viewcube.prototype.setupMaterials = function () {
        var self = this;
        // faces
        self.materials.face = new THREE.MeshBasicMaterial({
            alphaTest: 0.5,
            color: self.FACE_COLOUR,
            opacity: self.FACE_OPACITY_MOUSE_OFF,
            transparent: true
        });
        //self.materials.face = new THREE.MeshBasicMaterial({color: self.FACE_COLOUR, alphaTest: 0.5});
        self.materials.face.side = THREE.DoubleSide;
        // labels
        var label1 = new THREE.MeshPhongMaterial({
            color: 0xAAAAAA,
            map: THREE.ImageUtils.loadTexture('/lib/img/' + self.labelSize + '/top.png'),
            opacity: self.LABELS_HOVER_OFF,
            transparent: true
        });
        var label2 = new THREE.MeshPhongMaterial({
            color: 0xAAAAAA,
            map: THREE.ImageUtils.loadTexture('/lib/img/' + self.labelSize + '/front.png'),
            opacity: self.LABELS_HOVER_OFF,
            transparent: true
        });
        var label3 = new THREE.MeshPhongMaterial({
            color: 0xAAAAAA,
            map: THREE.ImageUtils.loadTexture('/lib/img/' + self.labelSize + '/right.png'),
            opacity: self.LABELS_HOVER_OFF,
            transparent: true
        });
        var label4 = new THREE.MeshPhongMaterial({
            color: 0xAAAAAA,
            map: THREE.ImageUtils.loadTexture('/lib/img/' + self.labelSize + '/left.png'),
            opacity: self.LABELS_HOVER_OFF,
            transparent: true
        });
        var label5 = new THREE.MeshPhongMaterial({
            color: 0xAAAAAA,
            map: THREE.ImageUtils.loadTexture('/lib/img/' + self.labelSize + '/back.png'),
            opacity: self.LABELS_HOVER_OFF,
            transparent: true
        });
        var label6 = new THREE.MeshPhongMaterial({
            color: 0xAAAAAA,
            map: THREE.ImageUtils.loadTexture('/lib/img/' + self.labelSize + '/bottom.png'),
            opacity: self.LABELS_HOVER_OFF,
            transparent: true
        });
        var labels = [label3, label4, label5, label2, label1, label6];
        self.materials.labels = new THREE.MeshFaceMaterial(labels);
    };

    Viewcube.prototype.setView = function (view) {
        var euler, self = this;
        switch (view) {
            case self.FACES.BACK:
                self.tweenViewRotation(Math.PI / 2, Math.PI, 0);
                self.dispatchEvent({type:'update', view:view, direction:new THREE.Euler(Math.PI / 2, Math.PI, 0)});
                break;
            case self.FACES.BACK_LEFT_EDGE:
                self.tweenViewRotation(Math.PI / 2, Math.PI * 1.25, 0);
                break;
            case self.FACES.BACK_RIGHT_EDGE:
                self.tweenViewRotation(Math.PI / 2, Math.PI * 0.75, 0);
                break;
            case self.FACES.BOTTOM:
                self.tweenViewRotation(Math.PI, 0, 0);
                break;
            case self.FACES.BOTTOM_BACK_EDGE:
                self.tweenViewRotation(Math.PI * 1.25, 0, Math.PI);
                break;
            case self.FACES.BOTTOM_BACK_LEFT_CORNER:
                self.tweenViewRotation(-Math.PI * 0.75, -Math.PI / 4, Math.PI * 0.75);
                break;
            case self.FACES.BOTTOM_BACK_RIGHT_CORNER:
                self.tweenViewRotation(Math.PI * 0.75, Math.PI * 0.25, Math.PI * 1.25);
                break;
            case self.FACES.BOTTOM_FRONT_EDGE:
                self.tweenViewRotation(Math.PI * 0.75, 0, 0);
                break;
            case self.FACES.BOTTOM_FRONT_LEFT_CORNER:
                self.tweenViewRotation(0, -Math.PI / 4, Math.PI * 0.25);
                break;
            case self.FACES.BOTTOM_FRONT_RIGHT_CORNER:
                euler = new THREE
                    .Euler(0,0,0)
                    .setFromVector3(new THREE.Vector3(1.5,1.5,-2).normalize());
                self.tweenViewRotation(euler.x, euler.y, euler.z);
                break;
            case self.FACES.BOTTOM_LEFT_EDGE:
                self.tweenViewRotation(0, Math.PI * 1.25, Math.PI * 1.5);
                break;
            case self.FACES.BOTTOM_RIGHT_EDGE:
                self.tweenViewRotation(0, Math.PI * 0.75, Math.PI / 2);
                break;
            case self.FACES.FRONT:
                self.tweenViewRotation(Math.PI / 2, 0, 0);
                break;
            case self.FACES.FRONT_LEFT_EDGE:
                self.tweenViewRotation(Math.PI / 2, Math.PI * 1.75, 0);
                break;
            case self.FACES.FRONT_RIGHT_EDGE:
                self.tweenViewRotation(Math.PI / 2, Math.PI / 4, 0);
                break;
            case self.FACES.LEFT:
                self.tweenViewRotation(Math.PI / 2, Math.PI * 1.5, 0);
                break;
            case self.FACES.RIGHT:
                self.tweenViewRotation(Math.PI / 2, Math.PI / 2, 0);
                break;
            case self.FACES.TOP:
                self.tweenViewRotation(0,0,0);
                break;
            case self.FACES.TOP_BACK_EDGE:
                self.tweenViewRotation(Math.PI * 1.75, 0, Math.PI);
                break;
            case self.FACES.TOP_BACK_LEFT_CORNER:
                euler = new THREE
                    .Euler(0,0,0)
                    .setFromVector3(new THREE.Vector3(-1.5,-1.5,2.75).normalize()); // good
                self.tweenViewRotation(euler.x, euler.y, euler.z * Math.PI * 1.5);
                break;
            case self.FACES.TOP_BACK_RIGHT_CORNER:
                euler = new THREE
                    .Euler(0,0,0)
                    .setFromVector3(new THREE.Vector3(-1.5,1.5,2.5).normalize());
                    //.setFromVector3(new THREE.Vector3(-Math.sqrt(2),Math.sqrt(2),2.5).normalize());
                self.tweenViewRotation(euler.x, euler.y, euler.z * Math.PI);
                break;
            case self.FACES.TOP_FRONT_EDGE:
                self.tweenViewRotation(Math.PI / 4, 0, 0);
                break;
            case self.FACES.TOP_FRONT_LEFT_CORNER:
                euler = new THREE
                    .Euler(0,0,0)
                    .setFromVector3(new THREE.Vector3(1.5,-1.5,-2).normalize());
                    //.setFromVector3(new THREE.Vector3(Math.sqrt(2),-Math.sqrt(2),-2).normalize());
                self.tweenViewRotation(euler.x, euler.y, euler.z);
                break;
            case self.FACES.TOP_FRONT_RIGHT_CORNER:
                euler = new THREE
                    .Euler(0,0,0)
                    .setFromVector3(new THREE.Vector3(1.5,1.5,2).normalize());
                    //.setFromVector3(new THREE.Vector3(Math.sqrt(2),Math.sqrt(2),2).normalize());
                self.tweenViewRotation(euler.x, euler.y, euler.z);

                //self.tweenViewRotation(0.5, 0.5, Math.PI / 8);
                //self.tweenViewRotation(Math.sqrt(Math.PI) / 2, Math.sqrt(Math.PI) / 2, Math.PI / 4);
                //self.tweenViewRotation(Math.sqrt(Math.PI) / 4, Math.sqrt(Math.PI) / 4, Math.PI / 4);
                //self.tweenViewRotation(Math.sqrt(Math.PI) / 8, Math.sqrt(Math.PI) / 8, Math.PI / 4);
                //self.tweenViewRotation(Math.PI * 0.09, Math.PI * 0.09, Math.PI / 4);
                //self.tweenViewRotation(Math.PI * 0.75, Math.PI * 0.75, -Math.PI * 0.5); // close
                //self.tweenViewRotation(Math.PI * 0.75, Math.PI * 0.75, Math.PI * 0.5); // close
                //self.tweenViewRotation(Math.PI * 0.75, Math.PI * 0.75, Math.PI * 1.5);
                //self.tweenViewRotation(-Math.PI * 0.25, -Math.PI * 1.25, -Math.PI * 0.5); // close

                //self.tweenViewRotation(Math.PI * 1.25, Math.PI * 0.75, -Math.PI * 0.5);
                //self.tweenViewRotation(Math.PI * 1.25, Math.PI * 1.25, -Math.PI * 1.5);
                //self.tweenViewRotation(Math.PI * 1.25, -Math.PI * 0.75, -Math.PI * 1.5);
                //self.tweenViewRotation(-Math.PI * 1.25, -Math.PI * 1.25, -Math.PI * 1.5);
                //self.tweenViewRotation(-Math.PI * 0.75, -Math.PI * 0.75, -Math.PI * 1.5);
                //self.tweenViewRotation(Math.PI * 0.75, Math.PI * 0.75, -Math.PI * 1.5);
                //self.tweenViewRotation(Math.PI * 0.75, -Math.PI * 0.75, Math.PI * 1.5);
                //self.tweenViewRotation(Math.PI * 0.75, -Math.PI * 0.75, -Math.PI * 1.5);
                //self.tweenViewRotation(-Math.PI * 0.75, -Math.PI * 0.75, Math.PI * 1.5);
                //self.tweenViewRotation(-Math.PI * 0.75, Math.PI * 0.75, -Math.PI * 1.5);
                //self.tweenViewRotation(-Math.PI * 0.75, Math.PI * 0.75, Math.PI * 1.5);
                //self.tweenViewRotation(Math.PI * 0.75, -Math.PI * 0.75, Math.PI * 0.5);
                //self.tweenViewRotation(Math.PI * 0.75, Math.PI * 0.75, -Math.PI * 0.5);
                //self.tweenViewRotation(Math.PI * 0.75, Math.PI * 0.75, Math.PI / 2);
                //self.tweenViewRotation(1, Math.PI / 5, 1 / Math.PI);
                //self.tweenViewRotation(Math.PI / 4, Math.PI / 8, Math.PI / 2);
                break;
            case self.FACES.TOP_LEFT_EDGE:
                self.tweenViewRotation(0, Math.PI * 1.75, Math.PI * 1.5);
                break;
            case self.FACES.TOP_RIGHT_EDGE:
                self.tweenViewRotation(0, Math.PI  / 4, Math.PI / 2);
                break;
            default:
                console.warn('view not found', view);
        }
    };

    Viewcube.prototype.tweenControlOpacity = function (material, start, finish) {
        var self = this;
        return new Promise(function (resolve) {
            var o1 = {opacity:start};
            var o2 = {opacity:finish};
            var tween = new TWEEN.Tween(o1).to(o2, 1000);
            function setOpacity (material, opacity) {
                if (Array.isArray(material)) {
                    material.forEach(function (m) {
                        setOpacity(m, opacity);
                    });
                } if (material instanceof THREE.MultiMaterial) {
                    material.materials.forEach(function (m) {
                        m.opacity = opacity;
                    });
                } else {
                    material.opacity = opacity;
                }
            }
            tween.easing(TWEEN.Easing.Cubic.InOut);
            tween.onComplete(function () {
                setOpacity(material, this.opacity);
                self.render();
                self.renderContinuous = false;
                resolve();
            });
            tween.onUpdate(function () {
                setOpacity(material, this.opacity);
                self.render();
            });
            self.renderContinuous = true;
            tween.start();
            self.render();
        });
    };

    Viewcube.prototype.tweenViewRotation = function (rx, ry, rz, duration) {
        var self = this;
        return new Promise(function (resolve) {
            var targetEuler = new THREE.Euler(rx, ry, rz);
            var startQuaternion = self.view.quaternion.clone();
            var endQuaternion = new THREE.Quaternion().setFromEuler(targetEuler);

            var start = {t: 0};
            var finish = {t: 1};

            var tween = new TWEEN.Tween(start).to(finish, duration || 1000);
            tween.easing(TWEEN.Easing.Cubic.InOut);
            tween.onComplete(function () {
                THREE.Quaternion.slerp(startQuaternion, endQuaternion, self.view.quaternion, this.t);
                self.render();
                self.renderContinuous = false;
                resolve();
            });
            tween.onUpdate(function () {
                THREE.Quaternion.slerp(startQuaternion, endQuaternion, self.view.quaternion, this.t);
                self.render();
            });
            self.renderContinuous = true;
            tween.start();
            self.render();
        });
    };

    Viewcube.prototype.update = function () {
        var self = this;
        TWEEN.update();
        if (self.renderContinuous) {
            requestAnimationFrame(self.update.bind(self));
        }
    };

    Viewcube.prototype.updateOrientation = function () {
        var self = this;
        var euler = new THREE.Euler(
            self.viewport.camera.rotation.x,
            self.viewport.camera.rotation.y,
            self.viewport.camera.rotation.z,
            'XZY'
        );
        self.view.quaternion.setFromEuler(euler);
        self.render();
    };

    return Viewcube;

}());
;'use strict';

var FOUR = FOUR || {};

/**
 * Renders the view from a scene camera to a canvas element in the DOM. Emits
 * the following change events:
 *
 *  backgroundChange:
 *  cameraChange:
 *  controllerChange: active controller changed
 */
FOUR.Viewport3D = (function () {

  /**
   * Viewport3D constructor.
   * @param {Object} config Configuration
   * @constructor
   */
  function Viewport3D(config) {
    THREE.EventDispatcher.call(this);
    config = config || {};
    var self = this;
    self.EVENT = {
      BACKGROUND_CHANGE: {type:'background-change'},
      CAMERA_CHANGE: {type:'camera-change'},
      CONTROLLER_CHANGE: {type:'controller-change'}
    };
    self.backgroundColor = config.backgroundColor || new THREE.Color(0x000, 1.0);
    self.camera = config.camera;
    self.clock = new THREE.Clock();
    self.continuousUpdate = false;
    self.controller = null; // the active controller
    self.controllers = {};
    self.delta = 0;
    self.domElement = config.domElement;
    self.renderer = new THREE.WebGLRenderer({antialias: true});
    self.renderer.setClearColor(self.backgroundColor);
    self.renderer.setSize(self.domElement.clientWidth, self.domElement.clientHeight);
    self.renderer.shadowMap.enabled = true;
    self.scene = config.scene;
    // add the viewport to the DOM
    self.domElement.appendChild(self.renderer.domElement);
    // listen for events
    self.domElement.addEventListener('contextmenu', self.onContextMenu.bind(self));
    self.scene.addEventListener('update', self.render.bind(self), false);
    window.addEventListener('resize', self.onWindowResize.bind(self), false);
    Object.keys(config).forEach(function (key) {
      self[key] = config[key];
    });
  }

  Viewport3D.prototype = Object.create(THREE.EventDispatcher.prototype);

  Viewport3D.prototype.constructor = Viewport3D;

  /**
   * Add controller to viewport.
   * @param {FOUR.Controller} controller Controller
   * @param {String} name Name
   */
  Viewport3D.prototype.addController = function (controller, name) {
    this.controllers[name] = controller;
  };

  /**
   * Get the viewport camera.
   * @returns {THREE.Camera}
   */
  Viewport3D.prototype.getCamera = function () {
    return this.camera;
  };

  /**
   * Get the viewport scene.
   * @returns {THREE.Scene}
   */
  Viewport3D.prototype.getScene = function () {
    return this.scene;
  };

  /**
   * Handle context menu event.
   * @param {Object} event Mouse event
   */
  Viewport3D.prototype.onContextMenu = function (event) {
    event.preventDefault();
  };

  /**
   * Handle window resize event.
   */
  Viewport3D.prototype.onWindowResize = function () {
    var ctrl, self = this;
    var height = self.domElement.clientHeight;
    var width = self.domElement.clientWidth;
    self.camera.aspect = width / height;
    self.camera.updateProjectionMatrix();
    Object.keys(self.controllers).forEach(function (key) {
      ctrl = self.controllers[key];
      if (typeof ctrl.handleResize === 'function') {
        ctrl.handleResize();
      }
    });
    self.renderer.setSize(width, height);
    self.render();
  };

  /**
   * Render the viewport once.
   */
  Viewport3D.prototype.render = function () {
    //console.log('render');
    this.renderer.render(this.scene, this.camera);
  };

  /**
   * Set the active viewport controller.
   * @param {String} name Controller name
   */
  Viewport3D.prototype.setActiveController = function (name) {
    var self = this;
    if (self.controller) {
      self.controller.disable();
      self.controller.removeEventListener(self.render);
    }
    console.info('set active controller to', name);
    self.controller = self.controllers[name];
    self.controller.addEventListener('update', self.render.bind(self), false);
    self.controller.enable();
    self.dispatchEvent(self.EVENT.CONTROLLER_CHANGE);
  };

  /**
   * Set viewport background color.
   * @param {THREE.Color} color Color
   */
  Viewport3D.prototype.setBackgroundColor = function (color) {
    var self = this;
    self.background = color;
    self.renderer.setClearColor(self.backgroundColor);
    self.dispatchEvent(self.EVENT.BACKGROUND_CHANGE);
    self.render();
  };

  /**
   * Set the viewport camera.
   * @param {THREE.Camera} camera Camera
   */
  Viewport3D.prototype.setCamera = function (camera) {
    var self = this;
    self.camera = camera;
    self.camera.aspect = self.domElement.clientWidth / self.domElement.clientHeight;
    self.camera.updateProjectionMatrix();
    self.dispatchEvent(self.EVENT.CAMERA_CHANGE);
    self.render();
  };

  /**
   * Update the controller and global tween state.
   * @param {Boolean} force Force update
   */
  Viewport3D.prototype.update = function (force) {
    var self = this;
    if (self.continuousUpdate || (force && force === true)) {
      // enqueue next update
      requestAnimationFrame(self.update.bind(self));
      // update tween state
      TWEEN.update();
      // update controller state
      if (self.controller) {
        self.delta = self.clock.getDelta();
        self.controller.update(self.delta);
      }
    }
  };

  return Viewport3D;

}());
;'use strict';

var FOUR = FOUR || {};

/**
 * Camera look controller rotates the view by moving the camera target at a
 * fixed distance around the camera position. If a THREE.PerspectiveCamera
 * is used, then we assume a fixed target distance of 100.
 */
FOUR.LookController = (function () {

	function LookController (config) {
		THREE.EventDispatcher.call(this);
		config = config || {};
		var self = this;

		self.CURSOR = {
			DEFAULT: 'default',
			LOOK: 'crosshair'
		};
		self.EPS = 0.000001;
		self.EVENT = {
			UPDATE: {type: 'update'}
		};
		self.KEY = {
			TILDE: 192
		};
		self.MOUSE_STATE = {
			UP: 0,
			DOWN: 1
		};

		self.camera = config.camera || config.viewport.camera;
		self.domElement = config.domElement || config.viewport.domElement;
		self.enabled = false;
		self.listeners = {};
		self.look = {
			delta: new THREE.Vector2(),
			dir: new THREE.Vector3(),
			end: new THREE.Vector2(),
			offset: new THREE.Vector3(),
			screen: new THREE.Vector3(),
			start: new THREE.Vector2(),
			target: new THREE.Vector3(),
			world: new THREE.Vector3()
		};
		self.lookSpeed = 0.75;
		self.mouse = self.MOUSE_STATE.UP;
		self.viewport = config.viewport;

		Object.keys(config).forEach(function (key) {
			self[key] = config[key];
		});
	}

	LookController.prototype = Object.create(THREE.EventDispatcher.prototype);

	LookController.prototype.disable = function () {
		var self = this;
		self.enabled = false;
		Object.keys(self.listeners).forEach(function (key) {
			var listener = self.listeners[key];
			listener.element.removeEventListener(listener.event, listener.fn);
		});
	};

	LookController.prototype.enable = function () {
		var self = this;
		function addListener(element, event, fn) {
			self.listeners[event] = {
				element: element,
				event: event,
				fn: fn.bind(self)
			};
			element.addEventListener(event, self.listeners[event].fn, false);
		}
		addListener(self.domElement, 'mousedown', self.onMouseDown);
		addListener(self.domElement, 'mousemove', self.onMouseMove);
		addListener(self.domElement, 'mouseup', self.onMouseUp);
		addListener(self.domElement, 'keyup', self.onKeyUp);
		self.enabled = true;
	};

	LookController.prototype.onKeyUp = function (event) {
		if (event.keyCode === this.KEY.TILDE) {
			this.camera.lookAt(this.camera.target);
			this.dispatchEvent(this.EVENT.UPDATE);
		}
	};

	LookController.prototype.onMouseDown = function (event) {
		if (event.button === THREE.MOUSE.LEFT) {
			this.domElement.style.cursor = this.CURSOR.LOOK;
			this.mouse = this.MOUSE_STATE.DOWN;
			this.look.start.set(event.offsetX - this.domElement.clientLeft, event.offsetY - this.domElement.clientTop);
			this.look.end.copy(this.look.start);
		}
	};

	LookController.prototype.onMouseMove = function (event) {
		if (this.mouse === this.MOUSE_STATE.DOWN) {
			this.look.end.set(event.offsetX - this.domElement.clientLeft, event.offsetY - this.domElement.clientTop);
		}
	};

	LookController.prototype.onMouseUp = function () {
		this.domElement.style.cursor = this.CURSOR.DEFAULT;
		this.mouse = this.MOUSE_STATE.UP;
		this.look.start.copy(this.look.end);
	};

	LookController.prototype.update = function () {
		if (this.enabled === false) {
			return;
		}
		if (this.mouse === this.MOUSE_STATE.DOWN) {
			// calculate mouse movement
			this.look.delta.set(this.look.end.x - this.look.start.x, this.look.end.y - this.look.start.y);
			if (this.look.delta.length() > 0) {
				// transform mouse screen space coordinates into world space position
				this.look.screen.set(
					(this.look.end.x / this.domElement.clientWidth) * 2 - 1,
					-(this.look.end.y / this.domElement.clientHeight) * 2 + 1,
					1);
				this.look.screen.unproject(this.camera);
				this.look.world.copy(this.look.screen).add(this.camera.position);
				// get the direction from the camera to the mouse world space position
				this.look.dir.subVectors(this.look.world, this.camera.position).normalize();
				// get the new target position
				this.look.target.copy(this.look.dir).multiplyScalar(this.camera.getDistance() * this.lookSpeed);
				// move the camera target
				if (this.camera instanceof FOUR.TargetCamera) {
					this.camera.lookAt(this.look.target);
					//console.info('TargetCamera', this.look.target);
				} else if (this.camera instanceof THREE.PerspectiveCamera) {
					//console.log('set THREE.PerspectiveCamera');
				}
				//this.look.end.copy(this.look.start); // consume the change
				this.dispatchEvent(this.EVENT.UPDATE);
			}
		}
	};

	return LookController;

}());
;'use strict';

var FOUR = FOUR || {};

FOUR.MultiController = (function () {

    /**
     * Multiple interaction controller.
     * @param {Object} config Configuration
     * @constructor
     */
    function MultiController (config) {
        THREE.EventDispatcher.call(this);
        config = config || {};

        var self = this;
        self.controllers = {};
        self.domElement = config.domElement;
        self.listeners = {};
        self.viewport = config.viewport;
    }

    MultiController.prototype = Object.create(THREE.EventDispatcher.prototype);

    MultiController.prototype.constructor = MultiController;

    MultiController.prototype.addController = function (controller, name) {
        var self = this;
        function addListener(name, ctrl, event, fn) {
            self.listeners[name] = {
                ctrl: ctrl,
                event: event,
                fn: fn.bind(self)
            };
            ctrl.addEventListener(event, self.listeners[name].fn, false);
        }
        this.controllers[name] = controller;
        addListener(name, controller, 'update', function () {
            self.dispatchEvent({type:'update'});
        });
    };

    MultiController.prototype.disable = function () {
        var self = this;
        Object.keys(self.controllers).forEach(function (key) {
            self.controllers[key].disable();
        });
    };

    MultiController.prototype.enable = function () {
        var self = this;
        Object.keys(self.controllers).forEach(function (key) {
            self.controllers[key].enable();
        });
    };

    MultiController.prototype.removeController = function (name) {
        delete this.controllers[name];
    };

    MultiController.prototype.update = function (delta) {
        var self = this;
        Object.keys(self.controllers).forEach(function (key) {
            self.controllers[key].update(delta);
        });
    };

    return MultiController;

}());
;'use strict';

var FOUR = FOUR || {};

/**
 * A reimplementation of the THREE.OrbitController.
 * @see http://threejs.org/examples/js/controls/OrbitControls.js
 * @todo add key/RMB combo
 */
FOUR.OrbitController = (function () {

	function OrbitConstraint (camera) {

		this.camera = camera;

		// "target" sets the location of focus, where the camera orbits around
		// and where it pans with respect to.
		this.target = new THREE.Vector3();

		// Limits to how far you can dolly in and out (PerspectiveCamera only)
		this.minDistance = 0;
		this.maxDistance = Infinity;

		// Limits to how far you can zoom in and out (OrthographicCamera only)
		this.minZoom = 0;
		this.maxZoom = Infinity;

		// How far you can orbit vertically, upper and lower limits.
		// Range is 0 to Math.PI radians.
		this.minPolarAngle = 0; // radians
		this.maxPolarAngle = Math.PI; // radians

		// How far you can orbit horizontally, upper and lower limits.
		// If set, must be a sub-interval of the interval [ - Math.PI, Math.PI ].
		this.minAzimuthAngle = - Infinity; // radians
		this.maxAzimuthAngle = Infinity; // radians

		// Set to true to enable damping (inertia)
		// If damping is enabled, you must call controls.update() in your animation loop
		this.enableDamping = false;
		this.dampingFactor = 0.25;

		////////////
		// internals

		var scope = this;

		var EPS = 0.000001;

		// Current position in spherical coordinate system.
		var theta;
		var phi;

		// Pending changes
		var phiDelta = 0;
		var thetaDelta = 0;
		var scale = 1;
		var panOffset = new THREE.Vector3();
		var zoomChanged = false;

		// Previously located in the update() closure. moved here so that we can
		// reset them when needed
		var offset = new THREE.Vector3();

		// so camera.up is the orbit axis
		var quat = new THREE.Quaternion().setFromUnitVectors(camera.up, new THREE.Vector3(0, 1, 0));
		var quatInverse = quat.clone().inverse();

		var lastPosition = new THREE.Vector3();
		var lastQuaternion = new THREE.Quaternion();

		//---------------------------------------------------------------------
		// API
		this.dollyIn = function (dollyScale) {
			if (scope.camera instanceof THREE.PerspectiveCamera) {
				scale /= dollyScale;
			} else if (scope.camera instanceof THREE.OrthographicCamera) {
				scope.camera.zoom = Math.max(this.minZoom, Math.min(this.maxZoom, this.camera.zoom * dollyScale));
				scope.camera.updateProjectionMatrix();
				zoomChanged = true;
			} else {
				console.warn('WARNING: OrbitControls.js encountered an unknown camera type - dolly/zoom disabled.');
			}
		};

		this.dollyOut = function (dollyScale) {
			if (scope.camera instanceof THREE.PerspectiveCamera) {
				scale *= dollyScale;
			} else if (scope.camera instanceof THREE.OrthographicCamera) {
				scope.camera.zoom = Math.max(this.minZoom, Math.min(this.maxZoom, this.camera.zoom / dollyScale));
				scope.camera.updateProjectionMatrix();
				zoomChanged = true;
			} else {
				console.warn('WARNING: OrbitControls.js encountered an unknown camera type - dolly/zoom disabled.');
			}
		};

		this.getPolarAngle = function () {
			return phi;
		};

		this.getAzimuthalAngle = function () {
			return theta;
		};

		this.rotateLeft = function (angle) {
			thetaDelta -= angle;
		};

		this.rotateUp = function (angle) {
			phiDelta -= angle;
		};

		// pass in distance in world space to move left
		this.panLeft = (function() {
			var v = new THREE.Vector3();
			return function panLeft (distance) {
				var te = this.camera.matrix.elements;
				// get X column of matrix
				v.set(te[ 0 ], te[ 1 ], te[ 2 ]);
				v.multiplyScalar(- distance);
				panOffset.add(v);
			};
		}());

		// pass in distance in world space to move up
		this.panUp = (function() {
			var v = new THREE.Vector3();
			return function panUp (distance) {
				var te = this.camera.matrix.elements;
				// get Y column of matrix
				v.set(te[ 4 ], te[ 5 ], te[ 6 ]);
				v.multiplyScalar(distance);
				panOffset.add(v);
			};
		}());

		// pass in x,y of change desired in pixel space,
		// right and down are positive
		this.pan = function (deltaX, deltaY, screenWidth, screenHeight) {
			if (scope.camera instanceof THREE.PerspectiveCamera) {
				// perspective
				var position = scope.camera.position;
				var offset = position.clone().sub(scope.target);
				var targetDistance = offset.length();

				// half of the fov is center to top of screen
				targetDistance *= Math.tan((scope.camera.fov / 2) * Math.PI / 180.0);

				// we actually don't use screenWidth, since perspective camera is fixed to screen height
				scope.panLeft(2 * deltaX * targetDistance / screenHeight);
				scope.panUp(2 * deltaY * targetDistance / screenHeight);
			} else if (scope.camera instanceof THREE.OrthographicCamera) {
				// orthographic
				scope.panLeft(deltaX * (scope.camera.right - scope.camera.left) / screenWidth);
				scope.panUp(deltaY * (scope.camera.top - scope.camera.bottom) / screenHeight);
			} else {
				// camera neither orthographic or perspective
				console.warn('WARNING: OrbitControls.js encountered an unknown camera type - pan disabled.');
			}
		};

		this.sync = function () {
			// target is a vec3
			this.target = new THREE.Vector3(0, 0, -1);
			//this.target.applyQuaternion(camera.quaternion);
			this.target.applyMatrix4(camera.matrixWorld);
		};

		this.update = function () {
			var position = this.camera.position;
			offset.copy(position).sub(this.target);
			// rotate offset to "y-axis-is-up" space
			offset.applyQuaternion(quat);
			// angle from z-axis around y-axis
			theta = Math.atan2(offset.x, offset.z);
			// angle from y-axis
			phi = Math.atan2(Math.sqrt(offset.x * offset.x + offset.z * offset.z), offset.y);
			theta += thetaDelta;
			phi += phiDelta;
			// restrict theta to be between desired limits
			theta = Math.max(this.minAzimuthAngle, Math.min(this.maxAzimuthAngle, theta));
			// restrict phi to be between desired limits
			phi = Math.max(this.minPolarAngle, Math.min(this.maxPolarAngle, phi));
			// restrict phi to be betwee EPS and PI-EPS
			phi = Math.max(EPS, Math.min(Math.PI - EPS, phi));
			var radius = offset.length() * scale;
			// restrict radius to be between desired limits
			radius = Math.max(this.minDistance, Math.min(this.maxDistance, radius));
			// move target to panned location
			this.target.add(panOffset);
			offset.x = radius * Math.sin(phi) * Math.sin(theta);
			offset.y = radius * Math.cos(phi);
			offset.z = radius * Math.sin(phi) * Math.cos(theta);

			// rotate offset back to "camera-up-vector-is-up" space
			offset.applyQuaternion(quatInverse);
			position.copy(this.target).add(offset);
			this.camera.lookAt(this.target);
			if (this.enableDamping === true) {
				thetaDelta *= (1 - this.dampingFactor);
				phiDelta *= (1 - this.dampingFactor);
			} else {
				thetaDelta = 0;
				phiDelta = 0;
			}
			scale = 1;
			panOffset.set(0, 0, 0);

			// update condition is:
			// min(camera displacement, camera rotation in radians)^2 > EPS
			// using small-angle approximation cos(x/2) = 1 - x^2 / 8
			if (zoomChanged ||
				 lastPosition.distanceToSquared(this.camera.position) > EPS ||
				8 * (1 - lastQuaternion.dot(this.camera.quaternion)) > EPS) {

				lastPosition.copy(this.camera.position);
				lastQuaternion.copy(this.camera.quaternion);
				zoomChanged = false;

				return true;
			}
			return false;
		};
	}

	function OrbitController (config) {
		THREE.EventDispatcher.call(this);
		config = config || {};

		var self = this;

		self.EVENT = {
			UPDATE: {type:'update'},
			END: {type:'end'},
			START: {type:'start'}
		};
		self.KEYS = {LEFT: 37, UP: 38, RIGHT: 39, BOTTOM: 40};
		self.STATE = { NONE : - 1, ROTATE : 0, DOLLY : 1, PAN : 2, TOUCH_ROTATE : 3, TOUCH_DOLLY : 4, TOUCH_PAN : 5 };

		// Set to true to automatically rotate around the target
		// If auto-rotate is enabled, you must call controls.update() in your animation loop
		self.autoRotate = false;
		self.autoRotateSpeed = 2.0; // 30 seconds per round when fps is 60

		self.camera = config.camera || config.viewport.camera;
		self.constraint = new OrbitConstraint(self.camera);
		self.dollyDelta = new THREE.Vector2();
		self.dollyEnd = new THREE.Vector2();
		self.dollyStart = new THREE.Vector2();
		self.domElement = config.domElement || config.viewport.domElement;
		self.enabled = false;
		self.enableKeys = true;
		self.enablePan = true;
		self.enableRotate = true;
		self.enableZoom = true;
		self.keyPanSpeed = 7.0;	// pixels moved per arrow key push
		self.keys = { LEFT: 37, UP: 38, RIGHT: 39, BOTTOM: 40 };
		self.listeners = {};
		self.mouseButtons = { ORBIT: THREE.MOUSE.LEFT, ZOOM: THREE.MOUSE.MIDDLE, PAN: THREE.MOUSE.RIGHT };
		self.panStart = new THREE.Vector2();
		self.panEnd = new THREE.Vector2();
		self.panDelta = new THREE.Vector2();
		self.rotateDelta = new THREE.Vector2();
		self.rotateEnd = new THREE.Vector2();
		self.rotateSpeed = 1.0;
		self.rotateStart = new THREE.Vector2();
		self.state = self.STATE.NONE;
		self.viewport = config.viewport;
		self.zoomSpeed = 1.0;
	}

	OrbitController.prototype = Object.create(THREE.EventDispatcher.prototype);

	OrbitController.prototype.constructor = OrbitController;

	OrbitController.prototype.contextmenu = function (event) {
		event.preventDefault();
	};

	OrbitController.prototype.disable = function () {
		var self = this;
		self.enabled = false;
		Object.keys(self.listeners).forEach(function (key) {
			var listener = self.listeners[key];
			listener.element.removeEventListener(listener.event, listener.fn);
		});
	};

	OrbitController.prototype.enable = function () {
		var self = this;
		function addListener(element, event, fn) {
			self.listeners[event] = {
				element: element,
				event: event,
				fn: fn.bind(self)
			};
			element.addEventListener(event, self.listeners[event].fn, false);
		}
		addListener(self.domElement, 'contextmenu', self.contextmenu);
		addListener(self.domElement, 'mousedown', self.onMouseDown);
		addListener(self.domElement, 'mousemove', self.onMouseMove);
		addListener(self.domElement, 'mouseup', self.onMouseUp);
		addListener(self.domElement, 'mousewheel', self.onMouseWheel);
		addListener(self.domElement, 'DOMMouseScroll', self.onMouseWheel);
		addListener(window, 'keydown', self.onKeyDown);
		addListener(window, 'keyup', self.onKeyUp);
		self.constraint.sync();
		self.enabled = true;
	};

	OrbitController.prototype.getAutoRotationAngle = function () {
		var self = this;
		return 2 * Math.PI / 60 / 60 * self.autoRotateSpeed;
	};

	OrbitController.prototype.getAzimuthalAngle = function () {
		return this.constraint.getAzimuthalAngle();
	};

	OrbitController.prototype.getPolarAngle = function () {
		return this.constraint.getPolarAngle();
	};

	OrbitController.prototype.getZoomScale = function () {
		var self = this;
		return Math.pow(0.95, self.zoomSpeed);
	};

	OrbitController.prototype.onKeyDown = function (event) {
		//console.info(event);
	};

	OrbitController.prototype.onKeyUp = function (event) {
		//console.info(event);
	};

	OrbitController.prototype.onMouseDown = function (event) {
		var self = this;
		if (self.enabled === false) {
			return;
		}
		event.preventDefault();
		if (event.button === self.mouseButtons.ORBIT) {
			if (self.enableRotate === false) {
				return;
			}
			self.state = self.STATE.ROTATE;
			self.rotateStart.set(event.clientX, event.clientY);
		} else if (event.button === self.mouseButtons.ZOOM) {
			if (self.enableZoom === false) {
				return;
			}
			self.state = self.STATE.DOLLY;
			self.dollyStart.set(event.clientX, event.clientY);
		} else if (event.button === self.mouseButtons.PAN) {
			if (self.enablePan === false) {
				return;
			}
			self.state = self.STATE.PAN;
			self.panStart.set(event.clientX, event.clientY);
		}

		if (self.state !== self.STATE.NONE) {
			self.dispatchEvent(self.EVENT.START);
		}
	};

	OrbitController.prototype.onMouseMove = function (event) {
		var self = this;
		if (self.enabled === false) {
			return;
		}
		event.preventDefault();
		var element = self.domElement;
		if (self.state === self.STATE.ROTATE) {
			if (self.enableRotate === false) {
				return;
			}
			self.rotateEnd.set(event.clientX, event.clientY);
			self.rotateDelta.subVectors(self.rotateEnd, self.rotateStart);
			// rotating across whole screen goes 360 degrees around
			self.constraint.rotateLeft(2 * Math.PI * self.rotateDelta.x / element.clientWidth * self.rotateSpeed);
			// rotating up and down along whole screen attempts to go 360, but limited to 180
			self.constraint.rotateUp(2 * Math.PI * self.rotateDelta.y / element.clientHeight * self.rotateSpeed);
			self.rotateStart.copy(self.rotateEnd);
		} else if (self.state === self.STATE.DOLLY) {
			if (self.enableZoom === false) {
				return;
			}
			self.dollyEnd.set(event.clientX, event.clientY);
			self.dollyDelta.subVectors(self.dollyEnd, self.dollyStart);
			if (self.dollyDelta.y > 0) {
				self.constraint.dollyIn(self.getZoomScale());
			} else if (self.dollyDelta.y < 0) {
				self.constraint.dollyOut(self.getZoomScale());
			}
			self.dollyStart.copy(self.dollyEnd);
		} else if (self.state === self.STATE.PAN) {
			if (self.enablePan === false) {
				return;
			}
			self.panEnd.set(event.clientX, event.clientY);
			self.panDelta.subVectors(self.panEnd, self.panStart);
			self.pan(self.panDelta.x, self.panDelta.y);
			self.panStart.copy(self.panEnd);
		}
		if (self.state !== self.STATE.NONE) {
			self.update();
		}
	};

	OrbitController.prototype.onMouseUp = function (event) {
		var self = this;
		if (self.enabled === false) {
			return;
		}
		self.dispatchEvent(self.EVENT.END);
		self.state = self.STATE.NONE;
	};

	OrbitController.prototype.onMouseWheel = function (event) {
		var self = this;
		if (self.enabled === false || self.enableZoom === false || self.state !== self.STATE.NONE) {
			return;
		}
		event.preventDefault();
		event.stopPropagation();
		var delta = 0;
		if (event.wheelDelta !== undefined) {
			// WebKit / Opera / Explorer 9
			delta = event.wheelDelta;
		} else if (event.detail !== undefined) {
			// Firefox
			delta = - event.detail;
		}
		if (delta > 0) {
			self.constraint.dollyOut(self.getZoomScale());
		} else if (delta < 0) {
			self.constraint.dollyIn(self.getZoomScale());
		}
		self.update();
		self.dispatchEvent(self.EVENT.START);
		self.dispatchEvent(self.EVENT.END);
	};

	OrbitController.prototype.onWindowResize = function () {
		console.warn('Not implemented');
	};

	/**
	 * pass in x,y of change desired in pixel space, right and down are positive
	 * @param deltaX
	 * @param deltaY
	 */
	OrbitController.prototype.pan = function (deltaX, deltaY) {
		var self = this;
		var element = self.domElement === document ? self.domElement.body : self.domElement;
		self.constraint.pan(deltaX, deltaY, element.clientWidth, element.clientHeight);
	};

	OrbitController.prototype.update = function () {
		var self = this;
		if (self.autoRotate && self.state === self.STATE.NONE) {
			self.constraint.rotateLeft(self.getAutoRotationAngle());
		}
		if (self.constraint.update() === true) {
			self.dispatchEvent(self.EVENT.UPDATE);
		}
	};

	Object.defineProperties(OrbitController.prototype, {
		//camera: {
		//	get: function () {
		//		return this.constraint.camera;
		//	},
		//	set: function (value) {
		//		this.constraint.camera = camera;
		//	}
		//},

		target: {
			get: function () {
				return this.constraint.target;
			},
			set: function (value) {
				console.warn('THREE.OrbitControls: target is now immutable. Use target.set() instead.');
				this.constraint.target.copy(value);
			}
		},

		minDistance : {
			get: function () {
				return this.constraint.minDistance;
			},
			set: function (value) {
				this.constraint.minDistance = value;
			}
		},

		maxDistance : {
			get: function () {
				return this.constraint.maxDistance;
			},
			set: function (value) {
				this.constraint.maxDistance = value;
			}
		},

		minZoom : {
			get: function () {
				return this.constraint.minZoom;
			},
			set: function (value) {
				this.constraint.minZoom = value;
			}
		},

		maxZoom : {
			get: function () {
				return this.constraint.maxZoom;
			},
			set: function (value) {
				this.constraint.maxZoom = value;
			}
		},

		minPolarAngle : {
			get: function () {
				return this.constraint.minPolarAngle;
			},
			set: function (value) {
				this.constraint.minPolarAngle = value;
			}
		},

		maxPolarAngle : {
			get: function () {
				return this.constraint.maxPolarAngle;
			},
			set: function (value) {
				this.constraint.maxPolarAngle = value;
			}
		},

		minAzimuthAngle : {
			get: function () {
				return this.constraint.minAzimuthAngle;
			},
			set: function (value) {
				this.constraint.minAzimuthAngle = value;
			}
		},

		maxAzimuthAngle : {
			get: function () {
				return this.constraint.maxAzimuthAngle;
			},
			set: function (value) {
				this.constraint.maxAzimuthAngle = value;
			}
		},

		enableDamping : {
			get: function () {
				return this.constraint.enableDamping;
			},
			set: function (value) {
				this.constraint.enableDamping = value;
			}
		},

		dampingFactor : {
			get: function () {
				return this.constraint.dampingFactor;
			},
			set: function (value) {
				this.constraint.dampingFactor = value;
			}
		}

	});

	return OrbitController;

}());
;'use strict';

var FOUR = FOUR || {};

/**
 * Camera pan controller. Panning can be performed using the right mouse button
 * or the combination of a keypress, left mouse button down and mouse move.
 */
FOUR.PanController = (function () {

    function PanController (config) {
        THREE.EventDispatcher.call(this);
        config = config || {};
        var self = this;

        self.CURSOR = {
            DEFAULT: 'default',
            PAN: 'all-scroll'
        };
        self.EPS = 0.000001;
        self.EVENT = {
            END: {type: 'end'},
            START: {type: 'start'},
            UPDATE: {type: 'update'}
        };
        self.KEY = {
            CTRL: 17
        };

        self.active = false;
        self.camera = config.camera || config.viewport.camera;
        self.domElement = config.domElement || config.viewport.domElement;
        self.dynamicDampingFactor = 0.2;
        self.enabled = false;
        self.keydown = false;
        self.listeners = {};
        self.maxDistance = Infinity;
        self.minDistance = 1;
        self.offset = new THREE.Vector3();
        self.pan = {
            cameraUp: new THREE.Vector3(),
            delta: new THREE.Vector2(),
            end: new THREE.Vector3(),
            eye: new THREE.Vector3(),
            start: new THREE.Vector3(),
            vector: new THREE.Vector2()
        };
        self.panSpeed = 1;
        self.viewport = config.viewport;

        Object.keys(config).forEach(function (key) {
           self[key] = config[key];
        });
    }

    PanController.prototype = Object.create(THREE.EventDispatcher.prototype);

    PanController.prototype.disable = function () {
        var self = this;
        self.enabled = false;
        Object.keys(self.listeners).forEach(function (key) {
            var listener = self.listeners[key];
            listener.element.removeEventListener(listener.event, listener.fn);
        });
    };

    PanController.prototype.enable = function () {
        var self = this;
        function addListener(element, event, fn) {
            self.listeners[event] = {
                element: element,
                event: event,
                fn: fn.bind(self)
            };
            element.addEventListener(event, self.listeners[event].fn, false);
        }
        addListener(self.domElement, 'mousedown', self.onMouseDown);
        addListener(self.domElement, 'mousemove', self.onMouseMove);
        addListener(self.domElement, 'mouseup', self.onMouseUp);
        addListener(window, 'keydown', self.onKeyDown);
        addListener(window, 'keyup', self.onKeyUp);
        self.enabled = true;
    };

    PanController.prototype.getMouseOnCircle = function (pageX, pageY) {
        this.pan.vector.set(
          (pageX - this.domElement.clientWidth * 0.5) / (this.domElement.clientWidth * 0.5),
          (this.domElement.clientHeight + 2 * pageY) / this.domElement.clientWidth
        );
        return this.pan.vector;
    };

    PanController.prototype.getMouseOnScreen = function (elementX, elementY) {
        this.pan.vector.set(elementX / this.domElement.clientWidth, elementY / this.domElement.clientHeight);
        return this.pan.vector;
    };

    PanController.prototype.onKeyDown = function (event) {
        if (event.keyCode === this.KEY.CTRL) {
            this.keydown = true;
        }
    };

    PanController.prototype.onKeyUp = function (event) {
        if (event.keyCode === this.KEY.CTRL) {
            this.keydown = false;
        }
    };

    PanController.prototype.onMouseDown = function (event) {
        event.preventDefault();
        if ((this.keydown && event.button === THREE.MOUSE.LEFT) || event.button === THREE.MOUSE.RIGHT) {
            this.active = true;
            this.domElement.style.cursor = this.CURSOR.PAN;
            this.pan.start.copy(this.getMouseOnScreen(event.offsetX - this.domElement.clientLeft, event.offsetY - this.domElement.clientTop));
            this.pan.end.copy(this.pan.start);
            this.dispatchEvent(this.EVENT.START);
        }
    };

    PanController.prototype.onMouseMove = function (event) {
        event.preventDefault();
        if ((this.keydown && event.button === THREE.MOUSE.LEFT) || event.button === THREE.MOUSE.RIGHT) {
            this.pan.end.copy(this.getMouseOnScreen(event.offsetX - this.domElement.clientLeft, event.offsetY - this.domElement.clientTop));
        }
    };

    PanController.prototype.onMouseUp = function (event) {
        event.preventDefault();
        if (this.active === true) {
            this.active = false;
            this.domElement.style.cursor = this.CURSOR.DEFAULT;
            this.pan.delta.set(0,0);
            this.dispatchEvent(this.EVENT.END);
        }
    };

    PanController.prototype.update = function () {
        var self = this;
        if (self.enabled === false) {
            return;
        }
        if (this.active === true) {
            self.pan.eye.subVectors(self.camera.position, self.camera.target);
            self.pan.delta.copy(self.pan.end).sub(self.pan.start);
            if (self.pan.delta.lengthSq() > self.EPS) {
                // compute offset
                self.pan.delta.multiplyScalar(self.pan.eye.length() * self.panSpeed);
                self.offset.copy(self.pan.eye).cross(self.camera.up).setLength(self.pan.delta.x);
                self.offset.add(self.pan.cameraUp.copy(self.camera.up).setLength(self.pan.delta.y));

                // set the new camera position
                self.camera.position.add(self.offset);
                self.camera.target.add(self.offset);

                // consume the change
                this.pan.start.copy(this.pan.end);

                self.dispatchEvent(self.EVENT.UPDATE);
            }
        }
    };

    return PanController;

}());
;'use strict';

var FOUR = FOUR || {};

/**
 * Camera rotation controller. Rotation can be performed using the middle
 * mouse button or the combination of a keypress, left mouse button down and
 * mouse move. A reimplementation of the THREE.OrbitController.
 * @see http://threejs.org/examples/js/controls/OrbitControls.js
 */
FOUR.RotateController = (function () {

    function OrbitConstraint (camera) {

        this.camera = camera;

        this.maxDistance = Infinity;
        this.minDistance = 1;

        // How far you can orbit vertically, upper and lower limits.
        // Range is 0 to Math.PI radians.
        this.minPolarAngle = 0; // radians
        this.maxPolarAngle = Math.PI; // radians

        // How far you can orbit horizontally, upper and lower limits.
        // If set, must be a sub-interval of the interval [ - Math.PI, Math.PI ].
        this.minAzimuthAngle = - Infinity; // radians
        this.maxAzimuthAngle = Infinity; // radians

        // Set to true to enable damping (inertia)
        // If damping is enabled, you must call controls.update() in your animation loop
        this.enableDamping = false;
        this.dampingFactor = 0.25;

        ////////////
        // internals

        var scope = this;

        var EPS = 0.000001;

        // Current position in spherical coordinate system.
        var theta;
        var phi;

        // Pending changes
        var phiDelta = 0;
        var thetaDelta = 0;
        var scale = 1;

        // Previously located in the update() closure. moved here so that we can
        // reset them when needed
        var offset = new THREE.Vector3();

        // so camera.up is the orbit axis
        var quat = new THREE.Quaternion().setFromUnitVectors(camera.up, new THREE.Vector3(0, 1, 0));
        var quatInverse = quat.clone().inverse();

        var lastPosition = new THREE.Vector3();
        var lastQuaternion = new THREE.Quaternion();

        //---------------------------------------------------------------------
        // API

        this.getPolarAngle = function () {
            return phi;
        };

        this.getAzimuthalAngle = function () {
            return theta;
        };

        this.rotateLeft = function (angle) {
            thetaDelta -= angle;
        };

        this.rotateUp = function (angle) {
            phiDelta -= angle;
        };

        this.update = function () {
            var position = this.camera.position;
            offset.copy(position).sub(this.camera.target);
            // rotate offset to "y-axis-is-up" space
            offset.applyQuaternion(quat);
            // angle from z-axis around y-axis
            theta = Math.atan2(offset.x, offset.z);
            // angle from y-axis
            phi = Math.atan2(Math.sqrt(offset.x * offset.x + offset.z * offset.z), offset.y);
            theta += thetaDelta;
            phi += phiDelta;
            // restrict theta to be between desired limits
            theta = Math.max(this.minAzimuthAngle, Math.min(this.maxAzimuthAngle, theta));
            // restrict phi to be between desired limits
            phi = Math.max(this.minPolarAngle, Math.min(this.maxPolarAngle, phi));
            // restrict phi to be betwee EPS and PI-EPS
            phi = Math.max(EPS, Math.min(Math.PI - EPS, phi));
            var radius = offset.length() * scale;
            // restrict radius to be between desired limits
            radius = Math.max(this.minDistance, Math.min(this.maxDistance, radius));

            offset.x = radius * Math.sin(phi) * Math.sin(theta);
            offset.y = radius * Math.cos(phi);
            offset.z = radius * Math.sin(phi) * Math.cos(theta);

            // rotate offset back to "camera-up-vector-is-up" space
            offset.applyQuaternion(quatInverse);
            position.copy(this.camera.target).add(offset);
            this.camera.lookAt(this.camera.target);
            if (this.enableDamping === true) {
                thetaDelta *= (1 - this.dampingFactor);
                phiDelta *= (1 - this.dampingFactor);
            } else {
                thetaDelta = 0;
                phiDelta = 0;
            }
            scale = 1;

            // update condition is:
            // min(camera displacement, camera rotation in radians)^2 > EPS
            // using small-angle approximation cos(x/2) = 1 - x^2 / 8
            if (lastPosition.distanceToSquared(this.camera.position) > EPS ||
                8 * (1 - lastQuaternion.dot(this.camera.quaternion)) > EPS) {

                lastPosition.copy(this.camera.position);
                lastQuaternion.copy(this.camera.quaternion);

                return true;
            }
            return false;
        };
    }

    function RotateController (config) {
        THREE.EventDispatcher.call(this);
        config = config || {};

        var self = this;

        self.CURSOR = {
            DEFAULT: 'default',
            ROTATE: 'crosshair'
        };
        self.EVENT = {
            UPDATE: {type:'update'},
            END: {type:'end'},
            START: {type:'start'}
        };
        self.KEY = {ALT: 18, LEFT: 37, UP: 38, RIGHT: 39, BOTTOM: 40};
        self.STATE = {NONE: -1, ROTATE: 0};

        self.camera = config.camera || config.viewport.camera;
        self.constraint = new OrbitConstraint(self.camera);
        self.domElement = config.domElement || config.viewport.domElement;
        self.enabled = false;
        self.enableKeys = true;
        self.enableRotate = true;
        self.keys = { LEFT: 37, UP: 38, RIGHT: 39, BOTTOM: 40 };
        self.listeners = {};
        self.rotateDelta = new THREE.Vector2();
        self.rotateEnd = new THREE.Vector2();
        self.rotateSpeed = 1.0;
        self.rotateStart = new THREE.Vector2();
        self.state = self.STATE.NONE;
        self.viewport = config.viewport;
    }

    RotateController.prototype = Object.create(THREE.EventDispatcher.prototype);

    RotateController.prototype.constructor = RotateController;

    RotateController.prototype.disable = function () {
        var self = this;
        self.enabled = false;
        Object.keys(self.listeners).forEach(function (key) {
            var listener = self.listeners[key];
            listener.element.removeEventListener(listener.event, listener.fn);
        });
    };

    RotateController.prototype.enable = function () {
        var self = this;
        function addListener(element, event, fn) {
            self.listeners[event] = {
                element: element,
                event: event,
                fn: fn.bind(self)
            };
            element.addEventListener(event, self.listeners[event].fn, false);
        }
        addListener(self.domElement, 'mousedown', self.onMouseDown);
        addListener(self.domElement, 'mousemove', self.onMouseMove);
        addListener(self.domElement, 'mouseup', self.onMouseUp);
        addListener(window, 'keydown', self.onKeyDown);
        addListener(window, 'keyup', self.onKeyUp);
        self.enabled = true;
    };

    RotateController.prototype.onKeyDown = function (event) {
        if (event.keyCode === this.KEY.ALT) {
            this.keydown = true;
        }
    };

    RotateController.prototype.onKeyUp = function (event) {
        if (event.keyCode === this.KEY.ALT) {
            this.keydown = false;
        }
    };

    RotateController.prototype.onMouseDown = function (event) {
        if (this.enabled === false) {
            return;
        }
        if (this.keydown && event.button === THREE.MOUSE.LEFT) {
            this.state = this.STATE.ROTATE;
            this.domElement.style.cursor = this.CURSOR.ROTATE;
            this.rotateStart.set(event.clientX, event.clientY);
            this.dispatchEvent(this.EVENT.START);
        }
    };

    RotateController.prototype.onMouseMove = function (event) {
        if (this.enabled === false) {
            return;
        }
        if (this.state === this.STATE.ROTATE) {
            this.rotateEnd.set(event.clientX, event.clientY);
            this.rotateDelta.subVectors(this.rotateEnd, this.rotateStart);
            // rotating across whole screen goes 360 degrees around
            this.constraint.rotateLeft(2 * Math.PI * this.rotateDelta.x / this.domElement.clientWidth * this.rotateSpeed);
            // rotating up and down along whole screen attempts to go 360, but limited to 180
            this.constraint.rotateUp(2 * Math.PI * this.rotateDelta.y / this.domElement.clientHeight * this.rotateSpeed);
            this.rotateStart.copy(this.rotateEnd);
        }
        if (this.state !== this.STATE.NONE) {
            this.update();
        }
    };

    RotateController.prototype.onMouseUp = function () {
        if (this.state === this.STATE.ROTATE) {
            this.domElement.style.cursor = this.CURSOR.DEFAULT;
            this.state = this.STATE.NONE;
            this.dispatchEvent(this.EVENT.END);
        }
    };

    RotateController.prototype.setCamera = function (camera) {
        this.constraint.camera = camera;
    };

    RotateController.prototype.update = function () {
        if (this.state === this.STATE.ROTATE) {
            if (this.constraint.update() === true) {
                this.dispatchEvent(this.EVENT.UPDATE);
            }
        }
    };

    Object.defineProperties(RotateController.prototype, {
        minDistance : {
            get: function () {
                return this.constraint.minDistance;
            },
            set: function (value) {
                this.constraint.minDistance = value;
            }
        },

        maxDistance : {
            get: function () {
                return this.constraint.maxDistance;
            },
            set: function (value) {
                this.constraint.maxDistance = value;
            }
        },

        minPolarAngle : {
            get: function () {
                return this.constraint.minPolarAngle;
            },
            set: function (value) {
                this.constraint.minPolarAngle = value;
            }
        },

        maxPolarAngle : {
            get: function () {
                return this.constraint.maxPolarAngle;
            },
            set: function (value) {
                this.constraint.maxPolarAngle = value;
            }
        },

        minAzimuthAngle : {
            get: function () {
                return this.constraint.minAzimuthAngle;
            },
            set: function (value) {
                this.constraint.minAzimuthAngle = value;
            }
        },

        maxAzimuthAngle : {
            get: function () {
                return this.constraint.maxAzimuthAngle;
            },
            set: function (value) {
                this.constraint.maxAzimuthAngle = value;
            }
        },

        enableDamping : {
            get: function () {
                return this.constraint.enableDamping;
            },
            set: function (value) {
                this.constraint.enableDamping = value;
            }
        },

        dampingFactor : {
            get: function () {
                return this.constraint.dampingFactor;
            },
            set: function (value) {
                this.constraint.dampingFactor = value;
            }
        }

    });

    return RotateController;

}());
;/* global THREE */
/* jshint unused:false */
'use strict';

var FOUR = FOUR || {};

FOUR.SelectionController = (function () {

  /**
   * Mouse based selection controller. The controller emits the following
   * selection events:
   *
   * add    - add one or more objects to the selection set
   * hover  - mouse over one or more objects
   * remove - remove one or more objects from the selection set
   * toggle - toggle the selection state for one or more objects
   *
   * The controller emits the following camera events:
   *
   * lookat    - look at the specified point
   * settarget - move the camera target to the specified point
   *
   * @param {Object} config Configuration
   * @constructor
   */
  function SelectionController (config) {
    THREE.EventDispatcher.call(this);
    config = config || {};
    var self = this;

    self.KEY = {ALT: 18, CTRL: 17, SHIFT: 16};
    self.MOUSE_STATE = {DOWN: 0, UP: 1};
    self.SINGLE_CLICK_TIMEOUT = 400; // milliseconds

    self.domElement = config.viewport.domElement;
    self.enabled = false;
    self.filter = function () { return true; };
    self.filters = {};
    self.intersects = [];
    self.listeners = {};
    self.modifiers = {};
    self.mouse = {
      end: new THREE.Vector2(),
      start: new THREE.Vector2(),
      state: self.MOUSE_STATE.UP
    };
    self.raycaster = new THREE.Raycaster();
    self.timeout = null;
    self.viewport = config.viewport;

    Object.keys(self.KEY).forEach(function (key) {
      self.modifiers[self.KEY[key]] = false;
    });
  }

  SelectionController.prototype = Object.create(THREE.EventDispatcher.prototype);

  SelectionController.prototype.contextMenu = function (event) {
    event.preventDefault();
  };

  SelectionController.prototype.disable = function () {
    var self = this;
    self.enabled = false;
    Object.keys(self.listeners).forEach(function (key) {
      var listener = self.listeners[key];
      listener.element.removeEventListener(listener.event, listener.fn);
    });
  };

  SelectionController.prototype.enable = function () {
    var self = this;
    function addListener(element, event, fn) {
      self.listeners[event] = {
        element: element,
        event: event,
        fn: fn.bind(self)
      };
      element.addEventListener(event, self.listeners[event].fn, false);
    }
    addListener(self.viewport.domElement, 'contextmenu', self.onContextMenu);
    addListener(self.viewport.domElement, 'mousedown', self.onMouseDown);
    addListener(self.viewport.domElement, 'mousemove', self.onMouseMove);
    addListener(self.viewport.domElement, 'mouseup', self.onMouseUp);
    addListener(window, 'keydown', self.onKeyDown);
    addListener(window, 'keyup', self.onKeyUp);
    self.enabled = true;
  };

  SelectionController.prototype.getSelected = function () {
    // update the picking ray with the camera and mouse position
    this.raycaster.setFromCamera(this.mouse.end, this.viewport.camera);
    // calculate objects intersecting the picking ray
    this.intersects = this.raycaster.intersectObjects(this.viewport.scene.model.children, true); // TODO this is FOUR specific use of children
    // update the selection set using only the nearest selected object
    return this.intersects && this.intersects.length > 0 ? this.intersects[0] : null;
  };

  SelectionController.prototype.onContextMenu = function () {};

  SelectionController.prototype.onDoubleClick = function () {
    var selected = this.getSelected();
    // CTRL double click rotates the camera toward the selected point
    if (this.modifiers[this.KEY.CTRL]) {
      this.dispatchEvent({type:'lookat', position:selected.point, object:selected.object});
    }
    // double click navigates the camera to the selected point
    else {
      this.dispatchEvent({type:'settarget', position:selected.point, object:selected.object});
    }
  };

  SelectionController.prototype.onKeyDown = function (event) {
    if (!this.enabled) {
      return;
    } else if (event.keyCode === this.KEY.ALT || event.keyCode === this.KEY.CTRL || event.keyCode === this.KEY.SHIFT) {
      this.modifiers[event.keyCode] = true;
    }
  };

  SelectionController.prototype.onKeyUp = function (event) {
    if (!this.enabled) {
      return;
    } else if (event.keyCode === this.KEY.ALT || event.keyCode === this.KEY.CTRL || event.keyCode === this.KEY.SHIFT) {
      this.modifiers[event.keyCode] = false;
    }
  };

  SelectionController.prototype.onMouseDown = function (event) {
    event.preventDefault();
    if (this.enabled && event.button === THREE.MOUSE.LEFT) {
      this.mouse.state = this.MOUSE_STATE.DOWN;
      // calculate mouse position in normalized device coordinates (-1 to +1)
      this.mouse.start.x = (event.offsetX / this.domElement.clientWidth) * 2 - 1;
      this.mouse.start.y = -(event.offsetY / this.domElement.clientHeight) * 2 + 1;
      this.mouse.end.copy(this.mouse.start);
    }
  };

  SelectionController.prototype.onMouseMove = function (event) {
    if (this.enabled && this.mouse.state === this.MOUSE_STATE.DOWN) {
      // calculate mouse position in normalized device coordinates (-1 to +1)
      this.mouse.end.x = (event.offsetX / this.domElement.clientWidth) * 2 - 1;
      this.mouse.end.y = -(event.offsetY / this.domElement.clientHeight) * 2 + 1;
      // on mouse over object
      // this.dispatchEvent({type:'hover',items:objs});
    }
  };

  SelectionController.prototype.onMouseUp = function (event) {
    var self = this;
    event.preventDefault();
    if (self.enabled) {
      self.mouse.state = self.MOUSE_STATE.UP;
      if (self.timeout !== null) {
        // handle double click event
        clearTimeout(self.timeout);
        self.timeout = null;
        self.onDoubleClick();
      } else {
        // handle single click event
        self.timeout = setTimeout(function () {
          clearTimeout(self.timeout);
          self.timeout = null;
          self.onSingleClick();
        }, self.SINGLE_CLICK_TIMEOUT);
      }
    }
  };

  SelectionController.prototype.onSingleClick = function () {
    var selected = this.getSelected();
    // add objects
    if (this.modifiers[this.KEY.SHIFT] === true) {
      this.dispatchEvent({type:'add', object: selected.object});
    }
    // remove objects
    else if (this.modifiers[this.KEY.ALT] === true) {
      this.dispatchEvent({type:'remove', object: selected.object});
    }
    // toggle selection state
    else {
      this.dispatchEvent({type:'toggle', object: selected.object});
    }
  };

  SelectionController.prototype.setFilter = function () {};

  SelectionController.prototype.update = function () {}; // do nothing

  return SelectionController;

}());
;'use strict';

var FOUR = FOUR || {};

FOUR.TourController = (function () {

    /**
     * Tour controller provides automated navigation between selected features.
     * @param {Object} config Configuration
     */
    function TourController (config) {
        THREE.EventDispatcher.call(this);
        config = config || {};

        var self = this;
        self.EVENTS = {
            UPDATE: { type: 'update' },
            END: { type: 'end' },
            START: { type: 'start' }
        };
        self.KEY = {
            CANCEL: 27,     // esc
            NEXT: 190,      // .
            PREVIOUS: 188,  // ,
            NONE: -1,
            PLAN: -2,
            UPDATE: -3
        };
        self.PLANNING_STRATEGY = {
            GENETIC_EVOLUTION: 0,
            SIMULATED_ANNEALING: 1
        };

        self.camera = config.viewport.camera;
        self.current = -1; // index of the tour feature
        self.domElement = config.viewport.domElement;
        self.enabled = false;
        self.listeners = {};
        self.offset = 100; // distance between camera and feature when visiting
        self.path = [];
        self.planner = new FOUR.PathPlanner();
        self.planningStrategy = self.PLANNING_STRATEGY.GENETIC_EVOLUTION;
        self.viewport = config.viewport;
    }

    TourController.prototype = Object.create(THREE.EventDispatcher.prototype);

    TourController.prototype.constructor = TourController;

    /**
     * Disable the controller.
     */
    TourController.prototype.disable = function () {
        var self = this;
        self.enabled = false;
        Object.keys(self.listeners).forEach(function (key) {
            var listener = self.listeners[key];
            listener.element.removeEventListener(listener.event, listener.fn);
        });
    };

    /**
     * Calculate the distance between points.
     * @param {THREE.Vector3} p1 Point
     * @param {THREE.Vector3} p2 Point
     * @returns {number} Distance
     */
    TourController.prototype.distanceBetween = function (p1, p2) {
        var dx = Math.abs(p2.x - p1.x);
        var dy = Math.abs(p2.y - p1.y);
        var dz = Math.abs(p2.z - p1.z);
        return Math.sqrt((dx * dx) + (dy * dy) + (dz * dz));
    };

    /**
     * Enable the controller.
     */
    TourController.prototype.enable = function () {
        var self = this;
        function addListener(element, event, fn) {
            self.listeners[event] = {
                element: element,
                event: event,
                fn: fn.bind(self)
            };
            element.addEventListener(event, self.listeners[event].fn, false);
        }
        //addListener(self.selection, 'update', self.plan);
        addListener(window, 'keyup', self.onKeyUp);

        // listen for key input events
        // TODO
        this.enabled = true;
    };

    /**
     * Get the tour path.
     * @returns {Array|*}
     */
    TourController.prototype.getPath = function () {
        return this.path;
    };

    /**
     * Navigate to the i-th feature.
     * @param {Integer} i Path index
     * @returns {Promise}
     */
    TourController.prototype.navigate = function (i) {
        var self = this;
        var feature = self.path[i];
        self.camera.setTarget(feature.x, feature.y, feature.z);
        // TODO zoom to fit object
    };

    /**
     * Find the tour feature nearest to position P.
     * @param {THREE.Vector3} p Point
     * @returns {THREE.Vector3} Position of nearest tour feature.
     */
    TourController.prototype.nearest = function (p) {
        var dist, nearest, self = this;
        nearest = self.path.reduce(function (last, current, index) {
            dist = self.distanceBetween(p, current);
            if (dist <= last.dist) {
                last = {x: current.x, y: current.y, z: current.z, dist: dist, index: index};
            }
            return last;
        }, {x: p.x, y: p.y, z: p.z, dist: Infinity, index: -1 }); // TODO include the feature identifier
        return nearest;
    };

    /**
     * Navigate to the next feature.
     * @returns {Promise}
     */
    TourController.prototype.next = function () {
        var self = this;
        if (self.current === -1) {
            // get the nearest feature to the camera
            var nearest = self.nearest(self.camera.position);
            self.current = nearest.index;
        } else if (self.current < self.path.length - 1) {
            self.current++;
        } else {
            self.current = 0;
        }
        return self.navigate(self.current);
    };

    /**
     * Empty function.
     */
    TourController.prototype.noop = function () {};

    TourController.prototype.onKeyDown = function () {};

    TourController.prototype.onKeyUp = function () {
        var self = this;
        if (!self.enabled) {
            return;
        }
        switch(event.keyCode) {
            case self.KEY.CANCEL:
                self.current = -1;
                self.path = [];
                break;
            case self.KEY.NEXT:
                self.next();
                break;
            case self.KEY.PREVIOUS:
                self.previous();
                break;
        }
    };

    /**
     * Generate a tour plan.
     * @returns {Promise}
     */
    TourController.prototype.plan = function (objs) {
        var self = this;
        // reset the current feature index
        self.current = -1;
        self.path = [];
        // generate the tour path
        return self.planner
          .generateTourSequence(objs)
          .then(function (path) {
              self.path = path;
          }, function (err) {
              console.error(err);
          });
    };

    /**
     * Navigate to the previous feature.
     * @returns {Promise}
     */
    TourController.prototype.previous = function () {
        var self = this;
        if (self.current === -1) {
            // get the nearest feature to the camera
            var nearest = self.nearest(self.camera.position);
            self.current = nearest.index;
        } else if (self.current === 0) {
            self.current = self.path.length - 1;
        } else {
            self.current--;
        }
        return self.navigate(self.current);
    };

    /**
     * Set camera.
     * @param {THREE.PerspectiveCamera} camera Camera
     */
    TourController.prototype.setCamera = function (camera) {
        this.camera = camera;
    };

    /**
     * Update the controller state.
     */
    TourController.prototype.update = function () {};

    return TourController;

}());
;'use strict';

var FOUR = FOUR || {};

/**
 * Trackball controller.
 * @todo listen for camera change on the viewport
 * @todo listen for domElement resize events
 * @todo handle mouse position, sizing differences between document and domelements
 */
FOUR.TrackballController = (function () {

    var STATE = {
        NONE: -1,
        ROTATE: 0,
        ZOOM: 1,
        PAN: 2,
        TOUCH_ROTATE: 3,
        TOUCH_ZOOM_PAN: 4
    };

    var _state = STATE.NONE,
      _prevState = STATE.NONE,

      _eye = new THREE.Vector3(),

      _movePrev = new THREE.Vector2(),
      _moveCurr = new THREE.Vector2(),

      _lastAxis = new THREE.Vector3(),
      _lastAngle = 0,

      _zoomStart = new THREE.Vector2(),
      _zoomEnd = new THREE.Vector2(),

      _touchZoomDistanceStart = 0,
      _touchZoomDistanceEnd = 0,

      _panStart = new THREE.Vector2(),
      _panEnd = new THREE.Vector2(),

      _key = null;

    function TrackballController (config) {
        THREE.EventDispatcher.call(this);
        config = config || {};
        var self = this;

        self.EPS = 0.000001;
        self.EVENTS = {
            UPDATE: {type: 'update'},
            END: {type: 'end'},
            START: {type: 'start'}
        };
        self.KEY = {
            A: 65,
            S: 83,
            D: 68,
            I: 73,
            J: 74,
            K: 75,
            L: 76,
            ALT: 18,
            CTRL: 17,
            SHIFT: 16,
            CANCEL: 27,
            GRAVE_ACCENT: 192,
            MOVE_FORWARD: 73,
            MOVE_LEFT: 74,
            MOVE_BACK: 75,
            MOVE_RIGHT: 76,
            MOVE_UP: 85,
            MOVE_DOWN: 79
        };
        self.MODE = {
            SELECTION: 0,
            TRACKBALL: 1,
            FIRSTPERSON: 2,
            ORBIT: 3
        };
        self.MOUSE_STATE = {
            UP: 0,
            DOWN: 1
        };
        self.SINGLE_CLICK_TIMEOUT = 400;

        // API
        self.allowZoom = true;
        self.allowPan = true;
        self.allowRotate = true;
        self.camera = config.camera || config.viewport.camera;
        self.domElement = config.domElement || config.viewport.domElement;
        self.dynamicDampingFactor = 0.2;
        self.enabled = false;
        self.keys = [
            65 /*A*/, 83 /*S*/, 68 /*D*/,
            73 /*I*/, 74 /*J*/, 75 /*K*/, 76 /*L*/
        ];
        self.lastPosition = new THREE.Vector3();
        self.lastTarget = new THREE.Vector3();
        self.listeners = {};
        self.maxDistance = Infinity;
        self.minDistance = 0;
        self.modifiers = {};
        self.mouse = self.MOUSE_STATE.UP;
        self.mousePosition = new THREE.Vector2();
        self.moving = false;
        self.name = 'Trackball';
        self.panSpeed = 0.3;
        self.raycaster = new THREE.Raycaster();
        self.rotateSpeed = 1.0;
        self.screen = { left: 0, top: 0, width: 0, height: 0 };
        self.staticMoving = false;
        self.target = new THREE.Vector3();
        self.timeout = null;
        self.viewport = config.viewport;
        self.zoomSpeed = 1.2;

        Object.keys(self.KEY).forEach(function (key) {
            self.modifiers[self.KEY[key]] = false;
        });

        Object.keys(config).forEach(function (key) {
           self[key] = config[key];
        });
    }

    TrackballController.prototype = Object.create(THREE.EventDispatcher.prototype);

    TrackballController.prototype.checkDistances = function () {
        var self = this;
        if (self.allowZoom || self.allowPan) {
            if (_eye.lengthSq() > self.maxDistance * self.maxDistance) {
                self.camera.position.addVectors(self.target, _eye.setLength(self.maxDistance));
                _zoomStart.copy(_zoomEnd);
            }
            if (_eye.lengthSq() < self.minDistance * self.minDistance) {
                self.camera.position.addVectors(self.target, _eye.setLength(self.minDistance));
                _zoomStart.copy(_zoomEnd);
            }
        }
    };

    TrackballController.prototype.contextMenu = function (event) {
        event.preventDefault();
    };

    TrackballController.prototype.disable = function () {
        var self = this;
        self.enabled = false;
        Object.keys(self.listeners).forEach(function (key) {
            var listener = self.listeners[key];
            listener.element.removeEventListener(listener.event, listener.fn);
        });
    };

    TrackballController.prototype.enable = function () {
        var self = this;
        self.handleResize(); // update screen size settings
        self.lastPosition.copy(self.camera.position);
        self.lastTarget.copy(self.camera.target);
        function addListener(element, event, fn) {
            self.listeners[event] = {
                element: element,
                event: event,
                fn: fn.bind(self)
            };
            element.addEventListener(event, self.listeners[event].fn, false);
        }
        addListener(self.domElement, 'contextmenu', self.contextMenu);
        addListener(self.domElement, 'mousedown', self.mousedown);
        addListener(self.domElement, 'mousemove', self.mousemove);
        addListener(self.domElement, 'mouseup', self.mouseup);
        addListener(self.domElement, 'mousewheel', self.mousewheel);
        addListener(self.domElement, 'DOMMouseScroll', self.mousewheel);
        addListener(self.domElement, 'touchstart', self.touchstart);
        addListener(self.domElement, 'touchend', self.touchend);
        addListener(self.domElement, 'touchmove', self.touchmove);
        addListener(window, 'keydown', self.keydown);
        addListener(window, 'keyup', self.keyup);
        self.enabled = true;
    };

    TrackballController.prototype.getMouseOnCircle = (function () {
        var vector = new THREE.Vector2();
        return function getMouseOnCircle(pageX, pageY) {
            vector.set(
              ((pageX - this.screen.width * 0.5 - this.screen.left) / (this.screen.width * 0.5)),
              ((this.screen.height + 2 * (this.screen.top - pageY)) / this.screen.width) // screen.width intentional
            );
            return vector;
        };
    }());

    TrackballController.prototype.getMouseOnScreen = (function () {
        var vector = new THREE.Vector2();
        return function getMouseOnScreen(pageX, pageY) {
            vector.set(
              (pageX - this.screen.left) / this.screen.width,
              (pageY - this.screen.top) / this.screen.height
            );
            return vector;
        };
    }());

    TrackballController.prototype.handleDoubleClick = function (selected) {
        var self = this;
        // CTRL double click rotates the camera toward the selected point
        if (self.modifiers[self.KEY.CTRL]) {
            self.dispatchEvent({type:'lookat', position:selected.point, object:selected.object});
        }
        // double click navigates the camera to the selected point
        else {
            self.dispatchEvent({type:'navigate', position:selected.point, object:selected.object});
        }
    };

    TrackballController.prototype.handleEvent = function (event) {
        if (typeof this[event.type] === 'function') {
            this[event.type](event);
        }
    };

    TrackballController.prototype.handleResize = function () {
        var self = this;
        if (self.domElement === document) {
            self.screen.left = 0;
            self.screen.top = 0;
            self.screen.width = window.innerWidth;
            self.screen.height = window.innerHeight;
        } else {
            var box = self.domElement.getBoundingClientRect();
            // adjustments come from similar code in the jquery offset() function
            var d = self.domElement.ownerDocument.documentElement;
            self.screen.left = box.left + window.pageXOffset - d.clientLeft;
            self.screen.top = box.top + window.pageYOffset - d.clientTop;
            self.screen.width = box.width;
            self.screen.height = box.height;
        }
    };

    TrackballController.prototype.handleSingleClick = function () {};

    TrackballController.prototype.keydown = function (event) {
        var self = this;
        if (self.enabled === false) {
            return;
        }
        if (_state !== STATE.NONE) {
            return;
        } else if (event.keyCode === self.keys[STATE.ROTATE] && self.allowRotate) {
            _state = STATE.ROTATE;
        } else if (event.keyCode === self.keys[STATE.ZOOM] && self.allowZoom) {
            _state = STATE.ZOOM;
        } else if (event.keyCode === self.keys[STATE.PAN] && self.allowPan) {
            _state = STATE.PAN;
        } else if (event.keyCode === self.KEY.CTRL) {
            self.modifiers[self.KEY.CTRL] = true;
        }
        _prevState = _state;
    };

    TrackballController.prototype.keyup = function (event) {
        var self = this;
        if (self.enabled === false) {
            return;
        } else if (event.keyCode === self.KEY.CTRL) {
            self.modifiers[self.KEY.CTRL] = true;
        } else if (event.keyCode === self.KEY.GRAVE_ACCENT) {
            self.camera.resetOrientation();
        }
        _state = _prevState;
    };

    TrackballController.prototype.mousedown = function (event) {
        event.preventDefault();
        event.stopPropagation();
        var self = this;
        self.lastPosition.copy(self.camera.position);
        self.lastTarget.copy(self.camera.target);
        self.mouse = self.MOUSE_STATE.DOWN;
        if (self.enabled === false) {
            return;
        }
        if (_state === STATE.NONE) {
            _state = event.button;
        }
        if (_state === STATE.ROTATE && self.allowRotate) {
            _moveCurr.copy(self.getMouseOnCircle(event.pageX, event.pageY));
            _movePrev.copy(_moveCurr);
        } else if (_state === STATE.ZOOM && self.allowZoom) {
            _zoomStart.copy(self.getMouseOnScreen(event.pageX, event.pageY));
            _zoomEnd.copy(_zoomStart);
        } else if (_state === STATE.PAN && self.allowPan) {
            _panStart.copy(self.getMouseOnScreen(event.pageX, event.pageY));
            _panEnd.copy(_panStart);
        }
        self.dispatchEvent(self.EVENTS.START);
    };

    TrackballController.prototype.mousemove = function (event) {
        event.preventDefault();
        event.stopPropagation();
        var self = this;
        if (self.enabled === false) {
            return;
        }
        self.moving = true;
        if (_state === STATE.ROTATE && self.allowRotate) {
            _movePrev.copy(_moveCurr);
            _moveCurr.copy(self.getMouseOnCircle(event.pageX, event.pageY));
        } else if (_state === STATE.ZOOM && self.allowZoom) {
            _zoomEnd.copy(self.getMouseOnScreen(event.pageX, event.pageY));
        } else if (_state === STATE.PAN && self.allowPan) {
            _panEnd.copy(self.getMouseOnScreen(event.pageX, event.pageY));
        }
    };

    TrackballController.prototype.mouseup = function (event) {
        event.preventDefault();
        event.stopPropagation();
        var self = this;
        self.mouse = self.MOUSE_STATE.UP;
        self.moving = false;
        _state = STATE.NONE;
        if (self.enabled === false) {
            return;
        } else if (self.timeout !== null) {
            clearTimeout(self.timeout);
            self.timeout = null;
            // calculate mouse position in normalized device coordinates (-1 to +1)
            self.mousePosition.x = (event.offsetX / self.viewport.domElement.clientWidth) * 2 - 1;
            self.mousePosition.y = -(event.offsetY / self.viewport.domElement.clientHeight) * 2 + 1;
            // update the picking ray with the camera and mouse position
            self.raycaster.setFromCamera(self.mousePosition, self.camera);
            // calculate objects intersecting the picking ray
            var intersects = self.raycaster.intersectObjects(self.viewport.scene.children, true); // TODO this is FOUR specific use of children
            // handle the action for the nearest object
            if (intersects && intersects.length > 0) {
                self.handleDoubleClick(intersects[0]);
            }
        } else {
            self.timeout = setTimeout(function () {
                self.timeout = null;
            }, self.SINGLE_CLICK_TIMEOUT);
            self.dispatchEvent(self.EVENTS.END);
        }
    };

    TrackballController.prototype.mousewheel = function (event) {
        var self = this;
        if (self.enabled === false) {
            return;
        }
        event.preventDefault();
        event.stopPropagation();
        var delta = 0;
        if (event.wheelDelta) {
            // WebKit / Opera / Explorer 9
            delta = event.wheelDelta / 40;
        } else if (event.detail) {
            // Firefox
            delta = - event.detail / 3;
        }
        _zoomStart.y += delta * 0.01;
        self.dispatchEvent(self.EVENTS.START);
        self.dispatchEvent(self.EVENTS.END);
    };

    TrackballController.prototype.panCamera = (function() {
        var mouseChange = new THREE.Vector2(),
          cameraUp = new THREE.Vector3(),
          pan = new THREE.Vector3();

        return function panCamera () {
            var change = false, self = this;
            mouseChange.copy(_panEnd).sub(_panStart);
            if (mouseChange.lengthSq()) {
                change = true;
                mouseChange.multiplyScalar(_eye.length() * self.panSpeed);
                pan.copy(_eye).cross(self.camera.up).setLength(mouseChange.x);
                pan.add(cameraUp.copy(self.camera.up).setLength(mouseChange.y));

                self.camera.position.add(pan);
                self.target.add(pan);
                if (self.staticMoving) {
                    _panStart.copy(_panEnd);
                } else {
                    _panStart.add(mouseChange.subVectors(_panEnd, _panStart).multiplyScalar(self.dynamicDampingFactor));
                }
            }
            return change;
        };
    }());

    TrackballController.prototype.reset = function () {
        var self = this;
        _state = STATE.NONE;
        _prevState = STATE.NONE;

        _eye.subVectors(self.camera.position, self.target);
        self.camera.lookAt(self.target);
        self.dispatchEvent(self.EVENTS.UPDATE);
        self.lastPosition.copy(self.camera.position);
        self.lastTarget.copy(self.camera.target);
    };

    TrackballController.prototype.rotateCamera = (function() {

        var axis = new THREE.Vector3(),
          quaternion = new THREE.Quaternion(),
          eyeDirection = new THREE.Vector3(),
          cameraUpDirection = new THREE.Vector3(),
          cameraSidewaysDirection = new THREE.Vector3(),
          moveDirection = new THREE.Vector3(),
          angle;

        return function rotateCamera() {
            var change = false, self = this;
            moveDirection.set(_moveCurr.x - _movePrev.x, _moveCurr.y - _movePrev.y, 0);
            angle = moveDirection.length();

            if (angle) {
                change = true;
                _eye.copy(self.camera.position).sub(self.target);

                eyeDirection.copy(_eye).normalize();
                cameraUpDirection.copy(self.camera.up).normalize();
                cameraSidewaysDirection.crossVectors(cameraUpDirection, eyeDirection).normalize();

                cameraUpDirection.setLength(_moveCurr.y - _movePrev.y);
                cameraSidewaysDirection.setLength(_moveCurr.x - _movePrev.x);

                moveDirection.copy(cameraUpDirection.add(cameraSidewaysDirection));

                axis.crossVectors(moveDirection, _eye).normalize();

                angle *= self.rotateSpeed;
                quaternion.setFromAxisAngle(axis, angle);

                _eye.applyQuaternion(quaternion);
                self.camera.up.applyQuaternion(quaternion);

                _lastAxis.copy(axis);
                _lastAngle = angle;
            } else if (! self.staticMoving && _lastAngle) {
                _lastAngle *= Math.sqrt(1.0 - self.dynamicDampingFactor);
                _eye.copy(self.camera.position).sub(self.target);
                quaternion.setFromAxisAngle(_lastAxis, _lastAngle);
                _eye.applyQuaternion(quaternion);
                self.camera.up.applyQuaternion(quaternion);
            }
            _movePrev.copy(_moveCurr);
            return change;
        };
    }());

    TrackballController.prototype.touchstart = function (event) {
        var self = this;
        if (self.enabled === false) {
            return;
        }
        switch (event.touches.length) {
            case 1:
                _state = STATE.TOUCH_ROTATE;
                _moveCurr.copy(self.getMouseOnCircle(event.touches[0].pageX, event.touches[0].pageY));
                _movePrev.copy(_moveCurr);
                break;
            case 2:
                _state = STATE.TOUCH_ZOOM_PAN;
                var dx = event.touches[0].pageX - event.touches[1].pageX;
                var dy = event.touches[0].pageY - event.touches[1].pageY;
                _touchZoomDistanceEnd = _touchZoomDistanceStart = Math.sqrt(dx * dx + dy * dy);
                var x = (event.touches[0].pageX + event.touches[1].pageX) / 2;
                var y = (event.touches[0].pageY + event.touches[1].pageY) / 2;
                _panStart.copy(self.getMouseOnScreen(x, y));
                _panEnd.copy(_panStart);
                break;
            default:
                _state = STATE.NONE;
        }
        self.dispatchEvent(self.EVENTS.START);
    };

    TrackballController.prototype.touchmove = function (event) {
        var self = this;
        if (self.enabled === false) {
            return;
        }
        event.preventDefault();
        event.stopPropagation();

        switch (event.touches.length) {
            case 1:
                _movePrev.copy(_moveCurr);
                _moveCurr.copy(self.getMouseOnCircle( event.touches[0].pageX, event.touches[0].pageY));
                break;
            case 2:
                var dx = event.touches[0].pageX - event.touches[1].pageX;
                var dy = event.touches[0].pageY - event.touches[1].pageY;
                _touchZoomDistanceEnd = Math.sqrt(dx * dx + dy * dy);

                var x = (event.touches[0].pageX + event.touches[1].pageX) / 2;
                var y = (event.touches[0].pageY + event.touches[1].pageY) / 2;
                _panEnd.copy(self.getMouseOnScreen(x, y));
                break;
            default:
                _state = STATE.NONE;
        }
    };

    TrackballController.prototype.touchend = function (event) {
        var self = this;
        if (self.enabled === false) {
            return;
        }
        switch (event.touches.length) {
            case 1:
                _movePrev.copy(_moveCurr);
                _moveCurr.copy(self.getMouseOnCircle( event.touches[0].pageX, event.touches[0].pageY));
                break;
            case 2:
                _touchZoomDistanceStart = _touchZoomDistanceEnd = 0;

                var x = (event.touches[0].pageX + event.touches[1].pageX) / 2;
                var y = (event.touches[0].pageY + event.touches[1].pageY) / 2;
                _panEnd.copy(self.getMouseOnScreen(x, y));
                _panStart.copy(_panEnd);
                break;
        }
        _state = STATE.NONE;
        self.dispatchEvent(self.EVENTS.END);
    };

    TrackballController.prototype.update = function () {
        var change = true, self = this;
        _eye.subVectors(self.camera.position, self.target);
        if (self.allowRotate && self.rotateCamera()) {
            change = true;
        }
        if (self.allowZoom && self.zoomCamera()) {
            change = true;
        }
        if (self.allowPan && self.panCamera()) {
            change = true;
        }
        self.camera.position.addVectors(self.target, _eye);
        self.checkDistances();
        self.camera.lookAt(self.target);

        if (change &&
          (self.lastPosition.distanceToSquared(self.camera.position) > self.EPS ||
          self.lastTarget.distanceToSquared(self.camera.target) > self.EPS)) {
            self.dispatchEvent(self.EVENTS.UPDATE);
            self.lastPosition.copy(self.camera.position);
            self.lastTarget.copy(self.camera.target);
        }
    };

    TrackballController.prototype.zoomCamera = function () {
        var change = false, factor, self = this;
        if (_state === STATE.TOUCH_ZOOM_PAN) {
            factor = _touchZoomDistanceStart / _touchZoomDistanceEnd;
            _touchZoomDistanceStart = _touchZoomDistanceEnd;
            _eye.multiplyScalar(factor);
            if (factor !== 1.0 && factor > 0.0) {
                change = true;
            }
        } else {
            factor = 1.0 + (_zoomEnd.y - _zoomStart.y) * self.zoomSpeed;
            if (factor !== 1.0 && factor > 0.0) {
                _eye.multiplyScalar(factor);
                if (self.staticMoving) {
                    _zoomStart.copy(_zoomEnd);
                } else {
                    _zoomStart.y += (_zoomEnd.y - _zoomStart.y) * this.dynamicDampingFactor;
                }
                change = true;
            }
        }
        return change;
    };

    return TrackballController;

}());
;/**
 * @author arodic / https://github.com/arodic
 */
/* jshint latedef:false, sub:true */

(function () {

  'use strict';


  var GizmoMaterial = function (parameters) {
    THREE.MeshBasicMaterial.call(this);

    this.depthTest = false;
    this.depthWrite = false;
    this.side = THREE.FrontSide;
    this.transparent = true;

    this.setValues(parameters);

    this.oldColor = this.color.clone();
    this.oldOpacity = this.opacity;

    this.highlight = function(highlighted) {

      if (highlighted) {

        this.color.setRGB(1, 1, 0);
        this.opacity = 1;

      } else {

        this.color.copy(this.oldColor);
        this.opacity = this.oldOpacity;

      }

    };

  };

  GizmoMaterial.prototype = Object.create(THREE.MeshBasicMaterial.prototype);
  GizmoMaterial.prototype.constructor = GizmoMaterial;


  var GizmoLineMaterial = function (parameters) {

    THREE.LineBasicMaterial.call(this);

    this.depthTest = false;
    this.depthWrite = false;
    this.transparent = true;
    this.linewidth = 1;

    this.setValues(parameters);

    this.oldColor = this.color.clone();
    this.oldOpacity = this.opacity;

    this.highlight = function(highlighted) {

      if (highlighted) {

        this.color.setRGB(1, 1, 0);
        this.opacity = 1;

      } else {

        this.color.copy(this.oldColor);
        this.opacity = this.oldOpacity;

      }

    };

  };

  GizmoLineMaterial.prototype = Object.create(THREE.LineBasicMaterial.prototype);
  GizmoLineMaterial.prototype.constructor = GizmoLineMaterial;


  var pickerMaterial = new GizmoMaterial({ visible: false, transparent: false });


  THREE.TransformGizmo = function () {

    var scope = this;

    this.init = function () {

      THREE.Object3D.call(this);

      this.handles = new THREE.Object3D();
      this.pickers = new THREE.Object3D();
      this.planes = new THREE.Object3D();

      this.add(this.handles);
      this.add(this.pickers);
      this.add(this.planes);

      //// PLANES
      var planeGeometry = new THREE.PlaneBufferGeometry(50, 50, 2, 2);
      var planeMaterial = new THREE.MeshBasicMaterial({ visible: false, side: THREE.DoubleSide });

      var planes = {
        'XY':   new THREE.Mesh(planeGeometry, planeMaterial),
        'YZ':   new THREE.Mesh(planeGeometry, planeMaterial),
        'XZ':   new THREE.Mesh(planeGeometry, planeMaterial),
        'XYZE': new THREE.Mesh(planeGeometry, planeMaterial)
      };

      this.activePlane = planes['XYZE'];
      planes['YZ'].rotation.set(0, Math.PI / 2, 0);
      planes['XZ'].rotation.set(- Math.PI / 2, 0, 0);

      for (var i in planes) {
        planes[i].name = i;
        this.planes.add(planes[i]);
        this.planes[i] = planes[i];
      }

      //// HANDLES AND PICKERS
      var setupGizmos = function(gizmoMap, parent) {
        for (var name in gizmoMap) {
          for (i = gizmoMap[name].length; i --;) {
            var object = gizmoMap[name][i][0];
            var position = gizmoMap[name][i][1];
            var rotation = gizmoMap[name][i][2];
            object.name = name;

            if (position) {
              object.position.set(position[0], position[1], position[2]);
            }
            if (rotation) {
              object.rotation.set(rotation[0], rotation[1], rotation[2]);
            }

            parent.add(object);
          }
        }
      };

      setupGizmos(this.handleGizmos, this.handles);
      setupGizmos(this.pickerGizmos, this.pickers);

      // reset Transformations
      this.traverse(function (child) {
        if (child instanceof THREE.Mesh) {
          child.updateMatrix();

          var tempGeometry = child.geometry.clone();
          tempGeometry.applyMatrix(child.matrix);
          child.geometry = tempGeometry;

          child.position.set(0, 0, 0);
          child.rotation.set(0, 0, 0);
          child.scale.set(1, 1, 1);
        }
      });
    };

    this.highlight = function (axis) {

      this.traverse(function(child) {

        if (child.material && child.material.highlight) {

          if (child.name === axis) {

            child.material.highlight(true);

          } else {

            child.material.highlight(false);

          }

        }

      });

    };

  };

  THREE.TransformGizmo.prototype = Object.create(THREE.Object3D.prototype);
  THREE.TransformGizmo.prototype.constructor = THREE.TransformGizmo;

  THREE.TransformGizmo.prototype.update = function (rotation, eye) {

    var vec1 = new THREE.Vector3(0, 0, 0);
    var vec2 = new THREE.Vector3(0, 1, 0);
    var lookAtMatrix = new THREE.Matrix4();

    this.traverse(function(child) {

      if (child.name.search('E') !== - 1) {

        child.quaternion.setFromRotationMatrix(lookAtMatrix.lookAt(eye, vec1, vec2));

      } else if (child.name.search('X') !== - 1 || child.name.search('Y') !== - 1 || child.name.search('Z') !== - 1) {

        child.quaternion.setFromEuler(rotation);

      }

    });

  };

  THREE.TransformGizmoTranslate = function () {

    THREE.TransformGizmo.call(this);

    var arrowGeometry = new THREE.Geometry();
    var mesh = new THREE.Mesh(new THREE.CylinderGeometry(0, 0.05, 0.2, 12, 1, false));
    mesh.position.y = 0.5;
    mesh.updateMatrix();

    arrowGeometry.merge(mesh.geometry, mesh.matrix);

    var lineXGeometry = new THREE.BufferGeometry();
    lineXGeometry.addAttribute('position', new THREE.Float32Attribute([0, 0, 0,  1, 0, 0], 3));

    var lineYGeometry = new THREE.BufferGeometry();
    lineYGeometry.addAttribute('position', new THREE.Float32Attribute([0, 0, 0,  0, 1, 0], 3));

    var lineZGeometry = new THREE.BufferGeometry();
    lineZGeometry.addAttribute('position', new THREE.Float32Attribute([0, 0, 0,  0, 0, 1], 3));

    this.handleGizmos = {

      X: [
        [new THREE.Mesh(arrowGeometry, new GizmoMaterial({ color: 0xff0000 })), [0.5, 0, 0], [0, 0, - Math.PI / 2]],
        [new THREE.Line(lineXGeometry, new GizmoLineMaterial({ color: 0xff0000 }))]
     ],

      Y: [
        [new THREE.Mesh(arrowGeometry, new GizmoMaterial({ color: 0x00ff00 })), [0, 0.5, 0]],
        [	new THREE.Line(lineYGeometry, new GizmoLineMaterial({ color: 0x00ff00 }))]
     ],

      Z: [
        [new THREE.Mesh(arrowGeometry, new GizmoMaterial({ color: 0x0000ff })), [0, 0, 0.5], [Math.PI / 2, 0, 0]],
        [new THREE.Line(lineZGeometry, new GizmoLineMaterial({ color: 0x0000ff }))]
     ],

      XYZ: [
        [new THREE.Mesh(new THREE.OctahedronGeometry(0.1, 0), new GizmoMaterial({ color: 0xffffff, opacity: 0.25 })), [0, 0, 0], [0, 0, 0]]
     ],

      XY: [
        [new THREE.Mesh(new THREE.PlaneBufferGeometry(0.29, 0.29), new GizmoMaterial({ color: 0xffff00, opacity: 0.25 })), [0.15, 0.15, 0]]
     ],

      YZ: [
        [new THREE.Mesh(new THREE.PlaneBufferGeometry(0.29, 0.29), new GizmoMaterial({ color: 0x00ffff, opacity: 0.25 })), [0, 0.15, 0.15], [0, Math.PI / 2, 0]]
     ],

      XZ: [
        [new THREE.Mesh(new THREE.PlaneBufferGeometry(0.29, 0.29), new GizmoMaterial({ color: 0xff00ff, opacity: 0.25 })), [0.15, 0, 0.15], [- Math.PI / 2, 0, 0]]
     ]

    };

    this.pickerGizmos = {

      X: [
        [new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0, 1, 4, 1, false), pickerMaterial), [0.6, 0, 0], [0, 0, - Math.PI / 2]]
     ],

      Y: [
        [new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0, 1, 4, 1, false), pickerMaterial), [0, 0.6, 0]]
     ],

      Z: [
        [new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0, 1, 4, 1, false), pickerMaterial), [0, 0, 0.6], [Math.PI / 2, 0, 0]]
     ],

      XYZ: [
        [new THREE.Mesh(new THREE.OctahedronGeometry(0.2, 0), pickerMaterial)]
     ],

      XY: [
        [new THREE.Mesh(new THREE.PlaneBufferGeometry(0.4, 0.4), pickerMaterial), [0.2, 0.2, 0]]
     ],

      YZ: [
        [new THREE.Mesh(new THREE.PlaneBufferGeometry(0.4, 0.4), pickerMaterial), [0, 0.2, 0.2], [0, Math.PI / 2, 0]]
     ],

      XZ: [
        [new THREE.Mesh(new THREE.PlaneBufferGeometry(0.4, 0.4), pickerMaterial), [0.2, 0, 0.2], [- Math.PI / 2, 0, 0]]
     ]

    };

    this.setActivePlane = function (axis, eye) {

      var tempMatrix = new THREE.Matrix4();
      eye.applyMatrix4(tempMatrix.getInverse(tempMatrix.extractRotation(this.planes['XY'].matrixWorld)));

      if (axis === 'X') {
        this.activePlane = this.planes['XY'];
        if (Math.abs(eye.y) > Math.abs(eye.z)) {
          this.activePlane = this.planes['XZ'];
        }
      }
      if (axis === 'Y') {
        this.activePlane = this.planes['XY'];
        if (Math.abs(eye.x) > Math.abs(eye.z)) {
          this.activePlane = this.planes['YZ'];
        }
      }
      if (axis === 'Z') {
        this.activePlane = this.planes['XZ'];
        if (Math.abs(eye.x) > Math.abs(eye.y)) {
          this.activePlane = this.planes['YZ'];
        }
      }
      if (axis === 'XYZ') {
        this.activePlane = this.planes['XYZE'];
      }
      if (axis === 'XY') {
        this.activePlane = this.planes['XY'];
      }
      if (axis === 'YZ') {
        this.activePlane = this.planes['YZ'];
      }
      if (axis === 'XZ') {
        this.activePlane = this.planes['XZ'];
      }
    };

    this.init();

  };

  THREE.TransformGizmoTranslate.prototype = Object.create(THREE.TransformGizmo.prototype);
  THREE.TransformGizmoTranslate.prototype.constructor = THREE.TransformGizmoTranslate;

  THREE.TransformGizmoRotate = function () {

    THREE.TransformGizmo.call(this);

    var CircleGeometry = function (radius, facing, arc) {
      var geometry = new THREE.BufferGeometry();
      var vertices = [];
      arc = arc ? arc : 1;
      for (var i = 0; i <= 64 * arc; ++ i) {
        // TODO if ... else if???
        if (facing === 'x') {
          vertices.push(0, Math.cos(i / 32 * Math.PI) * radius, Math.sin(i / 32 * Math.PI) * radius);
        }
        if (facing === 'y') {
          vertices.push(Math.cos(i / 32 * Math.PI) * radius, 0, Math.sin(i / 32 * Math.PI) * radius);
        }
        if (facing === 'z') {
          vertices.push(Math.sin(i / 32 * Math.PI) * radius, Math.cos(i / 32 * Math.PI) * radius, 0);
        }
      }
      geometry.addAttribute('position', new THREE.Float32Attribute(vertices, 3));
      return geometry;
    };

    this.handleGizmos = {
      X: [
        [new THREE.Line(new CircleGeometry(1, 'x', 0.5), new GizmoLineMaterial({ color: 0xff0000 }))]
     ],
      Y: [
        [new THREE.Line(new CircleGeometry(1, 'y', 0.5), new GizmoLineMaterial({ color: 0x00ff00 }))]
     ],
      Z: [
        [new THREE.Line(new CircleGeometry(1, 'z', 0.5), new GizmoLineMaterial({ color: 0x0000ff }))]
     ],
      E: [
        [new THREE.Line(new CircleGeometry(1.25, 'z', 1), new GizmoLineMaterial({ color: 0xcccc00 }))]
     ],
      XYZE: [
        [new THREE.Line(new CircleGeometry(1, 'z', 1), new GizmoLineMaterial({ color: 0x787878 }))]
     ]
    };

    this.pickerGizmos = {
      X: [
        [new THREE.Mesh(new THREE.TorusGeometry(1, 0.12, 4, 12, Math.PI), pickerMaterial), [0, 0, 0], [0, - Math.PI / 2, - Math.PI / 2]]
     ],
      Y: [
        [new THREE.Mesh(new THREE.TorusGeometry(1, 0.12, 4, 12, Math.PI), pickerMaterial), [0, 0, 0], [Math.PI / 2, 0, 0]]
     ],
      Z: [
        [new THREE.Mesh(new THREE.TorusGeometry(1, 0.12, 4, 12, Math.PI), pickerMaterial), [0, 0, 0], [0, 0, - Math.PI / 2]]
     ],
      E: [
        [new THREE.Mesh(new THREE.TorusGeometry(1.25, 0.12, 2, 24), pickerMaterial)]
     ],
      XYZE: [
        [new THREE.Mesh(new THREE.Geometry())]// TODO
     ]
    };

    this.setActivePlane = function (axis) {
      // TODO shouldn't this be if ... else if???
      if (axis === 'E') {
        this.activePlane = this.planes['XYZE'];
      }
      if (axis === 'X') {
        this.activePlane = this.planes['YZ'];
      }
      if (axis === 'Y') {
        this.activePlane = this.planes['XZ'];
      }
      if (axis === 'Z') {
        this.activePlane = this.planes['XY'];
      }
    };

    this.update = function (rotation, eye2) {

      THREE.TransformGizmo.prototype.update.apply(this, arguments);

      var group = {

        handles: this['handles'],
        pickers: this['pickers'],

      };

      var tempMatrix = new THREE.Matrix4();
      var worldRotation = new THREE.Euler(0, 0, 1);
      var tempQuaternion = new THREE.Quaternion();
      var unitX = new THREE.Vector3(1, 0, 0);
      var unitY = new THREE.Vector3(0, 1, 0);
      var unitZ = new THREE.Vector3(0, 0, 1);
      var quaternionX = new THREE.Quaternion();
      var quaternionY = new THREE.Quaternion();
      var quaternionZ = new THREE.Quaternion();
      var eye = eye2.clone();

      worldRotation.copy(this.planes['XY'].rotation);
      tempQuaternion.setFromEuler(worldRotation);

      tempMatrix.makeRotationFromQuaternion(tempQuaternion).getInverse(tempMatrix);
      eye.applyMatrix4(tempMatrix);

      this.traverse(function(child) {

        tempQuaternion.setFromEuler(worldRotation);

        if (child.name === 'X') {

          quaternionX.setFromAxisAngle(unitX, Math.atan2(- eye.y, eye.z));
          tempQuaternion.multiplyQuaternions(tempQuaternion, quaternionX);
          child.quaternion.copy(tempQuaternion);

        }

        if (child.name === 'Y') {

          quaternionY.setFromAxisAngle(unitY, Math.atan2(eye.x, eye.z));
          tempQuaternion.multiplyQuaternions(tempQuaternion, quaternionY);
          child.quaternion.copy(tempQuaternion);

        }

        if (child.name === 'Z') {

          quaternionZ.setFromAxisAngle(unitZ, Math.atan2(eye.y, eye.x));
          tempQuaternion.multiplyQuaternions(tempQuaternion, quaternionZ);
          child.quaternion.copy(tempQuaternion);

        }

      });

    };

    this.init();

  };

  THREE.TransformGizmoRotate.prototype = Object.create(THREE.TransformGizmo.prototype);
  THREE.TransformGizmoRotate.prototype.constructor = THREE.TransformGizmoRotate;

  THREE.TransformGizmoScale = function () {

    THREE.TransformGizmo.call(this);

    var arrowGeometry = new THREE.Geometry();
    var mesh = new THREE.Mesh(new THREE.BoxGeometry(0.125, 0.125, 0.125));
    mesh.position.y = 0.5;
    mesh.updateMatrix();

    arrowGeometry.merge(mesh.geometry, mesh.matrix);

    var lineXGeometry = new THREE.BufferGeometry();
    lineXGeometry.addAttribute('position', new THREE.Float32Attribute([0, 0, 0,  1, 0, 0], 3));

    var lineYGeometry = new THREE.BufferGeometry();
    lineYGeometry.addAttribute('position', new THREE.Float32Attribute([0, 0, 0,  0, 1, 0], 3));

    var lineZGeometry = new THREE.BufferGeometry();
    lineZGeometry.addAttribute('position', new THREE.Float32Attribute([0, 0, 0,  0, 0, 1], 3));

    this.handleGizmos = {
      X: [
        [new THREE.Mesh(arrowGeometry, new GizmoMaterial({ color: 0xff0000 })), [0.5, 0, 0], [0, 0, - Math.PI / 2]],
        [new THREE.Line(lineXGeometry, new GizmoLineMaterial({ color: 0xff0000 }))]
     ],
      Y: [
        [new THREE.Mesh(arrowGeometry, new GizmoMaterial({ color: 0x00ff00 })), [0, 0.5, 0]],
        [new THREE.Line(lineYGeometry, new GizmoLineMaterial({ color: 0x00ff00 }))]
     ],
      Z: [
        [new THREE.Mesh(arrowGeometry, new GizmoMaterial({ color: 0x0000ff })), [0, 0, 0.5], [Math.PI / 2, 0, 0]],
        [new THREE.Line(lineZGeometry, new GizmoLineMaterial({ color: 0x0000ff }))]
     ],
      XYZ: [
        [new THREE.Mesh(new THREE.BoxGeometry(0.125, 0.125, 0.125), new GizmoMaterial({ color: 0xffffff, opacity: 0.25 }))]
     ]
    };

    this.pickerGizmos = {
      X: [
        [new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0, 1, 4, 1, false), pickerMaterial), [0.6, 0, 0], [0, 0, - Math.PI / 2]]
     ],
      Y: [
        [new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0, 1, 4, 1, false), pickerMaterial), [0, 0.6, 0]]
     ],
      Z: [
        [new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0, 1, 4, 1, false), pickerMaterial), [0, 0, 0.6], [Math.PI / 2, 0, 0]]
     ],
      XYZ: [
        [new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.4, 0.4), pickerMaterial)]
     ]
    };

    this.setActivePlane = function (axis, eye) {
      var tempMatrix = new THREE.Matrix4();
      eye.applyMatrix4(tempMatrix.getInverse(tempMatrix.extractRotation(this.planes['XY'].matrixWorld)));
      if (axis === 'X') {
        this.activePlane = this.planes['XY'];
        if (Math.abs(eye.y) > Math.abs(eye.z)) {
          this.activePlane = this.planes['XZ'];
        }
      }
      if (axis === 'Y') {
        this.activePlane = this.planes['XY'];
        if (Math.abs(eye.x) > Math.abs(eye.z)) {
          this.activePlane = this.planes['YZ'];
        }
      }
      if (axis === 'Z') {
        this.activePlane = this.planes['XZ'];
        if (Math.abs(eye.x) > Math.abs(eye.y)) {
          this.activePlane = this.planes['YZ'];
        }
      }
      if (axis === 'XYZ') {
        this.activePlane = this.planes['XYZE'];
      }
    };

    this.init();

  };

  THREE.TransformGizmoScale.prototype = Object.create(THREE.TransformGizmo.prototype);
  THREE.TransformGizmoScale.prototype.constructor = THREE.TransformGizmoScale;

  THREE.TransformControls = function (camera, domElement) {

    // TODO: Make non-uniform scale and rotate play nice in hierarchies
    // TODO: ADD RXYZ contol

    THREE.Object3D.call(this);

    domElement = (domElement !== undefined) ? domElement : document;

    this.object = undefined;
    this.visible = false;
    this.snap = null;
    this.space = 'world';
    this.size = 1;
    this.axis = null;

    var scope = this;

    var _mode = 'translate';
    var _dragging = false;
    var _plane = 'XY';
    var _gizmo = {
      'translate': new THREE.TransformGizmoTranslate(),
      'rotate': new THREE.TransformGizmoRotate(),
      'scale': new THREE.TransformGizmoScale()
    };

    for (var type in _gizmo) {
      var gizmoObj = _gizmo[type];
      gizmoObj.visible = (type === _mode);
      this.add(gizmoObj);
    }

    var changeEvent = { type: 'change' };
    var mouseDownEvent = { type: 'mouseDown' };
    var mouseUpEvent = { type: 'mouseUp', mode: _mode };
    var objectChangeEvent = { type: 'objectChange' };

    var ray = new THREE.Raycaster();
    var pointerVector = new THREE.Vector2();

    var point = new THREE.Vector3();
    var offset = new THREE.Vector3();

    var rotation = new THREE.Vector3();
    var offsetRotation = new THREE.Vector3();
    var scale = 1;

    var lookAtMatrix = new THREE.Matrix4();
    var eye = new THREE.Vector3();

    var tempMatrix = new THREE.Matrix4();
    var tempVector = new THREE.Vector3();
    var tempQuaternion = new THREE.Quaternion();
    var unitX = new THREE.Vector3(1, 0, 0);
    var unitY = new THREE.Vector3(0, 1, 0);
    var unitZ = new THREE.Vector3(0, 0, 1);

    var quaternionXYZ = new THREE.Quaternion();
    var quaternionX = new THREE.Quaternion();
    var quaternionY = new THREE.Quaternion();
    var quaternionZ = new THREE.Quaternion();
    var quaternionE = new THREE.Quaternion();

    var oldPosition = new THREE.Vector3();
    var oldScale = new THREE.Vector3();
    var oldRotationMatrix = new THREE.Matrix4();

    var parentRotationMatrix  = new THREE.Matrix4();
    var parentScale = new THREE.Vector3();

    var worldPosition = new THREE.Vector3();
    var worldRotation = new THREE.Euler();
    var worldRotationMatrix  = new THREE.Matrix4();
    var camPosition = new THREE.Vector3();
    var camRotation = new THREE.Euler();

    domElement.addEventListener('mousedown', onPointerDown, false);
    domElement.addEventListener('touchstart', onPointerDown, false);

    domElement.addEventListener('mousemove', onPointerHover, false);
    domElement.addEventListener('touchmove', onPointerHover, false);

    domElement.addEventListener('mousemove', onPointerMove, false);
    domElement.addEventListener('touchmove', onPointerMove, false);

    domElement.addEventListener('mouseup', onPointerUp, false);
    domElement.addEventListener('mouseout', onPointerUp, false);
    domElement.addEventListener('touchend', onPointerUp, false);
    domElement.addEventListener('touchcancel', onPointerUp, false);
    domElement.addEventListener('touchleave', onPointerUp, false);

    this.dispose = function () {
      domElement.removeEventListener('mousedown', onPointerDown);
      domElement.removeEventListener('touchstart', onPointerDown);

      domElement.removeEventListener('mousemove', onPointerHover);
      domElement.removeEventListener('touchmove', onPointerHover);

      domElement.removeEventListener('mousemove', onPointerMove);
      domElement.removeEventListener('touchmove', onPointerMove);

      domElement.removeEventListener('mouseup', onPointerUp);
      domElement.removeEventListener('mouseout', onPointerUp);
      domElement.removeEventListener('touchend', onPointerUp);
      domElement.removeEventListener('touchcancel', onPointerUp);
      domElement.removeEventListener('touchleave', onPointerUp);
    };

    this.attach = function (object) {
      this.object = object;
      this.visible = true;
      this.update();
    };

    this.detach = function () {
      this.object = undefined;
      this.visible = false;
      this.axis = null;
    };

    this.setMode = function (mode) {
      _mode = mode ? mode : _mode;
      if (_mode === 'scale') {
        scope.space = 'local';
      }
      for (var type in _gizmo) {
        _gizmo[type].visible = (type === _mode);
      }
      this.update();
      scope.dispatchEvent(changeEvent);
    };

    this.setSnap = function (snap) {
      scope.snap = snap;
    };

    this.setSize = function (size) {
      scope.size = size;
      this.update();
      scope.dispatchEvent(changeEvent);
    };

    this.setSpace = function (space) {
      scope.space = space;
      this.update();
      scope.dispatchEvent(changeEvent);
    };

    this.update = function () {
      if (scope.object === undefined) {
        return;
      }
      scope.object.updateMatrixWorld();
      worldPosition.setFromMatrixPosition(scope.object.matrixWorld);
      worldRotation.setFromRotationMatrix(tempMatrix.extractRotation(scope.object.matrixWorld));

      camera.updateMatrixWorld();
      camPosition.setFromMatrixPosition(camera.matrixWorld);
      camRotation.setFromRotationMatrix(tempMatrix.extractRotation(camera.matrixWorld));

      scale = worldPosition.distanceTo(camPosition) / 6 * scope.size;
      this.position.copy(worldPosition);
      this.scale.set(scale, scale, scale);

      eye.copy(camPosition).sub(worldPosition).normalize();

      if (scope.space === 'local') {
        _gizmo[_mode].update(worldRotation, eye);
      } else if (scope.space === 'world') {
        _gizmo[_mode].update(new THREE.Euler(), eye);
      }
      _gizmo[_mode].highlight(scope.axis);
    };

    function onPointerHover (event) {
      if (scope.object === undefined || _dragging === true || (event.button !== undefined && event.button !== 0)) {
        return;
      }
      var pointer = event.changedTouches ? event.changedTouches[0] : event;
      var intersect = intersectObjects(pointer, _gizmo[_mode].pickers.children);
      var axis = null;
      if (intersect) {
        axis = intersect.object.name;
        event.preventDefault();
      }

      if (scope.axis !== axis) {
        scope.axis = axis;
        scope.update();
        scope.dispatchEvent(changeEvent);
      }
    }

    function onPointerDown(event) {
      if (scope.object === undefined || _dragging === true || (event.button !== undefined && event.button !== 0)) {
        return;
      }
      var pointer = event.changedTouches ? event.changedTouches[0] : event;
      if (pointer.button === 0 || pointer.button === undefined) {
        var intersect = intersectObjects(pointer, _gizmo[_mode].pickers.children);
        if (intersect) {
          event.preventDefault();
          event.stopPropagation();
          scope.dispatchEvent(mouseDownEvent);

          scope.axis = intersect.object.name;
          scope.update();

          eye.copy(camPosition).sub(worldPosition).normalize();
          _gizmo[_mode].setActivePlane(scope.axis, eye);
          var planeIntersect = intersectObjects(pointer, [_gizmo[_mode].activePlane]);
          if (planeIntersect) {
            oldPosition.copy(scope.object.position);
            oldScale.copy(scope.object.scale);

            oldRotationMatrix.extractRotation(scope.object.matrix);
            worldRotationMatrix.extractRotation(scope.object.matrixWorld);

            parentRotationMatrix.extractRotation(scope.object.parent.matrixWorld);
            parentScale.setFromMatrixScale(tempMatrix.getInverse(scope.object.parent.matrixWorld));

            offset.copy(planeIntersect.point);
          }
        }
      }
      _dragging = true;
    }

    function onPointerMove(event) {
      if (scope.object === undefined || scope.axis === null || _dragging === false || (event.button !== undefined && event.button !== 0)) {
        return;
      }
      var pointer = event.changedTouches ? event.changedTouches[0] : event;
      var planeIntersect = intersectObjects(pointer, [_gizmo[_mode].activePlane]);
      if (planeIntersect === false) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();

      point.copy(planeIntersect.point);

      if (_mode === 'translate') {
        point.sub(offset);
        point.multiply(parentScale);
        if (scope.space === 'local') {
          point.applyMatrix4(tempMatrix.getInverse(worldRotationMatrix));

          if (scope.axis.search('X') === - 1) {
            point.x = 0;
          }
          if (scope.axis.search('Y') === - 1) {
            point.y = 0;
          }
          if (scope.axis.search('Z') === - 1) {
            point.z = 0;
          }

          point.applyMatrix4(oldRotationMatrix);
          scope.object.position.copy(oldPosition);
          scope.object.position.add(point);
        }

        if (scope.space === 'world' || scope.axis.search('XYZ') !== - 1) {
          if (scope.axis.search('X') === - 1) {
            point.x = 0;
          }
          if (scope.axis.search('Y') === - 1) {
            point.y = 0;
          }
          if (scope.axis.search('Z') === - 1) {
            point.z = 0;
          }

          point.applyMatrix4(tempMatrix.getInverse(parentRotationMatrix));

          scope.object.position.copy(oldPosition);
          scope.object.position.add(point);
        }
        if (scope.snap !== null) {
          if (scope.axis.search('X') !== - 1) {
            scope.object.position.x = Math.round(scope.object.position.x / scope.snap) * scope.snap;
          }
          if (scope.axis.search('Y') !== - 1) {
            scope.object.position.y = Math.round(scope.object.position.y / scope.snap) * scope.snap;
          }
          if (scope.axis.search('Z') !== - 1) {
            scope.object.position.z = Math.round(scope.object.position.z / scope.snap) * scope.snap;
          }
        }
      } else if (_mode === 'scale') {
        point.sub(offset);
        point.multiply(parentScale);

        if (scope.space === 'local') {
          if (scope.axis === 'XYZ') {
            scale = 1 + ((point.y) / 50);
            scope.object.scale.x = oldScale.x * scale;
            scope.object.scale.y = oldScale.y * scale;
            scope.object.scale.z = oldScale.z * scale;
          } else {
            point.applyMatrix4(tempMatrix.getInverse(worldRotationMatrix));
            if (scope.axis === 'X') {
              scope.object.scale.x = oldScale.x * (1 + point.x / 50);
            }
            if (scope.axis === 'Y') {
              scope.object.scale.y = oldScale.y * (1 + point.y / 50);
            }
            if (scope.axis === 'Z') {
              scope.object.scale.z = oldScale.z * (1 + point.z / 50);
            }
          }
        }
      } else if (_mode === 'rotate') {
        point.sub(worldPosition);
        point.multiply(parentScale);
        tempVector.copy(offset).sub(worldPosition);
        tempVector.multiply(parentScale);
        if (scope.axis === 'E') {

          point.applyMatrix4(tempMatrix.getInverse(lookAtMatrix));
          tempVector.applyMatrix4(tempMatrix.getInverse(lookAtMatrix));

          rotation.set(Math.atan2(point.z, point.y), Math.atan2(point.x, point.z), Math.atan2(point.y, point.x));
          offsetRotation.set(Math.atan2(tempVector.z, tempVector.y), Math.atan2(tempVector.x, tempVector.z), Math.atan2(tempVector.y, tempVector.x));

          tempQuaternion.setFromRotationMatrix(tempMatrix.getInverse(parentRotationMatrix));

          quaternionE.setFromAxisAngle(eye, rotation.z - offsetRotation.z);
          quaternionXYZ.setFromRotationMatrix(worldRotationMatrix);

          tempQuaternion.multiplyQuaternions(tempQuaternion, quaternionE);
          tempQuaternion.multiplyQuaternions(tempQuaternion, quaternionXYZ);

          scope.object.quaternion.copy(tempQuaternion);
        } else if (scope.axis === 'XYZE') {

          quaternionE.setFromEuler(point.clone().cross(tempVector).normalize()); // rotation axis

          tempQuaternion.setFromRotationMatrix(tempMatrix.getInverse(parentRotationMatrix));
          quaternionX.setFromAxisAngle(quaternionE, - point.clone().angleTo(tempVector));
          quaternionXYZ.setFromRotationMatrix(worldRotationMatrix);

          tempQuaternion.multiplyQuaternions(tempQuaternion, quaternionX);
          tempQuaternion.multiplyQuaternions(tempQuaternion, quaternionXYZ);

          scope.object.quaternion.copy(tempQuaternion);
        } else if (scope.space === 'local') {

          point.applyMatrix4(tempMatrix.getInverse(worldRotationMatrix));

          tempVector.applyMatrix4(tempMatrix.getInverse(worldRotationMatrix));

          rotation.set(Math.atan2(point.z, point.y), Math.atan2(point.x, point.z), Math.atan2(point.y, point.x));
          offsetRotation.set(Math.atan2(tempVector.z, tempVector.y), Math.atan2(tempVector.x, tempVector.z), Math.atan2(tempVector.y, tempVector.x));

          quaternionXYZ.setFromRotationMatrix(oldRotationMatrix);
          quaternionX.setFromAxisAngle(unitX, rotation.x - offsetRotation.x);
          quaternionY.setFromAxisAngle(unitY, rotation.y - offsetRotation.y);
          quaternionZ.setFromAxisAngle(unitZ, rotation.z - offsetRotation.z);

          if (scope.axis === 'X') {
            quaternionXYZ.multiplyQuaternions(quaternionXYZ, quaternionX);
          }
          if (scope.axis === 'Y') {
            quaternionXYZ.multiplyQuaternions(quaternionXYZ, quaternionY);
          }
          if (scope.axis === 'Z') {
            quaternionXYZ.multiplyQuaternions(quaternionXYZ, quaternionZ);
          }

          scope.object.quaternion.copy(quaternionXYZ);

        } else if (scope.space === 'world') {

          rotation.set(Math.atan2(point.z, point.y), Math.atan2(point.x, point.z), Math.atan2(point.y, point.x));
          offsetRotation.set(Math.atan2(tempVector.z, tempVector.y), Math.atan2(tempVector.x, tempVector.z), Math.atan2(tempVector.y, tempVector.x));

          tempQuaternion.setFromRotationMatrix(tempMatrix.getInverse(parentRotationMatrix));

          quaternionX.setFromAxisAngle(unitX, rotation.x - offsetRotation.x);
          quaternionY.setFromAxisAngle(unitY, rotation.y - offsetRotation.y);
          quaternionZ.setFromAxisAngle(unitZ, rotation.z - offsetRotation.z);
          quaternionXYZ.setFromRotationMatrix(worldRotationMatrix);

          if (scope.axis === 'X') {
            tempQuaternion.multiplyQuaternions(tempQuaternion, quaternionX);
          }
          if (scope.axis === 'Y') {
            tempQuaternion.multiplyQuaternions(tempQuaternion, quaternionY);
          }
          if (scope.axis === 'Z') {
            tempQuaternion.multiplyQuaternions(tempQuaternion, quaternionZ);
          }

          tempQuaternion.multiplyQuaternions(tempQuaternion, quaternionXYZ);
          scope.object.quaternion.copy(tempQuaternion);
        }
      }
      scope.update();
      scope.dispatchEvent(changeEvent);
      scope.dispatchEvent(objectChangeEvent);
    }

    function onPointerUp(event) {
      if (event.button !== undefined && event.button !== 0) {
        return;
      }
      if (_dragging && (scope.axis !== null)) {
        mouseUpEvent.mode = _mode;
        scope.dispatchEvent(mouseUpEvent);
      }
      _dragging = false;
      onPointerHover(event);
    }

    function intersectObjects(pointer, objects) {
      var rect = domElement.getBoundingClientRect();
      var x = (pointer.clientX - rect.left) / rect.width;
      var y = (pointer.clientY - rect.top) / rect.height;

      pointerVector.set((x * 2) - 1, - (y * 2) + 1);
      ray.setFromCamera(pointerVector, camera);

      var intersections = ray.intersectObjects(objects, true);
      return intersections[0] ? intersections[0] : false;
    }

  };

  THREE.TransformControls.prototype = Object.create(THREE.Object3D.prototype);
  THREE.TransformControls.prototype.constructor = THREE.TransformControls;

}());
;'use strict';

var FOUR = FOUR || {};

/**
 * First person navigation controller. Uses keys to control movement in
 * cardinal directions. Assumes that +Z is up. Accepts a function that
 * maintains a minimum Z position.
 */
FOUR.WalkController = (function () {

    function WalkController (config) {
        THREE.EventDispatcher.call(this);
        config = config || {};
        var self = this;

        self.EVENT = {
            UPDATE: {type:'update'}
        };
        self.KEY = {
            CANCEL: 27,
            CTRL: 17,
            MOVE_TO_EYE_HEIGHT: 192,
            MOVE_FORWARD: 38,
            MOVE_LEFT: 37,
            MOVE_BACK: 40,
            MOVE_RIGHT: 39,
            MOVE_UP: 221,
            MOVE_DOWN: 219,
            ROTATE_LEFT: -1,
            ROTATE_RIGHT: -1
        };
        self.MOUSE_STATE = {
            DOWN: 0,
            UP: 1
        };
        self.SINGLE_CLICK_TIMEOUT = 400; // milliseconds

        self.camera = config.camera || config.viewport.camera;
        self.domElement = config.domElement || config.viewport.domElement;
        self.enabled = false;
        self.enforceWalkHeight = false;
        self.listeners = {};
        self.lookChange = false;
        self.lookSpeed = 0.85;
        self.modifiers = {
            'ALT': false,
            'CTRL': false,
            'SHIFT': false
        };
        self.mouse = {
            direction: new THREE.Vector2(),
            end: { x: 0, y: 0 },
            start: { x: 0, y: 0 },
            state: self.MOUSE_STATE.UP
        };
        self.move = {
            forward: false,
            backward: false,
            left: false,
            right: false,
            up: false,
            down: false
        };
        self.movementSpeed = 100.0;
        self.raycaster = new THREE.Raycaster();
        self.timeout = null;
        self.viewport = config.viewport;
        self.walkHeight = null;

        self.viewHalfX = self.domElement.offsetWidth / 2;
        self.viewHalfY = self.domElement.offsetHeight / 2;

        self.domElement.setAttribute('tabindex', -1);

        // done
        Object.keys(config).forEach(function (key) {
            self[key] = config[key];
        });
    }

    WalkController.prototype = Object.create(THREE.EventDispatcher.prototype);

    WalkController.prototype.constructor = WalkController;

    WalkController.prototype.WALK_HEIGHT = 2;

    WalkController.prototype.contextMenu = function (event) {
        event.preventDefault();
    };

    WalkController.prototype.disable = function () {
        var self = this;
        self.enabled = false;
        Object.keys(self.listeners).forEach(function (key) {
            var listener = self.listeners[key];
            listener.element.removeEventListener(listener.event, listener.fn);
        });
    };

    WalkController.prototype.emit = function (event) {
        this.dispatchEvent({type: event || 'update'});
    };

    WalkController.prototype.enable = function () {
        var self = this;
        function addListener(element, event, fn) {
            self.listeners[event] = {
                element: element,
                event: event,
                fn: fn.bind(self)
            };
            element.addEventListener(event, self.listeners[event].fn, false);
        }
        addListener(window, 'keydown', self.onKeyDown);
        addListener(window, 'keyup', self.onKeyUp);
        self.enabled = true;
        self.setWalkHeight();
    };

    /**
     * Get the walking height at the specified position.
     * @param {THREE.Vector3} position Camera position
     * @returns {THREE.Vector3} Position
     */
    WalkController.prototype.getWalkHeight = function (position) {
        return 0 + this.WALK_HEIGHT;
    };

    WalkController.prototype.onKeyDown = function (event) {
        var self = this;
        if (!self.enabled) {
            return;
        }
        switch(event.keyCode) {
            case self.KEY.CTRL:
                self.modifiers[self.KEY.CTRL] = true;
                break;
            case self.KEY.MOVE_TO_EYE_HEIGHT:
                self.setWalkHeight();
                break;
            case self.KEY.MOVE_FORWARD:
                self.move.forward = true;
                break;
            case self.KEY.MOVE_BACK:
                self.move.backward = true;
                break;
            case self.KEY.MOVE_LEFT:
                self.move.left = true;
                break;
            case self.KEY.MOVE_RIGHT:
                self.move.right = true;
                break;
            case self.KEY.MOVE_UP:
                self.move.up = true;
                break;
            case self.KEY.MOVE_DOWN:
                self.move.down = true;
                break;
        }
    };

    WalkController.prototype.onKeyUp = function (event) {
        var self = this;
        switch(event.keyCode) {
            case self.KEY.CTRL:
                self.modifiers[self.KEY.CTRL] = false;
                break;
            case self.KEY.MOVE_FORWARD:
                self.move.forward = false;
                break;
            case self.KEY.MOVE_BACK:
                self.move.backward = false;
                break;
            case self.KEY.MOVE_LEFT:
                self.move.left = false;
                break;
            case self.KEY.MOVE_RIGHT:
                self.move.right = false;
                break;
            case self.KEY.MOVE_UP:
                self.move.up = false;
                break;
            case self.KEY.MOVE_DOWN:
                self.move.down = false;
                break;
            case self.KEY.CANCEL:
                Object.keys(self.move).forEach(function (key) {
                    self.move[key] = false;
                });
                self.lookChange = false;
                break;
        }
    };

    WalkController.prototype.setWalkHeight = function () {
        var self = this;
        var pos = new THREE.Vector3(
          self.camera.position.x,
          self.camera.position.y,
          self.WALK_HEIGHT
        );
        var target = new THREE.Vector3(
          self.camera.target.x,
          self.camera.target.y,
          self.WALK_HEIGHT
        );
        return self.camera
          .resetOrientation(self.emit.bind(self))
          .then(function () {
            self.camera.setPositionAndTarget(pos, target);
        });
    };

    WalkController.prototype.update = function (delta) {
        var change = false, cross, distance, height, next, offset, self = this;
        if (!self.enabled) {
            return;
        }
        distance = delta * self.movementSpeed;
        offset = new THREE.Vector3().subVectors(self.camera.position, self.camera.target);
        offset.setLength(distance);
        cross = new THREE.Vector3().crossVectors(offset, self.camera.up);

        // translate the camera
        if (self.move.forward) {
            offset.negate();
            next = new THREE.Vector3().addVectors(self.camera.position, offset);
            self.camera.position.copy(next);
            next = new THREE.Vector3().addVectors(self.camera.target, offset);
            self.camera.target.copy(next);
            change = true;
        }
        if (self.move.backward) {
            next = new THREE.Vector3().addVectors(self.camera.position, offset);
            self.camera.position.copy(next);
            next = new THREE.Vector3().addVectors(self.camera.target, offset);
            self.camera.target.copy(next);
            change = true;
        }
        if (self.move.right) {
            cross.negate();
            next = new THREE.Vector3().addVectors(self.camera.position, cross);
            self.camera.position.copy(next);
            next = new THREE.Vector3().addVectors(self.camera.target, cross);
            self.camera.target.copy(next);
            change = true;
        }
        if (self.move.left) {
            next = new THREE.Vector3().addVectors(self.camera.position, cross);
            self.camera.position.copy(next);
            next = new THREE.Vector3().addVectors(self.camera.target, cross);
            self.camera.target.copy(next);
            change = true;
        }
        if (self.move.up) {
            offset = new THREE.Vector3().copy(self.camera.up);
            offset.setLength(distance);
            next = new THREE.Vector3().addVectors(self.camera.position, offset);
            self.camera.position.copy(next);
            next = new THREE.Vector3().addVectors(self.camera.target, offset);
            self.camera.target.copy(next);
            change = true;
        }
        if (self.move.down) {
            height = self.getWalkHeight(self.camera.position);
            offset = new THREE.Vector3().copy(self.camera.up).negate();
            offset.setLength(distance);
            next = new THREE.Vector3().addVectors(self.camera.position, offset);
            next.z = next.z < height ? height : next.z;
            self.camera.position.copy(next);
            next = new THREE.Vector3().addVectors(self.camera.target, offset);
            next.z = next.z < height ? height : next.z;
            self.camera.target.copy(next);
            change = true;
        }

        if (change) {
            self.dispatchEvent(self.EVENT.UPDATE);
        }
    };

    return WalkController;

}());
;'use strict';

var FOUR = FOUR || {};

/**
 * Camera zoom controller. Zooming can be performed using mouse wheel rotation
 * or the combination of a keypress, left mouse button down and mouse move.
 * Zooming is clamped to a maximum and minimum zoom distance when using a
 * FOUR.TargetCamera.
 */
FOUR.ZoomController = (function () {

    function ZoomController (config) {
        THREE.EventDispatcher.call(this);
        config = config || {};
        var self = this;

        self.CURSOR = {
            DEFAULT: 'default',
            ZOOM: 'ns-resize'
        };
        self.EPS = 0.000001;
        self.EVENT = {
            UPDATE: {type: 'update'}
        };
        self.KEY = {
            ZOOM: 16
        };
        self.MOUSE_STATE = {
            UP: 0,
            DOWN: 1
        };

        self.camera = config.camera || config.viewport.camera;
        self.domElement = config.domElement || config.viewport.domElement;
        self.dragZoomSpeed = 1.2;
        self.enabled = false;
        self.keydown = false;
        self.listeners = {};
        self.maxDistance = Infinity;
        self.minDistance = 1;
        self.mouse = self.MOUSE_STATE.UP;
        self.timeout = null;
        self.viewport = config.viewport;
        self.wheelZoomSpeed = 500;
        self.zoom = {
            delta: 0,
            end: new THREE.Vector2(),
            start: new THREE.Vector2()
        };

        Object.keys(config).forEach(function (key) {
           self[key] = config[key];
        });
    }

    ZoomController.prototype = Object.create(THREE.EventDispatcher.prototype);

    ZoomController.prototype.disable = function () {
        var self = this;
        self.enabled = false;
        Object.keys(self.listeners).forEach(function (key) {
            var listener = self.listeners[key];
            listener.element.removeEventListener(listener.event, listener.fn);
        });
    };

    ZoomController.prototype.enable = function () {
        var self = this;
        function addListener(element, event, fn) {
            self.listeners[event] = {
                element: element,
                event: event,
                fn: fn.bind(self)
            };
            element.addEventListener(event, self.listeners[event].fn, false);
        }
        addListener(self.domElement, 'contextmenu', self.onContextMenu);
        addListener(self.domElement, 'mousedown', self.onMouseDown);
        addListener(self.domElement, 'mousemove', self.onMouseMove);
        addListener(self.domElement, 'mouseup', self.onMouseUp);
        addListener(self.domElement, 'mousewheel', self.onMouseWheel);
        addListener(self.domElement, 'DOMMouseScroll', self.onMouseWheel);
        addListener(window, 'keydown', self.onKeyDown);
        addListener(window, 'keyup', self.onKeyUp);
        self.enabled = true;
    };

    ZoomController.prototype.onContextMenu = function (event) {
        event.preventDefault();
    };

    ZoomController.prototype.onKeyDown = function (event) {
        if (event.keyCode === this.KEY.ZOOM) {
            this.keydown = true;
        }
    };

    ZoomController.prototype.onKeyUp = function (event) {
        if (event.keyCode === this.KEY.ZOOM) {
            this.keydown = false;
        }
    };

    ZoomController.prototype.onMouseDown = function (event) {
        event.preventDefault();
        if (this.keydown && event.button === THREE.MOUSE.LEFT) {
            this.domElement.style.cursor = this.CURSOR.ZOOM;
            this.mouse = this.MOUSE_STATE.DOWN;
            this.zoom.end.set(0,0);
            this.zoom.start.set(event.offsetX, event.offsetY);
        }
    };

    ZoomController.prototype.onMouseMove = function (event) {
        event.preventDefault();
        if (this.keydown && event.button === THREE.MOUSE.LEFT && this.mouse === this.MOUSE_STATE.DOWN) {
            this.zoom.end.copy(this.zoom.start);
            this.zoom.start.set(event.offsetX, event.offsetY);
            this.zoom.delta = -((this.zoom.end.y - this.zoom.start.y) / this.domElement.clientHeight) * this.wheelZoomSpeed;
        }
    };

    ZoomController.prototype.onMouseUp = function (event) {
        event.preventDefault();
        if (event.button === THREE.MOUSE.LEFT) {
            this.domElement.style.cursor = this.CURSOR.DEFAULT;
            this.mouse = this.MOUSE_STATE.UP;
            this.zoom.delta = 0;
        }
    };

    /**
     * Zoom the camera in or out using the mouse wheel as input.
     * @param {Object} event Mouse event
     */
    ZoomController.prototype.onMouseWheel = function (event) {
        var self = this;
        if (self.enabled === false) {
            return;
        }
        event.preventDefault();
        if (event.wheelDeltaY) {
            // WebKit / Opera / Explorer 9
            self.zoom.delta = event.wheelDeltaY / 40;
        } else if (event.detail) {
            // Firefox
            self.zoom.delta = - event.detail / 3;
        } else {
            self.zoom.delta = 0;
        }
        // show the move cursor
        self.domElement.style.cursor = self.CURSOR.ZOOM;
        if (self.timeout !== null) {
            clearTimeout(self.timeout);
            self.timeout = setTimeout(function () {
                self.domElement.style.cursor = self.CURSOR.DEFAULT;
                self.timeout = null;
            }, 250);
        }
        self.dispatchEvent(self.EVENT.UPDATE);
    };

    ZoomController.prototype.update = function () {
        var distance, lookAt, self = this;
        if (self.enabled === false) {
            return;
        }
        if (self.zoom.delta !== 0) {
            if (self.camera instanceof FOUR.TargetCamera) {
                distance = self.camera.getDistance() + (-self.zoom.delta * self.dragZoomSpeed);
                distance = distance < self.minDistance ? self.minDistance : distance;
                if (Math.abs(distance) > self.EPS) {
                    self.camera.setDistance(distance);
                    self.dispatchEvent(self.EVENT.UPDATE);
                }
            } else if (self.camera instanceof THREE.PerspectiveCamera) {
                lookAt = new THREE.Vector3(0, 0, -1).applyQuaternion(self.camera.quaternion);
                distance = self.zoom.delta * self.dragZoomSpeed;
                if (Math.abs(distance) > self.EPS) {
                    lookAt.setLength(distance);
                    self.camera.position.add(lookAt);
                    self.dispatchEvent(self.EVENT.UPDATE);
                }
            }
            self.zoom.delta = 0; // consume the change
        }
    };

    return ZoomController;

}());
;if (_typeface_js && _typeface_js.loadFace) _typeface_js.loadFace({"glyphs":{"ο":{"x_min":0,"x_max":712,"ha":815,"o":"m 356 -25 q 96 88 192 -25 q 0 368 0 201 q 92 642 0 533 q 356 761 192 761 q 617 644 517 761 q 712 368 712 533 q 619 91 712 201 q 356 -25 520 -25 m 356 85 q 527 175 465 85 q 583 369 583 255 q 528 562 583 484 q 356 651 466 651 q 189 560 250 651 q 135 369 135 481 q 187 177 135 257 q 356 85 250 85 "},"S":{"x_min":0,"x_max":788,"ha":890,"o":"m 788 291 q 662 54 788 144 q 397 -26 550 -26 q 116 68 226 -26 q 0 337 0 168 l 131 337 q 200 152 131 220 q 384 85 269 85 q 557 129 479 85 q 650 270 650 183 q 490 429 650 379 q 194 513 341 470 q 33 739 33 584 q 142 964 33 881 q 388 1041 242 1041 q 644 957 543 1041 q 756 716 756 867 l 625 716 q 561 874 625 816 q 395 933 497 933 q 243 891 309 933 q 164 759 164 841 q 325 609 164 656 q 625 526 475 568 q 788 291 788 454 "},"¦":{"x_min":343,"x_max":449,"ha":792,"o":"m 449 462 l 343 462 l 343 986 l 449 986 l 449 462 m 449 -242 l 343 -242 l 343 280 l 449 280 l 449 -242 "},"/":{"x_min":183.25,"x_max":608.328125,"ha":792,"o":"m 608 1041 l 266 -129 l 183 -129 l 520 1041 l 608 1041 "},"Τ":{"x_min":-0.4375,"x_max":777.453125,"ha":839,"o":"m 777 893 l 458 893 l 458 0 l 319 0 l 319 892 l 0 892 l 0 1013 l 777 1013 l 777 893 "},"y":{"x_min":0,"x_max":684.78125,"ha":771,"o":"m 684 738 l 388 -83 q 311 -216 356 -167 q 173 -279 252 -279 q 97 -266 133 -279 l 97 -149 q 132 -155 109 -151 q 168 -160 155 -160 q 240 -114 213 -160 q 274 -26 248 -98 l 0 738 l 137 737 l 341 139 l 548 737 l 684 738 "},"Π":{"x_min":0,"x_max":803,"ha":917,"o":"m 803 0 l 667 0 l 667 886 l 140 886 l 140 0 l 0 0 l 0 1012 l 803 1012 l 803 0 "},"ΐ":{"x_min":-111,"x_max":339,"ha":361,"o":"m 339 800 l 229 800 l 229 925 l 339 925 l 339 800 m -1 800 l -111 800 l -111 925 l -1 925 l -1 800 m 284 3 q 233 -10 258 -5 q 182 -15 207 -15 q 85 26 119 -15 q 42 200 42 79 l 42 737 l 167 737 l 168 215 q 172 141 168 157 q 226 101 183 101 q 248 103 239 101 q 284 112 257 104 l 284 3 m 302 1040 l 113 819 l 30 819 l 165 1040 l 302 1040 "},"g":{"x_min":0,"x_max":686,"ha":838,"o":"m 686 34 q 586 -213 686 -121 q 331 -306 487 -306 q 131 -252 216 -306 q 31 -84 31 -190 l 155 -84 q 228 -174 166 -138 q 345 -207 284 -207 q 514 -109 454 -207 q 564 89 564 -27 q 461 6 521 36 q 335 -23 401 -23 q 88 100 184 -23 q 0 370 0 215 q 87 634 0 522 q 330 758 183 758 q 457 728 398 758 q 564 644 515 699 l 564 737 l 686 737 l 686 34 m 582 367 q 529 560 582 481 q 358 652 468 652 q 189 561 250 652 q 135 369 135 482 q 189 176 135 255 q 361 85 251 85 q 529 176 468 85 q 582 367 582 255 "},"²":{"x_min":0,"x_max":442,"ha":539,"o":"m 442 383 l 0 383 q 91 566 0 492 q 260 668 176 617 q 354 798 354 727 q 315 875 354 845 q 227 905 277 905 q 136 869 173 905 q 99 761 99 833 l 14 761 q 82 922 14 864 q 232 974 141 974 q 379 926 316 974 q 442 797 442 878 q 351 635 442 704 q 183 539 321 611 q 92 455 92 491 l 442 455 l 442 383 "},"–":{"x_min":0,"x_max":705.5625,"ha":803,"o":"m 705 334 l 0 334 l 0 410 l 705 410 l 705 334 "},"Κ":{"x_min":0,"x_max":819.5625,"ha":893,"o":"m 819 0 l 650 0 l 294 509 l 139 356 l 139 0 l 0 0 l 0 1013 l 139 1013 l 139 526 l 626 1013 l 809 1013 l 395 600 l 819 0 "},"ƒ":{"x_min":-46.265625,"x_max":392,"ha":513,"o":"m 392 651 l 259 651 l 79 -279 l -46 -278 l 134 651 l 14 651 l 14 751 l 135 751 q 151 948 135 900 q 304 1041 185 1041 q 334 1040 319 1041 q 392 1034 348 1039 l 392 922 q 337 931 360 931 q 271 883 287 931 q 260 793 260 853 l 260 751 l 392 751 l 392 651 "},"e":{"x_min":0,"x_max":714,"ha":813,"o":"m 714 326 l 140 326 q 200 157 140 227 q 359 87 260 87 q 488 130 431 87 q 561 245 545 174 l 697 245 q 577 48 670 123 q 358 -26 484 -26 q 97 85 195 -26 q 0 363 0 197 q 94 642 0 529 q 358 765 195 765 q 626 627 529 765 q 714 326 714 503 m 576 429 q 507 583 564 522 q 355 650 445 650 q 206 583 266 650 q 140 429 152 522 l 576 429 "},"ό":{"x_min":0,"x_max":712,"ha":815,"o":"m 356 -25 q 94 91 194 -25 q 0 368 0 202 q 92 642 0 533 q 356 761 192 761 q 617 644 517 761 q 712 368 712 533 q 619 91 712 201 q 356 -25 520 -25 m 356 85 q 527 175 465 85 q 583 369 583 255 q 528 562 583 484 q 356 651 466 651 q 189 560 250 651 q 135 369 135 481 q 187 177 135 257 q 356 85 250 85 m 576 1040 l 387 819 l 303 819 l 438 1040 l 576 1040 "},"J":{"x_min":0,"x_max":588,"ha":699,"o":"m 588 279 q 287 -26 588 -26 q 58 73 126 -26 q 0 327 0 158 l 133 327 q 160 172 133 227 q 288 96 198 96 q 426 171 391 96 q 449 336 449 219 l 449 1013 l 588 1013 l 588 279 "},"»":{"x_min":-1,"x_max":503,"ha":601,"o":"m 503 302 l 280 136 l 281 256 l 429 373 l 281 486 l 280 608 l 503 440 l 503 302 m 221 302 l 0 136 l 0 255 l 145 372 l 0 486 l -1 608 l 221 440 l 221 302 "},"©":{"x_min":-3,"x_max":1008,"ha":1106,"o":"m 502 -7 q 123 151 263 -7 q -3 501 -3 294 q 123 851 -3 706 q 502 1011 263 1011 q 881 851 739 1011 q 1008 501 1008 708 q 883 151 1008 292 q 502 -7 744 -7 m 502 60 q 830 197 709 60 q 940 501 940 322 q 831 805 940 681 q 502 944 709 944 q 174 805 296 944 q 65 501 65 680 q 173 197 65 320 q 502 60 294 60 m 741 394 q 661 246 731 302 q 496 190 591 190 q 294 285 369 190 q 228 497 228 370 q 295 714 228 625 q 499 813 370 813 q 656 762 588 813 q 733 625 724 711 l 634 625 q 589 704 629 673 q 498 735 550 735 q 377 666 421 735 q 334 504 334 597 q 374 340 334 408 q 490 272 415 272 q 589 304 549 272 q 638 394 628 337 l 741 394 "},"ώ":{"x_min":0,"x_max":922,"ha":1030,"o":"m 687 1040 l 498 819 l 415 819 l 549 1040 l 687 1040 m 922 339 q 856 97 922 203 q 650 -26 780 -26 q 538 9 587 -26 q 461 103 489 44 q 387 12 436 46 q 277 -22 339 -22 q 69 97 147 -22 q 0 338 0 202 q 45 551 0 444 q 161 737 84 643 l 302 737 q 175 552 219 647 q 124 336 124 446 q 155 179 124 248 q 275 88 197 88 q 375 163 341 88 q 400 294 400 219 l 400 572 l 524 572 l 524 294 q 561 135 524 192 q 643 88 591 88 q 762 182 719 88 q 797 341 797 257 q 745 555 797 450 q 619 737 705 637 l 760 737 q 874 551 835 640 q 922 339 922 444 "},"^":{"x_min":193.0625,"x_max":598.609375,"ha":792,"o":"m 598 772 l 515 772 l 395 931 l 277 772 l 193 772 l 326 1013 l 462 1013 l 598 772 "},"«":{"x_min":0,"x_max":507.203125,"ha":604,"o":"m 506 136 l 284 302 l 284 440 l 506 608 l 507 485 l 360 371 l 506 255 l 506 136 m 222 136 l 0 302 l 0 440 l 222 608 l 221 486 l 73 373 l 222 256 l 222 136 "},"D":{"x_min":0,"x_max":828,"ha":935,"o":"m 389 1013 q 714 867 593 1013 q 828 521 828 729 q 712 161 828 309 q 382 0 587 0 l 0 0 l 0 1013 l 389 1013 m 376 124 q 607 247 523 124 q 681 510 681 355 q 607 771 681 662 q 376 896 522 896 l 139 896 l 139 124 l 376 124 "},"∙":{"x_min":0,"x_max":142,"ha":239,"o":"m 142 585 l 0 585 l 0 738 l 142 738 l 142 585 "},"ÿ":{"x_min":0,"x_max":47,"ha":125,"o":"m 47 3 q 37 -7 47 -7 q 28 0 30 -7 q 39 -4 32 -4 q 45 3 45 -1 l 37 0 q 28 9 28 0 q 39 19 28 19 l 47 16 l 47 19 l 47 3 m 37 1 q 44 8 44 1 q 37 16 44 16 q 30 8 30 16 q 37 1 30 1 m 26 1 l 23 22 l 14 0 l 3 22 l 3 3 l 0 25 l 13 1 l 22 25 l 26 1 "},"w":{"x_min":0,"x_max":1009.71875,"ha":1100,"o":"m 1009 738 l 783 0 l 658 0 l 501 567 l 345 0 l 222 0 l 0 738 l 130 738 l 284 174 l 432 737 l 576 738 l 721 173 l 881 737 l 1009 738 "},"$":{"x_min":0,"x_max":700,"ha":793,"o":"m 664 717 l 542 717 q 490 825 531 785 q 381 872 450 865 l 381 551 q 620 446 540 522 q 700 241 700 370 q 618 45 700 116 q 381 -25 536 -25 l 381 -152 l 307 -152 l 307 -25 q 81 62 162 -25 q 0 297 0 149 l 124 297 q 169 146 124 204 q 307 81 215 89 l 307 441 q 80 536 148 469 q 13 725 13 603 q 96 910 13 839 q 307 982 180 982 l 307 1077 l 381 1077 l 381 982 q 574 917 494 982 q 664 717 664 845 m 307 565 l 307 872 q 187 831 233 872 q 142 724 142 791 q 180 618 142 656 q 307 565 218 580 m 381 76 q 562 237 562 96 q 517 361 562 313 q 381 423 472 409 l 381 76 "},"\\":{"x_min":-0.015625,"x_max":425.0625,"ha":522,"o":"m 425 -129 l 337 -129 l 0 1041 l 83 1041 l 425 -129 "},"µ":{"x_min":0,"x_max":697.21875,"ha":747,"o":"m 697 -4 q 629 -14 658 -14 q 498 97 513 -14 q 422 9 470 41 q 313 -23 374 -23 q 207 4 258 -23 q 119 81 156 32 l 119 -278 l 0 -278 l 0 738 l 124 738 l 124 343 q 165 173 124 246 q 308 83 216 83 q 452 178 402 83 q 493 359 493 255 l 493 738 l 617 738 l 617 214 q 623 136 617 160 q 673 92 637 92 q 697 96 684 92 l 697 -4 "},"Ι":{"x_min":42,"x_max":181,"ha":297,"o":"m 181 0 l 42 0 l 42 1013 l 181 1013 l 181 0 "},"Ύ":{"x_min":0,"x_max":1144.5,"ha":1214,"o":"m 1144 1012 l 807 416 l 807 0 l 667 0 l 667 416 l 325 1012 l 465 1012 l 736 533 l 1004 1012 l 1144 1012 m 277 1040 l 83 799 l 0 799 l 140 1040 l 277 1040 "},"’":{"x_min":0,"x_max":139,"ha":236,"o":"m 139 851 q 102 737 139 784 q 0 669 65 690 l 0 734 q 59 787 42 741 q 72 873 72 821 l 0 873 l 0 1013 l 139 1013 l 139 851 "},"Ν":{"x_min":0,"x_max":801,"ha":915,"o":"m 801 0 l 651 0 l 131 822 l 131 0 l 0 0 l 0 1013 l 151 1013 l 670 191 l 670 1013 l 801 1013 l 801 0 "},"-":{"x_min":8.71875,"x_max":350.390625,"ha":478,"o":"m 350 317 l 8 317 l 8 428 l 350 428 l 350 317 "},"Q":{"x_min":0,"x_max":968,"ha":1072,"o":"m 954 5 l 887 -79 l 744 35 q 622 -11 687 2 q 483 -26 556 -26 q 127 130 262 -26 q 0 504 0 279 q 127 880 0 728 q 484 1041 262 1041 q 841 884 708 1041 q 968 507 968 735 q 933 293 968 398 q 832 104 899 188 l 954 5 m 723 191 q 802 330 777 248 q 828 499 828 412 q 744 790 828 673 q 483 922 650 922 q 228 791 322 922 q 142 505 142 673 q 227 221 142 337 q 487 91 323 91 q 632 123 566 91 l 520 215 l 587 301 l 723 191 "},"ς":{"x_min":1,"x_max":676.28125,"ha":740,"o":"m 676 460 l 551 460 q 498 595 542 546 q 365 651 448 651 q 199 578 263 651 q 136 401 136 505 q 266 178 136 241 q 508 106 387 142 q 640 -50 640 62 q 625 -158 640 -105 q 583 -278 611 -211 l 465 -278 q 498 -182 490 -211 q 515 -80 515 -126 q 381 12 515 -15 q 134 91 197 51 q 1 388 1 179 q 100 651 1 542 q 354 761 199 761 q 587 680 498 761 q 676 460 676 599 "},"M":{"x_min":0,"x_max":954,"ha":1067,"o":"m 954 0 l 819 0 l 819 869 l 537 0 l 405 0 l 128 866 l 128 0 l 0 0 l 0 1013 l 200 1013 l 472 160 l 757 1013 l 954 1013 l 954 0 "},"Ψ":{"x_min":0,"x_max":1006,"ha":1094,"o":"m 1006 678 q 914 319 1006 429 q 571 200 814 200 l 571 0 l 433 0 l 433 200 q 92 319 194 200 q 0 678 0 429 l 0 1013 l 139 1013 l 139 679 q 191 417 139 492 q 433 326 255 326 l 433 1013 l 571 1013 l 571 326 l 580 326 q 813 423 747 326 q 868 679 868 502 l 868 1013 l 1006 1013 l 1006 678 "},"C":{"x_min":0,"x_max":886,"ha":944,"o":"m 886 379 q 760 87 886 201 q 455 -26 634 -26 q 112 136 236 -26 q 0 509 0 283 q 118 882 0 737 q 469 1041 245 1041 q 748 955 630 1041 q 879 708 879 859 l 745 708 q 649 862 724 805 q 473 920 573 920 q 219 791 312 920 q 136 509 136 675 q 217 229 136 344 q 470 99 311 99 q 672 179 591 99 q 753 379 753 259 l 886 379 "},"!":{"x_min":0,"x_max":138,"ha":236,"o":"m 138 684 q 116 409 138 629 q 105 244 105 299 l 33 244 q 16 465 33 313 q 0 684 0 616 l 0 1013 l 138 1013 l 138 684 m 138 0 l 0 0 l 0 151 l 138 151 l 138 0 "},"{":{"x_min":0,"x_max":480.5625,"ha":578,"o":"m 480 -286 q 237 -213 303 -286 q 187 -45 187 -159 q 194 48 187 -15 q 201 141 201 112 q 164 264 201 225 q 0 314 118 314 l 0 417 q 164 471 119 417 q 201 605 201 514 q 199 665 201 644 q 193 772 193 769 q 241 941 193 887 q 480 1015 308 1015 l 480 915 q 336 866 375 915 q 306 742 306 828 q 310 662 306 717 q 314 577 314 606 q 288 452 314 500 q 176 365 256 391 q 289 275 257 337 q 314 143 314 226 q 313 84 314 107 q 310 -11 310 -5 q 339 -131 310 -94 q 480 -182 377 -182 l 480 -286 "},"X":{"x_min":-0.015625,"x_max":854.15625,"ha":940,"o":"m 854 0 l 683 0 l 423 409 l 166 0 l 0 0 l 347 519 l 18 1013 l 186 1013 l 428 637 l 675 1013 l 836 1013 l 504 520 l 854 0 "},"#":{"x_min":0,"x_max":963.890625,"ha":1061,"o":"m 963 690 l 927 590 l 719 590 l 655 410 l 876 410 l 840 310 l 618 310 l 508 -3 l 393 -2 l 506 309 l 329 310 l 215 -2 l 102 -3 l 212 310 l 0 310 l 36 410 l 248 409 l 312 590 l 86 590 l 120 690 l 347 690 l 459 1006 l 573 1006 l 462 690 l 640 690 l 751 1006 l 865 1006 l 754 690 l 963 690 m 606 590 l 425 590 l 362 410 l 543 410 l 606 590 "},"ι":{"x_min":42,"x_max":284,"ha":361,"o":"m 284 3 q 233 -10 258 -5 q 182 -15 207 -15 q 85 26 119 -15 q 42 200 42 79 l 42 738 l 167 738 l 168 215 q 172 141 168 157 q 226 101 183 101 q 248 103 239 101 q 284 112 257 104 l 284 3 "},"Ά":{"x_min":0,"x_max":906.953125,"ha":982,"o":"m 283 1040 l 88 799 l 5 799 l 145 1040 l 283 1040 m 906 0 l 756 0 l 650 303 l 251 303 l 143 0 l 0 0 l 376 1012 l 529 1012 l 906 0 m 609 421 l 452 866 l 293 421 l 609 421 "},")":{"x_min":0,"x_max":318,"ha":415,"o":"m 318 365 q 257 25 318 191 q 87 -290 197 -141 l 0 -290 q 140 21 93 -128 q 193 360 193 189 q 141 704 193 537 q 0 1024 97 850 l 87 1024 q 257 706 197 871 q 318 365 318 542 "},"ε":{"x_min":0,"x_max":634.71875,"ha":714,"o":"m 634 234 q 527 38 634 110 q 300 -25 433 -25 q 98 29 183 -25 q 0 204 0 93 q 37 314 0 265 q 128 390 67 353 q 56 460 82 419 q 26 555 26 505 q 114 712 26 654 q 295 763 191 763 q 499 700 416 763 q 589 515 589 631 l 478 515 q 419 618 464 580 q 307 657 374 657 q 207 630 253 657 q 151 547 151 598 q 238 445 151 469 q 389 434 280 434 l 389 331 l 349 331 q 206 315 255 331 q 125 210 125 287 q 183 107 125 145 q 302 76 233 76 q 436 117 379 76 q 509 234 493 159 l 634 234 "},"Δ":{"x_min":0,"x_max":952.78125,"ha":1028,"o":"m 952 0 l 0 0 l 400 1013 l 551 1013 l 952 0 m 762 124 l 476 867 l 187 124 l 762 124 "},"}":{"x_min":0,"x_max":481,"ha":578,"o":"m 481 314 q 318 262 364 314 q 282 136 282 222 q 284 65 282 97 q 293 -58 293 -48 q 241 -217 293 -166 q 0 -286 174 -286 l 0 -182 q 143 -130 105 -182 q 171 -2 171 -93 q 168 81 171 22 q 165 144 165 140 q 188 275 165 229 q 306 365 220 339 q 191 455 224 391 q 165 588 165 505 q 168 681 165 624 q 171 742 171 737 q 141 865 171 827 q 0 915 102 915 l 0 1015 q 243 942 176 1015 q 293 773 293 888 q 287 675 293 741 q 282 590 282 608 q 318 466 282 505 q 481 417 364 417 l 481 314 "},"‰":{"x_min":-3,"x_max":1672,"ha":1821,"o":"m 846 0 q 664 76 732 0 q 603 244 603 145 q 662 412 603 344 q 846 489 729 489 q 1027 412 959 489 q 1089 244 1089 343 q 1029 76 1089 144 q 846 0 962 0 m 845 103 q 945 143 910 103 q 981 243 981 184 q 947 340 981 301 q 845 385 910 385 q 745 342 782 385 q 709 243 709 300 q 742 147 709 186 q 845 103 781 103 m 888 986 l 284 -25 l 199 -25 l 803 986 l 888 986 m 241 468 q 58 545 126 468 q -3 715 -3 615 q 56 881 -3 813 q 238 958 124 958 q 421 881 353 958 q 483 712 483 813 q 423 544 483 612 q 241 468 356 468 m 241 855 q 137 811 175 855 q 100 710 100 768 q 136 612 100 653 q 240 572 172 572 q 344 614 306 572 q 382 713 382 656 q 347 810 382 771 q 241 855 308 855 m 1428 0 q 1246 76 1314 0 q 1185 244 1185 145 q 1244 412 1185 344 q 1428 489 1311 489 q 1610 412 1542 489 q 1672 244 1672 343 q 1612 76 1672 144 q 1428 0 1545 0 m 1427 103 q 1528 143 1492 103 q 1564 243 1564 184 q 1530 340 1564 301 q 1427 385 1492 385 q 1327 342 1364 385 q 1291 243 1291 300 q 1324 147 1291 186 q 1427 103 1363 103 "},"a":{"x_min":0,"x_max":698.609375,"ha":794,"o":"m 698 0 q 661 -12 679 -7 q 615 -17 643 -17 q 536 12 564 -17 q 500 96 508 41 q 384 6 456 37 q 236 -25 312 -25 q 65 31 130 -25 q 0 194 0 88 q 118 390 0 334 q 328 435 180 420 q 488 483 476 451 q 495 523 495 504 q 442 619 495 584 q 325 654 389 654 q 209 617 257 654 q 152 513 161 580 l 33 513 q 123 705 33 633 q 332 772 207 772 q 528 712 448 772 q 617 531 617 645 l 617 163 q 624 108 617 126 q 664 90 632 90 l 698 94 l 698 0 m 491 262 l 491 372 q 272 329 350 347 q 128 201 128 294 q 166 113 128 144 q 264 83 205 83 q 414 130 346 83 q 491 262 491 183 "},"—":{"x_min":0,"x_max":941.671875,"ha":1039,"o":"m 941 334 l 0 334 l 0 410 l 941 410 l 941 334 "},"=":{"x_min":8.71875,"x_max":780.953125,"ha":792,"o":"m 780 510 l 8 510 l 8 606 l 780 606 l 780 510 m 780 235 l 8 235 l 8 332 l 780 332 l 780 235 "},"N":{"x_min":0,"x_max":801,"ha":914,"o":"m 801 0 l 651 0 l 131 823 l 131 0 l 0 0 l 0 1013 l 151 1013 l 670 193 l 670 1013 l 801 1013 l 801 0 "},"ρ":{"x_min":0,"x_max":712,"ha":797,"o":"m 712 369 q 620 94 712 207 q 362 -26 521 -26 q 230 2 292 -26 q 119 83 167 30 l 119 -278 l 0 -278 l 0 362 q 91 643 0 531 q 355 764 190 764 q 617 647 517 764 q 712 369 712 536 m 583 366 q 530 559 583 480 q 359 651 469 651 q 190 562 252 651 q 135 370 135 483 q 189 176 135 257 q 359 85 250 85 q 528 175 466 85 q 583 366 583 254 "},"2":{"x_min":59,"x_max":731,"ha":792,"o":"m 731 0 l 59 0 q 197 314 59 188 q 457 487 199 315 q 598 691 598 580 q 543 819 598 772 q 411 867 488 867 q 272 811 328 867 q 209 630 209 747 l 81 630 q 182 901 81 805 q 408 986 271 986 q 629 909 536 986 q 731 694 731 826 q 613 449 731 541 q 378 316 495 383 q 201 122 235 234 l 731 122 l 731 0 "},"¯":{"x_min":0,"x_max":941.671875,"ha":938,"o":"m 941 1033 l 0 1033 l 0 1109 l 941 1109 l 941 1033 "},"Z":{"x_min":0,"x_max":779,"ha":849,"o":"m 779 0 l 0 0 l 0 113 l 621 896 l 40 896 l 40 1013 l 779 1013 l 778 887 l 171 124 l 779 124 l 779 0 "},"u":{"x_min":0,"x_max":617,"ha":729,"o":"m 617 0 l 499 0 l 499 110 q 391 10 460 45 q 246 -25 322 -25 q 61 58 127 -25 q 0 258 0 136 l 0 738 l 125 738 l 125 284 q 156 148 125 202 q 273 82 197 82 q 433 165 369 82 q 493 340 493 243 l 493 738 l 617 738 l 617 0 "},"k":{"x_min":0,"x_max":612.484375,"ha":697,"o":"m 612 738 l 338 465 l 608 0 l 469 0 l 251 382 l 121 251 l 121 0 l 0 0 l 0 1013 l 121 1013 l 121 402 l 456 738 l 612 738 "},"Η":{"x_min":0,"x_max":803,"ha":917,"o":"m 803 0 l 667 0 l 667 475 l 140 475 l 140 0 l 0 0 l 0 1013 l 140 1013 l 140 599 l 667 599 l 667 1013 l 803 1013 l 803 0 "},"Α":{"x_min":0,"x_max":906.953125,"ha":985,"o":"m 906 0 l 756 0 l 650 303 l 251 303 l 143 0 l 0 0 l 376 1013 l 529 1013 l 906 0 m 609 421 l 452 866 l 293 421 l 609 421 "},"s":{"x_min":0,"x_max":604,"ha":697,"o":"m 604 217 q 501 36 604 104 q 292 -23 411 -23 q 86 43 166 -23 q 0 238 0 114 l 121 237 q 175 122 121 164 q 300 85 223 85 q 415 112 363 85 q 479 207 479 147 q 361 309 479 276 q 140 372 141 370 q 21 544 21 426 q 111 708 21 647 q 298 761 190 761 q 492 705 413 761 q 583 531 583 643 l 462 531 q 412 625 462 594 q 298 657 363 657 q 199 636 242 657 q 143 558 143 608 q 262 454 143 486 q 484 394 479 397 q 604 217 604 341 "},"B":{"x_min":0,"x_max":778,"ha":876,"o":"m 580 546 q 724 469 670 535 q 778 311 778 403 q 673 83 778 171 q 432 0 575 0 l 0 0 l 0 1013 l 411 1013 q 629 957 541 1013 q 732 768 732 892 q 691 633 732 693 q 580 546 650 572 m 393 899 l 139 899 l 139 588 l 379 588 q 521 624 462 588 q 592 744 592 667 q 531 859 592 819 q 393 899 471 899 m 419 124 q 566 169 504 124 q 635 303 635 219 q 559 436 635 389 q 402 477 494 477 l 139 477 l 139 124 l 419 124 "},"…":{"x_min":0,"x_max":614,"ha":708,"o":"m 142 0 l 0 0 l 0 151 l 142 151 l 142 0 m 378 0 l 236 0 l 236 151 l 378 151 l 378 0 m 614 0 l 472 0 l 472 151 l 614 151 l 614 0 "},"?":{"x_min":0,"x_max":607,"ha":704,"o":"m 607 777 q 543 599 607 674 q 422 474 482 537 q 357 272 357 391 l 236 272 q 297 487 236 395 q 411 619 298 490 q 474 762 474 691 q 422 885 474 838 q 301 933 371 933 q 179 880 228 933 q 124 706 124 819 l 0 706 q 94 963 0 872 q 302 1044 177 1044 q 511 973 423 1044 q 607 777 607 895 m 370 0 l 230 0 l 230 151 l 370 151 l 370 0 "},"H":{"x_min":0,"x_max":803,"ha":915,"o":"m 803 0 l 667 0 l 667 475 l 140 475 l 140 0 l 0 0 l 0 1013 l 140 1013 l 140 599 l 667 599 l 667 1013 l 803 1013 l 803 0 "},"ν":{"x_min":0,"x_max":675,"ha":761,"o":"m 675 738 l 404 0 l 272 0 l 0 738 l 133 738 l 340 147 l 541 738 l 675 738 "},"c":{"x_min":1,"x_max":701.390625,"ha":775,"o":"m 701 264 q 584 53 681 133 q 353 -26 487 -26 q 91 91 188 -26 q 1 370 1 201 q 92 645 1 537 q 353 761 190 761 q 572 688 479 761 q 690 493 666 615 l 556 493 q 487 606 545 562 q 356 650 428 650 q 186 563 246 650 q 134 372 134 487 q 188 179 134 258 q 359 88 250 88 q 492 136 437 88 q 566 264 548 185 l 701 264 "},"¶":{"x_min":0,"x_max":566.671875,"ha":678,"o":"m 21 892 l 52 892 l 98 761 l 145 892 l 176 892 l 178 741 l 157 741 l 157 867 l 108 741 l 88 741 l 40 871 l 40 741 l 21 741 l 21 892 m 308 854 l 308 731 q 252 691 308 691 q 227 691 240 691 q 207 696 213 695 l 207 712 l 253 706 q 288 733 288 706 l 288 763 q 244 741 279 741 q 193 797 193 741 q 261 860 193 860 q 287 860 273 860 q 308 854 302 855 m 288 842 l 263 843 q 213 796 213 843 q 248 756 213 756 q 288 796 288 756 l 288 842 m 566 988 l 502 988 l 502 -1 l 439 -1 l 439 988 l 317 988 l 317 -1 l 252 -1 l 252 602 q 81 653 155 602 q 0 805 0 711 q 101 989 0 918 q 309 1053 194 1053 l 566 1053 l 566 988 "},"β":{"x_min":0,"x_max":660,"ha":745,"o":"m 471 550 q 610 450 561 522 q 660 280 660 378 q 578 64 660 151 q 367 -22 497 -22 q 239 5 299 -22 q 126 82 178 32 l 126 -278 l 0 -278 l 0 593 q 54 903 0 801 q 318 1042 127 1042 q 519 964 436 1042 q 603 771 603 887 q 567 644 603 701 q 471 550 532 586 m 337 79 q 476 138 418 79 q 535 279 535 198 q 427 437 535 386 q 226 477 344 477 l 226 583 q 398 620 329 583 q 486 762 486 668 q 435 884 486 833 q 312 935 384 935 q 169 861 219 935 q 126 698 126 797 l 126 362 q 170 169 126 242 q 337 79 224 79 "},"Μ":{"x_min":0,"x_max":954,"ha":1068,"o":"m 954 0 l 819 0 l 819 868 l 537 0 l 405 0 l 128 865 l 128 0 l 0 0 l 0 1013 l 199 1013 l 472 158 l 758 1013 l 954 1013 l 954 0 "},"Ό":{"x_min":0.109375,"x_max":1120,"ha":1217,"o":"m 1120 505 q 994 132 1120 282 q 642 -29 861 -29 q 290 130 422 -29 q 167 505 167 280 q 294 883 167 730 q 650 1046 430 1046 q 999 882 868 1046 q 1120 505 1120 730 m 977 504 q 896 784 977 669 q 644 915 804 915 q 391 785 484 915 q 307 504 307 669 q 391 224 307 339 q 644 95 486 95 q 894 224 803 95 q 977 504 977 339 m 277 1040 l 83 799 l 0 799 l 140 1040 l 277 1040 "},"Ή":{"x_min":0,"x_max":1158,"ha":1275,"o":"m 1158 0 l 1022 0 l 1022 475 l 496 475 l 496 0 l 356 0 l 356 1012 l 496 1012 l 496 599 l 1022 599 l 1022 1012 l 1158 1012 l 1158 0 m 277 1040 l 83 799 l 0 799 l 140 1040 l 277 1040 "},"•":{"x_min":0,"x_max":663.890625,"ha":775,"o":"m 663 529 q 566 293 663 391 q 331 196 469 196 q 97 294 194 196 q 0 529 0 393 q 96 763 0 665 q 331 861 193 861 q 566 763 469 861 q 663 529 663 665 "},"¥":{"x_min":0.1875,"x_max":819.546875,"ha":886,"o":"m 563 561 l 697 561 l 696 487 l 520 487 l 482 416 l 482 380 l 697 380 l 695 308 l 482 308 l 482 0 l 342 0 l 342 308 l 125 308 l 125 380 l 342 380 l 342 417 l 303 487 l 125 487 l 125 561 l 258 561 l 0 1013 l 140 1013 l 411 533 l 679 1013 l 819 1013 l 563 561 "},"(":{"x_min":0,"x_max":318.0625,"ha":415,"o":"m 318 -290 l 230 -290 q 61 23 122 -142 q 0 365 0 190 q 62 712 0 540 q 230 1024 119 869 l 318 1024 q 175 705 219 853 q 125 360 125 542 q 176 22 125 187 q 318 -290 223 -127 "},"U":{"x_min":0,"x_max":796,"ha":904,"o":"m 796 393 q 681 93 796 212 q 386 -25 566 -25 q 101 95 208 -25 q 0 393 0 211 l 0 1013 l 138 1013 l 138 391 q 204 191 138 270 q 394 107 276 107 q 586 191 512 107 q 656 391 656 270 l 656 1013 l 796 1013 l 796 393 "},"γ":{"x_min":0.5,"x_max":744.953125,"ha":822,"o":"m 744 737 l 463 54 l 463 -278 l 338 -278 l 338 54 l 154 495 q 104 597 124 569 q 13 651 67 651 l 0 651 l 0 751 l 39 753 q 168 711 121 753 q 242 594 207 676 l 403 208 l 617 737 l 744 737 "},"α":{"x_min":0,"x_max":765.5625,"ha":809,"o":"m 765 -4 q 698 -14 726 -14 q 564 97 586 -14 q 466 7 525 40 q 337 -26 407 -26 q 88 98 186 -26 q 0 369 0 212 q 88 637 0 525 q 337 760 184 760 q 465 728 407 760 q 563 637 524 696 l 563 739 l 685 739 l 685 222 q 693 141 685 168 q 748 94 708 94 q 765 96 760 94 l 765 -4 m 584 371 q 531 562 584 485 q 360 653 470 653 q 192 566 254 653 q 135 379 135 489 q 186 181 135 261 q 358 84 247 84 q 528 176 465 84 q 584 371 584 260 "},"F":{"x_min":0,"x_max":683.328125,"ha":717,"o":"m 683 888 l 140 888 l 140 583 l 613 583 l 613 458 l 140 458 l 140 0 l 0 0 l 0 1013 l 683 1013 l 683 888 "},"­":{"x_min":0,"x_max":705.5625,"ha":803,"o":"m 705 334 l 0 334 l 0 410 l 705 410 l 705 334 "},":":{"x_min":0,"x_max":142,"ha":239,"o":"m 142 585 l 0 585 l 0 738 l 142 738 l 142 585 m 142 0 l 0 0 l 0 151 l 142 151 l 142 0 "},"Χ":{"x_min":0,"x_max":854.171875,"ha":935,"o":"m 854 0 l 683 0 l 423 409 l 166 0 l 0 0 l 347 519 l 18 1013 l 186 1013 l 427 637 l 675 1013 l 836 1013 l 504 521 l 854 0 "},"*":{"x_min":116,"x_max":674,"ha":792,"o":"m 674 768 l 475 713 l 610 544 l 517 477 l 394 652 l 272 478 l 178 544 l 314 713 l 116 766 l 153 876 l 341 812 l 342 1013 l 446 1013 l 446 811 l 635 874 l 674 768 "},"†":{"x_min":0,"x_max":777,"ha":835,"o":"m 458 804 l 777 804 l 777 683 l 458 683 l 458 0 l 319 0 l 319 681 l 0 683 l 0 804 l 319 804 l 319 1015 l 458 1013 l 458 804 "},"°":{"x_min":0,"x_max":347,"ha":444,"o":"m 173 802 q 43 856 91 802 q 0 977 0 905 q 45 1101 0 1049 q 173 1153 90 1153 q 303 1098 255 1153 q 347 977 347 1049 q 303 856 347 905 q 173 802 256 802 m 173 884 q 238 910 214 884 q 262 973 262 937 q 239 1038 262 1012 q 173 1064 217 1064 q 108 1037 132 1064 q 85 973 85 1010 q 108 910 85 937 q 173 884 132 884 "},"V":{"x_min":0,"x_max":862.71875,"ha":940,"o":"m 862 1013 l 505 0 l 361 0 l 0 1013 l 143 1013 l 434 165 l 718 1012 l 862 1013 "},"Ξ":{"x_min":0,"x_max":734.71875,"ha":763,"o":"m 723 889 l 9 889 l 9 1013 l 723 1013 l 723 889 m 673 463 l 61 463 l 61 589 l 673 589 l 673 463 m 734 0 l 0 0 l 0 124 l 734 124 l 734 0 "}," ":{"x_min":0,"x_max":0,"ha":853},"Ϋ":{"x_min":0.328125,"x_max":819.515625,"ha":889,"o":"m 588 1046 l 460 1046 l 460 1189 l 588 1189 l 588 1046 m 360 1046 l 232 1046 l 232 1189 l 360 1189 l 360 1046 m 819 1012 l 482 416 l 482 0 l 342 0 l 342 416 l 0 1012 l 140 1012 l 411 533 l 679 1012 l 819 1012 "},"0":{"x_min":73,"x_max":715,"ha":792,"o":"m 394 -29 q 153 129 242 -29 q 73 479 73 272 q 152 829 73 687 q 394 989 241 989 q 634 829 545 989 q 715 479 715 684 q 635 129 715 270 q 394 -29 546 -29 m 394 89 q 546 211 489 89 q 598 479 598 322 q 548 748 598 640 q 394 871 491 871 q 241 748 298 871 q 190 479 190 637 q 239 211 190 319 q 394 89 296 89 "},"”":{"x_min":0,"x_max":347,"ha":454,"o":"m 139 851 q 102 737 139 784 q 0 669 65 690 l 0 734 q 59 787 42 741 q 72 873 72 821 l 0 873 l 0 1013 l 139 1013 l 139 851 m 347 851 q 310 737 347 784 q 208 669 273 690 l 208 734 q 267 787 250 741 q 280 873 280 821 l 208 873 l 208 1013 l 347 1013 l 347 851 "},"@":{"x_min":0,"x_max":1260,"ha":1357,"o":"m 1098 -45 q 877 -160 1001 -117 q 633 -203 752 -203 q 155 -29 327 -203 q 0 360 0 127 q 176 802 0 616 q 687 1008 372 1008 q 1123 854 969 1008 q 1260 517 1260 718 q 1155 216 1260 341 q 868 82 1044 82 q 772 106 801 82 q 737 202 737 135 q 647 113 700 144 q 527 82 594 82 q 367 147 420 82 q 314 312 314 212 q 401 565 314 452 q 639 690 498 690 q 810 588 760 690 l 849 668 l 938 668 q 877 441 900 532 q 833 226 833 268 q 853 182 833 198 q 902 167 873 167 q 1088 272 1012 167 q 1159 512 1159 372 q 1051 793 1159 681 q 687 925 925 925 q 248 747 415 925 q 97 361 97 586 q 226 26 97 159 q 627 -122 370 -122 q 856 -87 737 -122 q 1061 8 976 -53 l 1098 -45 m 786 488 q 738 580 777 545 q 643 615 700 615 q 483 517 548 615 q 425 322 425 430 q 457 203 425 250 q 552 156 490 156 q 722 273 665 156 q 786 488 738 309 "},"Ί":{"x_min":0,"x_max":499,"ha":613,"o":"m 277 1040 l 83 799 l 0 799 l 140 1040 l 277 1040 m 499 0 l 360 0 l 360 1012 l 499 1012 l 499 0 "},"i":{"x_min":14,"x_max":136,"ha":275,"o":"m 136 873 l 14 873 l 14 1013 l 136 1013 l 136 873 m 136 0 l 14 0 l 14 737 l 136 737 l 136 0 "},"Β":{"x_min":0,"x_max":778,"ha":877,"o":"m 580 545 q 724 468 671 534 q 778 310 778 402 q 673 83 778 170 q 432 0 575 0 l 0 0 l 0 1013 l 411 1013 q 629 957 541 1013 q 732 768 732 891 q 691 632 732 692 q 580 545 650 571 m 393 899 l 139 899 l 139 587 l 379 587 q 521 623 462 587 q 592 744 592 666 q 531 859 592 819 q 393 899 471 899 m 419 124 q 566 169 504 124 q 635 302 635 219 q 559 435 635 388 q 402 476 494 476 l 139 476 l 139 124 l 419 124 "},"υ":{"x_min":0,"x_max":617,"ha":725,"o":"m 617 352 q 540 94 617 199 q 308 -24 455 -24 q 76 94 161 -24 q 0 352 0 199 l 0 739 l 126 739 l 126 355 q 169 185 126 257 q 312 98 220 98 q 451 185 402 98 q 492 355 492 257 l 492 739 l 617 739 l 617 352 "},"]":{"x_min":0,"x_max":275,"ha":372,"o":"m 275 -281 l 0 -281 l 0 -187 l 151 -187 l 151 920 l 0 920 l 0 1013 l 275 1013 l 275 -281 "},"m":{"x_min":0,"x_max":1019,"ha":1128,"o":"m 1019 0 l 897 0 l 897 454 q 860 591 897 536 q 739 660 816 660 q 613 586 659 660 q 573 436 573 522 l 573 0 l 447 0 l 447 455 q 412 591 447 535 q 294 657 372 657 q 165 586 213 657 q 122 437 122 521 l 122 0 l 0 0 l 0 738 l 117 738 l 117 640 q 202 730 150 697 q 316 763 254 763 q 437 730 381 763 q 525 642 494 697 q 621 731 559 700 q 753 763 682 763 q 943 694 867 763 q 1019 512 1019 625 l 1019 0 "},"χ":{"x_min":8.328125,"x_max":780.5625,"ha":815,"o":"m 780 -278 q 715 -294 747 -294 q 616 -257 663 -294 q 548 -175 576 -227 l 379 133 l 143 -277 l 9 -277 l 313 254 l 163 522 q 127 586 131 580 q 36 640 91 640 q 8 637 27 640 l 8 752 l 52 757 q 162 719 113 757 q 236 627 200 690 l 383 372 l 594 737 l 726 737 l 448 250 l 625 -69 q 670 -153 647 -110 q 743 -188 695 -188 q 780 -184 759 -188 l 780 -278 "},"8":{"x_min":55,"x_max":736,"ha":792,"o":"m 571 527 q 694 424 652 491 q 736 280 736 358 q 648 71 736 158 q 395 -26 551 -26 q 142 69 238 -26 q 55 279 55 157 q 96 425 55 359 q 220 527 138 491 q 120 615 153 562 q 88 726 88 668 q 171 904 88 827 q 395 986 261 986 q 618 905 529 986 q 702 727 702 830 q 670 616 702 667 q 571 527 638 565 m 394 565 q 519 610 475 565 q 563 717 563 655 q 521 823 563 781 q 392 872 474 872 q 265 824 312 872 q 224 720 224 783 q 265 613 224 656 q 394 565 312 565 m 395 91 q 545 150 488 91 q 597 280 597 204 q 546 408 597 355 q 395 465 492 465 q 244 408 299 465 q 194 280 194 356 q 244 150 194 203 q 395 91 299 91 "},"ί":{"x_min":42,"x_max":326.71875,"ha":361,"o":"m 284 3 q 233 -10 258 -5 q 182 -15 207 -15 q 85 26 119 -15 q 42 200 42 79 l 42 737 l 167 737 l 168 215 q 172 141 168 157 q 226 101 183 101 q 248 102 239 101 q 284 112 257 104 l 284 3 m 326 1040 l 137 819 l 54 819 l 189 1040 l 326 1040 "},"Ζ":{"x_min":0,"x_max":779.171875,"ha":850,"o":"m 779 0 l 0 0 l 0 113 l 620 896 l 40 896 l 40 1013 l 779 1013 l 779 887 l 170 124 l 779 124 l 779 0 "},"R":{"x_min":0,"x_max":781.953125,"ha":907,"o":"m 781 0 l 623 0 q 587 242 590 52 q 407 433 585 433 l 138 433 l 138 0 l 0 0 l 0 1013 l 396 1013 q 636 946 539 1013 q 749 731 749 868 q 711 597 749 659 q 608 502 674 534 q 718 370 696 474 q 729 207 722 352 q 781 26 736 62 l 781 0 m 373 551 q 533 594 465 551 q 614 731 614 645 q 532 859 614 815 q 373 896 465 896 l 138 896 l 138 551 l 373 551 "},"o":{"x_min":0,"x_max":713,"ha":821,"o":"m 357 -25 q 94 91 194 -25 q 0 368 0 202 q 93 642 0 533 q 357 761 193 761 q 618 644 518 761 q 713 368 713 533 q 619 91 713 201 q 357 -25 521 -25 m 357 85 q 528 175 465 85 q 584 369 584 255 q 529 562 584 484 q 357 651 467 651 q 189 560 250 651 q 135 369 135 481 q 187 177 135 257 q 357 85 250 85 "},"5":{"x_min":54.171875,"x_max":738,"ha":792,"o":"m 738 314 q 626 60 738 153 q 382 -23 526 -23 q 155 47 248 -23 q 54 256 54 125 l 183 256 q 259 132 204 174 q 382 91 314 91 q 533 149 471 91 q 602 314 602 213 q 538 469 602 411 q 386 528 475 528 q 284 506 332 528 q 197 439 237 484 l 81 439 l 159 958 l 684 958 l 684 840 l 254 840 l 214 579 q 306 627 258 612 q 407 643 354 643 q 636 552 540 643 q 738 314 738 457 "},"7":{"x_min":58.71875,"x_max":730.953125,"ha":792,"o":"m 730 839 q 469 448 560 641 q 335 0 378 255 l 192 0 q 328 441 235 252 q 593 830 421 630 l 58 830 l 58 958 l 730 958 l 730 839 "},"K":{"x_min":0,"x_max":819.46875,"ha":906,"o":"m 819 0 l 649 0 l 294 509 l 139 355 l 139 0 l 0 0 l 0 1013 l 139 1013 l 139 526 l 626 1013 l 809 1013 l 395 600 l 819 0 "},",":{"x_min":0,"x_max":142,"ha":239,"o":"m 142 -12 q 105 -132 142 -82 q 0 -205 68 -182 l 0 -138 q 57 -82 40 -124 q 70 0 70 -51 l 0 0 l 0 151 l 142 151 l 142 -12 "},"d":{"x_min":0,"x_max":683,"ha":796,"o":"m 683 0 l 564 0 l 564 93 q 456 6 516 38 q 327 -25 395 -25 q 87 100 181 -25 q 0 365 0 215 q 90 639 0 525 q 343 763 187 763 q 564 647 486 763 l 564 1013 l 683 1013 l 683 0 m 582 373 q 529 562 582 484 q 361 653 468 653 q 190 561 253 653 q 135 365 135 479 q 189 175 135 254 q 358 85 251 85 q 529 178 468 85 q 582 373 582 258 "},"¨":{"x_min":-109,"x_max":247,"ha":232,"o":"m 247 1046 l 119 1046 l 119 1189 l 247 1189 l 247 1046 m 19 1046 l -109 1046 l -109 1189 l 19 1189 l 19 1046 "},"E":{"x_min":0,"x_max":736.109375,"ha":789,"o":"m 736 0 l 0 0 l 0 1013 l 725 1013 l 725 889 l 139 889 l 139 585 l 677 585 l 677 467 l 139 467 l 139 125 l 736 125 l 736 0 "},"Y":{"x_min":0,"x_max":820,"ha":886,"o":"m 820 1013 l 482 416 l 482 0 l 342 0 l 342 416 l 0 1013 l 140 1013 l 411 534 l 679 1012 l 820 1013 "},"\"":{"x_min":0,"x_max":299,"ha":396,"o":"m 299 606 l 203 606 l 203 988 l 299 988 l 299 606 m 96 606 l 0 606 l 0 988 l 96 988 l 96 606 "},"‹":{"x_min":17.984375,"x_max":773.609375,"ha":792,"o":"m 773 40 l 18 376 l 17 465 l 773 799 l 773 692 l 159 420 l 773 149 l 773 40 "},"„":{"x_min":0,"x_max":364,"ha":467,"o":"m 141 -12 q 104 -132 141 -82 q 0 -205 67 -182 l 0 -138 q 56 -82 40 -124 q 69 0 69 -51 l 0 0 l 0 151 l 141 151 l 141 -12 m 364 -12 q 327 -132 364 -82 q 222 -205 290 -182 l 222 -138 q 279 -82 262 -124 q 292 0 292 -51 l 222 0 l 222 151 l 364 151 l 364 -12 "},"δ":{"x_min":1,"x_max":710,"ha":810,"o":"m 710 360 q 616 87 710 196 q 356 -28 518 -28 q 99 82 197 -28 q 1 356 1 192 q 100 606 1 509 q 355 703 199 703 q 180 829 288 754 q 70 903 124 866 l 70 1012 l 643 1012 l 643 901 l 258 901 q 462 763 422 794 q 636 592 577 677 q 710 360 710 485 m 584 365 q 552 501 584 447 q 451 602 521 555 q 372 611 411 611 q 197 541 258 611 q 136 355 136 472 q 190 171 136 245 q 358 85 252 85 q 528 173 465 85 q 584 365 584 252 "},"έ":{"x_min":0,"x_max":634.71875,"ha":714,"o":"m 634 234 q 527 38 634 110 q 300 -25 433 -25 q 98 29 183 -25 q 0 204 0 93 q 37 313 0 265 q 128 390 67 352 q 56 459 82 419 q 26 555 26 505 q 114 712 26 654 q 295 763 191 763 q 499 700 416 763 q 589 515 589 631 l 478 515 q 419 618 464 580 q 307 657 374 657 q 207 630 253 657 q 151 547 151 598 q 238 445 151 469 q 389 434 280 434 l 389 331 l 349 331 q 206 315 255 331 q 125 210 125 287 q 183 107 125 145 q 302 76 233 76 q 436 117 379 76 q 509 234 493 159 l 634 234 m 520 1040 l 331 819 l 248 819 l 383 1040 l 520 1040 "},"ω":{"x_min":0,"x_max":922,"ha":1031,"o":"m 922 339 q 856 97 922 203 q 650 -26 780 -26 q 538 9 587 -26 q 461 103 489 44 q 387 12 436 46 q 277 -22 339 -22 q 69 97 147 -22 q 0 339 0 203 q 45 551 0 444 q 161 738 84 643 l 302 738 q 175 553 219 647 q 124 336 124 446 q 155 179 124 249 q 275 88 197 88 q 375 163 341 88 q 400 294 400 219 l 400 572 l 524 572 l 524 294 q 561 135 524 192 q 643 88 591 88 q 762 182 719 88 q 797 342 797 257 q 745 556 797 450 q 619 738 705 638 l 760 738 q 874 551 835 640 q 922 339 922 444 "},"´":{"x_min":0,"x_max":96,"ha":251,"o":"m 96 606 l 0 606 l 0 988 l 96 988 l 96 606 "},"±":{"x_min":11,"x_max":781,"ha":792,"o":"m 781 490 l 446 490 l 446 255 l 349 255 l 349 490 l 11 490 l 11 586 l 349 586 l 349 819 l 446 819 l 446 586 l 781 586 l 781 490 m 781 21 l 11 21 l 11 115 l 781 115 l 781 21 "},"|":{"x_min":343,"x_max":449,"ha":792,"o":"m 449 462 l 343 462 l 343 986 l 449 986 l 449 462 m 449 -242 l 343 -242 l 343 280 l 449 280 l 449 -242 "},"ϋ":{"x_min":0,"x_max":617,"ha":725,"o":"m 482 800 l 372 800 l 372 925 l 482 925 l 482 800 m 239 800 l 129 800 l 129 925 l 239 925 l 239 800 m 617 352 q 540 93 617 199 q 308 -24 455 -24 q 76 93 161 -24 q 0 352 0 199 l 0 738 l 126 738 l 126 354 q 169 185 126 257 q 312 98 220 98 q 451 185 402 98 q 492 354 492 257 l 492 738 l 617 738 l 617 352 "},"§":{"x_min":0,"x_max":593,"ha":690,"o":"m 593 425 q 554 312 593 369 q 467 233 516 254 q 537 83 537 172 q 459 -74 537 -12 q 288 -133 387 -133 q 115 -69 184 -133 q 47 96 47 -6 l 166 96 q 199 7 166 40 q 288 -26 232 -26 q 371 -5 332 -26 q 420 60 420 21 q 311 201 420 139 q 108 309 210 255 q 0 490 0 383 q 33 602 0 551 q 124 687 66 654 q 75 743 93 712 q 58 812 58 773 q 133 984 58 920 q 300 1043 201 1043 q 458 987 394 1043 q 529 814 529 925 l 411 814 q 370 908 404 877 q 289 939 336 939 q 213 911 246 939 q 180 841 180 883 q 286 720 180 779 q 484 612 480 615 q 593 425 593 534 m 467 409 q 355 544 467 473 q 196 630 228 612 q 146 587 162 609 q 124 525 124 558 q 239 387 124 462 q 398 298 369 315 q 448 345 429 316 q 467 409 467 375 "},"b":{"x_min":0,"x_max":685,"ha":783,"o":"m 685 372 q 597 99 685 213 q 347 -25 501 -25 q 219 5 277 -25 q 121 93 161 36 l 121 0 l 0 0 l 0 1013 l 121 1013 l 121 634 q 214 723 157 692 q 341 754 272 754 q 591 637 493 754 q 685 372 685 526 m 554 356 q 499 550 554 470 q 328 644 437 644 q 162 556 223 644 q 108 369 108 478 q 160 176 108 256 q 330 83 221 83 q 498 169 435 83 q 554 356 554 245 "},"q":{"x_min":0,"x_max":683,"ha":876,"o":"m 683 -278 l 564 -278 l 564 97 q 474 8 533 39 q 345 -23 415 -23 q 91 93 188 -23 q 0 364 0 203 q 87 635 0 522 q 337 760 184 760 q 466 727 408 760 q 564 637 523 695 l 564 737 l 683 737 l 683 -278 m 582 375 q 527 564 582 488 q 358 652 466 652 q 190 565 253 652 q 135 377 135 488 q 189 179 135 261 q 361 84 251 84 q 530 179 469 84 q 582 375 582 260 "},"Ω":{"x_min":-0.171875,"x_max":969.5625,"ha":1068,"o":"m 969 0 l 555 0 l 555 123 q 744 308 675 194 q 814 558 814 423 q 726 812 814 709 q 484 922 633 922 q 244 820 334 922 q 154 567 154 719 q 223 316 154 433 q 412 123 292 199 l 412 0 l 0 0 l 0 124 l 217 124 q 68 327 122 210 q 15 572 15 444 q 144 911 15 781 q 484 1041 274 1041 q 822 909 691 1041 q 953 569 953 777 q 899 326 953 443 q 750 124 846 210 l 969 124 l 969 0 "},"ύ":{"x_min":0,"x_max":617,"ha":725,"o":"m 617 352 q 540 93 617 199 q 308 -24 455 -24 q 76 93 161 -24 q 0 352 0 199 l 0 738 l 126 738 l 126 354 q 169 185 126 257 q 312 98 220 98 q 451 185 402 98 q 492 354 492 257 l 492 738 l 617 738 l 617 352 m 535 1040 l 346 819 l 262 819 l 397 1040 l 535 1040 "},"z":{"x_min":-0.015625,"x_max":613.890625,"ha":697,"o":"m 613 0 l 0 0 l 0 100 l 433 630 l 20 630 l 20 738 l 594 738 l 593 636 l 163 110 l 613 110 l 613 0 "},"™":{"x_min":0,"x_max":894,"ha":1000,"o":"m 389 951 l 229 951 l 229 503 l 160 503 l 160 951 l 0 951 l 0 1011 l 389 1011 l 389 951 m 894 503 l 827 503 l 827 939 l 685 503 l 620 503 l 481 937 l 481 503 l 417 503 l 417 1011 l 517 1011 l 653 580 l 796 1010 l 894 1011 l 894 503 "},"ή":{"x_min":0.78125,"x_max":697,"ha":810,"o":"m 697 -278 l 572 -278 l 572 454 q 540 587 572 536 q 425 650 501 650 q 271 579 337 650 q 206 420 206 509 l 206 0 l 81 0 l 81 489 q 73 588 81 562 q 0 644 56 644 l 0 741 q 68 755 38 755 q 158 721 124 755 q 200 630 193 687 q 297 726 234 692 q 434 761 359 761 q 620 692 544 761 q 697 516 697 624 l 697 -278 m 479 1040 l 290 819 l 207 819 l 341 1040 l 479 1040 "},"Θ":{"x_min":0,"x_max":960,"ha":1056,"o":"m 960 507 q 833 129 960 280 q 476 -32 698 -32 q 123 129 255 -32 q 0 507 0 280 q 123 883 0 732 q 476 1045 255 1045 q 832 883 696 1045 q 960 507 960 732 m 817 500 q 733 789 817 669 q 476 924 639 924 q 223 792 317 924 q 142 507 142 675 q 222 222 142 339 q 476 89 315 89 q 730 218 636 89 q 817 500 817 334 m 716 449 l 243 449 l 243 571 l 716 571 l 716 449 "},"®":{"x_min":-3,"x_max":1008,"ha":1106,"o":"m 503 532 q 614 562 566 532 q 672 658 672 598 q 614 747 672 716 q 503 772 569 772 l 338 772 l 338 532 l 503 532 m 502 -7 q 123 151 263 -7 q -3 501 -3 294 q 123 851 -3 706 q 502 1011 263 1011 q 881 851 739 1011 q 1008 501 1008 708 q 883 151 1008 292 q 502 -7 744 -7 m 502 60 q 830 197 709 60 q 940 501 940 322 q 831 805 940 681 q 502 944 709 944 q 174 805 296 944 q 65 501 65 680 q 173 197 65 320 q 502 60 294 60 m 788 146 l 678 146 q 653 316 655 183 q 527 449 652 449 l 338 449 l 338 146 l 241 146 l 241 854 l 518 854 q 688 808 621 854 q 766 658 766 755 q 739 563 766 607 q 668 497 713 519 q 751 331 747 472 q 788 164 756 190 l 788 146 "},"~":{"x_min":0,"x_max":833,"ha":931,"o":"m 833 958 q 778 753 833 831 q 594 665 716 665 q 402 761 502 665 q 240 857 302 857 q 131 795 166 857 q 104 665 104 745 l 0 665 q 54 867 0 789 q 237 958 116 958 q 429 861 331 958 q 594 765 527 765 q 704 827 670 765 q 729 958 729 874 l 833 958 "},"Ε":{"x_min":0,"x_max":736.21875,"ha":778,"o":"m 736 0 l 0 0 l 0 1013 l 725 1013 l 725 889 l 139 889 l 139 585 l 677 585 l 677 467 l 139 467 l 139 125 l 736 125 l 736 0 "},"³":{"x_min":0,"x_max":450,"ha":547,"o":"m 450 552 q 379 413 450 464 q 220 366 313 366 q 69 414 130 366 q 0 567 0 470 l 85 567 q 126 470 85 504 q 225 437 168 437 q 320 467 280 437 q 360 552 360 498 q 318 632 360 608 q 213 657 276 657 q 195 657 203 657 q 176 657 181 657 l 176 722 q 279 733 249 722 q 334 815 334 752 q 300 881 334 856 q 220 907 267 907 q 133 875 169 907 q 97 781 97 844 l 15 781 q 78 926 15 875 q 220 972 135 972 q 364 930 303 972 q 426 817 426 888 q 344 697 426 733 q 421 642 392 681 q 450 552 450 603 "},"[":{"x_min":0,"x_max":273.609375,"ha":371,"o":"m 273 -281 l 0 -281 l 0 1013 l 273 1013 l 273 920 l 124 920 l 124 -187 l 273 -187 l 273 -281 "},"L":{"x_min":0,"x_max":645.828125,"ha":696,"o":"m 645 0 l 0 0 l 0 1013 l 140 1013 l 140 126 l 645 126 l 645 0 "},"σ":{"x_min":0,"x_max":803.390625,"ha":894,"o":"m 803 628 l 633 628 q 713 368 713 512 q 618 93 713 204 q 357 -25 518 -25 q 94 91 194 -25 q 0 368 0 201 q 94 644 0 533 q 356 761 194 761 q 481 750 398 761 q 608 739 564 739 l 803 739 l 803 628 m 360 85 q 529 180 467 85 q 584 374 584 262 q 527 566 584 490 q 352 651 463 651 q 187 559 247 651 q 135 368 135 478 q 189 175 135 254 q 360 85 251 85 "},"ζ":{"x_min":0,"x_max":573,"ha":642,"o":"m 573 -40 q 553 -162 573 -97 q 510 -278 543 -193 l 400 -278 q 441 -187 428 -219 q 462 -90 462 -132 q 378 -14 462 -14 q 108 45 197 -14 q 0 290 0 117 q 108 631 0 462 q 353 901 194 767 l 55 901 l 55 1012 l 561 1012 l 561 924 q 261 669 382 831 q 128 301 128 489 q 243 117 128 149 q 458 98 350 108 q 573 -40 573 80 "},"θ":{"x_min":0,"x_max":674,"ha":778,"o":"m 674 496 q 601 160 674 304 q 336 -26 508 -26 q 73 153 165 -26 q 0 485 0 296 q 72 840 0 683 q 343 1045 166 1045 q 605 844 516 1045 q 674 496 674 692 m 546 579 q 498 798 546 691 q 336 935 437 935 q 178 798 237 935 q 126 579 137 701 l 546 579 m 546 475 l 126 475 q 170 233 126 348 q 338 80 230 80 q 504 233 447 80 q 546 475 546 346 "},"Ο":{"x_min":0,"x_max":958,"ha":1054,"o":"m 485 1042 q 834 883 703 1042 q 958 511 958 735 q 834 136 958 287 q 481 -26 701 -26 q 126 130 261 -26 q 0 504 0 279 q 127 880 0 729 q 485 1042 263 1042 m 480 98 q 731 225 638 98 q 815 504 815 340 q 733 783 815 670 q 480 913 640 913 q 226 785 321 913 q 142 504 142 671 q 226 224 142 339 q 480 98 319 98 "},"Γ":{"x_min":0,"x_max":705.28125,"ha":749,"o":"m 705 886 l 140 886 l 140 0 l 0 0 l 0 1012 l 705 1012 l 705 886 "}," ":{"x_min":0,"x_max":0,"ha":375},"%":{"x_min":-3,"x_max":1089,"ha":1186,"o":"m 845 0 q 663 76 731 0 q 602 244 602 145 q 661 412 602 344 q 845 489 728 489 q 1027 412 959 489 q 1089 244 1089 343 q 1029 76 1089 144 q 845 0 962 0 m 844 103 q 945 143 909 103 q 981 243 981 184 q 947 340 981 301 q 844 385 909 385 q 744 342 781 385 q 708 243 708 300 q 741 147 708 186 q 844 103 780 103 m 888 986 l 284 -25 l 199 -25 l 803 986 l 888 986 m 241 468 q 58 545 126 468 q -3 715 -3 615 q 56 881 -3 813 q 238 958 124 958 q 421 881 353 958 q 483 712 483 813 q 423 544 483 612 q 241 468 356 468 m 241 855 q 137 811 175 855 q 100 710 100 768 q 136 612 100 653 q 240 572 172 572 q 344 614 306 572 q 382 713 382 656 q 347 810 382 771 q 241 855 308 855 "},"P":{"x_min":0,"x_max":726,"ha":806,"o":"m 424 1013 q 640 931 555 1013 q 726 719 726 850 q 637 506 726 587 q 413 426 548 426 l 140 426 l 140 0 l 0 0 l 0 1013 l 424 1013 m 379 889 l 140 889 l 140 548 l 372 548 q 522 589 459 548 q 593 720 593 637 q 528 845 593 801 q 379 889 463 889 "},"Έ":{"x_min":0,"x_max":1078.21875,"ha":1118,"o":"m 1078 0 l 342 0 l 342 1013 l 1067 1013 l 1067 889 l 481 889 l 481 585 l 1019 585 l 1019 467 l 481 467 l 481 125 l 1078 125 l 1078 0 m 277 1040 l 83 799 l 0 799 l 140 1040 l 277 1040 "},"Ώ":{"x_min":0.125,"x_max":1136.546875,"ha":1235,"o":"m 1136 0 l 722 0 l 722 123 q 911 309 842 194 q 981 558 981 423 q 893 813 981 710 q 651 923 800 923 q 411 821 501 923 q 321 568 321 720 q 390 316 321 433 q 579 123 459 200 l 579 0 l 166 0 l 166 124 l 384 124 q 235 327 289 210 q 182 572 182 444 q 311 912 182 782 q 651 1042 441 1042 q 989 910 858 1042 q 1120 569 1120 778 q 1066 326 1120 443 q 917 124 1013 210 l 1136 124 l 1136 0 m 277 1040 l 83 800 l 0 800 l 140 1041 l 277 1040 "},"_":{"x_min":0,"x_max":705.5625,"ha":803,"o":"m 705 -334 l 0 -334 l 0 -234 l 705 -234 l 705 -334 "},"Ϊ":{"x_min":-110,"x_max":246,"ha":275,"o":"m 246 1046 l 118 1046 l 118 1189 l 246 1189 l 246 1046 m 18 1046 l -110 1046 l -110 1189 l 18 1189 l 18 1046 m 136 0 l 0 0 l 0 1012 l 136 1012 l 136 0 "},"+":{"x_min":23,"x_max":768,"ha":792,"o":"m 768 372 l 444 372 l 444 0 l 347 0 l 347 372 l 23 372 l 23 468 l 347 468 l 347 840 l 444 840 l 444 468 l 768 468 l 768 372 "},"½":{"x_min":0,"x_max":1050,"ha":1149,"o":"m 1050 0 l 625 0 q 712 178 625 108 q 878 277 722 187 q 967 385 967 328 q 932 456 967 429 q 850 484 897 484 q 759 450 798 484 q 721 352 721 416 l 640 352 q 706 502 640 448 q 851 551 766 551 q 987 509 931 551 q 1050 385 1050 462 q 976 251 1050 301 q 829 179 902 215 q 717 68 740 133 l 1050 68 l 1050 0 m 834 985 l 215 -28 l 130 -28 l 750 984 l 834 985 m 224 422 l 142 422 l 142 811 l 0 811 l 0 867 q 104 889 62 867 q 164 973 157 916 l 224 973 l 224 422 "},"Ρ":{"x_min":0,"x_max":720,"ha":783,"o":"m 424 1013 q 637 933 554 1013 q 720 723 720 853 q 633 508 720 591 q 413 426 546 426 l 140 426 l 140 0 l 0 0 l 0 1013 l 424 1013 m 378 889 l 140 889 l 140 548 l 371 548 q 521 589 458 548 q 592 720 592 637 q 527 845 592 801 q 378 889 463 889 "},"'":{"x_min":0,"x_max":139,"ha":236,"o":"m 139 851 q 102 737 139 784 q 0 669 65 690 l 0 734 q 59 787 42 741 q 72 873 72 821 l 0 873 l 0 1013 l 139 1013 l 139 851 "},"ª":{"x_min":0,"x_max":350,"ha":397,"o":"m 350 625 q 307 616 328 616 q 266 631 281 616 q 247 673 251 645 q 190 628 225 644 q 116 613 156 613 q 32 641 64 613 q 0 722 0 669 q 72 826 0 800 q 247 866 159 846 l 247 887 q 220 934 247 916 q 162 953 194 953 q 104 934 129 953 q 76 882 80 915 l 16 882 q 60 976 16 941 q 166 1011 104 1011 q 266 979 224 1011 q 308 891 308 948 l 308 706 q 311 679 308 688 q 331 670 315 670 l 350 672 l 350 625 m 247 757 l 247 811 q 136 790 175 798 q 64 726 64 773 q 83 682 64 697 q 132 667 103 667 q 207 690 174 667 q 247 757 247 718 "},"΅":{"x_min":0,"x_max":450,"ha":553,"o":"m 450 800 l 340 800 l 340 925 l 450 925 l 450 800 m 406 1040 l 212 800 l 129 800 l 269 1040 l 406 1040 m 110 800 l 0 800 l 0 925 l 110 925 l 110 800 "},"T":{"x_min":0,"x_max":777,"ha":835,"o":"m 777 894 l 458 894 l 458 0 l 319 0 l 319 894 l 0 894 l 0 1013 l 777 1013 l 777 894 "},"Φ":{"x_min":0,"x_max":915,"ha":997,"o":"m 527 0 l 389 0 l 389 122 q 110 231 220 122 q 0 509 0 340 q 110 785 0 677 q 389 893 220 893 l 389 1013 l 527 1013 l 527 893 q 804 786 693 893 q 915 509 915 679 q 805 231 915 341 q 527 122 696 122 l 527 0 m 527 226 q 712 310 641 226 q 779 507 779 389 q 712 705 779 627 q 527 787 641 787 l 527 226 m 389 226 l 389 787 q 205 698 275 775 q 136 505 136 620 q 206 308 136 391 q 389 226 276 226 "},"⁋":{"x_min":0,"x_max":0,"ha":694},"j":{"x_min":-77.78125,"x_max":167,"ha":349,"o":"m 167 871 l 42 871 l 42 1013 l 167 1013 l 167 871 m 167 -80 q 121 -231 167 -184 q -26 -278 76 -278 l -77 -278 l -77 -164 l -41 -164 q 26 -143 11 -164 q 42 -65 42 -122 l 42 737 l 167 737 l 167 -80 "},"Σ":{"x_min":0,"x_max":756.953125,"ha":819,"o":"m 756 0 l 0 0 l 0 107 l 395 523 l 22 904 l 22 1013 l 745 1013 l 745 889 l 209 889 l 566 523 l 187 125 l 756 125 l 756 0 "},"1":{"x_min":215.671875,"x_max":574,"ha":792,"o":"m 574 0 l 442 0 l 442 697 l 215 697 l 215 796 q 386 833 330 796 q 475 986 447 875 l 574 986 l 574 0 "},"›":{"x_min":18.0625,"x_max":774,"ha":792,"o":"m 774 376 l 18 40 l 18 149 l 631 421 l 18 692 l 18 799 l 774 465 l 774 376 "},"<":{"x_min":17.984375,"x_max":773.609375,"ha":792,"o":"m 773 40 l 18 376 l 17 465 l 773 799 l 773 692 l 159 420 l 773 149 l 773 40 "},"£":{"x_min":0,"x_max":704.484375,"ha":801,"o":"m 704 41 q 623 -10 664 5 q 543 -26 583 -26 q 359 15 501 -26 q 243 36 288 36 q 158 23 197 36 q 73 -21 119 10 l 6 76 q 125 195 90 150 q 175 331 175 262 q 147 443 175 383 l 0 443 l 0 512 l 108 512 q 43 734 43 623 q 120 929 43 854 q 358 1010 204 1010 q 579 936 487 1010 q 678 729 678 857 l 678 684 l 552 684 q 504 838 552 780 q 362 896 457 896 q 216 852 263 896 q 176 747 176 815 q 199 627 176 697 q 248 512 217 574 l 468 512 l 468 443 l 279 443 q 297 356 297 398 q 230 194 297 279 q 153 107 211 170 q 227 133 190 125 q 293 142 264 142 q 410 119 339 142 q 516 96 482 96 q 579 105 550 96 q 648 142 608 115 l 704 41 "},"t":{"x_min":0,"x_max":367,"ha":458,"o":"m 367 0 q 312 -5 339 -2 q 262 -8 284 -8 q 145 28 183 -8 q 108 143 108 64 l 108 638 l 0 638 l 0 738 l 108 738 l 108 944 l 232 944 l 232 738 l 367 738 l 367 638 l 232 638 l 232 185 q 248 121 232 140 q 307 102 264 102 q 345 104 330 102 q 367 107 360 107 l 367 0 "},"¬":{"x_min":0,"x_max":706,"ha":803,"o":"m 706 411 l 706 158 l 630 158 l 630 335 l 0 335 l 0 411 l 706 411 "},"λ":{"x_min":0,"x_max":750,"ha":803,"o":"m 750 -7 q 679 -15 716 -15 q 538 59 591 -15 q 466 214 512 97 l 336 551 l 126 0 l 0 0 l 270 705 q 223 837 247 770 q 116 899 190 899 q 90 898 100 899 l 90 1004 q 152 1011 125 1011 q 298 938 244 1011 q 373 783 326 901 l 605 192 q 649 115 629 136 q 716 95 669 95 l 736 95 q 750 97 745 97 l 750 -7 "},"W":{"x_min":0,"x_max":1263.890625,"ha":1351,"o":"m 1263 1013 l 995 0 l 859 0 l 627 837 l 405 0 l 265 0 l 0 1013 l 136 1013 l 342 202 l 556 1013 l 701 1013 l 921 207 l 1133 1012 l 1263 1013 "},">":{"x_min":18.0625,"x_max":774,"ha":792,"o":"m 774 376 l 18 40 l 18 149 l 631 421 l 18 692 l 18 799 l 774 465 l 774 376 "},"v":{"x_min":0,"x_max":675.15625,"ha":761,"o":"m 675 738 l 404 0 l 272 0 l 0 738 l 133 737 l 340 147 l 541 737 l 675 738 "},"τ":{"x_min":0.28125,"x_max":644.5,"ha":703,"o":"m 644 628 l 382 628 l 382 179 q 388 120 382 137 q 436 91 401 91 q 474 94 447 91 q 504 97 501 97 l 504 0 q 454 -9 482 -5 q 401 -14 426 -14 q 278 67 308 -14 q 260 233 260 118 l 260 628 l 0 628 l 0 739 l 644 739 l 644 628 "},"ξ":{"x_min":0,"x_max":624.9375,"ha":699,"o":"m 624 -37 q 608 -153 624 -96 q 563 -278 593 -211 l 454 -278 q 491 -183 486 -200 q 511 -83 511 -126 q 484 -23 511 -44 q 370 1 452 1 q 323 0 354 1 q 283 -1 293 -1 q 84 76 169 -1 q 0 266 0 154 q 56 431 0 358 q 197 538 108 498 q 94 613 134 562 q 54 730 54 665 q 77 823 54 780 q 143 901 101 867 l 27 901 l 27 1012 l 576 1012 l 576 901 l 380 901 q 244 863 303 901 q 178 745 178 820 q 312 600 178 636 q 532 582 380 582 l 532 479 q 276 455 361 479 q 118 281 118 410 q 165 173 118 217 q 274 120 208 133 q 494 101 384 110 q 624 -37 624 76 "},"&":{"x_min":-3,"x_max":894.25,"ha":992,"o":"m 894 0 l 725 0 l 624 123 q 471 0 553 40 q 306 -41 390 -41 q 168 -7 231 -41 q 62 92 105 26 q 14 187 31 139 q -3 276 -3 235 q 55 433 -3 358 q 248 581 114 508 q 170 689 196 640 q 137 817 137 751 q 214 985 137 922 q 384 1041 284 1041 q 548 988 483 1041 q 622 824 622 928 q 563 666 622 739 q 431 556 516 608 l 621 326 q 649 407 639 361 q 663 493 653 426 l 781 493 q 703 229 781 352 l 894 0 m 504 818 q 468 908 504 877 q 384 940 433 940 q 293 907 331 940 q 255 818 255 875 q 289 714 255 767 q 363 628 313 678 q 477 729 446 682 q 504 818 504 771 m 556 209 l 314 499 q 179 395 223 449 q 135 283 135 341 q 146 222 135 253 q 183 158 158 192 q 333 80 241 80 q 556 209 448 80 "},"Λ":{"x_min":0,"x_max":862.5,"ha":942,"o":"m 862 0 l 719 0 l 426 847 l 143 0 l 0 0 l 356 1013 l 501 1013 l 862 0 "},"I":{"x_min":41,"x_max":180,"ha":293,"o":"m 180 0 l 41 0 l 41 1013 l 180 1013 l 180 0 "},"G":{"x_min":0,"x_max":921,"ha":1011,"o":"m 921 0 l 832 0 l 801 136 q 655 15 741 58 q 470 -28 568 -28 q 126 133 259 -28 q 0 499 0 284 q 125 881 0 731 q 486 1043 259 1043 q 763 957 647 1043 q 905 709 890 864 l 772 709 q 668 866 747 807 q 486 926 589 926 q 228 795 322 926 q 142 507 142 677 q 228 224 142 342 q 483 94 323 94 q 712 195 625 94 q 796 435 796 291 l 477 435 l 477 549 l 921 549 l 921 0 "},"ΰ":{"x_min":0,"x_max":617,"ha":725,"o":"m 524 800 l 414 800 l 414 925 l 524 925 l 524 800 m 183 800 l 73 800 l 73 925 l 183 925 l 183 800 m 617 352 q 540 93 617 199 q 308 -24 455 -24 q 76 93 161 -24 q 0 352 0 199 l 0 738 l 126 738 l 126 354 q 169 185 126 257 q 312 98 220 98 q 451 185 402 98 q 492 354 492 257 l 492 738 l 617 738 l 617 352 m 489 1040 l 300 819 l 216 819 l 351 1040 l 489 1040 "},"`":{"x_min":0,"x_max":138.890625,"ha":236,"o":"m 138 699 l 0 699 l 0 861 q 36 974 0 929 q 138 1041 72 1020 l 138 977 q 82 931 95 969 q 69 839 69 893 l 138 839 l 138 699 "},"·":{"x_min":0,"x_max":142,"ha":239,"o":"m 142 585 l 0 585 l 0 738 l 142 738 l 142 585 "},"Υ":{"x_min":0.328125,"x_max":819.515625,"ha":889,"o":"m 819 1013 l 482 416 l 482 0 l 342 0 l 342 416 l 0 1013 l 140 1013 l 411 533 l 679 1013 l 819 1013 "},"r":{"x_min":0,"x_max":355.5625,"ha":432,"o":"m 355 621 l 343 621 q 179 569 236 621 q 122 411 122 518 l 122 0 l 0 0 l 0 737 l 117 737 l 117 604 q 204 719 146 686 q 355 753 262 753 l 355 621 "},"x":{"x_min":0,"x_max":675,"ha":764,"o":"m 675 0 l 525 0 l 331 286 l 144 0 l 0 0 l 256 379 l 12 738 l 157 737 l 336 473 l 516 738 l 661 738 l 412 380 l 675 0 "},"μ":{"x_min":0,"x_max":696.609375,"ha":747,"o":"m 696 -4 q 628 -14 657 -14 q 498 97 513 -14 q 422 8 470 41 q 313 -24 374 -24 q 207 3 258 -24 q 120 80 157 31 l 120 -278 l 0 -278 l 0 738 l 124 738 l 124 343 q 165 172 124 246 q 308 82 216 82 q 451 177 402 82 q 492 358 492 254 l 492 738 l 616 738 l 616 214 q 623 136 616 160 q 673 92 636 92 q 696 95 684 92 l 696 -4 "},"h":{"x_min":0,"x_max":615,"ha":724,"o":"m 615 472 l 615 0 l 490 0 l 490 454 q 456 590 490 535 q 338 654 416 654 q 186 588 251 654 q 122 436 122 522 l 122 0 l 0 0 l 0 1013 l 122 1013 l 122 633 q 218 727 149 694 q 362 760 287 760 q 552 676 484 760 q 615 472 615 600 "},".":{"x_min":0,"x_max":142,"ha":239,"o":"m 142 0 l 0 0 l 0 151 l 142 151 l 142 0 "},"φ":{"x_min":-2,"x_max":878,"ha":974,"o":"m 496 -279 l 378 -279 l 378 -17 q 101 88 204 -17 q -2 367 -2 194 q 68 626 -2 510 q 283 758 151 758 l 283 646 q 167 537 209 626 q 133 373 133 462 q 192 177 133 254 q 378 93 259 93 l 378 758 q 445 764 426 763 q 476 765 464 765 q 765 659 653 765 q 878 377 878 553 q 771 96 878 209 q 496 -17 665 -17 l 496 -279 m 496 93 l 514 93 q 687 183 623 93 q 746 380 746 265 q 691 569 746 491 q 522 658 629 658 l 496 656 l 496 93 "},";":{"x_min":0,"x_max":142,"ha":239,"o":"m 142 585 l 0 585 l 0 738 l 142 738 l 142 585 m 142 -12 q 105 -132 142 -82 q 0 -206 68 -182 l 0 -138 q 58 -82 43 -123 q 68 0 68 -56 l 0 0 l 0 151 l 142 151 l 142 -12 "},"f":{"x_min":0,"x_max":378,"ha":472,"o":"m 378 638 l 246 638 l 246 0 l 121 0 l 121 638 l 0 638 l 0 738 l 121 738 q 137 935 121 887 q 290 1028 171 1028 q 320 1027 305 1028 q 378 1021 334 1026 l 378 908 q 323 918 346 918 q 257 870 273 918 q 246 780 246 840 l 246 738 l 378 738 l 378 638 "},"“":{"x_min":1,"x_max":348.21875,"ha":454,"o":"m 140 670 l 1 670 l 1 830 q 37 943 1 897 q 140 1011 74 990 l 140 947 q 82 900 97 940 q 68 810 68 861 l 140 810 l 140 670 m 348 670 l 209 670 l 209 830 q 245 943 209 897 q 348 1011 282 990 l 348 947 q 290 900 305 940 q 276 810 276 861 l 348 810 l 348 670 "},"A":{"x_min":0.03125,"x_max":906.953125,"ha":1008,"o":"m 906 0 l 756 0 l 648 303 l 251 303 l 142 0 l 0 0 l 376 1013 l 529 1013 l 906 0 m 610 421 l 452 867 l 293 421 l 610 421 "},"6":{"x_min":53,"x_max":739,"ha":792,"o":"m 739 312 q 633 62 739 162 q 400 -31 534 -31 q 162 78 257 -31 q 53 439 53 206 q 178 859 53 712 q 441 986 284 986 q 643 912 559 986 q 732 713 732 833 l 601 713 q 544 830 594 786 q 426 875 494 875 q 268 793 331 875 q 193 517 193 697 q 301 597 240 570 q 427 624 362 624 q 643 540 552 624 q 739 312 739 451 m 603 298 q 540 461 603 400 q 404 516 484 516 q 268 461 323 516 q 207 300 207 401 q 269 137 207 198 q 405 83 325 83 q 541 137 486 83 q 603 298 603 197 "},"‘":{"x_min":1,"x_max":139.890625,"ha":236,"o":"m 139 670 l 1 670 l 1 830 q 37 943 1 897 q 139 1011 74 990 l 139 947 q 82 900 97 940 q 68 810 68 861 l 139 810 l 139 670 "},"ϊ":{"x_min":-70,"x_max":283,"ha":361,"o":"m 283 800 l 173 800 l 173 925 l 283 925 l 283 800 m 40 800 l -70 800 l -70 925 l 40 925 l 40 800 m 283 3 q 232 -10 257 -5 q 181 -15 206 -15 q 84 26 118 -15 q 41 200 41 79 l 41 737 l 166 737 l 167 215 q 171 141 167 157 q 225 101 182 101 q 247 103 238 101 q 283 112 256 104 l 283 3 "},"π":{"x_min":-0.21875,"x_max":773.21875,"ha":857,"o":"m 773 -7 l 707 -11 q 575 40 607 -11 q 552 174 552 77 l 552 226 l 552 626 l 222 626 l 222 0 l 97 0 l 97 626 l 0 626 l 0 737 l 773 737 l 773 626 l 676 626 l 676 171 q 695 103 676 117 q 773 90 714 90 l 773 -7 "},"ά":{"x_min":0,"x_max":765.5625,"ha":809,"o":"m 765 -4 q 698 -14 726 -14 q 564 97 586 -14 q 466 7 525 40 q 337 -26 407 -26 q 88 98 186 -26 q 0 369 0 212 q 88 637 0 525 q 337 760 184 760 q 465 727 407 760 q 563 637 524 695 l 563 738 l 685 738 l 685 222 q 693 141 685 168 q 748 94 708 94 q 765 95 760 94 l 765 -4 m 584 371 q 531 562 584 485 q 360 653 470 653 q 192 566 254 653 q 135 379 135 489 q 186 181 135 261 q 358 84 247 84 q 528 176 465 84 q 584 371 584 260 m 604 1040 l 415 819 l 332 819 l 466 1040 l 604 1040 "},"O":{"x_min":0,"x_max":958,"ha":1057,"o":"m 485 1041 q 834 882 702 1041 q 958 512 958 734 q 834 136 958 287 q 481 -26 702 -26 q 126 130 261 -26 q 0 504 0 279 q 127 880 0 728 q 485 1041 263 1041 m 480 98 q 731 225 638 98 q 815 504 815 340 q 733 783 815 669 q 480 912 640 912 q 226 784 321 912 q 142 504 142 670 q 226 224 142 339 q 480 98 319 98 "},"n":{"x_min":0,"x_max":615,"ha":724,"o":"m 615 463 l 615 0 l 490 0 l 490 454 q 453 592 490 537 q 331 656 410 656 q 178 585 240 656 q 117 421 117 514 l 117 0 l 0 0 l 0 738 l 117 738 l 117 630 q 218 728 150 693 q 359 764 286 764 q 552 675 484 764 q 615 463 615 593 "},"3":{"x_min":54,"x_max":737,"ha":792,"o":"m 737 284 q 635 55 737 141 q 399 -25 541 -25 q 156 52 248 -25 q 54 308 54 140 l 185 308 q 245 147 185 202 q 395 96 302 96 q 539 140 484 96 q 602 280 602 190 q 510 429 602 390 q 324 454 451 454 l 324 565 q 487 584 441 565 q 565 719 565 617 q 515 835 565 791 q 395 879 466 879 q 255 824 307 879 q 203 661 203 769 l 78 661 q 166 909 78 822 q 387 992 250 992 q 603 921 513 992 q 701 723 701 844 q 669 607 701 656 q 578 524 637 558 q 696 434 655 499 q 737 284 737 369 "},"9":{"x_min":53,"x_max":739,"ha":792,"o":"m 739 524 q 619 94 739 241 q 362 -32 516 -32 q 150 47 242 -32 q 59 244 59 126 l 191 244 q 246 129 191 176 q 373 82 301 82 q 526 161 466 82 q 597 440 597 255 q 363 334 501 334 q 130 432 216 334 q 53 650 53 521 q 134 880 53 786 q 383 986 226 986 q 659 841 566 986 q 739 524 739 719 m 388 449 q 535 514 480 449 q 585 658 585 573 q 535 805 585 744 q 388 873 480 873 q 242 809 294 873 q 191 658 191 745 q 239 514 191 572 q 388 449 292 449 "},"l":{"x_min":41,"x_max":166,"ha":279,"o":"m 166 0 l 41 0 l 41 1013 l 166 1013 l 166 0 "},"¤":{"x_min":40.09375,"x_max":728.796875,"ha":825,"o":"m 728 304 l 649 224 l 512 363 q 383 331 458 331 q 256 363 310 331 l 119 224 l 40 304 l 177 441 q 150 553 150 493 q 184 673 150 621 l 40 818 l 119 898 l 267 749 q 321 766 291 759 q 384 773 351 773 q 447 766 417 773 q 501 749 477 759 l 649 898 l 728 818 l 585 675 q 612 618 604 648 q 621 553 621 587 q 591 441 621 491 l 728 304 m 384 682 q 280 643 318 682 q 243 551 243 604 q 279 461 243 499 q 383 423 316 423 q 487 461 449 423 q 525 553 525 500 q 490 641 525 605 q 384 682 451 682 "},"κ":{"x_min":0,"x_max":632.328125,"ha":679,"o":"m 632 0 l 482 0 l 225 384 l 124 288 l 124 0 l 0 0 l 0 738 l 124 738 l 124 446 l 433 738 l 596 738 l 312 466 l 632 0 "},"4":{"x_min":48,"x_max":742.453125,"ha":792,"o":"m 742 243 l 602 243 l 602 0 l 476 0 l 476 243 l 48 243 l 48 368 l 476 958 l 602 958 l 602 354 l 742 354 l 742 243 m 476 354 l 476 792 l 162 354 l 476 354 "},"p":{"x_min":0,"x_max":685,"ha":786,"o":"m 685 364 q 598 96 685 205 q 350 -23 504 -23 q 121 89 205 -23 l 121 -278 l 0 -278 l 0 738 l 121 738 l 121 633 q 220 726 159 691 q 351 761 280 761 q 598 636 504 761 q 685 364 685 522 m 557 371 q 501 560 557 481 q 330 651 437 651 q 162 559 223 651 q 108 366 108 479 q 162 177 108 254 q 333 87 224 87 q 502 178 441 87 q 557 371 557 258 "},"‡":{"x_min":0,"x_max":777,"ha":835,"o":"m 458 238 l 458 0 l 319 0 l 319 238 l 0 238 l 0 360 l 319 360 l 319 681 l 0 683 l 0 804 l 319 804 l 319 1015 l 458 1013 l 458 804 l 777 804 l 777 683 l 458 683 l 458 360 l 777 360 l 777 238 l 458 238 "},"ψ":{"x_min":0,"x_max":808,"ha":907,"o":"m 465 -278 l 341 -278 l 341 -15 q 87 102 180 -15 q 0 378 0 210 l 0 739 l 133 739 l 133 379 q 182 195 133 275 q 341 98 242 98 l 341 922 l 465 922 l 465 98 q 623 195 563 98 q 675 382 675 278 l 675 742 l 808 742 l 808 381 q 720 104 808 213 q 466 -13 627 -13 l 465 -278 "},"η":{"x_min":0.78125,"x_max":697,"ha":810,"o":"m 697 -278 l 572 -278 l 572 454 q 540 587 572 536 q 425 650 501 650 q 271 579 337 650 q 206 420 206 509 l 206 0 l 81 0 l 81 489 q 73 588 81 562 q 0 644 56 644 l 0 741 q 68 755 38 755 q 158 720 124 755 q 200 630 193 686 q 297 726 234 692 q 434 761 359 761 q 620 692 544 761 q 697 516 697 624 l 697 -278 "}},"cssFontWeight":"normal","ascender":1189,"underlinePosition":-100,"cssFontStyle":"normal","boundingBox":{"yMin":-334,"xMin":-111,"yMax":1189,"xMax":1672},"resolution":1000,"original_font_information":{"postscript_name":"Helvetiker-Regular","version_string":"Version 1.00 2004 initial release","vendor_url":"http://www.magenta.gr/","full_font_name":"Helvetiker","font_family_name":"Helvetiker","copyright":"Copyright (c) Μagenta ltd, 2004","description":"","trademark":"","designer":"","designer_url":"","unique_font_identifier":"Μagenta ltd:Helvetiker:22-10-104","license_url":"http://www.ellak.gr/fonts/MgOpen/license.html","license_description":"Copyright (c) 2004 by MAGENTA Ltd. All Rights Reserved.\r\n\r\nPermission is hereby granted, free of charge, to any person obtaining a copy of the fonts accompanying this license (\"Fonts\") and associated documentation files (the \"Font Software\"), to reproduce and distribute the Font Software, including without limitation the rights to use, copy, merge, publish, distribute, and/or sell copies of the Font Software, and to permit persons to whom the Font Software is furnished to do so, subject to the following conditions: \r\n\r\nThe above copyright and this permission notice shall be included in all copies of one or more of the Font Software typefaces.\r\n\r\nThe Font Software may be modified, altered, or added to, and in particular the designs of glyphs or characters in the Fonts may be modified and additional glyphs or characters may be added to the Fonts, only if the fonts are renamed to names not containing the word \"MgOpen\", or if the modifications are accepted for inclusion in the Font Software itself by the each appointed Administrator.\r\n\r\nThis License becomes null and void to the extent applicable to Fonts or Font Software that has been modified and is distributed under the \"MgOpen\" name.\r\n\r\nThe Font Software may be sold as part of a larger software package but no copy of one or more of the Font Software typefaces may be sold by itself. \r\n\r\nTHE FONT SOFTWARE IS PROVIDED \"AS IS\", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO ANY WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT OF COPYRIGHT, PATENT, TRADEMARK, OR OTHER RIGHT. IN NO EVENT SHALL MAGENTA OR PERSONS OR BODIES IN CHARGE OF ADMINISTRATION AND MAINTENANCE OF THE FONT SOFTWARE BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, INCLUDING ANY GENERAL, SPECIAL, INDIRECT, INCIDENTAL, OR CONSEQUENTIAL DAMAGES, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF THE USE OR INABILITY TO USE THE FONT SOFTWARE OR FROM OTHER DEALINGS IN THE FONT SOFTWARE.","manufacturer_name":"Μagenta ltd","font_sub_family_name":"Regular"},"descender":-334,"familyName":"Helvetiker","lineHeight":1522,"underlineThickness":50});;/* global THREE, TravellingSalesman, TWEEN */
/* jshint unused:false */
'use strict';

var FOUR = FOUR || {};

/**
 * Camera path navigation utilities.
 * @constructor
 */
FOUR.PathPlanner = (function () {

    /**
     * Get the distance from P1 to P2.
     * @param {THREE.Vector3} p1 Point 1
     * @param {THREE.Vector3} p2 Point 2
     * @returns {Number} Distance
     */
    function distance (p1, p2) {
        var dx = Math.pow(p2.x - p1.x, 2);
        var dy = Math.pow(p2.y - p1.y, 2);
        var dz = Math.pow(p2.z - p1.z, 2);
        return Math.sqrt(dx + dy + dz);
    }

    function PathPlanner () {
        var self = this;
        self.PLANNING_STRATEGY = {
            GENETIC: 0,
            SIMULATED_ANNEALING: 1
        };
    }

    /**
     * Generate tour sequence for a collection of features.
     * @param {Array} features Features
     * @param {*} strategy Planning strategy ID
     * @returns {Promise}
     */
    PathPlanner.prototype.generateTourSequence = function (features, strategy) {
        // TODO execute computation in a worker
        return new Promise(function (resolve, reject) {
            var path = [];
            if (features.length > 0) {
                var ts = new TravellingSalesman(50);
                // Add points to itinerary
                features.forEach(function (obj) {
                    ts.addPoint({
                        focus: 0,
                        obj: obj,
                        radius: obj.geometry.boundingSphere.radius,
                        x: obj.position.x,
                        y: obj.position.y,
                        z: obj.position.z
                    });
                });
                // Initialize the population
                ts.init();
                console.info('Initial distance: ' + ts.getPopulation().getFittest().getDistance());
                // Evolve the population
                try {
                    ts.evolve(100);
                    console.info('Final distance: ' + ts.getPopulation().getFittest().getDistance());
                    path = ts.getSolution();
                } catch (e) {
                    reject(e);
                }
            }
            resolve(path);
        });
    };

    PathPlanner.prototype.tweenToOrientation = function (camera, orientation, progress) {
        // TODO animation time needs to be relative to the distance traversed
        return new Promise(function (resolve) {
            var emit = progress;
            var start = { x: camera.up.x, y: camera.up.y, z: camera.up.z };
            var finish = { x: orientation.x, y: orientation.y, z: orientation.z };
            var tween = new TWEEN.Tween(start).to(finish, 1000);
            tween.easing(TWEEN.Easing.Cubic.InOut);
            tween.onComplete(function () {
                camera.setUp(new THREE.Vector3(this.x, this.y, this.z));
                emit('update');
                emit('continuous-update-end');
                resolve();
            });
            tween.onUpdate(function () {
                camera.setUp(new THREE.Vector3(this.x, this.y, this.z));
                emit('update');
            });
            tween.start();
            emit('continuous-update-start');
            emit('update');
        });
    };

    /**
     * Tween the camera to the specified position.
     * @param {THREE.Camera} camera Camera
     * @param {THREE.Vector3} position New camera position
     * @param {THREE.Vector3} target New camera target position
     * @param {Function} progress Progress callback
     * @returns {Promise}
     */
    PathPlanner.prototype.tweenToPosition = function (camera, position, target, progress) {
        // TODO animation time needs to be relative to the distance traversed
        // TODO need better path planning ... there is too much rotation happening right now
        return new Promise(function (resolve) {
            var emit = progress;
            // start and end tween values
            var start = {
                x: camera.position.x, y: camera.position.y, z: camera.position.z,
                tx: camera.target.x, ty: camera.target.y, tz: camera.target.z
            };
            var finish = {
                x: position.x, y: position.y, z: position.z,
                tx: target.x, ty: target.y, tz: target.z
            };
            // calculate the animation duration
            var cameraDistance = distance(camera.position, position);
            var targetDistance = distance(camera.target, target);
            var dist = cameraDistance > targetDistance ? cameraDistance : targetDistance;
            // animate
            var tween = new TWEEN.Tween(start).to(finish, 1500);
            tween.easing(TWEEN.Easing.Cubic.InOut);
            tween.onComplete(function () {
                var tweened = this;
                camera.distance = distance(camera.position, camera.target);
                camera.position.set(tweened.x, tweened.y, tweened.z);
                camera.lookAt(new THREE.Vector3(tweened.tx, tweened.ty, tweened.tz));
                camera.target = new THREE.Vector3(tweened.tx, tweened.ty, tweened.tz);
                emit('update');
                emit('continuous-update-end');
                resolve();
            });
            tween.onUpdate(function () {
                var tweened = this;
                camera.distance = distance(camera.position, camera.target);
                camera.position.set(tweened.x, tweened.y, tweened.z);
                camera.target = new THREE.Vector3(tweened.tx, tweened.ty, tweened.tz);
                camera.lookAt(new THREE.Vector3(tweened.tx, tweened.ty, tweened.tz));
                console.info(tweened.tx,tweened.ty,tweened.tz);
                emit('update');
            });
            tween.start();
            emit('continuous-update-start');
            emit('update');
        });
    };

    return PathPlanner;

}());
;'use strict';

var FOUR = FOUR || {};

/**
 * Simulated annealing path planner.
 * @see http://www.theprojectspot.com/tutorial-post/simulated-annealing-algorithm-for-beginners/6
 */
var SimulatedAnnealing = (function () {

    /**
     * Simulated annealing path planner.
     * @constructor
     */
    function SimulatedAnnealing() {
    }

    return SimulatedAnnealing;
}());
;/* jshint unused:false */
'use strict';

var FOUR = FOUR || {};

/**
 * Travelling salesman path planner.
 * Based on http://www.theprojectspot.com/tutorial-post/applying-a-genetic-algorithm-to-the-travelling-salesman-problem/5
 */
var TravellingSalesman = (function () {

    // The list of points that must be visited by the salesman.
    var Itinerary = [];

    /**
     * A proposed solution.
     * @constructor
     */
    function Tour () {
        this.distance = 0;
        this.fitness = 0;
        this.tour = [];
        for (var i = 0; i < Itinerary.length; i++) {
            this.tour.push(null);
        }
    }

    Tour.prototype.checkForDuplicateValues = function () {
        var i;
        for (i = 0; i < this.tour.length; i++) {
            var p = this.tour[i];
            if (this.tour.lastIndexOf(p) !== i) {
                throw new Error('Tour contains a duplicate element');
            }
        }
    };

    Tour.prototype.checkForNullValues = function () {
        var i;
        for (i = 0; i < this.tour.length; i++) {
            if (this.tour[i] === null) {
                throw new Error('Tour contains a null entry');
            }
        }
    };

    Tour.prototype.containsPoint = function (p) {
        var result = false;
        this.tour.forEach(function (point) {
            if (point && point.x === p.x && point.y === p.y) {
                result = true;
            }
        });
        return result;
    };

    Tour.prototype.distanceBetween = function (p1, p2) {
        var dx = Math.abs(p2.x - p1.x);
        var dy = Math.abs(p2.y - p1.y);
        return Math.sqrt((dx * dx) + (dy * dy));
    };

    Tour.prototype.generateIndividual = function () {
        // Loop through all our destination cities and add them to our tour
        for (var i = 0; i < Itinerary.length; i++) {
            this.setPoint(i, Itinerary[i]);
        }
        // Randomly reorder the tour
        this.shuffle();
    };

    Tour.prototype.getPoint = function (i) {
        return this.tour[i];
    };

    Tour.prototype.getFitness = function () {
        if (this.fitness === 0) {
            this.fitness = 1 / this.getDistance();
        }
        return this.fitness;
    };

    Tour.prototype.getDistance = function () {
        if (this.distance === 0) {
            var i, p1, p2, totalDistance = 0;
            // Loop through our tour's cities
            for (i = 0; i < this.tour.length; i++) {
                // point we're travelling from
                p1 = this.getPoint(i);
                // Check we're not on our tour's last point, if we are set our
                // tour's final destination point to our starting point
                if (i + 1 < this.tour.length) {
                    p2 = this.tour[i + 1];
                }
                else {
                    p2 = this.tour[0];
                }
                // Get the distance between the two cities
                totalDistance += this.distanceBetween(p1, p2);
            }
            this.distance = totalDistance;
        }
        return this.distance;
    };

    Tour.prototype.init = function () {
        for (var i = 0; i < Itinerary.length; i++) {
            this.tour.push(null);
        }
    };

    Tour.prototype.setPoint = function (i, point) {
        this.tour[i] = point;
        this.fitness = 0;
        this.distance = 0;
    };

    Tour.prototype.shuffle = function () {
        var currentIndex = this.tour.length, temporaryValue, randomIndex;
        // While there remain elements to shuffle...
        while (0 !== currentIndex) {
            // Pick a remaining element...
            randomIndex = Math.floor(Math.random() * currentIndex);
            currentIndex -= 1;
            // And swap it with the current element.
            temporaryValue = this.tour[currentIndex];
            this.tour[currentIndex] = this.tour[randomIndex];
            this.tour[randomIndex] = temporaryValue;
        }
    };

    Tour.prototype.tourSize = function () {
        return this.tour.length;
    };


    /**
     * A collection of potential tour solutions.
     * @param populationSize
     * @param initialise
     * @constructor
     */
    function Population(populationSize, initialise) {
        this.tours = [];
        var i;
        for (i = 0; i < populationSize; i++) {
            this.tours.push(null);
        }
        if (initialise) {
            for (i = 0; i < populationSize; i++) {
                var newTour = new Tour();
                newTour.generateIndividual();
                this.tours[i] = newTour;
            }
        }
    }

    Population.prototype.getFittest = function () {
        var fittest = this.tours[0], i;
        for (i = 1; i < this.tours.length; i++) {
            if (fittest.getFitness() <= this.tours[i].getFitness()) {
                fittest = this.tours[i];
            }
        }
        return fittest;
    };

    Population.prototype.getPopulationSize = function () {
        return this.tours.length;
    };

    Population.prototype.getTour = function (i) {
        return this.tours[i];
    };

    Population.prototype.saveTour = function (i, tour) {
        this.tours[i] = tour;
    };


    /**
     * Travelling salesman.
     * @param {Integer} Population size
     * @constructor
     */
    function TravellingSalesman(populationSize) {
        this.elitism = true;
        this.mutationRate = 0.015;
        this.population = null;
        this.populationSize = populationSize;
        this.tournamentSize = 5;
    }

    /**
     * Add an object to the tour list. The object must contain properties x and y
     * at minimum.
     * @param {Object} obj Object with x and y coordinate properties
     */
    TravellingSalesman.prototype.addPoint = function (obj) {
        Itinerary.push(obj);
    };

    TravellingSalesman.prototype.crossover = function (parent1, parent2) {
        var i, ii;
        // Create new child tour
        var child = new Tour();
        // Get start and end sub tour positions for parent1's tour
        var startPos = Math.floor(Math.random() * parent1.tourSize());
        var endPos = Math.floor(Math.random() * parent1.tourSize());
        // Loop and add the sub tour from parent1 to our child
        for (i = 0; i < child.tourSize(); i++) {
            // If our start position is less than the end position
            if (startPos < endPos && i > startPos && i < endPos) {
                child.setPoint(i, parent1.getPoint(i));
            }
            // If our start position is larger
            else if (startPos > endPos) {
                if (!(i < startPos && i > endPos)) {
                    child.setPoint(i, parent1.getPoint(i));
                }
            }
        }
        // Loop through parent2's point tour
        for (i = 0; i < parent2.tourSize(); i++) {
            // If child doesn't have the point add it
            if (!child.containsPoint(parent2.getPoint(i))) {
                // Loop to find a spare position in the child's tour
                for (ii = 0; ii < child.tourSize(); ii++) {
                    // Spare position found, add point
                    if (child.getPoint(ii) === null) {
                        child.setPoint(ii, parent2.getPoint(i));
                        break;
                    }
                }
            }
        }
        child.checkForNullValues();
        child.checkForDuplicateValues();
        // force fitness value to update?
        return child;
    };

    TravellingSalesman.prototype.evolve = function (generations) {
        this.population = this.evolvePopulation(this.population);
        for (var i = 0; i < generations; i++) {
            this.population = this.evolvePopulation(this.population);
        }
    };

    TravellingSalesman.prototype.evolvePopulation = function (pop) {
        var i;
        var newPopulation = new Population(pop.getPopulationSize(), false);
        // Keep our best individual if elitism is enabled
        var elitismOffset = 0;
        if (this.elitism) {
            newPopulation.saveTour(0, pop.getFittest());
            elitismOffset = 1;
        }
        // Crossover population
        // Loop over the new population's size and create individuals from
        // Current population
        for (i = elitismOffset; i < newPopulation.getPopulationSize(); i++) {
            // Select parents
            var parent1 = this.tournamentSelection(pop);
            var parent2 = this.tournamentSelection(pop);
            // Crossover parents
            var childTour = this.crossover(parent1, parent2);
            // Add child to new population
            newPopulation.saveTour(i, childTour);
        }
        // Mutate the new population a bit to add some new genetic material
        for (i = elitismOffset; i < newPopulation.getPopulationSize(); i++) {
            this.mutate(newPopulation.getTour(i));
        }
        return newPopulation;
    };

    TravellingSalesman.prototype.getPopulation = function () {
        return this.population;
    };

    TravellingSalesman.prototype.getSolution = function () {
        return this.population.getFittest().tour;
    };

    TravellingSalesman.prototype.init = function () {
        this.population = new Population(this.populationSize, true);
    };

    TravellingSalesman.prototype.mutate = function (tour) {
        // Loop through tour cities
        for (var tourPos1 = 0; tourPos1 < tour.tourSize(); tourPos1++) {
            // Apply mutation rate
            if (Math.random() < this.mutationRate) {
                // Get a second random position in the tour
                var tourPos2 = Math.floor(tour.tourSize() * Math.random());
                // Get the cities at target position in tour
                var point1 = tour.getPoint(tourPos1);
                var point2 = tour.getPoint(tourPos2);
                // Swap them around
                tour.setPoint(tourPos2, point1);
                tour.setPoint(tourPos1, point2);
            }
        }
    };

    TravellingSalesman.prototype.setPoints = function (points) {
        var tourManager = Itinerary;
        points.forEach(function (point) {
            tourManager.push(point);
        });
    };

    TravellingSalesman.prototype.tournamentSelection = function (pop) {
        // Create a tournament population
        var tournament = new Population(this.tournamentSize, false);
        // For each place in the tournament get a random candidate tour and
        // add it
        for (var i = 0; i < this.tournamentSize; i++) {
            var randomId = Math.floor(Math.random() * pop.getPopulationSize());
            tournament.saveTour(i, pop.getTour(randomId));
        }
        // Get the fittest tour
        return tournament.getFittest();
    };

    return TravellingSalesman;
}());
