"use strict";

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

;// default entity values
FOUR.DEFAULT = {
  CAMERA: {
    far: 1000,
    fov: 45,
    height: 1,
    name: 'camera',
    near: 0.1,
    width: 1
  }
};


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
};;FOUR.KeyInputController = (function () {

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
;FOUR.Scene = (function () {

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

}());;FOUR.SelectionSet = (function () {

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
    if (!obj) {
      return;
    }
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
    if (!objects || objects.length < 1) {
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
    if (!objects || !Array.isArray(objects)){
      return;
    }
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
;FOUR.TargetCamera = (function () {

    /**
     * The camera has a default position of 0,-1,0, a default target of 0,0,0 and
     * distance of 1.
     * @todo setters to intercept changes on position, target, distance properties
     * @todo setters to intercept changes on THREE.Camera properties
     */
    function TargetCamera (fov, aspect, near, far) {
        THREE.PerspectiveCamera.call(this);
        var self = this;

        self.MAXIMUM_DISTANCE = 10000;
        self.MINIMUM_DISTANCE = 1;
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

        self.distance = 1;
        self.position.set(0,-1,0);
        self.target = new THREE.Vector3(0, 0, 0);

        // camera motion planner
        self.planner = new FOUR.PathPlanner();

        // set defaults
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
        return this.distance;
    };

    /**
     * Get direction from camera to target.
     * @returns {THREE.Vector}
     */
    TargetCamera.prototype.getDirection = function () {
        return this.getOffset().normalize();
    };

    /**
     * Get offset from camera to target.
     * @returns {THREE.Vector}
     */
    TargetCamera.prototype.getOffset = function () {
        return new THREE.Vector3().subVectors(this.target, this.position);
    };

    /**
     * Get camera position.
     * @returns {THREE.Vector}
     */
    TargetCamera.prototype.getPosition = function () {
        return new THREE.Vector3().copy(this.position);
    };

    /**
     * Get camera target.
     * @returns {THREE.Vector}
     */
    TargetCamera.prototype.getTarget = function () {
        return new THREE.Vector3().copy(this.target);
    };

    /**
     * Reset camera orientation so that camera.up aligns with +Z.
     * @param {Function} progress Progress callback
     * @param {Boolean} animate Animate the change
     */
    TargetCamera.prototype.resetOrientation = function (progress, animate) {
        var self = this, up = new THREE.Vector3(0,0,1);
        animate = animate || false;
        if (animate) {
            return self.planner.tweenToOrientation(self, up, progress || self.emit.bind(self));
        } else {
            return self.setUp(up);
        }
    };

    /**
     * Set the distance from the camera to the target. Keep the target position
     * fixed and move the camera position as required.
     * @param {Number} distance Distance from target to camera
     * @param {Boolean} animate Animate the change
     * @returns {Promise}
     */
    TargetCamera.prototype.setDistance = function (distance, animate) {
        var offset = this.getOffset(), position, self = this;
        animate = animate || false;
        // ensure that the offset is not less than the minimum distance
        self.distance = distance < this.MINIMUM_DISTANCE ? this.MINIMUM_DISTANCE : distance;
        offset.setLength(self.distance);
        // the new camera position
        position = new THREE.Vector3().addVectors(offset.negate(), self.target);
        if (animate) {
            return self.tweenToPosition(position, self.target);
        } else {
            self.position.copy(position);
            self.lookAt(self.target);
            self.dispatchEvent({type:'update'});
            return Promise.resolve();
        }
    };

    // FIXME update this to set the target, rotate the camera toward it or just rotate the camera
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
        animate = animate || false;
        // direction from camera to new look at position
        offset = new THREE.Vector3().subVectors(lookAt, self.position);
        offset.setLength(self.distance);
        var target = new THREE.Vector3().addVectors(self.position, offset);
        return self.tweenToPosition(self.position, target);
    };

    /**
     * Move the camera to the specified position. Update the camera target.
     * Maintain the current distance.
     * @param {THREE.Vector3} position Position
     * @param {Boolean} animate Animate the change
     * @returns {Promise}
     */
    TargetCamera.prototype.setPosition = function (position, animate) {
        var offset = this.getOffset(), self = this, target;
        animate = animate || false;
        target = new THREE.Vector3().addVectors(offset, position);
        if (animate) {
            return self.tweenToPosition(position, target);
        } else {
            self.position.copy(position);
            self.target.copy(target);
            self.lookAt(self.target);
            self.distance = new THREE.Vector3().subVectors(self.position, self.target).length();
            self.dispatchEvent({type:'update'});
            return Promise.resolve();
        }
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
        return self.tweenToPosition(pos, target);
    };

    /**
     * Move the camera so that the target is at the specified position.
     * Maintain the current camera orientation and distance.
     * @param {THREE.Vector3} target Target position
     * @param {Boolean} animate Animate the change
     * @returns {Promise}
     */
    TargetCamera.prototype.setTarget = function (target, animate) {
        var offset = this.getOffset().negate(), position, self = this;
        animate = animate || false;
        position = new THREE.Vector3().addVectors(offset, target);
        if (animate) {
            return self.tweenToPosition(position, target);
        } else {
            self.position.copy(position);
            self.target.copy(target);
            self.lookAt(self.target);
            self.distance = new THREE.Vector3().subVectors(self.position, self.target).length();
            self.dispatchEvent({type:'update'});
            return Promise.resolve();
        }
    };

    /**
     * Set camera up direction.
     * @param {THREE.Vector3} vec Up direction
     */
    TargetCamera.prototype.setUp = function (vec, animate) {
        var self = this;
        animate = animate || false;
        self.up = vec;
        self.dispatchEvent({type:'update'});
        if (animate) {
            return Promise.resolve();
        } else {
            self.dispatchEvent({type:'update'});
            return Promise.resolve();
        }
    };

    /**
     * Move the camera to the predefined orientation. Ensure that the entire
     * bounding box is visible within the camera view.
     * @param {String} orientation Orientation
     * @param {BoundingBox} bbox View bounding box
     * @param {Boolean} animate Animate the change
     * @returns {Promise}
     */
    TargetCamera.prototype.setView = function (orientation, bbox, animate) {
        var center = bbox.getCenter(), direction = new THREE.Vector3(), distance, position, radius = bbox.getRadius(), self = this, target;
        animate = animate || false;
        // new camera position, target, direction, orientation
        position = new THREE.Vector3().copy(center);
        target = new THREE.Vector3().copy(center);
        distance = radius / Math.tan(Math.PI * self.fov / 360);
        // reorient the camera relative to the bounding box
        if (orientation === self.VIEWS.TOP) {
            position.z = center.z + distance;
            direction.set(0,0,-1);
        }
        else if (orientation === self.VIEWS.FRONT) {
            position.y = center.y - distance;
            direction.set(0,-1,0);
        }
        else if (orientation === self.VIEWS.BACK) {
            position.y = center.y + distance;
            direction.set(0,1,0);
        }
        else if (orientation === self.VIEWS.RIGHT) {
            position.x = center.x + distance;
            direction.set(-1,0,0);
        }
        else if (orientation === self.VIEWS.LEFT) {
            position.x = center.x - distance;
            direction.set(1,0,0);
        }
        else if (orientation === self.VIEWS.BOTTOM) {
            position.z = center.z - distance;
            direction.set(0,0,1);
        }
        else if (orientation === self.VIEWS.PERSPECTIVE) {
            position.set(center.x - 100, center.y - 100, center.z + 100);
            direction.set(1,1,-1);
        }
        if (animate) {
            return self.tweenToPosition(position, target);
        } else {
            self.position.copy(position);
            self.target.copy(target);
            self.lookAt(self.target);
            self.distance = new THREE.Vector3().subVectors(self.position, self.target).length();
            self.dispatchEvent({type:'update'});
            return Promise.resolve();
        }
    };

    /**
     * Tween camera up orientation.
     * @param {THREE.Euler} orientation
     * @returns {Promise}
     */
    TargetCamera.prototype.tweenToOrientation = function (orientation) {
        var self = this;
        return new Promise(function (resolve) {
            var start = { x: self.up.x, y: self.up.y, z: self.up.z };
            var finish = { x: orientation.x, y: orientation.y, z: orientation.z };
            var tween = new TWEEN.Tween(start).to(finish, 1000);
            tween.easing(TWEEN.Easing.Cubic.InOut);
            tween.onComplete(function () {
                self.up.set(this.x, this.y, this.z);
                self.dispatchEvent({type:'update'});
                self.dispatchEvent({type:'continuous-update-end'});
                resolve();
            });
            tween.onUpdate(function () {
                self.up.set(this.x, this.y, this.z);
                self.dispatchEvent({type:'update'});
            });
            tween.start();
            self.dispatchEvent({type:'continuous-update-start'});
        });
    };

    /**
     * Tween the camera to the specified position.
     * @param {THREE.Vector3} position New camera position
     * @param {THREE.Vector3} target New camera target position
     * @param {THREE.Quaternion} orientation New camera orientation
     * @returns {Promise}
     */
    TargetCamera.prototype.tweenToPosition = function (position, target, orientation) {
        var self = this;
        return new Promise(function (resolve) {
            // start and end tween values
            var start = {
                x: self.position.x, y: self.position.y, z: self.position.z,
                tx: self.target.x, ty: self.target.y, tz: self.target.z
            };
            var finish = {
                x: position.x, y: position.y, z: position.z,
                tx: target.x, ty: target.y, tz: target.z
            };
            // TODO calculate the animation duration
            var cameraDistance = new THREE.Vector3().subVectors(self.position, position).length;
            var targetDistance = new THREE.Vector3().subVectors(self.target, target).length();
            var distance = cameraDistance > targetDistance ? cameraDistance : targetDistance;
            // execute animation
            var tween = new TWEEN.Tween(start).to(finish, 1500);
            tween.easing(TWEEN.Easing.Cubic.InOut);
            tween.onComplete(function () {
                var d = this;
                self.position.set(d.x, d.y, d.z);
                self.target.set(d.tx, d.ty, d.tz);
                self.lookAt(self.target);
                self.distance = new THREE.Vector3().subVectors(self.position, self.target).length();
                self.dispatchEvent({type:'update'});
                self.dispatchEvent({type:'continuous-update-end'});
                resolve();
            });
            tween.onUpdate(function () {
                var d = this;
                self.position.set(d.x, d.y, d.z);
                self.target.set(d.tx, d.ty, d.tz);
                self.lookAt(self.target);
                self.distance = new THREE.Vector3().subVectors(self.position, self.target).length();
                self.dispatchEvent({type:'update'});
            });
            tween.start();
            self.dispatchEvent({type:'continuous-update-start'});
        });
    };

    /**
     * Zoom in incrementally.
     * @param {Boolean} animate Animate the change
     * @returns {Promise}
     */
    TargetCamera.prototype.zoomIn = function (animate) {
        var distance = this.getDistance() / this.ZOOM_FACTOR, offset, position, self = this;
        animate = animate || false;
        // ensure that the distance is never less than the minimum
        distance = distance <= this.MINIMUM_DISTANCE ? this.MINIMUM_DISTANCE : distance;
        if (animate) {
            offset = this.getOffset();
            offset.setLength(distance);
            position = new THREE.Vector3().addVectors(self.target, offset);
            return self.tweenToPosition(position, self.target);
        } else {
            self.setDistance(distance, false);
            return Promise.resolve();
        }
    };

    /**
     * Zoom out incrementally.
     * @param {Boolean} animate Animate the change
     * @returns {Promise}
     */
    TargetCamera.prototype.zoomOut = function (animate) {
        var distance = this.getDistance() * this.ZOOM_FACTOR, offset, position, self = this;
        // ensure that the distance is never greater than the maximum
        distance = distance >= this.MAXIMUM_DISTANCE ? this.MAXIMUM_DISTANCE : distance;
        animate = animate || false;
        if (animate) {
            offset = this.getOffset();
            offset.setLength(distance);
            position = new THREE.Vector3().addVectors(self.target, offset);
            return self.tweenToPosition(position, self.target);
        } else {
            self.setDistance(distance, false);
            return Promise.resolve();
        }
    };

    /**
     * Zoom to fit the bounding box.
     * @param {BoundingBox} bbox Bounding box
     * @param {Boolean} animate Animate the change
     * @returns {Promise}
     */
    TargetCamera.prototype.zoomToFit = function (bbox, animate) {
        var distance, offset = this.getOffset(), position, self = this, target;
        animate = animate || false;
        // get the distance required to fit all entities within the view
        distance = bbox.getRadius() / Math.tan(Math.PI * self.fov / 360);
        // move the camera to the new position
        if (animate) {
            offset.setLength(distance);
            target = bbox.getCenter();
            position = new THREE.Vector3().addVectors(target, offset);
            return self.tweenToPosition(position, target);
        } else {
            self.setDistance(distance);
            return Promise.resolve();
        }
    };

    return TargetCamera;

}());
;FOUR.ViewAxis = (function () {

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
            z: null
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

        //axis.rotateOnAxis(new THREE.Vector3(1,0,0), Math.PI * 2);

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
        self.camera.position.x = 0;
        self.camera.position.y = -2.5;
        self.camera.position.z = 0;
        self.camera.up = new THREE.Vector3(0, 0, 1);
        self.camera.lookAt(new THREE.Vector3(0, 0, 0));
    };

    ViewAxis.prototype.setupGeometry = function () {
        var self = this;
        if (self.enable.axis) {
            self.axis = self.createAxis();
            self.scene.add(self.axis);
            if (self.enable.labels) {
                self.createLabels();
                self.axis.add(self.labels);
            }
            if (self.enable.xyPlane) {
                self.axisXYPlane = self.createXYPlane();
                self.axis.add(self.axisXYPlane);
            }
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
        //console.info('update');
        Object.keys(self.label).forEach(function (key) {
            self.label[key].lookAt(self.camera.position);
        });
        requestAnimationFrame(self.render.bind(self));
    };

    ViewAxis.prototype.updateOrientation = function () {
        var self = this;

        var identity = (new THREE.Matrix4()).identity();
        identity.elements[0] = -1;
        identity.elements[10] = -1;

        //var m = self.viewport.camera.matrixWorld;
        //self.axis.matrixWorld.extractRotation(m);
        //var lookAtVector = new THREE.Vector3(0, 0, 1)
        //    .applyQuaternion(self.viewport.camera.quaternion).normalize();
        //self.axis.lookAt(lookAtVector);
        //self.axis.quaternion.setFromUnitVectors(new THREE.Vector3(0,0,1), lookAtVector);

        var euler = new THREE.Euler(
            self.viewport.camera.rotation.x,
            self.viewport.camera.rotation.y,
            self.viewport.camera.rotation.z,
            'XZY'
        );
        //self.camera.quaternion.setFromEuler(euler).inverse();
        self.axis.quaternion.setFromEuler(euler).inverse();
        self.axis.applyMatrix(identity);
        self.render();
    };

    return ViewAxis;

}());
;FOUR.Viewcube = (function () {

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
            //console.info('over', label, intersects);
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
        self.mouse.y = - (event.offsetY / self.domElement.clientHeight) * 2 + 1;
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
                //self.tweenViewRotation(Math.PI * 0.5, Math.PI * 0.25, 0);
                //self.tweenViewRotation(0, Math.PI * 0.75, Math.PI / 2); // bottom right edge
                self.tweenViewRotation(Math.PI, Math.PI, Math.PI * 1.75); // front right edge
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
            var targetEuler = new THREE.Euler(rx, ry, rz, 'XYZ');
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
;/**
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
    self.listeners = {};
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
    console.info('render');
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
    console.info('Set active viewport controller to', name);
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
;/**
 * The look controller rotates the view around the current camera position,
 * emulating a first person view.
 *
 *
 * by moving the camera lookAt around
 * the current position. The camera target is maintained as the default .
 *
 * When the camera is disabled, the camera direction is reverted to look at the
 * target.
 *
 * If a THREE.PerspectiveCamera
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
;FOUR.MultiController = (function () {

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
        var events = ['continuous-update-end','continuous-update-start','update'];
        events.forEach(function (event) {
            addListener(name + '-' + event, controller, event, function () {
                self.dispatchEvent({type:event});
            });
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
;/**
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
;/**
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
            lookAt: new THREE.Vector3(),
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
        this.keydown = (event.keyCode === this.KEY.CTRL);
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
            self.pan.lookAt.subVectors(self.camera.position, self.camera.target);
            // TODO add a scaling factor on the mouse delta
            self.pan.delta.subVectors(self.pan.end, self.pan.start);
            if (self.pan.delta.lengthSq() > self.EPS) {
                // compute offset
                self.pan.delta.multiplyScalar(self.pan.lookAt.length() * self.panSpeed);
                self.offset.copy(self.pan.lookAt).cross(self.camera.up).setLength(self.pan.delta.x);
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
;/**
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
            this.state = this.STATE.NONE;
        }
    };

    RotateController.prototype.onMouseDown = function (event) {
        if (this.enabled === false) {
            return;
        }
        if ((this.keydown && event.button === THREE.MOUSE.LEFT) || event.button === THREE.MOUSE.MIDDLE) {
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
;FOUR.SelectionController = (function () {

  /**
   * Mouse based selection controller. The controller emits the following
   * selection events:
   *
   * add    - add one or more objects to the selection set
   * hover  - mouse over one or more objects
   * remove - remove one or more objects from the selection set
   * toggle - toggle the selection state for one or more objects
   *
   * The controller emits the following camera realted events:
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
    if (selected) {
      // CTRL double click rotates the camera toward the selected point
      if (this.modifiers[this.KEY.CTRL]) {
        this.dispatchEvent({type:'lookat', position:selected.point, object:selected.object});
      }
      // double click navigates the camera to the selected point
      else {
        this.dispatchEvent({type:'settarget', position:selected.point, object:selected.object});
      }
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
    if (selected) {
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
    }
  };

  SelectionController.prototype.setFilter = function () {};

  SelectionController.prototype.update = function () {}; // do nothing

  return SelectionController;

}());
;FOUR.TourController = (function () {

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
;/**
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
;/**
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
        self.enforceWalkHeight = true;
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
                self.emit({type:'continuous-update-start'});
                break;
            case self.KEY.MOVE_FORWARD:
                self.move.forward = true;
                self.emit({type:'continuous-update-start'});
                break;
            case self.KEY.MOVE_BACK:
                self.move.backward = true;
                self.emit({type:'continuous-update-start'});
                break;
            case self.KEY.MOVE_LEFT:
                self.move.left = true;
                self.emit({type:'continuous-update-start'});
                break;
            case self.KEY.MOVE_RIGHT:
                self.move.right = true;
                self.emit({type:'continuous-update-start'});
                break;
            case self.KEY.MOVE_UP:
                self.move.up = true;
                self.emit({type:'continuous-update-start'});
                break;
            case self.KEY.MOVE_DOWN:
                self.move.down = true;
                self.emit({type:'continuous-update-start'});
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
                self.emit({type:'continuous-update-end'});
                break;
            case self.KEY.MOVE_BACK:
                self.move.backward = false;
                self.emit({type:'continuous-update-end'});
                break;
            case self.KEY.MOVE_LEFT:
                self.move.left = false;
                self.emit({type:'continuous-update-end'});
                break;
            case self.KEY.MOVE_RIGHT:
                self.move.right = false;
                self.emit({type:'continuous-update-end'});
                break;
            case self.KEY.MOVE_UP:
                self.move.up = false;
                self.emit({type:'continuous-update-end'});
                break;
            case self.KEY.MOVE_DOWN:
                self.move.down = false;
                self.emit({type:'continuous-update-end'});
                break;
            case self.KEY.CANCEL:
                Object.keys(self.move).forEach(function (key) {
                    self.move[key] = false;
                });
                self.lookChange = false;
                self.emit({type:'continuous-update-end'});
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
;/**
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
;/**
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
        this.strategy = self.PLANNING_STRATEGY.GENETIC;
    }

    /**
     * Generate tour sequence for a collection of features.
     * @param {Array} features Features
     * @param {*} strategy Planning strategy ID
     * @returns {Promise}
     */
    PathPlanner.prototype.generateTourSequence = function (features) {
        // TODO execute computation in a worker
        return new Promise(function (resolve, reject) {
            var path = [];
            if (features.length > 0) {
                var ts = new TravellingSalesman();
                ts.setPopulationSize(50);
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

    PathPlanner.prototype.setPlanningStragegy = function (strategy) {
        this.strategy = strategy;
    };

    return PathPlanner;

}());
;/**
 * Simulated annealing path planner.
 * @see http://www.theprojectspot.com/tutorial-post/simulated-annealing-algorithm-for-beginners/6
 */
var SimulatedAnnealer = (function () {

    /**
     * A proposed solution.
     * @constructor
     * @param {Number} size Itinerary size
     */
    function Tour(size) {
        this.distance = 0;
        this.fitness = 0;
        this.tour = [];
        if (size) {
            for (var i = 0; i < size; i++) {
                this.tour.push(null);
            }
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
            if (point !== null && point.x === p.x && point.y === p.y) {
                result = true;
            }
        });
        return result;
    };

    Tour.prototype.copy = function (tour) {
        this.tour = tour.slice();
        this.getFitness();
    };

    Tour.prototype.distanceBetween = function (p1, p2) {
        var dx = Math.abs(p2.x - p1.x);
        var dy = Math.abs(p2.y - p1.y);
        return Math.sqrt((dx * dx) + (dy * dy));
    };

    Tour.prototype.generateIndividual = function (itinerary) {
        this.tour = itinerary.slice();
        this.shuffle();
        this.getFitness();
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

    Tour.prototype.updateFitness = function () {
        this.fitness = 1 / this.getDistance();
    };

    function SimulatedAnnealer() {
        this.best = null; // best solution
        this.coolingRate = 0.003;
        this.itinerary = [];
        this.temp = 0;
    }

    SimulatedAnnealer.prototype.acceptanceProbability = function (energy, newEnergy, temperature) {
        // If the new solution is better, accept it
        if (newEnergy < energy) {
            return 1.0;
        }
        // If the new solution is worse, calculate an acceptance probability
        return Math.exp((energy - newEnergy) / temperature);
    };

    /**
     * Add point to itinerary.
     * @param {Object} p Point
     */
    SimulatedAnnealer.prototype.addPoint = function (p) {
        this.itinerary.push(p);
        this.checkForDuplicatePoints();
    };

    /**
     * Check for duplicate points in the itinerary. Throw an error when a
     * duplicate is found.
     */
    SimulatedAnnealer.prototype.checkForDuplicatePoints = function () {
        var i, p, px, py, x = [], y = [];
        // build an index of points
        for (i = 0; i < this.itinerary.length; i++) {
            x.push(this.itinerary[i].x);
            y.push(this.itinerary[i].y);
        }
        // check for duplicates
        for (i = 0; i < this.itinerary.length; i++) {
            p = this.itinerary[i];
            px = x.lastIndexOf(p.x);
            py = y.lastIndexOf(p.y);
            if (px === py && px !== i) {
                throw new Error('Tour contains a duplicate element');
            }
        }
    };

    SimulatedAnnealer.prototype.evolve = function (temperature) {
        var newSolution, pointSwap1, pointSwap2, currentEnergy, neighbourEnergy, tourPos1, tourPos2;

        this.temp = temperature;

        // Set as current best
        this.best = new Tour(0);
        this.best.copy(this.currentSolution.tour);

        // Loop until system has cooled
        while (this.temp > 1) {
            // Create new neighbour tour
            newSolution = new Tour(0);
            newSolution.copy(this.currentSolution.tour);

            // Get a random positions in the tour
            tourPos1 = Math.floor(newSolution.tourSize() * Math.random());
            tourPos2 = Math.floor(newSolution.tourSize() * Math.random());

            // Get the cities at selected positions in the tour
            pointSwap1 = newSolution.getPoint(tourPos1);
            pointSwap2 = newSolution.getPoint(tourPos2);

            // Swap them
            newSolution.setPoint(tourPos2, pointSwap1);
            newSolution.setPoint(tourPos1, pointSwap2);

            // Get energy of solutions
            currentEnergy = this.currentSolution.getDistance();
            neighbourEnergy = newSolution.getDistance();

            // Decide if we should accept the neighbour
            if (this.acceptanceProbability(currentEnergy, neighbourEnergy, this.temp) > Math.random()) {
                this.currentSolution = new Tour(0);
                this.currentSolution.copy(newSolution.tour);
            }

            // Keep track of the best solution found
            if (this.currentSolution.getDistance() < this.best.getDistance()) {
                this.best = new Tour(0);
                this.best.copy(this.currentSolution.tour);
            }

            // Cool system
            this.temp *= 1 - this.coolingRate;
        }
    };

    SimulatedAnnealer.prototype.getDistance = function () {
        return this.best.getDistance();
    };

    SimulatedAnnealer.prototype.getSolution = function () {
        return this.best.tour;
    };

    SimulatedAnnealer.prototype.init = function () {
        this.currentSolution = new Tour(0);
        this.currentSolution.generateIndividual(this.itinerary);
        this.best = this.currentSolution;
    };

    SimulatedAnnealer.prototype.reset = function () {
        this.itinerary = [];
        this.best = null;
    };

    return SimulatedAnnealer;

}());
;/* jshint unused:false */
'use strict';

/**
 * Travelling salesman path planner.
 * Based on http://www.theprojectspot.com/tutorial-post/applying-a-genetic-algorithm-to-the-travelling-salesman-problem/5
 */
var TravellingSalesman = (function () {

    /**
     * A proposed solution.
     * @constructor
     * @param {Number} size Itinerary size
     */
    function Tour (size) {
        this.distance = 0;
        this.fitness = 0;
        this.tour = [];
        if (size) {
            for (var i=0;i<size;i++) {
                this.tour.push(null);
            }
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
            if (point !== null && point.x === p.x && point.y === p.y) {
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

    Tour.prototype.generateRandomRoute = function (itinerary) {
        this.tour = itinerary.slice();
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

    Tour.prototype.updateFitness = function () {
        this.fitness = 1 / this.getDistance();
    };

    /**
     * A collection of potential tour solutions.
     * @param {Array} itinerary Itinerary
     * @param {Number} populationSize The number of solutions in the population
     * @param {Boolean} initialise Initialize the population with random solutions
     * @constructor
     */
    function Population(itinerary, populationSize, initialise) {
        var i, tour;
        this.populationSize = populationSize;
        this.tours = [];
        for (i = 0; i < this.populationSize; i++) {
            this.tours.push(null);
        }
        if (initialise) {
            for (i = 0; i < this.populationSize; i++) {
                tour = new Tour();
                tour.generateRandomRoute(itinerary);
                this.tours[i] = tour;
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
        return this.populationSize;
    };

    Population.prototype.getTour = function (i) {
        return this.tours[i];
    };

    Population.prototype.saveTour = function (i, tour) {
        this.tours[i] = tour;
    };


    /**
     * Travelling salesman.
     * @constructor
     */
    function TravellingSalesman() {
        this.elitism = true;
        this.itinerary = [];
        this.mutationRate = 0.015;
        this.population = null;
        this.populationSize = 50;
        this.tournamentSize = 5;
    }

    /**
     * Add an object to the tour list. The object must contain properties x and y
     * at minimum.
     * @param {Object} obj Object with x and y coordinate properties
     */
    TravellingSalesman.prototype.addPoint = function (obj) {
        this.itinerary.push(obj);
        this.checkForDuplicatePoints();
    };

    TravellingSalesman.prototype.checkForDuplicatePoints = function () {
        var i, p, px, py, x = [], y = [];
        // build an index of points
        for (i = 0; i < this.itinerary.length; i++) {
            x.push(this.itinerary[i].x);
            y.push(this.itinerary[i].y);
        }
        // check for duplicates
        for (i = 0; i < this.itinerary.length; i++) {
            p = this.itinerary[i];
            px = x.lastIndexOf(p.x);
            py = y.lastIndexOf(p.y);
            if (px === py && px !== i) {
                throw new Error('Tour contains a duplicate element');
            }
        }
    };

    TravellingSalesman.prototype.crossTours = function (parent1, parent2, start, end) {
        var child = new Tour(parent1.tourSize()), i, ii;
        // Loop and add the sub tour from parent1 to child
        for (i = 0; i < parent1.tourSize(); i++) {
            // If our start position is less than the end position
            if (start < end && i > start && i < end) {
                child.setPoint(i, parent1.getPoint(i));
            }
            // If our start position is larger
            else if (start > end) {
                if (!(i < start && i > end)) {
                    child.setPoint(i, parent1.getPoint(i));
                }
            } else {
                // mark the element so that we know we need to insert an element
                // from parent2
                child.setPoint(i, null);
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
        // force fitness value to update
        child.updateFitness();
        return child;
    };

    /**
     * Crossover mutation creates a new tour comprising a subsegment of parent1
     * combined with a subsegment of parent2.
     * @param {Tour} parent1 Tour
     * @param {Tour} parent2 Tour
     * @returns {Tour}
     */
    TravellingSalesman.prototype.crossover = function (parent1, parent2) {
        // Get start and end sub tour positions for parent1's tour
        var start = Math.floor(Math.random() * parent1.tourSize());
        var end = Math.floor(Math.random() * parent1.tourSize());
        var child = this.crossTours(parent1, parent2, start, end);
        child.checkForNullValues();
        child.checkForDuplicateValues();
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
        var newPopulation = new Population(this.itinerary, pop.getPopulationSize(), false);
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

    /**
     * Create an initial population of candidate solutions.
     */
    TravellingSalesman.prototype.init = function () {
        this.population = new Population(this.itinerary, this.populationSize, true);
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

    TravellingSalesman.prototype.reset = function () {
        this.itinerary = [];
    };

    TravellingSalesman.prototype.setPopulationSize = function (size) {
        this.populationSize = size;
    };

    TravellingSalesman.prototype.tour = function () {
        return new Tour();
    };

    TravellingSalesman.prototype.tournamentSelection = function (pop) {
        // Create a tournament population
        var tournament = new Population(this.itinerary, this.tournamentSize, false);
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
