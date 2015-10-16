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
;'use strict';

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
;/* global THREE, TravellingSalesman, TWEEN */
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
        var dx = Math.pow(p2.x + p1.x, 2);
        var dy = Math.pow(p2.y + p1.y, 2);
        var dz = Math.pow(p2.z + p1.z, 2);
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
                resolve();
            });
            tween.onUpdate(function () {
                camera.setUp(new THREE.Vector3(this.x, this.y, this.z));
                emit('update');
            });
            tween.start();
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
                resolve();
            });
            tween.onUpdate(function () {
                var tweened = this;
                camera.distance = distance(camera.position, camera.target);
                camera.lookAt(new THREE.Vector3(tweened.tx, tweened.ty, tweened.tz));
                camera.position.set(tweened.x, tweened.y, tweened.z);
                camera.target.set(tweened.tx, tweened.ty, tweened.tz);
                emit('update');
            });
            tween.start();
            emit('update');
        });
    };

    return PathPlanner;

}());
;/* global THREE */
/* jshint unused:false */
'use strict';

var FOUR = FOUR || {};

FOUR.Scene = (function () {

    /**
     * Scene
     * @constructor
     */
    function Scene (config) {
        THREE.Scene.call(this);
        config = config || {};

        var self = this;
        self.DEFAULT_CAMERA_NAME = 'camera1';
        self.boundingBox = new FOUR.BoundingBox('scene-bounding-box');
        self.cameras = new THREE.Object3D();
        self.helpers = new THREE.Object3D();
        self.lights = new THREE.Object3D();
        self.model = new THREE.Object3D();
        self.selection = new FOUR.SelectionSet();

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

        // scene bounding box
        self.helpers.add(self.boundingBox);

        // listen for updates
        // TODO update the scene bounding box when the backing model changes
        self.selection.addEventListener('update', function () {
            self.boundingBox.update(self.selection.getObjects());
        });
    }

    Scene.prototype = Object.create(THREE.Scene.prototype);

    Scene.prototype.constructor = Scene;

    /**
     * Create a default scene camera. A camera aspect ratio or DOM height
     * element and width must be specified.
     * @param {Object} config Configuration
     */
    Scene.prototype.createDefaultCamera = function (config) {
        var self = this;
        config = config || {};
        // default camera settings
        var cfg = {
            far: 1000,
            fov: 45,
            height: 1,
            name: self.DEFAULT_CAMERA_NAME,
            near: 0.1,
            width: 1
        };
        Object.keys(config).forEach(function (key) {
           cfg[key] = config[key];
        });
        var camera = new FOUR.TargetCamera(cfg.fov, cfg.width / cfg.height, cfg.near, cfg.far);
        camera.name = cfg.name;
        camera.setPositionAndTarget(-50, -50, 50, 0, 0, 0); // use position, target fields
        camera.addEventListener('update', function () { self.emit('update'); });
        self.cameras.add(camera);
    };

    Scene.prototype.emit = function (type) {
      this.dispatchEvent({'type':type});
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

/**
 * Needs to know about the scene, selection set(s)
 * Dependencies: selection set, bounding box, scene, path planning, THREE.TransformControls
 */
FOUR.TargetCamera = (function () {

    /**
     * Get the distance from P1 to P2.
     * @param {THREE.Vector3} p1 Point 1
     * @param {THREE.Vector3} p2 Point 2
     * @returns {Number} Distance
     */
    function distance (p1, p2) {
        var dx = Math.pow(p2.x + p1.x, 2);
        var dy = Math.pow(p2.y + p1.y, 2);
        var dz = Math.pow(p2.z + p1.z, 2);
        return Math.sqrt(dx + dy + dz);
    }

    function TargetCamera (fov, aspect, near, far) {
        THREE.PerspectiveCamera.call(this);
        var geometry, material, self = this;

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

        self.distance = 100;
        self.target = new THREE.Vector3(0, 0, self.distance); // world space position

        // camera motion planner
        self.planner = new FOUR.PathPlanner();

        // camera frustrum
        // TODO the frustrum needs to be positioned in world space coordinates
        self.frustrum = new THREE.CameraHelper(self);
        self.frustrum.visible = false;
        self.add(self.frustrum);

        // target
        // TODO the target helper needs to be positioned in world space coordinates
        // rather than camera space coordinates
        geometry = new THREE.BoxGeometry(1, 1, 1);
        material = new THREE.MeshBasicMaterial({color: 0x0000ff});
        self.targetHelper = new THREE.Mesh(geometry, material);
        self.targetHelper.position.set(0,0,-100); // relative to the camera?
        self.targetHelper.name = 'target';
        self.targetHelper.visible = false;
        self.add(self.targetHelper);

        // set default positions
        self.lookAt(self.target); // TODO need to be able to intercept this call

        self.distance = self.getDistance(self.position, self.target);
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

    TargetCamera.prototype.getTarget = function () {
        return this.target;
    };

    TargetCamera.prototype.handleResize = function () {
        // TODO handle resize event
        throw new Error('not implemented');
    };

    /**
     * Hide the camera frustrum.
     */
    TargetCamera.prototype.hideFrustrum = function () {
        this.frustrum.visible = false;
        this.emit('update');
    };

    /**
     * Hide the camera target.
     */
    TargetCamera.prototype.hideTarget = function () {
        this.targetHelper.visible = false;
        this.emit('update');
    };

    /**
     * Reset camera orientation so that camera.up aligns with +Z.
     * @param {Function} progress Progress callback
     */
    TargetCamera.prototype.resetOrientation = function (progress) {
        var self = this;
        return self.planner.tweenToOrientation(self, new THREE.Vector3(0,0,1), progress || self.emit.bind(self));
    };

    TargetCamera.prototype.setDistance = function (dist) {
        console.log('update the camera distance from target');
        var offset, distance, next, self = this;
        self.distance = dist;
        // get the direction and current distance from the target to the camera
        offset = new THREE.Vector3().subVectors(self.position, self.target);
        distance = offset.length();
        // compute the new camera distance and position
        offset.setLength(dist);
        next = new THREE.Vector3().addVectors(self.target, offset);
        // move the camera to the new position
        return self.planner.tweenToPosition(
            self,
            new THREE.Vector3(next.x, next.y, next.z),
            self.target,
            self.emit.bind(self));
    };

    TargetCamera.prototype.setUp = function (vec) {
        this.up = vec;
        this.emit('update');
    };

    /**
     * Orient the camera to look at the specified position. Update the camera
     * target and distance. Animate the camera to the new orientation.
     * @param {Number} x X coordinate
     * @param {Number} y Y coordinate
     * @param {Number} z Z coordinate
     * @returns {Promise}
     */
    TargetCamera.prototype.setLookAt = function (x, y, z) {
        var self = this, target = new THREE.Vector3(x, y, z);
        // update camera orientation
        return self.planner.tweenToPosition(
          self,
          self.position,
          target,
          self.emit.bind(self));
    };

    /**
     * Move the camera to the specified position. Maintain the current target
     * position.
     * @param {Number} x X coordinate
     * @param {Number} y Y coordinate
     * @param {Number} z Z coordinate
     * @returns {Promise}
     */
    TargetCamera.prototype.setPosition = function (x, y, z) {
        var self = this;
        // TODO need to update the target!!!
        return self.planner.tweenToPosition(
            self,
            new THREE.Vector3(x, y, z),
            self.target,
            self.emit.bind(self));
    };

    TargetCamera.prototype.setPositionAndTarget = function (x, y, z, tx ,ty, tz) {
        var self = this;
        self.distance = distance(new THREE.Vector3(x,y,z), new THREE.Vector3(tx, ty, tz));
        return self.planner.tweenToPosition(
            self,
            new THREE.Vector3(x, y, z),
            new THREE.Vector3(tx, ty, tz),
            self.emit.bind(self));
    };

    /**
     * Set the camera target. Maintain the distance from the camera to the
     * target.
     * @param {Number} x X coordinate
     * @param {Number} y Y coordinate
     * @param {Number} z Z coordinate
     * @returns {Promise}
     */
    TargetCamera.prototype.setTarget = function (x, y, z) {
        var offset, next, self = this, target = new THREE.Vector3(x, y, z);
        // get the current direction from the target to the camera
        offset = new THREE.Vector3().subVectors(self.position, self.target);
        offset.length(self.distance);
        // compute the new camera position
        next = new THREE.Vector3().addVectors(target, offset);
        // move the camera to the new position
        return self.planner.tweenToPosition(
          self,
          new THREE.Vector3(next.x, next.y, next.z),
          target,
          self.emit.bind(self));
    };

    /**
     * Move the camera to the predefined view position. Ensure that the entire
     * bounding box is visible within the camera view.
     * @param {String} view View
     * @param {BoundingBox} bbox View bounding box
     */
    TargetCamera.prototype.setView = function (view, bbox) {
        var dist, height, offset, self = this;
        var center = bbox.getCenter();
        var cx = center.x; // new camera position
        var cy = center.y;
        var cz = center.z;
        var tx = center.x; // new camera target
        var ty = center.y;
        var tz = center.z;
        // reorient the camera relative to the bounding box
        if (view === self.VIEWS.TOP) {
            height = bbox.getYDimension();
            offset = (bbox.getZDimension() / 2);
            dist = height / 2 / Math.tan(Math.PI * self.fov / 360);
            cz = center.z + dist + offset;
        }
        else if (view === self.VIEWS.FRONT) {
            height = bbox.getZDimension();
            offset = (bbox.getYDimension() / 2);
            dist = height / 2 / Math.tan(Math.PI * self.fov / 360);
            cy = center.y - dist - offset;
        }
        else if (view === self.VIEWS.BACK) {
            height = bbox.getZDimension();
            offset = (bbox.getYDimension() / 2);
            dist = height / 2 / Math.tan(Math.PI * self.fov / 360);
            cy = center.y + dist + offset;
        }
        else if (view === self.VIEWS.RIGHT) {
            height = bbox.getZDimension();
            offset = (bbox.getXDimension() / 2);
            dist = height / 2 / Math.tan(Math.PI * self.fov / 360);
            cx = center.x + dist + offset;
        }
        else if (view === self.VIEWS.LEFT) {
            height = bbox.getZDimension();
            offset = (bbox.getXDimension() / 2);
            dist = height / 2 / Math.tan(Math.PI * self.fov / 360);
            cx = center.x - dist - offset;
        }
        else if (view === self.VIEWS.PERSPECTIVE) {
            cx = center.x - 50;
            cy = center.y - 50;
            cz = center.z + 50;
            tx = center.x;
            ty = center.y;
            tz = center.z;
        }
        self.planner.tweenToPosition(
            self,
            new THREE.Vector3(cx, cy, cz),
            new THREE.Vector3(tx, ty, tz),
            self.emit.bind(self));
    };

    /**
     * Show the camera frustrum.
     */
    TargetCamera.prototype.showFrustrum = function () {
        var self = this;
        self.frustrum.visible = true;
        this.emit('update');
    };

    /**
     * Show the camera target.
     */
    TargetCamera.prototype.showTarget = function () {
        this.targetHelper.visible = true;
        this.emit('update');
    };

    TargetCamera.prototype.translate = function (x, y, z) {
        var self = this;
        self.position.add(new THREE.Vector3(x, y, z));
        self.target.add(new THREE.Vector3(x, y, z));
        //self.emit('update');
    };

    /**
     * Zoom in incrementally.
     */
    TargetCamera.prototype.zoomIn = function () {
        //console.log('zoom in');
        var offset, distance, next, self = this;
        // get the direction and current distance from the target to the camera
        offset = new THREE.Vector3().subVectors(self.position, self.target);
        distance = offset.length();
        // compute the new camera distance and position
        offset.setLength(distance / self.ZOOM_FACTOR);
        next = new THREE.Vector3().addVectors(self.target, offset);
        // move the camera to the new position
        return self.planner.tweenToPosition(
            self,
            new THREE.Vector3(next.x, next.y, next.z),
            self.target,
            self.emit.bind(self));
    };

    /**
     * Zoom out incrementally.
     */
    TargetCamera.prototype.zoomOut = function () {
        //console.log('zoom out');
        var offset, distance, next, self = this;
        // get the direction and current distance from the target to the camera
        offset = new THREE.Vector3().subVectors(self.position, self.target);
        distance = offset.length();
        // compute the new camera distance and position
        offset.setLength(distance * self.ZOOM_FACTOR);
        next = new THREE.Vector3().addVectors(self.target, offset);
        // move the camera to the new position
        return self.planner.tweenToPosition(
            self,
            new THREE.Vector3(next.x, next.y, next.z),
            self.target,
            self.emit.bind(self));
    };

    /**
     * Zoom to fit the bounding box.
     * @param {BoundingBox} bbox Bounding box
     */
    TargetCamera.prototype.zoomToFit = function (bbox) {
        //console.log('zoom to fit all or selected items');
        var direction, distance, next, self = this;
        // get the direction from the target to the camera
        direction = new THREE.Vector3().subVectors(self.position, self.target);
        // get the distance required to fit all entities within the view
        distance = bbox.getRadius() / Math.tan(Math.PI * self.fov / 360);
        // compute the new camera position
        direction.setLength(distance);
        next = new THREE.Vector3().addVectors(bbox.getCenter(), direction);
        // move the camera to the new position
        return self.planner.tweenToPosition(
            self,
            new THREE.Vector3(next.x, next.y, next.z),
            bbox.getCenter(),
            self.emit.bind(self));
    };

    /**
     * Zoom the view to fit the window selection.
     */
    TargetCamera.prototype.zoomToWindow = function () {
        throw new Error('zoom in to window');
    };

    return TargetCamera;

}());
;'use strict';

var FOUR = FOUR || {};

FOUR.Viewcube = (function () {

    function Viewcube (elementId) {
        THREE.EventDispatcher.call(this);

        this.FACES = {
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
        this.MODES = {
            SELECT: 0,
            READONLY: 1
        };
        this.OFFSET = 250;
        this.ROTATION_0   = 0;
        this.ROTATION_90  = Math.PI / 2;
        this.ROTATION_180 = Math.PI;
        this.ROTATION_270 = Math.PI * 1.5;
        this.ROTATION_360 = Math.PI * 2;

        this.COMPASS_COLOR = 0x666666;
        this.COMPASS_OPACITY = 0.8;
        this.FACE_COLOUR = 0x4a5f70;
        this.FACE_OPACITY_MOUSE_OFF = 0.0;
        this.FACE_OPACITY_MOUSE_OVER = 0.8;

        this.backgroundColor = new THREE.Color(0x000000, 0);
        this.camera = null;
        this.compass = null;
        this.control = null;
        this.cube = null;
        this.domElement = document.getElementById(elementId);
        this.elementId = elementId;
        this.fov = 60; // 50
        this.mouse = new THREE.Vector2();
        this.raycaster = new THREE.Raycaster();
        this.renderer = null;
        this.scene = new THREE.Scene();
    }

    Viewcube.prototype = Object.create(THREE.EventDispatcher.prototype);

    Viewcube.prototype.constructor = Viewcube;

    Viewcube.prototype.init = function () {
        var self = this;
        // renderer
        self.renderer = new THREE.WebGLRenderer({alpha: true, antialias: true});
        //self.renderer.setClearColor(self.backgroundColor);
        self.renderer.setSize(self.domElement.clientWidth, self.domElement.clientHeight);
        self.renderer.shadowMap.enabled = true;
        // add the output of the renderer to the html element
        self.domElement.appendChild(self.renderer.domElement);
        // setup scene
        self.setupCamera();
        self.setupGeometry();
        self.setupLights();
        // setup interactions
        self.setupNavigation();
        self.setupSelection();
        // start rendering
        self.render();
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

    Viewcube.prototype.makeCorner = function (name, w, x, y, z, rotations, color) {
        var face1, face2, face3, geometry, material, obj, self = this;
        obj = new THREE.Object3D();

        geometry = new THREE.PlaneGeometry(w, w);
        material = new THREE.MeshBasicMaterial({color: color, opacity: self.FACE_OPACITY_MOUSE_OFF, transparent: true});
        face1 = new THREE.Mesh(geometry, material);
        face1.material.side = THREE.DoubleSide;
        face1.name = name;
        face1.position.setX(w / 2);
        face1.position.setY(w / 2);

        geometry = new THREE.PlaneGeometry(w, w);
        face2 = new THREE.Mesh(geometry, material);
        face2.material.side = THREE.DoubleSide;
        face2.name = name;
        face2.position.setX(w / 2);
        face2.position.setZ(-w / 2);
        face2.rotateOnAxis(new THREE.Vector3(1,0,0), Math.PI / 2);

        geometry = new THREE.PlaneGeometry(w, w);
        face3 = new THREE.Mesh(geometry, material);
        face3.material.side = THREE.DoubleSide;
        face3.name = name;
        face3.position.setY(w / 2);
        face3.position.setZ(-w / 2);
        face3.rotateOnAxis(new THREE.Vector3(0,1,0), Math.PI / 2);

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

    Viewcube.prototype.makeEdge = function (name, w, h, x, y, z, rotations, color) {
        var face1, face2, geometry, material, obj, self = this;
        obj = new THREE.Object3D();

        geometry = new THREE.PlaneGeometry(w, h);
        material = new THREE.MeshBasicMaterial({color: color, opacity: self.FACE_OPACITY_MOUSE_OFF, transparent: true});
        face1 = new THREE.Mesh(geometry, material);
        face1.material.side = THREE.DoubleSide;
        face1.name = name;
        face1.position.setY(h / 2);

        geometry = new THREE.PlaneGeometry(w, h);
        face2 = new THREE.Mesh(geometry, material);
        face2.material.side = THREE.DoubleSide;
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

    Viewcube.prototype.makeFace = function (name, w, x, y, z, rotations, color) {
        var self = this;
        var geometry = new THREE.PlaneGeometry(w, w);
        var material = new THREE.MeshBasicMaterial({color: color, opacity: self.FACE_OPACITY_MOUSE_OFF, transparent: true});
        var face = new THREE.Mesh(geometry, material);
        face.material.side = THREE.DoubleSide;
        face.name = name;
        face.position.setX(x);
        face.position.setY(y);
        face.position.setZ(z);
        rotations.forEach(function (rotation) {
            face.rotateOnAxis(rotation.axis, rotation.rad);
        });
        return face;
    };

    Viewcube.prototype.onMouseMove = function (event) {
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
                obj.material.opacity = self.FACE_OPACITY_MOUSE_OFF;
            }
        });
        // calculate objects intersecting the picking ray
        var intersects = self.raycaster.intersectObjects(self.scene.children, true);
        if (intersects.length > 0 && intersects[0].object.name !== 'labels') {
            intersects[0].object.material.opacity = self.FACE_OPACITY_MOUSE_OVER;
        }
    };

    Viewcube.prototype.onMouseOver = function (event) {
        var self = this;
        requestAnimationFrame(self.render.bind(self));
    };

    Viewcube.prototype.onMouseUp = function (event) {
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

    Viewcube.prototype.render = function () {
        var self = this;
        self.renderer.render(self.scene, self.camera);
    };

    Viewcube.prototype.setupCamera = function () {
        var self = this;
        // position and point the camera to the center of the scene
        self.camera = new THREE.PerspectiveCamera(self.fov, self.domElement.clientWidth / self.domElement.clientHeight, 0.1, 1000);
        self.camera.position.x = 150;
        self.camera.position.y = 150;
        self.camera.position.z = 90;
        self.camera.up = new THREE.Vector3(0, 0, 1);
        self.camera.lookAt(new THREE.Vector3(0, 0, 0));
    };

    Viewcube.prototype.setupGeometry = function () {
        var self = this;

        var ROTATE_0 = 0;
        var ROTATE_90 = Math.PI / 2;
        var ROTATE_180 = Math.PI;
        var ROTATE_270 = Math.PI * 1.5;
        var ROTATE_360 = Math.PI * 2;

        var X_AXIS = new THREE.Vector3(1, 0, 0);
        var Y_AXIS = new THREE.Vector3(0, 1, 0);
        var Z_AXIS = new THREE.Vector3(0, 0, 1);

        self.control = new THREE.Object3D();
        self.cube = new THREE.Object3D();

        // labels
        var material1 = new THREE.MeshPhongMaterial({
            color: 0xAAAAAA,
            map: THREE.ImageUtils.loadTexture('/lib/img/top.png'),
            opacity: 1.0,
            transparent: true
        });
        var material2 = new THREE.MeshPhongMaterial({
            color: 0xAAAAAA,
            map: THREE.ImageUtils.loadTexture('/lib/img/front.png'),
            opacity: 1.0,
            transparent: true
        });
        var material3 = new THREE.MeshPhongMaterial({
            color: 0xAAAAAA,
            map: THREE.ImageUtils.loadTexture('/lib/img/right.png'),
            opacity: 1.0,
            transparent: true
        });
        var material4 = new THREE.MeshPhongMaterial({
            color: 0xAAAAAA,
            map: THREE.ImageUtils.loadTexture('/lib/img/back.png'),
            opacity: 1.0,
            transparent: true
        });
        var material5 = new THREE.MeshPhongMaterial({
            color: 0xAAAAAA,
            map: THREE.ImageUtils.loadTexture('/lib/img/left.png'),
            opacity: 1.0,
            transparent: true
        });
        var material6 = new THREE.MeshPhongMaterial({
            color: 0xAAAAAA,
            map: THREE.ImageUtils.loadTexture('/lib/img/bottom.png'),
            opacity: 1.0,
            transparent: true
        });
        var materials = [
            material2, material5, material3,
            material4, material1, material6
        ];

        var geometry = new THREE.BoxGeometry(99, 99, 99);
        var material = new THREE.MeshFaceMaterial(materials);
        var labels = new THREE.Mesh(geometry, material);
        labels.name = 'labels';
        self.scene.add(labels);

        // faces
        var topFace    = self.makeFace(self.FACES.TOP,    70,   0,   0,  50, [{axis:Z_AXIS, rad:ROTATE_90}], self.FACE_COLOUR);
        var frontFace  = self.makeFace(self.FACES.FRONT,  70,  50,   0,   0, [{axis:Y_AXIS, rad:ROTATE_90},{axis:Z_AXIS, rad:ROTATE_90}], self.FACE_COLOUR);
        var rightFace  = self.makeFace(self.FACES.RIGHT,  70,   0,  50,   0, [{axis:X_AXIS, rad:ROTATE_270},{axis:Z_AXIS, rad:ROTATE_180}], self.FACE_COLOUR);
        var leftFace   = self.makeFace(self.FACES.LEFT,   70,   0, -50,   0, [{axis:X_AXIS, rad:ROTATE_90},{axis:Z_AXIS, rad:ROTATE_360}], self.FACE_COLOUR);
        var backFace   = self.makeFace(self.FACES.BACK,   70, -50,   0,   0, [{axis:X_AXIS, rad:ROTATE_90},{axis:Y_AXIS, rad:ROTATE_270}], self.FACE_COLOUR);
        var bottomFace = self.makeFace(self.FACES.BOTTOM, 70,   0,   0, -50, [{axis:Y_AXIS, rad:ROTATE_180},{axis:Z_AXIS, rad:ROTATE_90}], self.FACE_COLOUR);

        // edges
        var topFrontEdge    = self.makeEdge(self.FACES.TOP_FRONT_EDGE, 70, 15,  50,   0, 50, [{axis:Z_AXIS, rad:ROTATE_90}], self.FACE_COLOUR);
        var topRightEdge    = self.makeEdge(self.FACES.TOP_RIGHT_EDGE, 70, 15,   0,  50, 50, [{axis:Z_AXIS, rad:ROTATE_180}], self.FACE_COLOUR);
        var topBackEdge     = self.makeEdge(self.FACES.TOP_BACK_EDGE, 70, 15, -50,   0, 50, [{axis:Z_AXIS, rad:ROTATE_270}], self.FACE_COLOUR);
        var topLeftEdge     = self.makeEdge(self.FACES.TOP_LEFT_EDGE, 70, 15,   0, -50, 50, [{axis:Z_AXIS, rad:ROTATE_360}], self.FACE_COLOUR);

        var bottomFrontEdge = self.makeEdge(self.FACES.BOTTOM_FRONT_EDGE, 70, 15,  50,   0, -50, [{axis:Z_AXIS, rad:ROTATE_90}, {axis:Y_AXIS, rad:ROTATE_180}], self.FACE_COLOUR);
        var bottomRightEdge = self.makeEdge(self.FACES.BOTTOM_RIGHT_EDGE, 70, 15,   0,  50, -50, [{axis:Z_AXIS, rad:ROTATE_180},{axis:Y_AXIS, rad:ROTATE_180}], self.FACE_COLOUR);
        var bottomBackEdge  = self.makeEdge(self.FACES.BOTTOM_BACK_EDGE, 70, 15, -50,   0, -50, [{axis:Z_AXIS, rad:ROTATE_270},{axis:Y_AXIS, rad:ROTATE_180}], self.FACE_COLOUR);
        var bottomLeftEdge  = self.makeEdge(self.FACES.BOTTOM_LEFT_EDGE, 70, 15,   0, -50, -50, [{axis:Z_AXIS, rad:ROTATE_360},{axis:Y_AXIS, rad:ROTATE_180}], self.FACE_COLOUR);

        var frontRightEdge  = self.makeEdge(self.FACES.FRONT_RIGHT_EDGE, 70, 15,  50,  50, 0, [{axis:X_AXIS, rad:ROTATE_180},{axis:Y_AXIS, rad:ROTATE_90},{axis:Z_AXIS, rad:0}], self.FACE_COLOUR);
        var backRightEdge   = self.makeEdge(self.FACES.BACK_RIGHT_EDGE, 70, 15, -50,  50, 0, [{axis:X_AXIS, rad:ROTATE_90},{axis:Y_AXIS, rad:ROTATE_180},{axis:Z_AXIS, rad:ROTATE_90}], self.FACE_COLOUR);
        var backLeftEdge    = self.makeEdge(self.FACES.BACK_LEFT_EDGE, 70, 15, -50, -50, 0, [{axis:X_AXIS, rad:ROTATE_90},{axis:Y_AXIS, rad:ROTATE_270},{axis:Z_AXIS, rad:ROTATE_90}], self.FACE_COLOUR);
        var frontLeftEdge   = self.makeEdge(self.FACES.FRONT_LEFT_EDGE, 70, 15,  50, -50, 0, [{axis:X_AXIS, rad:ROTATE_90},{axis:Y_AXIS, rad:ROTATE_360},{axis:Z_AXIS, rad:ROTATE_90}], self.FACE_COLOUR);

        // corners
        var topFrontLeftCorner  = self.makeCorner(self.FACES.TOP_FRONT_LEFT_CORNER, 15,  50, -50, 50, [{axis:Z_AXIS, rad:ROTATE_90}], self.FACE_COLOUR);
        var topFrontRightCorner = self.makeCorner(self.FACES.TOP_FRONT_RIGHT_CORNER, 15,  50,  50, 50, [{axis:Z_AXIS, rad:ROTATE_180}], self.FACE_COLOUR);
        var topBackRightCorner  = self.makeCorner(self.FACES.TOP_BACK_RIGHT_CORNER, 15, -50,  50, 50, [{axis:Z_AXIS, rad:ROTATE_270}], self.FACE_COLOUR);
        var topBackLeftCorner   = self.makeCorner(self.FACES.TOP_BACK_LEFT_CORNER, 15, -50, -50, 50, [{axis:Z_AXIS, rad:ROTATE_360}], self.FACE_COLOUR);

        var bottomFrontLeftCorner  = self.makeCorner(self.FACES.BOTTOM_FRONT_LEFT_CORNER, 15,  50, -50, -50, [{axis:X_AXIS, rad:ROTATE_0},{axis:Y_AXIS, rad:ROTATE_180},{axis:Z_AXIS, rad:ROTATE_0}], self.FACE_COLOUR);
        var bottomFrontRightCorner = self.makeCorner(self.FACES.BOTTOM_FRONT_RIGHT_CORNER, 15,  50,  50, -50, [{axis:X_AXIS, rad:ROTATE_90},{axis:Y_AXIS, rad:ROTATE_180},{axis:Z_AXIS, rad:ROTATE_0}], self.FACE_COLOUR);
        var bottomBackRightCorner  = self.makeCorner(self.FACES.BOTTOM_BACK_RIGHT_CORNER, 15, -50,  50, -50, [{axis:X_AXIS, rad:ROTATE_90},{axis:Y_AXIS, rad:ROTATE_180},{axis:Z_AXIS, rad:ROTATE_90}], self.FACE_COLOUR);
        var bottomBackLeftCorner   = self.makeCorner(self.FACES.BOTTOM_BACK_LEFT_CORNER, 15, -50, -50, -50, [{axis:X_AXIS, rad:ROTATE_0},{axis:Y_AXIS, rad:ROTATE_180},{axis:Z_AXIS, rad:ROTATE_90}], self.FACE_COLOUR);

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

        // compass
        self.compass = new THREE.Object3D();
        var circle = self.makeCompass('compass', 0, 0, -55, 90, 64, self.COMPASS_COLOR, self.COMPASS_OPACITY);

        self.compass.add(circle);

        // add
        self.scene.add(self.cube);
        self.scene.add(self.compass);
    };

    Viewcube.prototype.setupLights = function () {
        var ambientLight = new THREE.AmbientLight(0x383838);
        this.scene.add(ambientLight);

        // add spotlight for the shadows
        var spotLight = new THREE.SpotLight(0xffffff);
        spotLight.position.set(100, 140, 130);
        spotLight.intensity = 2;
        this.scene.add(spotLight);
    };

    Viewcube.prototype.setupNavigation = function () {
        // bind click events to views
    };

    Viewcube.prototype.setupSelection = function () {
        var self = this;
        self.domElement.addEventListener('mousemove', self.onMouseMove.bind(self), false);
        self.domElement.addEventListener('mouseover', self.onMouseOver.bind(self), false);
        self.domElement.addEventListener('mouseup', self.onMouseUp.bind(self), false);
    };

    Viewcube.prototype.setView = function (view) {
        var self = this;
        switch (view) {
            case self.FACES.TOP:
                self.tweenCameraToPosition(0,0,self.OFFSET);
                break;
            case self.FACES.FRONT:
                self.tweenCameraToPosition(self.OFFSET,0,0);
                break;
            case self.FACES.LEFT:
                self.tweenCameraToPosition(0,0,self.OFFSET);
                break;
            case self.FACES.RIGHT:
                self.tweenCameraToPosition(self.OFFSET,0,0);
                break;
            case self.FACES.BACK:
                self.tweenCameraToPosition(-self.OFFSET,0,0);
                break;
            case self.FACES.BOTTOM:
                self.tweenCameraToPosition(0,0,-self.OFFSET);
                break;
            case self.FACES.TOP_FRONT_EDGE:
                self.tweenCameraToPosition(0,0,self.OFFSET,0);
                break;
            case self.FACES.TOP_BACK_EDGE:
                console.log(view); // TODO
                break;
            case self.FACES.TOP_RIGHT_EDGE:
                console.log(view); // TODO
                break;
            case self.FACES.TOP_LEFT_EDGE:
                console.log(view); // TODO
                break;
            default:
                console.dir(view);
        }
    };

    Viewcube.prototype.tweenCameraToPosition = function (x, y, z, rx, ry, rz) {
        var self = this;
        return new Promise(function (resolve) {
            var start = {
                x: self.camera.position.x,
                y: self.camera.position.y,
                z: self.camera.position.z
            };
            var finish = {x: x, y: y, z: z};
            var tween = new TWEEN.Tween(start).to(finish, 2000);
            tween.easing(TWEEN.Easing.Cubic.InOut);
            tween.onComplete(resolve);
            tween.onUpdate(function () {
                self.camera.lookAt(new THREE.Vector3(0, 0, 0));
                self.camera.position.set(this.x, this.y, this.z);
            });
            tween.start();
            self.render();
        });
    };

    Viewcube.prototype.tweenControlRotation = function (rx, ry, rz) {
        var self = this;
        return new Promise(function (resolve) {
            var start = {
                rx: self.control.rotation.x,
                ry: self.control.rotation.y,
                rz: self.control.rotation.z
            };
            var finish = {rx: rx, ry: ry, rz: rz};
            var tween = new TWEEN.Tween(start).to(finish, 1000);
            tween.easing(TWEEN.Easing.Cubic.InOut);
            tween.onComplete(resolve);
            tween.onUpdate(function () {
                self.control.rotation.set(this.rx, this.ry, this.rz, 'XYZ');
            });
            tween.start();
            self.render();
        });
    };

    Viewcube.prototype.update = function () {
        TWEEN.update();
    };

    return Viewcube;

}());
;'use strict';

var FOUR = FOUR || {};

/**
 * Renders the view from a scene camera to a canvas element in the DOM.
 */
FOUR.Viewport3D = (function () {

  /**
   * Viewport3D constructor.
   * @param {Object} config Configuration
   * @constructor
   */
  function Viewport3D(config) {
    THREE.EventDispatcher.call(this);
    var self = this;
    self.backgroundColor = new THREE.Color(0x000, 1.0);
    self.camera = config.camera;
    self.clock = new THREE.Clock();
    self.continuousUpdate = true;
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
    self.domElement.addEventListener('resize', self.handleResize.bind(self), false);
    self.scene.addEventListener('update', self.render.bind(self), false);
  }

  Viewport3D.prototype = Object.create(THREE.EventDispatcher.prototype);

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
   * Handle window resize event.
   */
  Viewport3D.prototype.handleResize = function () {
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
    }
    self.controller = self.controllers[name];
    self.controller.enable();
  };

  /**
   * Set viewport background color.
   * @param {THREE.Color} color Color
   */
  Viewport3D.prototype.setBackgroundColor = function (color) {
    var self = this;
    self.background = color;
    self.renderer.setClearColor(self.backgroundColor);
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
    this.render();
  };

  /**
   * Update the controller and global tween state.
   */
  Viewport3D.prototype.update = function () {
    var self = this;
    if (self.continuousUpdate) {
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
 * A reimplementation of the THREE.FirstPersonController.
 */
FOUR.FirstPersonController = (function () {

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

	function FirstPersonController (config) {
		THREE.EventDispatcher.call(this);
		config = config || {};

		var self = this;

		self.EVENT = {
			UPDATE: {type:'udpate'},
			END: {type:'end'},
			START: {type:'start'}
		};
		self.KEYS = {LEFT: 37, UP: 38, RIGHT: 39, BOTTOM: 40};
		self.STATE = { NONE : - 1, ROTATE : 0, DOLLY : 1, PAN : 2, TOUCH_ROTATE : 3, TOUCH_DOLLY : 4, TOUCH_PAN : 5 };
		self.WALK_HEIGHT = 2;

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

		// TODO do we need these?
		// for reset
		self.target0 = self.target.clone();
		self.position0 = self.camera.position.clone();
		self.zoom0 = self.camera.zoom;

		Object.keys(config).forEach(function (key) {
			self[key] = config[key];
		});
	}

	FirstPersonController.prototype = Object.create(THREE.EventDispatcher.prototype);

	FirstPersonController.prototype.constructor = FirstPersonController;

	FirstPersonController.prototype.contextmenu = function (event) {
		event.preventDefault();
	};

	FirstPersonController.prototype.disable = function () {
		var self = this;
		self.enabled = false;
		Object.keys(self.listeners).forEach(function (key) {
			var listener = self.listeners[key];
			listener.element.removeEventListener(listener.event, listener.fn);
		});
	};

	FirstPersonController.prototype.emit = function (event) {
		this.dispatchEvent({type: event || 'update'});
	};

	FirstPersonController.prototype.enable = function () {
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

		// FIXME integrate the following
		//function addListener(element, event, fn) {
		//	self.listeners[event] = {
		//		element: element,
		//		event: event,
		//		fn: fn.bind(self)
		//	};
		//	element.addEventListener(event, self.listeners[event].fn, false);
		//}
		//addListener(self.domElement, 'mousedown', self.onMouseDown);
		//addListener(self.domElement, 'mousemove', self.onMouseMove);
		//addListener(self.domElement, 'mouseup', self.onMouseUp);
		//addListener(window, 'keydown', self.onKeyDown);
		//addListener(window, 'keyup', self.onKeyUp);
		//self.enabled = true;
		//self.setWalkHeight();
	};

	FirstPersonController.prototype.getAutoRotationAngle = function () {
		var self = this;
		return 2 * Math.PI / 60 / 60 * self.autoRotateSpeed;
	};

	FirstPersonController.prototype.getAzimuthalAngle = function () {
		return this.constraint.getAzimuthalAngle();
	};

	FirstPersonController.prototype.getPolarAngle = function () {
		return this.constraint.getPolarAngle();
	};

	FirstPersonController.prototype.getWalkHeight = function (position) {
		return 0;
	};

	FirstPersonController.prototype.getZoomScale = function () {
		var self = this;
		return Math.pow(0.95, self.zoomSpeed);
	};

	FirstPersonController.prototype.handleDoubleClick = function (selected) {
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

	FirstPersonController.prototype.handleSingleClick = function () {};

	FirstPersonController.prototype.onKeyDown = function (event) {
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

	FirstPersonController.prototype.onKeyUp = function (event) {
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
		}	};

	FirstPersonController.prototype.onMouseDown = function (event) {
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

	FirstPersonController.prototype.onMouseMove = function (event) {
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

	FirstPersonController.prototype.onMouseUp = function (event) {
		var self = this;
		if (self.enabled === false) {
			return;
		}
		self.dispatchEvent(self.EVENT.END);
		self.state = self.STATE.NONE;
	};

	FirstPersonController.prototype.onMouseWheel = function (event) {
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

	FirstPersonController.prototype.onWindowResize = function () {
		console.warn('Not implemented');
	};

	FirstPersonController.prototype.pan = function (deltaX, deltaY) {
		var self = this;
		var element = self.domElement === document ? self.domElement.body : self.domElement;
		self.constraint.pan(deltaX, deltaY, element.clientWidth, element.clientHeight);
	};

	FirstPersonController.prototype.reset = function () {
		var self = this;
		self.state = self.STATE.NONE;

		self.target.copy(self.target0);
		self.camera.position.copy(self.position0);
		self.camera.zoom = self.zoom0;

		self.camera.updateProjectionMatrix();
		self.dispatchEvent(self.EVENT.UPDATE);

		self.update();
	};

	FirstPersonController.prototype.setWalkHeight = function () {
		var self = this;
		return self.viewport
			.camera
			.resetOrientation(self.emit.bind(self))
			.then(function () {
				self.camera.setPositionAndTarget(
					self.camera.position.x,
					self.camera.position.y,
					self.WALK_HEIGHT,
					self.camera.target.x,
					self.camera.target.y,
					self.WALK_HEIGHT);
			});
	};

	FirstPersonController.prototype.update = function (delta) {
		var self = this;
		if (!self.enabled) {
			return;
		}
		// rotation
		if (self.autoRotate && self.state === self.STATE.NONE) {
			self.constraint.rotateLeft(self.getAutoRotationAngle());
		}
		// translation
		var change = false, distance = delta * self.movementSpeed;
		if (self.move.forward) {
			self.camera.translateZ(-distance);
			change = true;
		}
		if (self.move.backward) {
			self.camera.translateZ(distance);
			change = true;
		}
		if (self.move.right) {
			self.camera.translateX(distance);
			change = true;
		}
		if (self.move.left) {
			self.camera.translateX(-distance);
			change = true;
		}
		if (self.move.up) {
			self.camera.translateY(-distance);
			change = true;
		}
		if (self.move.down) {
			self.camera.translateY(distance);
			change = true;
		}
		// signal change
		if (self.constraint.update() === true || change === true) {
			self.dispatchEvent(self.EVENT.UPDATE);
		}
	};

	Object.defineProperties(FirstPersonController.prototype, {
		dampingFactor : {
			get: function () {
				return this.constraint.dampingFactor;
			},
			set: function (value) {
				this.constraint.dampingFactor = value;
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
		maxAzimuthAngle : {
			get: function () {
				return this.constraint.maxAzimuthAngle;
			},
			set: function (value) {
				this.constraint.maxAzimuthAngle = value;
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
		maxPolarAngle : {
			get: function () {
				return this.constraint.maxPolarAngle;
			},
			set: function (value) {
				this.constraint.maxPolarAngle = value;
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
		minAzimuthAngle : {
			get: function () {
				return this.constraint.minAzimuthAngle;
			},
			set: function (value) {
				this.constraint.minAzimuthAngle = value;
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
		minPolarAngle : {
			get: function () {
				return this.constraint.minPolarAngle;
			},
			set: function (value) {
				this.constraint.minPolarAngle = value;
			}
		},
		minZoom : {
			get: function () {
				return this.constraint.minZoom;
			},
			set: function (value) {
				this.constraint.minZoom = value;
			}
		}
	});

	return FirstPersonController;

}());
;'use strict';

var FOUR = FOUR || {};

/**
 * Hybrid selection, editing, trackball, orbit, first person controller.
 * Emits the following events:
 *
 * - change: Controller change
 *
 * @todo listen for camera change on the viewport
 * @todo listen for domelement resize events
 * @todo handle mouse position, sizing differences between document and domelements
 */
FOUR.MultiController = (function () {

    /**
     * Multi-mode interaction controller.
     * @param viewport Viewport 3D
     * @param domElement Viewport DOM element
     * @constructor
     */
    function MultiController (viewport, domElement) {
        THREE.EventDispatcher.call(this);

        var self = this;

        self.EVENTS = {
            UPDATE: { type: 'update' },
            END: { type: 'end' },
            START: { type: 'start' }
        };
        self.KEY = {
            NONE: -1,
            ROTATE: 0,
            ZOOM: 1,
            PAN: 2,
            TOUCH_ROTATE: 3,
            TOUCH_ZOOM_PAN: 4,
            TRANSLATE: 5,
            CANCEL: 27,
            MOVE_FORWARD: 73,
            MOVE_LEFT: 74,
            MOVE_BACK: 75,
            MOVE_RIGHT: 76,
            MOVE_UP: 85,
            MOVE_DOWN: 79,
            ROTATE_LEFT: -1,
            ROTATE_RIGHT: -1
        };

        self.controller = null;
        self.controllers = {};
        self.domElement = domElement;
        self.viewport = viewport;
    }

    MultiController.prototype = Object.create(THREE.EventDispatcher.prototype);

    MultiController.prototype.constructor = MultiController;

    MultiController.prototype.init = function () {
        var self = this;
        self.controllers.orbit = new FOUR.OrbitController();
        self.controllers.trackball = new FOUR.TrackballController();
        self.controllers.walk = new FOUR.WalkController();
    };

    /**
     * Set the active viewport controller.
     * @param {String} name Controller name
     */
    MultiController.prototype.setActiveController = function (name) {
        var self = this;
        self.controller.disable();
        if (!self.controllers[name]) {
            console.error('Controller ' + name + ' does not exist');
        } else {
            self.controller = self.controllers[name];
            self.controller.enable();
            self.dispatchEvent(self.EVENTS.UPDATE);
        }
    };

    return MultiController;

}());
;'use strict';

var FOUR = FOUR || {};

/**
 * A reimplementation of the THREE.OrbitController.
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

		// TODO do we need these?
		// for reset
		self.target0 = self.target.clone();
		self.position0 = self.camera.position.clone();
		self.zoom0 = self.camera.zoom;
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

	OrbitController.prototype.reset = function () {
		var self = this;
		self.state = self.STATE.NONE;

		self.target.copy(self.target0);
		self.camera.position.copy(self.position0);
		self.camera.zoom = self.zoom0;

		self.camera.updateProjectionMatrix();
		self.dispatchEvent(self.EVENT.UPDATE);

		self.update();
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
		},

		// backward compatibility

		noZoom: {
			get: function () {
				console.warn('THREE.OrbitControls: .noZoom has been deprecated. Use .enableZoom instead.');
				return ! this.enableZoom;
			},
			set: function (value) {
				console.warn('THREE.OrbitControls: .noZoom has been deprecated. Use .enableZoom instead.');
				this.enableZoom = ! value;
			}
		},

		noRotate: {
			get: function () {
				console.warn('THREE.OrbitControls: .noRotate has been deprecated. Use .enableRotate instead.');
				return ! this.enableRotate;
			},
			set: function (value) {
				console.warn('THREE.OrbitControls: .noRotate has been deprecated. Use .enableRotate instead.');
				this.enableRotate = ! value;
			}
		},

		noPan: {
			get: function () {
				console.warn('THREE.OrbitControls: .noPan has been deprecated. Use .enablePan instead.');
				return ! this.enablePan;
			},
			set: function (value) {
				console.warn('THREE.OrbitControls: .noPan has been deprecated. Use .enablePan instead.');
				this.enablePan = ! value;
			}
		},

		noKeys: {
			get: function () {
				console.warn('THREE.OrbitControls: .noKeys has been deprecated. Use .enableKeys instead.');
				return ! this.enableKeys;
			},
			set: function (value) {
				console.warn('THREE.OrbitControls: .noKeys has been deprecated. Use .enableKeys instead.');
				this.enableKeys = ! value;
			}
		},

		staticMoving : {
			get: function () {
				console.warn('THREE.OrbitControls: .staticMoving has been deprecated. Use .enableDamping instead.');
				return ! this.constraint.enableDamping;
			},
			set: function (value) {
				console.warn('THREE.OrbitControls: .staticMoving has been deprecated. Use .enableDamping instead.');
				this.constraint.enableDamping = ! value;
			}
		},

		dynamicDampingFactor : {
			get: function () {
				console.warn('THREE.OrbitControls: .dynamicDampingFactor has been renamed. Use .dampingFactor instead.');
				return this.constraint.dampingFactor;
			},
			set: function (value) {
				console.warn('THREE.OrbitControls: .dynamicDampingFactor has been renamed. Use .dampingFactor instead.');
				this.constraint.dampingFactor = value;
			}
		}

	});

	return OrbitController;

}());
;/* global THREE */
/* jshint unused:false */
'use strict';

var FOUR = FOUR || {};

FOUR.SelectionController = (function () {

  /**
   * Mouse based selection controller. Emits 'update' event when the associated
   * selection set changes. Emits 'lookat' event when a lookat point is
   * selected. Emits 'navigate' when a point is selected for the camera to
   * navigate toward for close inspection.
   * @param {Object} config Configuration
   * @constructor
   */
  function SelectionController (config) {
    THREE.EventDispatcher.call(this);
    config = config || {};
    var self = this;

    self.SINGLE_CLICK_TIMEOUT = 500; // milliseconds
    self.KEY = {ALT: 18, CTRL: 17, SHIFT: 16};
    self.SELECTION_MODE = {
      POINT: 0,
      FACE: 1,
      MESH: 2,
      OBJECT: 3,
      CAMERA: 4,
      LIGHT: 5
    };

    self.enabled = false;
    self.listeners = {};
    self.modifiers = {};
    self.mouse = new THREE.Vector2();
    self.raycaster = new THREE.Raycaster();
    self.selection = config.selection;
    self.viewport = config.viewport;

    Object.keys(self.KEY).forEach(function (key) {
      self.modifiers[self.KEY[key]] = false;
    });
  }

  SelectionController.prototype = Object.create(THREE.EventDispatcher.prototype);

  //SelectionController.prototype.constructor = SelectionController;

  SelectionController.prototype.contextMenu = function (event) {
    event.preventDefault();
  };

  SelectionController.prototype.count = function () {
    return this.selection.getObjects().length;
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
    addListener(self.selection, 'update', self.update);
    addListener(self.viewport.domElement, 'contextmenu', self.contextMenu);
    addListener(self.viewport.domElement, 'mousedown', self.onMouseDown);
    addListener(self.viewport.domElement, 'mousemove', self.onMouseMove);
    addListener(self.viewport.domElement, 'mouseover', self.onMouseOver);
    addListener(self.viewport.domElement, 'mouseup', self.onMouseUp);
    addListener(window, 'keydown', self.onKeyDown);
    addListener(window, 'keyup', self.onKeyUp);
    self.enabled = true;
  };

  SelectionController.prototype.onKeyDown = function (event) {
    var self = this;
    if (!self.enabled) {
      return;
    } else if (event.keyCode === self.KEY.ALT || event.keyCode === self.KEY.CTRL || event.keyCode === self.KEY.SHIFT) {
      //console.info('key down', event.keyCode);
      self.modifiers[event.keyCode] = true;
    }
  };

  SelectionController.prototype.onKeyUp = function (event) {
    var self = this;
    if (!self.enabled) {
      return;
    } else if (event.keyCode === self.KEY.ALT || event.keyCode === self.KEY.CTRL || event.keyCode === self.KEY.SHIFT) {
      //console.info('key up', event.keyCode);
      self.modifiers[event.keyCode] = false;
    }
  };

  SelectionController.prototype.onMouseDown = function (event) {
    event.stopPropagation();
  };

  SelectionController.prototype.onMouseMove = function (event) {};

  SelectionController.prototype.onMouseOver = function (event) {};

  SelectionController.prototype.onMouseUp = function (event) {
    event.preventDefault();
    event.stopPropagation();
    var intersects, objs, self = this;
    if (self.enabled) {
      // calculate mouse position in normalized device coordinates (-1 to +1)
      self.mouse.x = (event.offsetX / self.viewport.domElement.clientWidth) * 2 - 1;
      self.mouse.y = -(event.offsetY / self.viewport.domElement.clientHeight) * 2 + 1;
      // update the picking ray with the camera and mouse position
      self.raycaster.setFromCamera(self.mouse, self.viewport.camera);
      // calculate objects intersecting the picking ray
      intersects = self.raycaster.intersectObjects(self.viewport.scene.model.children, true); // TODO this is FOUR specific use of children
      // update the selection set using only the nearest selected object
      objs = intersects && intersects.length > 0 ? [intersects[0].object] : [];
      // add objects
      if (self.modifiers[self.KEY.SHIFT] === true) {
        self.selection.addAll(objs);
      }
      // remove objects
      else if (self.modifiers[self.KEY.ALT] === true) {
        self.selection.removeAll(objs);
      }
      // toggle selection state
      else {
        self.selection.toggle(objs);
      }
    }
  };

  SelectionController.prototype.selectByFilter = function (filter) {
    console.log('select by filter');
    var objs = [], self = this;
    self.viewport.scene.traverse(function (obj) {
      if (filter(obj)) {
        objs.push(obj);
      }
    });
    self.selection.addAll(objs);
  };

  SelectionController.prototype.selectByMarquee = function (event) {
    console.log('select by marquee');
    throw new Error('not implemented');
  };

  SelectionController.prototype.update = function () {
    this.dispatchEvent({type: 'update'});
  };

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
        self.selection = config.selection;
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
     * Emit event.
     * @param {String} type Event type
     */
    TourController.prototype.emit = function (type) {
        this.dispatchEvent({type: type});
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
        addListener(self.selection, 'update', self.plan);
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
        // get the list of features
        var features = objs || self.selection.getObjects();
        // generate the tour path
        return self.planner
          .generateTourSequence(features)
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
        self.camera = config.viewport.camera;
        self.domElement = config.viewport.domElement;
        self.dynamicDampingFactor = 0.2;
        self.enabled = false;
        self.keys = [
            65 /*A*/, 83 /*S*/, 68 /*D*/,
            73 /*I*/, 74 /*J*/, 75 /*K*/, 76 /*L*/
        ];
        self.lastPosition = new THREE.Vector3();
        self.listeners = {};
        self.maxDistance = Infinity;
        self.minDistance = 0;
        self.modifiers = {};
        self.mouse = self.MOUSE_STATE.UP;
        self.mousePosition = new THREE.Vector2();
        self.panSpeed = 0.3;
        self.raycaster = new THREE.Raycaster();
        self.rotateSpeed = 1.0;
        self.screen = { left: 0, top: 0, width: 0, height: 0 };
        self.staticMoving = false;
        self.target = new THREE.Vector3();
        self.timeout = null;
        self.viewport = config.viewport;
        self.zoomSpeed = 1.2;

        // for reset
        self.target0 = self.target.clone();
        self.position0 = self.camera.position.clone();
        self.up0 = self.camera.up.clone();

        Object.keys(self.KEY).forEach(function (key) {
            self.modifiers[self.KEY[key]] = false;
        });

        Object.keys(config).forEach(function (key) {
           self[key] = config[key];
        });
    }

    TrackballController.prototype = Object.create(THREE.EventDispatcher.prototype);

    //TrackballController.prototype.constructor = TrackballController;

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
            var self = this;
            mouseChange.copy(_panEnd).sub(_panStart);
            if (mouseChange.lengthSq()) {
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
        };
    }());

    TrackballController.prototype.reset = function () {
        var self = this;
        _state = STATE.NONE;
        _prevState = STATE.NONE;

        self.target.copy(self.target0);
        self.camera.position.copy(self.position0);
        self.camera.up.copy(self.up0);

        _eye.subVectors(self.camera.position, self.target);
        self.camera.lookAt(self.target);
        self.dispatchEvent(self.EVENTS.UPDATE);
        self.lastPosition.copy(self.camera.position);
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
            var self = this;
            moveDirection.set(_moveCurr.x - _movePrev.x, _moveCurr.y - _movePrev.y, 0);
            angle = moveDirection.length();

            if (angle) {
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
        var self = this;
        _eye.subVectors(self.camera.position, self.target);
        if (self.allowRotate) {
            self.rotateCamera();
        }
        if (self.allowZoom) {
            self.zoomCamera();
        }
        if (self.allowPan) {
            self.panCamera();
        }
        self.camera.position.addVectors(self.target, _eye);
        self.checkDistances();
        self.camera.lookAt(self.target);

        if (self.lastPosition.distanceToSquared(self.camera.position) > self.EPS) {
            self.dispatchEvent(self.EVENTS.UPDATE);
            self.lastPosition.copy(self.camera.position);
        }
    };

    TrackballController.prototype.zoomCamera = function () {
        var factor, self = this;
        if (_state === STATE.TOUCH_ZOOM_PAN) {
            factor = _touchZoomDistanceStart / _touchZoomDistanceEnd;
            _touchZoomDistanceStart = _touchZoomDistanceEnd;
            _eye.multiplyScalar(factor);
        } else {
            factor = 1.0 + (_zoomEnd.y - _zoomStart.y) * self.zoomSpeed;
            if (factor !== 1.0 && factor > 0.0) {
                _eye.multiplyScalar(factor);
                if (self.staticMoving) {
                    _zoomStart.copy(_zoomEnd);
                } else {
                    _zoomStart.y += (_zoomEnd.y - _zoomStart.y) * this.dynamicDampingFactor;
                }
            }
        }
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
 * First person navigation controller. Uses U-I-O-J-K-L keys for navigation
 * and the mouse pointer for look control. Assumes that +Z is up.
 */
FOUR.WalkController = (function () {

    function WalkController (config) {
        THREE.EventDispatcher.call(this);
        var self = this;

        self.EVENTS = {
            UPDATE: {type:'update'}
        };
        self.SINGLE_CLICK_TIMEOUT = 400; // milliseconds
        self.KEY = {
            CANCEL: 27,
            CTRL: 17,
            MOVE_TO_EYE_HEIGHT: 192,
            MOVE_FORWARD: 38,
            MOVE_LEFT: 37,
            MOVE_BACK: 40,
            MOVE_RIGHT: 39,
            MOVE_UP: 221,
            MOVE_DOWN: 219
        };
        self.MOUSE_STATE = {
            DOWN: 0,
            UP: 1
        };

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

    // done
    WalkController.prototype = Object.create(THREE.EventDispatcher.prototype);

    // done
    WalkController.prototype.constructor = WalkController;

    // done
    WalkController.prototype.WALK_HEIGHT = 2;

    // done
    WalkController.prototype.contextMenu = function (event) {
        event.preventDefault();
    };

    // done
    WalkController.prototype.disable = function () {
        var self = this;
        self.enabled = false;
        Object.keys(self.listeners).forEach(function (key) {
            var listener = self.listeners[key];
            listener.element.removeEventListener(listener.event, listener.fn);
        });
    };

    // done
    WalkController.prototype.emit = function (event) {
        this.dispatchEvent({type: event || 'update'});
    };

    // done
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
        addListener(self.domElement, 'contextmenu', self.contextMenu);
        addListener(self.domElement, 'mousedown', self.onMouseDown);
        addListener(self.domElement, 'mousemove', self.onMouseMove);
        addListener(self.domElement, 'mouseup', self.onMouseUp);
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
    // done
    WalkController.prototype.getWalkHeight = function (position) {
        return 0;
    };

    // done
    WalkController.prototype.handleDoubleClick = function (selected) {
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

    // done
    WalkController.prototype.handleSingleClick = function () {};

    // done
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

    // done
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

    WalkController.prototype.onMouseDown = function (event) {
        var self = this;
        self.lookChange = false;
        self.mouse.state = self.MOUSE_STATE.DOWN;
        // get mouse coordinates
        self.mouse.start = new THREE.Vector2(
            event.pageX - self.domElement.offsetLeft - self.viewHalfX,
            event.pageY - self.domElement.offsetTop - self.viewHalfY
        );
        // handle single and double click events
        if (self.timeout !== null) {
            //console.log('double click');
            clearTimeout(self.timeout);
            self.timeout = null;
            // calculate mouse position in normalized device coordinates (-1 to +1)
            self.mouse.end.x = (event.offsetX / self.viewport.domElement.clientWidth) * 2 - 1;
            self.mouse.end.y = -(event.offsetY / self.viewport.domElement.clientHeight) * 2 + 1;
            // update the picking ray with the camera and mouse position
            self.raycaster.setFromCamera(self.mouse.end, self.viewport.camera);
            // calculate objects intersecting the picking ray
            var intersects = self.raycaster.intersectObjects(self.viewport.scene.model.children, true); // TODO this is FOUR specific use of children
            // handle the action for the nearest object
            if (intersects && intersects.length > 0) {
                self.handleDoubleClick(intersects[0]);
            }
        } else {
            self.timeout = setTimeout(function () {
                //console.log('single click');
                clearTimeout(self.timeout);
                self.timeout = null;
            }, self.SINGLE_CLICK_TIMEOUT);
        }
    };

    WalkController.prototype.onMouseMove = function (event) {
        var self = this;
        if (self.mouse.state === self.MOUSE_STATE.DOWN) {
            self.lookChange = true;
            self.mouse.end = new THREE.Vector2(
              event.pageX - self.domElement.offsetLeft - self.viewHalfX,
              event.pageY - self.domElement.offsetTop - self.viewHalfY
            );
            self.mouse.direction = new THREE.Vector2(
              (self.mouse.end.x / self.domElement.clientWidth) * 2,
              (self.mouse.end.y / self.domElement.clientHeight) * 2
            );
        }
    };

    WalkController.prototype.onMouseUp = function (event) {
        var self = this;
        self.lookChange = false;
        self.mouse.state = self.MOUSE_STATE.UP;
    };

    // done
    WalkController.prototype.onResize = function () {
        console.log('resize');
    };

    // done
    WalkController.prototype.setWalkHeight = function () {
        var self = this;
        return self.camera
          .resetOrientation(self.emit.bind(self))
          .then(function () {
            self.camera.setPositionAndTarget(
              self.camera.position.x,
              self.camera.position.y,
              self.WALK_HEIGHT,
              self.camera.target.x,
              self.camera.target.y,
              self.WALK_HEIGHT);
        });
    };

    // done
    WalkController.prototype.update = function (delta) {
        var self = this;
        if (!self.enabled) {
            return;
        }
        var distance = delta * self.movementSpeed;
        var change = false;

        // translate the camera
        if (self.move.forward) {
            self.camera.translateZ(-distance);
            change = true;
        }
        if (self.move.backward) {
            self.camera.translateZ(distance);
            change = true;
        }
        if (self.move.right) {
            self.camera.translateX(distance);
            change = true;
        }
        if (self.move.left) {
            self.camera.translateX(-distance);
            change = true;
        }
        if (self.move.up) {
            self.camera.translateY(-distance);
            change = true;
        }
        if (self.move.down) {
            self.camera.translateY(distance);
            change = true;
        }

        // change the camera lookat direction
        //if (self.lookChange) {
        //    self.camera.rotateOnAxis(
        //        new THREE.Vector3(0,1,0),
        //        Math.PI * 2 / 360 * -self.mouse.direction.x * self.lookSpeed);
        //    // TODO clamp the amount of vertical rotation
        //    //self.camera.rotateOnAxis(
        //    //    new THREE.Vector3(1,0,0),
        //    //    Math.PI * 2 / 360 * -self.mouse.direction.y * self.lookSpeed * 0.5);
        //    change = true;
        //}
        if (change) {
            self.dispatchEvent(self.EVENTS.UPDATE);
        }
    };

    return WalkController;

}());
;/* jshint unused:false */
'use strict';

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
