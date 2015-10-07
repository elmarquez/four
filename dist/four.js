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
    console.log('bounding box update');
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

FOUR.KeyStateController = (function () {

  /**
   * Key state controller. Maintains the state of some key combinations and
   * otherwise dispatches key events to listeners.
   * @constructor
   */
  function KeyStateController (config) {
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

  KeyStateController.prototype = Object.create(THREE.EventDispatcher.prototype);

  KeyStateController.prototype.constructor = KeyStateController;

  KeyStateController.prototype.keydown = function (key, evt) {
    this.modifiers[key] = true;
    this.dispatchEvent({'type': 'keydown', key: key, keyCode: evt ? evt.keyCode : null});
  };

  KeyStateController.prototype.keyup = function (key, evt) {
    this.modifiers[key] = false;
    this.dispatchEvent({'type': 'keyup', key: key, keyCode: evt ? evt.keyCode : null});
  };

  /**
   * Register key event callback.
   * @param {String} command Key command
   * @param {Function} callback Callback
   */
  KeyStateController.prototype.register = function (command, callback) {
    throw new Error('not implemented');
  };

  return KeyStateController;

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

    function PathPlanner () {}

    PathPlanner.prototype.generateTourSequence = function (features) {
        // TODO return a promise
        // TODO execute computation in a worker
        var material, geometry, i, line, self = this;
        var ts = new TravellingSalesman(50);
        // Add points to itinerary
        var selected = self.selection.getObjects();
        if (selected.length > 0) {
            selected.forEach(function (obj) {
                ts.addPoint({
                    focus: 0,
                    obj: obj,
                    radius: obj.geometry.boundingSphere.radius,
                    x: obj.position.x,
                    y: obj.position.y,
                    z: obj.position.z
                });
            });
        } else {
            // TODO filter entities
            self.scene.traverse(function (obj) {
                ts.addPoint({
                    focus: 0,
                    obj: obj,
                    radius: obj.geometry.boundingSphere.radius,
                    x: obj.position.x,
                    y: obj.position.y,
                    z: obj.position.z
                });
            });
        }
        // Initialize population
        ts.init();
        console.log('Initial distance: ' + ts.getPopulation().getFittest().getDistance());
        // Evolve the population
        ts.evolve(100);
        // Print final results
        console.log('Final distance: ' + ts.getPopulation().getFittest().getDistance());
        console.log(ts.getPopulation().getFittest());

        self.walk.path = ts.getSolution();
        var lastpoint = self.walk.path[0];
        for (i = 1; i < self.walk.path.length; i++) {
            var point = self.walk.path[i];
            // line geometry
            material = new THREE.LineBasicMaterial({color: 0x0000cc});
            geometry = new THREE.Geometry();
            geometry.vertices.push(
                new THREE.Vector3(lastpoint.x, lastpoint.y, lastpoint.z),
                new THREE.Vector3(point.x, point.y, point.z)
            );
            line = new THREE.Line(geometry, material);
            self.scene.add(line);
            lastpoint = point;
        }
        // select the nearest point and set the walk index to that item
        self.walk.index = 0;
    };

    PathPlanner.prototype.moveToNextWaypointFeature = function () {
        console.log('move to next bounding box focal point');
        var self = this;
        var waypoint = self.walk.path[self.walk.index];
        var obj = waypoint.obj;
        var x, y, z;
        // if entity is a pole, then move to middle, top, bottom
        if (obj.userData.type === 'pole') {
            console.log('pole');
            if (waypoint.focus === 0) {
                z = obj.geometry.boundingSphere.radius;
                waypoint.focus = 1;
            } else if (waypoint.focus === 1) {
                z = -(obj.geometry.boundingSphere.radius * 2);
                waypoint.focus = 2;
            } else if (waypoint.focus === 2) {
                z = obj.geometry.boundingSphere.radius;
                waypoint.focus = 0;
            }
            self.tweenCameraToPosition(
                self.camera.position.x,
                self.camera.position.y,
                self.camera.position.z + z,
                obj.position.x,
                obj.position.y,
                obj.position.z + z
            );
        }
        // if entity is a catenary, then move to middle, end, start
        else if (obj.userData.type === 'catenary') {
            console.log('catenary');
        }
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
        // TODO need better path planning ... there is too much rotation happening right now
        return new Promise(function (resolve) {
            var emit = progress;
            var start = {
                x: camera.position.x, y: camera.position.y, z: camera.position.z,
                tx: camera.target.x, ty: camera.target.y, tz: camera.target.z
            };
            var finish = {
                x: position.x, y: position.y, z: position.z,
                tx: target.x, ty: target.y, tz: target.z
            };
            var tween = new TWEEN.Tween(start).to(finish, 1500);
            tween.easing(TWEEN.Easing.Cubic.InOut);
            tween.onComplete(function () {
                emit('continuous-update-end');
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
            emit('continuous-update-start');
            emit('update');
        });
    };

    //PathPlanner.prototype.tweenToPositionAndRotation = function (camera, position, target, rotation, progress) {
    //    // TODO need better path planning ... there is too much rotation happening right now
    //    return new Promise(function (resolve) {
    //        var emit = progress;
    //        var start = {
    //            x: camera.position.x, y: camera.position.y, z: camera.position.z,
    //            tx: camera.target.x, ty: camera.target.y, tz: camera.target.z,
    //            rx: camera.rotation.x, ry: camera.rotation.y, rz: camera.rotation.z
    //        };
    //        var finish = {
    //            x: position.x, y: position.y, z: position.z,
    //            tx: target.x, ty: target.y, tz: target.z,
    //            rx: rotation.x, ry: rotation.y, rz: rotation.z
    //        };
    //        var tween = new TWEEN.Tween(start).to(finish, 1500);
    //        tween.easing(TWEEN.Easing.Cubic.InOut);
    //        tween.onComplete(function () {
    //            emit('continuous-update-end');
    //            resolve();
    //        });
    //        tween.onUpdate(function () {
    //            var tweened = this;
    //            camera.distance = distance(camera.position, camera.target);
    //            camera.lookAt(new THREE.Vector3(tweened.tx, tweened.ty, tweened.tz));
    //            camera.position.set(tweened.x, tweened.y, tweened.z);
    //            camera.target.set(tweened.tx, tweened.ty, tweened.tz);
    //            camera.rotation.set(tweened.rx, tweened.ry, tweened.rz, 'XYZ');
    //        });
    //        tween.start();
    //        emit('continuous-update-start');
    //        emit('update');
    //    });
    //};

    PathPlanner.prototype.walkToNextPoint = function () {
        console.log('walk to next point');
        var self = this;
        if (self.walk.index >= self.walk.path.length - 1) {
            self.walk.index = 0;
        } else {
            self.walk.index += 1;
        }
        var point = self.walk.path[self.walk.index];
        var offset = 0;
        // the offset from the current camera position to the new camera position
        var dist = 10 / Math.tan(Math.PI * self.camera.fov / 360);
        var target = new THREE.Vector3(0, 0, -(dist + offset)); // 100 is the distance from the camera to the target, measured along the Z axis
        target.applyQuaternion(self.camera.quaternion);
        target.add(self.camera.position);
        var diff = new THREE.Vector3().subVectors(new THREE.Vector3(point.x, point.y, point.z), target);
        // the next camera position
        var next = new THREE.Vector3().add(self.camera.position, diff);
        // move the camera to the next position
        self.tweenCameraToPosition(next.x, next.y, next.z, point.x, point.y, 2);
    };

    PathPlanner.prototype.walkToPreviousPoint = function () {
        console.log('walk to previous point');
        var self = this;
        if (self.walk.index <= 0) {
            self.walk.index = self.walk.path.length - 1;
        } else {
            self.walk.index -= 1;
        }
        var point = self.walk.path[self.walk.index];
        var offset = 0;
        // the offset from the current camera position to the new camera position
        var dist = 10 / Math.tan(Math.PI * self.camera.fov / 360);
        var target = new THREE.Vector3(0, 0, -(dist + offset)); // 100 is the distance from the camera to the target, measured along the Z axis
        target.applyQuaternion(self.camera.quaternion);
        target.add(self.camera.position);
        var diff = new THREE.Vector3().subVectors(new THREE.Vector3(point.x, point.y, point.z), target);
        // the next camera position
        var next = new THREE.Vector3().add(self.camera.position, diff);
        // move the camera to the next position
        self.tweenCameraToPosition(next.x, next.y, next.z, point.x, point.y, 2);
    };

    return PathPlanner;

}());
;/* global THREE */
/* jshint unused:false */
'use strict';

var FOUR = FOUR || {};

FOUR.Scene3D = (function () {

    // default camera settings
    var camera = {
        far: 1000,
        fov: 45,
        height: 1,
        near: 0.1,
        width: 1
    };

    /**
     *
     * @constructor
     */
    function Scene3D () {
        THREE.Scene.call(this);

        var self = this;
        self.boundingBox = new FOUR.BoundingBox('scene-bounding-box');
        self.cameras = new THREE.Object3D();
        self.helpers = new THREE.Object3D();
        self.lights = new THREE.Object3D();
        self.model = new THREE.Object3D();
        self.selection = new FOUR.SelectionSet({scene: self});

        self.add(self.cameras);
        self.add(self.lights);
        self.add(self.model);
        self.add(self.helpers);

        // scene bounding box
        self.helpers.add(self.boundingBox);

        // listen for updates
        self.selection.addEventListener('update', function () {
            self.boundingBox.update(self.selection.getObjects());
        });
        self.selection.addEventListener('update', function () {
            // highlight selected objects
        });
    }

    Scene3D.prototype = Object.create(THREE.Scene.prototype);

    Scene3D.prototype.DEFAULT_CAMERA_NAME = 'camera1';

    Scene3D.prototype.constructor = Scene3D;

    /**
     * Create a default scene camera. A camera aspect ratio or DOM height
     * element and width must be specified.
     * @param config
     */
    Scene3D.prototype.createDefaultCamera = function (config) {
        // TODO rename to createCamera
        var self = this;
        Object.keys(config).forEach(function (key) {
           camera[key] = config[key];
        });
        var targetcamera = new FOUR.TargetCamera(camera.fov, camera.width / camera.height, camera.near, camera.far);
        targetcamera.name = self.DEFAULT_CAMERA_NAME; // use name field
        self.cameras.add(targetcamera);
        targetcamera.setPositionAndTarget(-50, -50, 50, 0, 0, 0); // use position, target fields
        targetcamera.addEventListener('continuous-update-end', function () { self.emit('continuous-update-end'); });
        targetcamera.addEventListener('continuous-update-start', function () { self.emit('continuous-update-start'); });
        targetcamera.addEventListener('update', function () { self.emit('update'); });
    };

    Scene3D.prototype.emit = function (type) {
      this.dispatchEvent({'type':type});
    };

    Scene3D.prototype.getCamera = function (name) {
        var self = this;
        return self.getCameras(function (obj) {
            return obj.name === name;
        }).pop();
    };

    Scene3D.prototype.getCameras = function (filter) {
        var cameras = [], self = this;
        if (!filter) {
            filter = filter || function () { return true; };
        }
        self.cameras.traverse(function (obj) {
            if (filter(obj)) {
                cameras.push(obj);
            }
        });
        return cameras;
    };

    Scene3D.prototype.getLight = function (name) {
        throw new Error('not implemented');
    };

    Scene3D.prototype.getLights = function () {
        throw new Error('not implemented');
    };

    Scene3D.prototype.load = function () {
        throw new Error('not implemented');
    };

    return Scene3D;

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
    self.count = 0;
    self.name = 'selection-set';
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

    var TargetCamera = function (fov, aspect, near, far) {
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
    };

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

    TargetCamera.prototype.setDistance = function (dist) {
        console.log('update the camera distance from target');
        var offset, distance, next, self = this;
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
        return self.planner.tweenToPosition(
            self,
            new THREE.Vector3(x, y, z),
            new THREE.Vector3(tx, ty, tz),
            self.emit.bind(self));
    };

    /**
     * Set the camera target position. Animate the camera target to the new
     * target position.
     * @param {Number} x X coordinate
     * @param {Number} y Y coordinate
     * @param {Number} z Z coordinate
     */
    TargetCamera.prototype.setTarget = function (x, y, z) {
        var self = this;
        return self.planner.tweenToPosition(
            self,
            self.position,
            new THREE.Vector3(x, y, z),
            self.emit.bind(self));
    };

    /**
     * Move the camera to the predefined view position.
     * @param {Number} view View
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
        console.log('zoom in');
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
        console.log('zoom out');
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
        console.log('zoom to fit all or selected items');
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
        TWEEN.update();
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
     * @param {Element} domElement DOM element
     * @param {THREE.Scene|FOUR.Scene} scene Scene
     * @param {THREE.Camera} camera Camera
     * @constructor
     */
    function Viewport3D(domElement, scene, camera) {
        THREE.EventDispatcher.call(this);
        this.backgroundColor = new THREE.Color(0x000, 1.0);
        this.camera = camera;
        this.clock = new THREE.Clock();
        this.controller = null; // the active controller
        this.controllers = {};
        this.domElement = domElement;
        this.renderer = null;
        this.scene = scene || new THREE.Scene();
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
     * @returns {THREE.Scene|FOUR.Scene}
     */
    Viewport3D.prototype.getScene = function () {
        return this.scene;
    };

    /**
     * Handle window resize event.
     */
    Viewport3D.prototype.handleResize = function () {
        var self = this;
        var height = self.domElement.clientHeight;
        var width = self.domElement.clientWidth;
        self.camera.aspect = width / height;
        self.camera.updateProjectionMatrix();
        self.renderer.setSize(width, height);
        self.render();
    };

    /**
     * Initialize the viewport.
     */
    Viewport3D.prototype.init = function () {
        var self = this;
        // renderer
        self.renderer = new THREE.WebGLRenderer({antialias: true});
        self.renderer.setClearColor(self.backgroundColor);
        self.renderer.setSize(self.domElement.clientWidth, self.domElement.clientHeight);
        self.renderer.shadowMap.enabled = true;
        self.domElement.appendChild(self.renderer.domElement);
        // listen for events
        window.addEventListener('resize', self.handleResize.bind(self), false);
        self.scene.addEventListener('update', self.render.bind(self), false);
        // draw the first frame
        self.render();
        // start updating controllers
        self.update();
    };

    /**
     * Render the viewport once.
     */
    Viewport3D.prototype.render = function () {
        var self = this;
        self.renderer.render(self.scene, self.camera);
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
     * @param {String} name Camera name
     */
    Viewport3D.prototype.setCamera = function (name) {
        var found = false, i, obj, self = this;
        if (typeof self.scene === FOUR.Scene3D) {
            self.camera = self.scene.getCamera(name);
        } else {
            for (i = 0;i < self.scene.children && !found; i++) {
                obj = self.scene.children[i];
                if (typeof obj === THREE.Camera) {
                    if (obj.name === name) {
                        self.camera = obj;
                        found = true;
                    }
                }
            }
            if (!found) {
                console.error('Camera "' + name + '" not found');
            }
        }
        self.render();
    };

    /**
     * Set the active viewport controller.
     * @param {String} mode Controller key
     */
    Viewport3D.prototype.setMode = function (mode) {
        var self = this;
        self.controller[self.mode].disable();
        self.mode = mode;
        self.controller[self.mode].enable();
    };

    /**
     * Update the controller and global tween state.
     */
    Viewport3D.prototype.update = function () {
        var self = this;
        // enqueue next update
        requestAnimationFrame(self.update.bind(self));
        // update tween state
        TWEEN.update();
        // update the current controller if it has an update() function
        if (self.controller) {
            var delta = self.clock.getDelta();
            self.controller[self.mode].update(delta);
        }
    };

    return Viewport3D;

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
            CHANGE: { type: 'change' },
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
        self.MODE = {
            SELECTION: 0,
            TRACKBALL: 1,
            FIRSTPERSON: 2,
            ORBIT: 3
        };

        self.controller = null;
        self.controllers = {};
        self.domElement = domElement;
        self.viewport = viewport;
    }

    MultiController.prototype = Object.create(THREE.EventDispatcher.prototype);

    MultiController.prototype.constructor = MultiController;

    MultiController.prototype.init = function () {
        // Q, W, E, R
        var self = this;
        self.controllers.orbit = new FOUR.OrbitController();
        self.controllers.trackball = new FOUR.TrackballController();
        self.controllers.walk = new FOUR.WalkController();
    };

    /**
     * Set the controller mode.
     * @param {String} mode Controller mode
     */
    MultiController.prototype.setMode = function (mode) {
        var self = this;
        self.dispatchEvent({type: 'change'});
    };

    return MultiController;

}());
;'use strict';

var FOUR = FOUR || {};

/**
 * Modified version of the THREE.OrbitController
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

	function OrbitController (camera, domElement) {
		THREE.EventDispatcher.call(this);

		var constraint = new OrbitConstraint(camera);
		this.domElement = (domElement !== undefined) ? domElement : document;

		// API
		Object.defineProperty(this, 'constraint', {
			get: function() {
				return constraint;
			}
		});

		// Set to false to disable this control
		this.enabled = true;

		// This option actually enables dollying in and out; left as "zoom" for
		// backwards compatibility.
		// Set to false to disable zooming
		this.enableZoom = true;
		this.zoomSpeed = 1.0;

		// Set to false to disable rotating
		this.enableRotate = true;
		this.rotateSpeed = 1.0;

		// Set to false to disable panning
		this.enablePan = true;
		this.keyPanSpeed = 7.0;	// pixels moved per arrow key push

		// Set to true to automatically rotate around the target
		// If auto-rotate is enabled, you must call controls.update() in your animation loop
		this.autoRotate = false;
		this.autoRotateSpeed = 2.0; // 30 seconds per round when fps is 60

		// Set to false to disable use of the keys
		this.enableKeys = true;

		// The four arrow keys
		this.keys = { LEFT: 37, UP: 38, RIGHT: 39, BOTTOM: 40 };

		// Mouse buttons
		this.mouseButtons = { ORBIT: THREE.MOUSE.LEFT, ZOOM: THREE.MOUSE.MIDDLE, PAN: THREE.MOUSE.RIGHT };

		////////////
		// internals
		var scope = this;

		var rotateStart = new THREE.Vector2();
		var rotateEnd = new THREE.Vector2();
		var rotateDelta = new THREE.Vector2();

		var panStart = new THREE.Vector2();
		var panEnd = new THREE.Vector2();
		var panDelta = new THREE.Vector2();

		var dollyStart = new THREE.Vector2();
		var dollyEnd = new THREE.Vector2();
		var dollyDelta = new THREE.Vector2();

		var STATE = { NONE : - 1, ROTATE : 0, DOLLY : 1, PAN : 2, TOUCH_ROTATE : 3, TOUCH_DOLLY : 4, TOUCH_PAN : 5 };

		var state = STATE.NONE;

		// for reset
		this.target0 = this.target.clone();
		this.position0 = this.camera.position.clone();
		this.zoom0 = this.camera.zoom;

		// events
		scope.changeEvent = { type: 'change' };
		scope.startEvent = { type: 'start' };
		scope.endEvent = { type: 'end' };


		function contextmenu(event) {
			event.preventDefault();
		}

		function getAutoRotationAngle() {
			return 2 * Math.PI / 60 / 60 * scope.autoRotateSpeed;
		}

		function getZoomScale() {
			return Math.pow(0.95, scope.zoomSpeed);
		}

		function onMouseDown(event) {
			if (scope.enabled === false) {
				return;
			}
			event.preventDefault();
			if (event.button === scope.mouseButtons.ORBIT) {
				if (scope.enableRotate === false) {
					return;
				}
				state = STATE.ROTATE;
				rotateStart.set(event.clientX, event.clientY);
			} else if (event.button === scope.mouseButtons.ZOOM) {
				if (scope.enableZoom === false) {
					return;
				}
				state = STATE.DOLLY;
				dollyStart.set(event.clientX, event.clientY);
			} else if (event.button === scope.mouseButtons.PAN) {
				if (scope.enablePan === false) {
					return;
				}
				state = STATE.PAN;
				panStart.set(event.clientX, event.clientY);
			}

			if (state !== STATE.NONE) {
				scope.domElement.addEventListener('mousemove', onMouseMove.bind(scope), false);
				scope.domElement.addEventListener('mouseup', onMouseUp.bind(scope), false);
				scope.dispatchEvent(scope.startEvent);
			}
		}

		function onMouseMove(event) {
			if (scope.enabled === false) {
				return;
			}
			event.preventDefault();
			var element = scope.domElement === document ? scope.domElement.body : scope.domElement;
			if (state === STATE.ROTATE) {
				if (scope.enableRotate === false) {
					return;
				}
				rotateEnd.set(event.clientX, event.clientY);
				rotateDelta.subVectors(rotateEnd, rotateStart);
				// rotating across whole screen goes 360 degrees around
				constraint.rotateLeft(2 * Math.PI * rotateDelta.x / element.clientWidth * scope.rotateSpeed);
				// rotating up and down along whole screen attempts to go 360, but limited to 180
				constraint.rotateUp(2 * Math.PI * rotateDelta.y / element.clientHeight * scope.rotateSpeed);
				rotateStart.copy(rotateEnd);
			} else if (state === STATE.DOLLY) {
				if (scope.enableZoom === false) {
					return;
				}
				dollyEnd.set(event.clientX, event.clientY);
				dollyDelta.subVectors(dollyEnd, dollyStart);
				if (dollyDelta.y > 0) {
					constraint.dollyIn(getZoomScale());
				} else if (dollyDelta.y < 0) {
					constraint.dollyOut(getZoomScale());
				}
				dollyStart.copy(dollyEnd);
			} else if (state === STATE.PAN) {
				if (scope.enablePan === false) {
					return;
				}
				panEnd.set(event.clientX, event.clientY);
				panDelta.subVectors(panEnd, panStart);
				scope.pan(panDelta.x, panDelta.y);
				panStart.copy(panEnd);
			}
			if (state !== STATE.NONE) {
				scope.update();
			}
		}

		function onMouseUp() {
			if (scope.enabled === false) {
				return;
			}
			scope.domElement.removeEventListener('mousemove', onMouseMove, false);
			scope.domElement.removeEventListener('mouseup', onMouseUp, false);
			scope.dispatchEvent(scope.endEvent);
			state = STATE.NONE;
		}
		// force an update at start
		this.listen();
		this.update();
	}

	OrbitController.prototype = Object.create(THREE.EventDispatcher.prototype);

	OrbitController.prototype.constructor = OrbitController;

	OrbitController.prototype.disable = function () {
		var self = this;
		self.enabled = false;
		self.dispose();
	};

	OrbitController.prototype.dispose = function() {
		var self = this;
		self.domElement.removeEventListener('contextmenu', self.contextmenu, false);
		self.domElement.removeEventListener('mousedown', self.onMouseDown, false);
		self.domElement.removeEventListener('mousewheel', self.onMouseWheel, false);
		self.domElement.removeEventListener('DOMMouseScroll', self.onMouseWheel, false); // firefox
		self.domElement.removeEventListener('mousemove', self.onMouseMove, false);
		self.domElement.removeEventListener('mouseup', self.onMouseUp, false);
	};

	OrbitController.prototype.enable = function () {
		var self = this;
		self.constraint.sync();
		self.enabled = true;
		self.listen();
	};

	OrbitController.prototype.getAzimuthalAngle = function () {
		return this.constraint.getAzimuthalAngle();
	};

	OrbitController.prototype.getPolarAngle = function () {
		return this.constraint.getPolarAngle();
	};

	OrbitController.prototype.listen = function () {
		var self = this;
		self.domElement.addEventListener('contextmenu', self.contextmenu, false);
		self.domElement.addEventListener('mousedown', self.onMouseDown, false);
		self.domElement.addEventListener('mousewheel', self.onMouseWheel, false);
		self.domElement.addEventListener('DOMMouseScroll', self.onMouseWheel, false); // firefox
		self.domElement.addEventListener('mouseup', self.onMouseUp, false);
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
		self.dispatchEvent(self.startEvent);
		self.dispatchEvent(self.endEvent);
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
		self.dispatchEvent(self.changeEvent);

		self.update();
	};

	OrbitController.prototype.update = function () {
		var self = this;
		if (self.autoRotate && self.state === self.STATE.NONE) {
			self.constraint.rotateLeft(self.getAutoRotationAngle());
		}
		if (self.constraint.update() === true) {
			self.dispatchEvent(self.changeEvent);
		}
	};


	Object.defineProperties(OrbitController.prototype, {
		camera: {
			get: function () {
				return this.constraint.camera;
			}
		},

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
   * selection set changes.
   * @param {Object} config Configuration
   * @constructor
   */
  function SelectionController (config) {
    THREE.EventDispatcher.call(this);
    config = config || {};
    var self = this;

    self.KEY = {ALT: 18, CTRL: 17, SHIFT: 16};
    self.SELECTION_MODE = {
      POINT: 0,
      FACE: 1,
      MESH: 2,
      OBJECT: 3,
      CAMERA: 4,
      LIGHT: 5
    };

    self.enabled = config.enabled || true;
    self.modifiers = {};
    self.mouse = new THREE.Vector2();
    self.raycaster = new THREE.Raycaster();
    self.selection = config.selection;
    self.viewport = config.viewport;

    Object.keys(self.KEY).forEach(function (key) {
      self.modifiers[self.KEY[key]] = false;
    });

    // listen for mouse events
    self.selection.addEventListener('update', self.update.bind(self), false);
    self.viewport.domElement.addEventListener('mousedown', self.onMouseDown.bind(self), false);
    self.viewport.domElement.addEventListener('mousemove', self.onMouseMove.bind(self), false);
    self.viewport.domElement.addEventListener('mouseover', self.onMouseOver.bind(self), false);
    self.viewport.domElement.addEventListener('mouseup', self.onMouseUp.bind(self), false);
  }

  SelectionController.prototype = Object.create(THREE.EventDispatcher.prototype);

  SelectionController.prototype.constructor = SelectionController;

  SelectionController.prototype.count = function () {
    return this.selection.getObjects().length;
  };

  SelectionController.prototype.disable = function () {
    this.enabled = false;
  };

  SelectionController.prototype.enable = function () {
    this.enabled = true;
  };

  SelectionController.prototype.onKeyDown = function (event) {
    var self = this;
    if (!self.enabled) {
      return;
    } else if (event.keyCode === self.KEY.ALT || event.keyCode === self.KEY.CTRL || event.keyCode === self.KEY.SHIFT) {
      this.modifiers[event.keyCode] = true;
    }
  };

  SelectionController.prototype.onKeyUp = function (event) {
    var self = this;
    if (!self.enabled) {
      return;
    } else if (event.keyCode === self.KEY.ALT || event.keyCode === self.KEY.CTRL || event.keyCode === self.KEY.SHIFT) {
      this.modifiers[event.keyCode] = false;
    }
  };

  SelectionController.prototype.onMouseDown = function (event) {
    //console.log('mouse down');
  };

  SelectionController.prototype.onMouseMove = function (event) {
    //console.log('mouse move');
  };

  SelectionController.prototype.onMouseOver = function (event) {
    //console.log('mouse over');
  };

  SelectionController.prototype.onMouseUp = function (event) {
    event.preventDefault();
    event.stopPropagation();
    var self = this;
    if (self.enabled) {
      // calculate mouse position in normalized device coordinates (-1 to +1)
      self.mouse.x = (event.offsetX / self.viewport.domElement.clientWidth) * 2 - 1;
      self.mouse.y = -(event.offsetY / self.viewport.domElement.clientHeight) * 2 + 1;
      // update the picking ray with the camera and mouse position
      self.raycaster.setFromCamera(self.mouse, self.viewport.camera); // TODO this is FOUR specific
      // calculate objects intersecting the picking ray
      var intersects = self.raycaster.intersectObjects(self.viewport.scene.model.children, true) || []; // TODO this is FOUR specific use of children
      // update the selection set using only the nearest selected object
      var objs = intersects && intersects.length > 0 ? [intersects[0].object] : [];
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
            CHANGE: { type: 'change' },
            END: { type: 'end' },
            START: { type: 'start' }
        };
        self.KEY = {
            NONE: -1,
            CANCEL: 0,
            NEXT: 1,
            PREVIOUS: 2,
            UPDATE: 3
        };
        self.PLANNING_STRATEGY = {
            GENETIC: 0,
            SIMULATED_ANNEALING: 1
        };

        self.camera = config.camera;
        self.current = -1; // index of the tour feature
        self.domElement = config.domElement;
        self.enabled = config.enabled || true;
        self.offset = 100; // distance between camera and feature when visiting
        self.path = [];
        self.planner = new FOUR.PathPlanner();
        self.planningStrategy = self.PLANNING_STRATEGY.GENETIC;
        self.selection = config.selection;

        if (self.enabled) {
            self.enable();
        }
    }

    TourController.prototype = Object.create(THREE.EventDispatcher.prototype);

    TourController.prototype.constructor = TourController;

    /**
     * Disable the controller.
     */
    TourController.prototype.disable = function () {
        var self = this;
        self.enabled = false;
        self.selection.removeEventListener('update', self.update);
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
        // listen for updates on the selection set
        self.selection.addEventListener('update', self.update.bind(self), false);
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
        // the feature to visit
        var feature = self.path[i];
        // the offset from the current camera position to the new camera position
        // TODO what is 10??
        var dist = (10 / Math.tan(Math.PI * self.camera.fov / 360)) + self.offset;
        var target = new THREE.Vector3(0, 0, -dist);
        target.applyQuaternion(self.camera.quaternion);
        target.add(self.camera.position);
        var diff = new THREE.Vector3().subVectors(new THREE.Vector3(feature.x, feature.y, feature.z), target);
        // the next camera position
        var camera = new THREE.Vector3().add(self.camera.position, diff);
        // move the camera to the next position
        return self.planner.tweenToPosition(
          self.camera,
          new THREE.Vector3(camera.x, camera.y, camera.z),
          new THREE.Vector3(feature.x, feature.y, feature.z),
          self.noop
        );
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
        } else if (self.current < self.path.length) {
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
     * Update the tour itinerary.
     * @returns {Promise}
     */
    TourController.prototype.update = function () {
        var self = this;
        // reset the current feature index
        self.current = -1;
        // get the list of features
        var features = [];
        return self.planner
          .generateTourSequence(features)
          .then(function (path) {
              self.path = path;
          });
    };

    return TourController;

}());
;'use strict';

var FOUR = FOUR || {};

/**
 * Trackball controller.
 * @todo listen for camera change on the viewport
 * @todo listen for domelement resize events
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

    function TrackballController (camera, domElement) {
        THREE.EventDispatcher.call(this);

        var self = this;

        self.EPS = 0.000001;
        self.EVENTS = {
            CHANGE: {type: 'change'},
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

            CANCEL: 27,
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
            DOWN: 1,
            MOVE: 2
        };

        // API
        self.allowZoom = true;
        self.allowPan = true;
        self.allowRotate = true;
        self.camera = camera;
        self.domElement = (domElement !== undefined) ? domElement : document;
        self.dynamicDampingFactor = 0.2;
        self.enabled = true;
        self.keys = [
            65 /*A*/, 83 /*S*/, 68 /*D*/,
            73 /*I*/, 74 /*J*/, 75 /*K*/, 76 /*L*/
        ];
        self.lastPosition = new THREE.Vector3();
        self.maxDistance = Infinity;
        self.minDistance = 0;
        self.mouse = self.MOUSE_STATE.UP;
        self.panSpeed = 0.3;
        self.rotateSpeed = 1.0;
        self.screen = { left: 0, top: 0, width: 0, height: 0 };
        self.staticMoving = false;
        self.target = new THREE.Vector3();
        self.zoomSpeed = 1.2;

        // for reset
        self.target0 = self.target.clone();
        self.position0 = self.camera.position.clone();
        self.up0 = self.camera.up.clone();
    }

    TrackballController.prototype = Object.create(THREE.EventDispatcher.prototype);

    TrackballController.prototype.constructor = TrackballController;

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

    TrackballController.prototype.contextmenu = function (event) {
        event.preventDefault();
    };

    TrackballController.prototype.disable = function () {
        var self = this;
        self.enabled = false;
        self.domElement.removeEventListener('contextmenu', self.contextmenu, false);
        self.domElement.removeEventListener('mousedown', self.mousedown, false);
        self.domElement.removeEventListener('mousemove', self.mousemove, false);
        self.domElement.removeEventListener('mouseup', self.mouseup, false);
        self.domElement.removeEventListener('mousewheel', self.mousewheel, false);
        self.domElement.removeEventListener('DOMMouseScroll', self.mousewheel, false); // firefox
        self.domElement.removeEventListener('touchstart', self.touchstart, false);
        self.domElement.removeEventListener('touchend', self.touchend, false);
        self.domElement.removeEventListener('touchmove', self.touchmove, false);

        window.removeEventListener('keydown', self.keydown, false);
        window.removeEventListener('keyup', self.keyup, false);
    };

    TrackballController.prototype.enable = function () {
        var self = this;
        self.enabled = true;
        self.handleResize(); // update screen size settings
        self.domElement.addEventListener('contextmenu', self.contextmenu.bind(self), false);
        self.domElement.addEventListener('mousedown', self.mousedown.bind(self), false);
        self.domElement.addEventListener('mousemove', self.mousemove.bind(self), false);
        self.domElement.addEventListener('mouseup', self.mouseup.bind(self), false);
        self.domElement.addEventListener('mousewheel', self.mousewheel.bind(self), false);
        self.domElement.addEventListener('DOMMouseScroll', self.mousewheel.bind(self), false); // firefox
        self.domElement.addEventListener('touchstart', self.touchstart.bind(self), false);
        self.domElement.addEventListener('touchend', self.touchend.bind(self), false);
        self.domElement.addEventListener('touchmove', self.touchmove.bind(self), false);

        window.addEventListener('keydown', self.keydown.bind(self), false);
        window.addEventListener('keyup', self.keyup.bind(self), false);
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

    TrackballController.prototype.keydown = function (event) {
        var self = this;
        if (self.enabled === false) {
            return;
        }
        window.removeEventListener('keydown', self.keydown.bind(self));
        _prevState = _state;
        if (_state !== STATE.NONE) {
            return;
        } else if (event.keyCode === self.keys[STATE.ROTATE] && self.allowRotate) {
            _state = STATE.ROTATE;
        } else if (event.keyCode === self.keys[STATE.ZOOM] && self.allowZoom) {
            _state = STATE.ZOOM;
        } else if (event.keyCode === self.keys[STATE.PAN] && self.allowPan) {
            _state = STATE.PAN;
        }
    };

    TrackballController.prototype.keyup = function () {
        var self = this;
        if (self.enabled === false) {
            return;
        }
        _state = _prevState;
        window.addEventListener('keydown', self.keydown.bind(self));
    };

    TrackballController.prototype.mousedown = function (event) {
        var self = this;
        if (self.enabled === false) {
            return;
        }
        event.preventDefault();
        event.stopPropagation();
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
        self.mouse = self.MOUSE_STATE.DOWN;
        self.dispatchEvent(self.EVENTS.START);
    };

    TrackballController.prototype.mousemove = function (event) {
        var self = this;
        if (self.enabled === false && self.mouse === self.MOUSE_STATE.DOWN) {
            return;
        }
        event.preventDefault();
        event.stopPropagation();
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
        var self = this;
        if (self.enabled === false && self.mouse === self.MOUSE_STATE.DOWN) {
            return;
        }
        event.preventDefault();
        event.stopPropagation();
        _state = STATE.NONE;
        self.mouse = self.MOUSE_STATE.UP;
        self.dispatchEvent(self.EVENTS.END);
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
        self.dispatchEvent(self.EVENTS.CHANGE);
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
            self.dispatchEvent(self.EVENTS.CHANGE);
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
;'use strict';

var FOUR = FOUR || {};

/**
 * First person navigation controller. Uses U-I-O-J-K-L keys for navigation
 * and the mouse pointer for look control. Assumes that +Z is up.
 */
FOUR.WalkController = (function () {

    function WalkController (camera, domElement) {
        THREE.EventDispatcher.call(this);
        var self = this;

        self.KEY = {
            CANCEL: 27,
            MOVE_FORWARD: 73,
            MOVE_LEFT: 74,
            MOVE_BACK: 75,
            MOVE_RIGHT: 76,
            MOVE_UP: 85,
            MOVE_DOWN: 79
        };

        self.camera = camera;
        self.domElement = domElement;
        self.enabled = false;
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
            start: { x: 0, y: 0 }
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
        self.enforceWalkHeight = false;
        self.walkHeight = null;

        self.viewHalfX = self.domElement.offsetWidth / 2;
        self.viewHalfY = self.domElement.offsetHeight / 2;
        self.domElement.setAttribute('tabindex', -1);
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
        self.domElement.removeEventListener('mousedown', self.onMouseDown);
    };

    WalkController.prototype.enable = function () {
        var self = this;
        // attach mousedown listener
        self.domElement.addEventListener('mousedown', self.onMouseDown.bind(self));
        // translate the camera to the walking height
        if (self.enforceWalkHeight) {
            self.setWalkHeight().then(function () {
                self.enabled = true;
            });
        } else {
            self.enabled = true;
        }
    };

    /**
     * Get the walking height at the specified position.
     * @param {THREE.Vector3} position Camera position
     * @returns {THREE.Vector3} Position
     */
    WalkController.prototype.getWalkHeight = function (position) {
        return 0;
    };

    WalkController.prototype.onKeyDown = function (event) {
        var self = this;
        if (!self.enabled) {
            return;
        }
        switch(event.keyCode) {
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
        // get mouse coordinates
        self.mouse.start = new THREE.Vector2(
            event.pageX - self.domElement.offsetLeft - self.viewHalfX,
            event.pageY - self.domElement.offsetTop - self.viewHalfY
        );
        // bind mousemove, mouseup handlers
        self.domElement.addEventListener('mousemove', self.onMouseMove.bind(self), false);
        self.domElement.addEventListener('mouseup', self.onMouseUp.bind(self), false);
        self.lookChange = true;
    };

    WalkController.prototype.onMouseMove = function (event) {
        var self = this;
        // get mouse coordinates
        self.mouse.end = new THREE.Vector2(
            event.pageX - self.domElement.offsetLeft - self.viewHalfX,
            event.pageY - self.domElement.offsetTop - self.viewHalfY
        );
        self.mouse.direction = new THREE.Vector2(
            (self.mouse.end.x / self.domElement.clientWidth) * 2,
            (self.mouse.end.y / self.domElement.clientHeight) * 2
        );
    };

    WalkController.prototype.onMouseUp = function (event) {
        // detatch mousemove, mouseup handlers
        var self = this;
        self.domElement.removeEventListener('mousemove', self.onMouseMove);
        self.domElement.removeEventListener('mouseup', self.onMouseUp);
        self.lookChange = false;
    };

    WalkController.prototype.onResize = function () {
        console.log('resize');
    };

    WalkController.prototype.setWalkHeight = function () {
        var self = this;
        return self.camera.setPositionAndTarget(
            self.camera.position.x,
            self.camera.position.y,
            self.WALK_HEIGHT,
            self.camera.target.x,
            self.camera.target.y,
            self.WALK_HEIGHT);
    };

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
        if (self.lookChange) {
            self.camera.rotateOnAxis(
                new THREE.Vector3(0,1,0),
                Math.PI * 2 / 360 * -self.mouse.direction.x * self.lookSpeed);
            // TODO clamp the amount of vertical rotation
            //self.camera.rotateOnAxis(
            //    new THREE.Vector3(1,0,0),
            //    Math.PI * 2 / 360 * -self.mouse.direction.y * self.lookSpeed * 0.5);
            change = true;
        }
        if (change) {
            self.dispatchEvent({'type':'change'});
        }
    };

    return WalkController;

}());
;/**
 * @author mrdoob / http://mrdoob.com/
 * @author alteredq / http://alteredqualia.com/
 * @author paulirish / http://paulirish.com/
 */

THREE.FirstPersonControls = function ( object, domElement ) {

    this.object = object;
    this.target = new THREE.Vector3( 0, 0, 0 );

    this.domElement = ( domElement !== undefined ) ? domElement : document;

    this.movementSpeed = 1.0;
    this.lookSpeed = 0.005;

    this.noFly = false;
    this.lookVertical = true;
    this.autoForward = false;

    this.activeLook = true;

    this.heightSpeed = false;
    this.heightCoef = 1.0;
    this.heightMin = 0.0;

    this.constrainVertical = false;
    this.verticalMin = 0;
    this.verticalMax = Math.PI;

    this.autoSpeedFactor = 0.0;

    this.mouseX = 0;
    this.mouseY = 0;

    this.lat = 0;
    this.lon = 0;
    this.phi = 0;
    this.theta = 0;

    this.moveForward = false;
    this.moveBackward = false;
    this.moveLeft = false;
    this.moveRight = false;
    this.freeze = false;

    this.mouseDragOn = false;

    if ( this.domElement === document ) {

        this.viewHalfX = window.innerWidth / 2;
        this.viewHalfY = window.innerHeight / 2;

    } else {
        this.viewHalfX = this.domElement.offsetWidth / 2;
        this.viewHalfY = this.domElement.offsetHeight / 2;
        this.domElement.setAttribute( 'tabindex', -1 );
    }

    this.onMouseDown = function ( event ) {

        if ( this.domElement !== document ) {

            this.domElement.focus();

        }

        event.preventDefault();
        event.stopPropagation();

        if ( this.activeLook ) {

            switch ( event.button ) {

                case 0: this.moveForward = true; break;
                case 2: this.moveBackward = true; break;

            }

        }

        this.mouseDragOn = true;

    };

    this.onMouseUp = function ( event ) {

        event.preventDefault();
        event.stopPropagation();

        if ( this.activeLook ) {

            switch ( event.button ) {

                case 0: this.moveForward = false; break;
                case 2: this.moveBackward = false; break;

            }

        }

        this.mouseDragOn = false;

    };

    this.onMouseMove = function ( event ) {

        if ( this.domElement === document ) {

            this.mouseX = event.pageX - this.viewHalfX;
            this.mouseY = event.pageY - this.viewHalfY;

        } else {

            this.mouseX = event.pageX - this.domElement.offsetLeft - this.viewHalfX;
            this.mouseY = event.pageY - this.domElement.offsetTop - this.viewHalfY;

        }

    };

    this.onKeyDown = function ( event ) {

        switch( event.keyCode ) {

            case 38: /*up*/
            case 87: /*W*/ this.moveForward = true; break;

            case 37: /*left*/
            case 65: /*A*/ this.moveLeft = true; break;

            case 40: /*down*/
            case 83: /*S*/ this.moveBackward = true; break;

            case 39: /*right*/
            case 68: /*D*/ this.moveRight = true; break;

            case 82: /*R*/ this.moveUp = true; break;
            case 70: /*F*/ this.moveDown = true; break;

            case 81: /*Q*/ this.freeze = !this.freeze; break;

        }

    };

    this.onKeyUp = function ( event ) {

        switch( event.keyCode ) {

            case 38: /*up*/
            case 87: /*W*/ this.moveForward = false; break;

            case 37: /*left*/
            case 65: /*A*/ this.moveLeft = false; break;

            case 40: /*down*/
            case 83: /*S*/ this.moveBackward = false; break;

            case 39: /*right*/
            case 68: /*D*/ this.moveRight = false; break;

            case 82: /*R*/ this.moveUp = false; break;
            case 70: /*F*/ this.moveDown = false; break;

        }

    };

    this.update = function( delta ) {
        var actualMoveSpeed = 0;
        if ( !this.freeze ) {

            if ( this.heightSpeed ) {

                var y = THREE.Math.clamp( this.object.position.y, this.heightMin, this.heightMax );
                var heightDelta = y - this.heightMin;

                this.autoSpeedFactor = delta * ( heightDelta * this.heightCoef );

            } else {

                this.autoSpeedFactor = 0.0;

            }

            actualMoveSpeed = delta * this.movementSpeed;

            if ( this.moveForward || ( this.autoForward && !this.moveBackward ) ) this.object.translateZ( - ( actualMoveSpeed + this.autoSpeedFactor ) );
            if ( this.moveBackward ) this.object.translateZ( actualMoveSpeed );

            if ( this.moveLeft ) this.object.translateX( - actualMoveSpeed );
            if ( this.moveRight ) this.object.translateX( actualMoveSpeed );

            if ( this.moveUp ) this.object.translateY( actualMoveSpeed );
            if ( this.moveDown ) this.object.translateY( - actualMoveSpeed );

            var actualLookSpeed = delta * this.lookSpeed;

            if ( !this.activeLook ) {

                actualLookSpeed = 0;

            }

            this.lon += this.mouseX * actualLookSpeed;
            if( this.lookVertical ) this.lat -= this.mouseY * actualLookSpeed;

            this.lat = Math.max( - 85, Math.min( 85, this.lat ) );
            this.phi = ( 90 - this.lat ) * Math.PI / 180;
            this.theta = this.lon * Math.PI / 180;

            var targetPosition = this.target,
                position = this.object.position;

            targetPosition.x = position.x + 100 * Math.sin( this.phi ) * Math.cos( this.theta );
            targetPosition.y = position.y + 100 * Math.cos( this.phi );
            targetPosition.z = position.z + 100 * Math.sin( this.phi ) * Math.sin( this.theta );

        }

        var verticalLookRatio = 1;

        if ( this.constrainVertical ) {

            verticalLookRatio = Math.PI / ( this.verticalMax - this.verticalMin );

        }

        this.lon += this.mouseX * actualLookSpeed;
        if( this.lookVertical ) this.lat -= this.mouseY * actualLookSpeed * verticalLookRatio;

        this.lat = Math.max( - 85, Math.min( 85, this.lat ) );
        this.phi = ( 90 - this.lat ) * Math.PI / 180;

        this.theta = this.lon * Math.PI / 180;

        if ( this.constrainVertical ) {

            this.phi = THREE.Math.mapLinear( this.phi, 0, Math.PI, this.verticalMin, this.verticalMax );

        }

        var targetPosition = this.target,
            position = this.object.position;

        targetPosition.x = position.x + 100 * Math.sin( this.phi ) * Math.cos( this.theta );
        targetPosition.y = position.y + 100 * Math.cos( this.phi );
        targetPosition.z = position.z + 100 * Math.sin( this.phi ) * Math.sin( this.theta );

        this.object.lookAt( targetPosition );

    };


    this.domElement.addEventListener( 'contextmenu', function ( event ) { event.preventDefault(); }, false );

    this.domElement.addEventListener( 'mousemove', bind( this, this.onMouseMove ), false );
    this.domElement.addEventListener( 'mousedown', bind( this, this.onMouseDown ), false );
    this.domElement.addEventListener( 'mouseup', bind( this, this.onMouseUp ), false );
    this.domElement.addEventListener( 'keydown', bind( this, this.onKeyDown ), false );
    this.domElement.addEventListener( 'keyup', bind( this, this.onKeyUp ), false );

    function bind( scope, fn ) {

        return function () {

            fn.apply( scope, arguments );

        };

    };

};
;/**
 * @author qiao / https://github.com/qiao
 * @author mrdoob / http://mrdoob.com
 * @author alteredq / http://alteredqualia.com/
 * @author WestLangley / http://github.com/WestLangley
 * @author erich666 / http://erichaines.com
 */
/*global THREE, console */

( function () {

    function OrbitConstraint ( object ) {

        this.object = object;

        // "target" sets the location of focus, where the object orbits around
        // and where it pans with respect to.
        this.target = new THREE.Vector3();

        // Limits to how far you can dolly in and out ( PerspectiveCamera only )
        this.minDistance = 0;
        this.maxDistance = Infinity;

        // Limits to how far you can zoom in and out ( OrthographicCamera only )
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

        // API

        this.getPolarAngle = function () {

            return phi;

        };

        this.getAzimuthalAngle = function () {

            return theta;

        };

        this.rotateLeft = function ( angle ) {

            thetaDelta -= angle;

        };

        this.rotateUp = function ( angle ) {

            phiDelta -= angle;

        };

        // pass in distance in world space to move left
        this.panLeft = function() {

            var v = new THREE.Vector3();

            return function panLeft ( distance ) {

                var te = this.object.matrix.elements;

                // get X column of matrix
                v.set( te[ 0 ], te[ 1 ], te[ 2 ] );
                v.multiplyScalar( - distance );

                panOffset.add( v );

            };

        }();

        // pass in distance in world space to move up
        this.panUp = function() {

            var v = new THREE.Vector3();

            return function panUp ( distance ) {

                var te = this.object.matrix.elements;

                // get Y column of matrix
                v.set( te[ 4 ], te[ 5 ], te[ 6 ] );
                v.multiplyScalar( distance );

                panOffset.add( v );

            };

        }();

        // pass in x,y of change desired in pixel space,
        // right and down are positive
        this.pan = function ( deltaX, deltaY, screenWidth, screenHeight ) {

            if ( scope.object instanceof THREE.PerspectiveCamera ) {

                // perspective
                var position = scope.object.position;
                var offset = position.clone().sub( scope.target );
                var targetDistance = offset.length();

                // half of the fov is center to top of screen
                targetDistance *= Math.tan( ( scope.object.fov / 2 ) * Math.PI / 180.0 );

                // we actually don't use screenWidth, since perspective camera is fixed to screen height
                scope.panLeft( 2 * deltaX * targetDistance / screenHeight );
                scope.panUp( 2 * deltaY * targetDistance / screenHeight );

            } else if ( scope.object instanceof THREE.OrthographicCamera ) {

                // orthographic
                scope.panLeft( deltaX * ( scope.object.right - scope.object.left ) / screenWidth );
                scope.panUp( deltaY * ( scope.object.top - scope.object.bottom ) / screenHeight );

            } else {

                // camera neither orthographic or perspective
                console.warn( 'WARNING: OrbitControls.js encountered an unknown camera type - pan disabled.' );

            }

        };

        this.dollyIn = function ( dollyScale ) {

            if ( scope.object instanceof THREE.PerspectiveCamera ) {

                scale /= dollyScale;

            } else if ( scope.object instanceof THREE.OrthographicCamera ) {

                scope.object.zoom = Math.max( this.minZoom, Math.min( this.maxZoom, this.object.zoom * dollyScale ) );
                scope.object.updateProjectionMatrix();
                zoomChanged = true;

            } else {

                console.warn( 'WARNING: OrbitControls.js encountered an unknown camera type - dolly/zoom disabled.' );

            }

        };

        this.dollyOut = function ( dollyScale ) {

            if ( scope.object instanceof THREE.PerspectiveCamera ) {

                scale *= dollyScale;

            } else if ( scope.object instanceof THREE.OrthographicCamera ) {

                scope.object.zoom = Math.max( this.minZoom, Math.min( this.maxZoom, this.object.zoom / dollyScale ) );
                scope.object.updateProjectionMatrix();
                zoomChanged = true;

            } else {

                console.warn( 'WARNING: OrbitControls.js encountered an unknown camera type - dolly/zoom disabled.' );

            }

        };

        this.update = function() {

            var offset = new THREE.Vector3();

            // so camera.up is the orbit axis
            var quat = new THREE.Quaternion().setFromUnitVectors( object.up, new THREE.Vector3( 0, 1, 0 ) );
            var quatInverse = quat.clone().inverse();

            var lastPosition = new THREE.Vector3();
            var lastQuaternion = new THREE.Quaternion();

            return function () {

                var position = this.object.position;

                offset.copy( position ).sub( this.target );

                // rotate offset to "y-axis-is-up" space
                offset.applyQuaternion( quat );

                // angle from z-axis around y-axis

                theta = Math.atan2( offset.x, offset.z );

                // angle from y-axis

                phi = Math.atan2( Math.sqrt( offset.x * offset.x + offset.z * offset.z ), offset.y );

                theta += thetaDelta;
                phi += phiDelta;

                // restrict theta to be between desired limits
                theta = Math.max( this.minAzimuthAngle, Math.min( this.maxAzimuthAngle, theta ) );

                // restrict phi to be between desired limits
                phi = Math.max( this.minPolarAngle, Math.min( this.maxPolarAngle, phi ) );

                // restrict phi to be betwee EPS and PI-EPS
                phi = Math.max( EPS, Math.min( Math.PI - EPS, phi ) );

                var radius = offset.length() * scale;

                // restrict radius to be between desired limits
                radius = Math.max( this.minDistance, Math.min( this.maxDistance, radius ) );

                // move target to panned location
                this.target.add( panOffset );

                offset.x = radius * Math.sin( phi ) * Math.sin( theta );
                offset.y = radius * Math.cos( phi );
                offset.z = radius * Math.sin( phi ) * Math.cos( theta );

                // rotate offset back to "camera-up-vector-is-up" space
                offset.applyQuaternion( quatInverse );

                position.copy( this.target ).add( offset );

                this.object.lookAt( this.target );

                if ( this.enableDamping === true ) {

                    thetaDelta *= ( 1 - this.dampingFactor );
                    phiDelta *= ( 1 - this.dampingFactor );

                } else {

                    thetaDelta = 0;
                    phiDelta = 0;

                }

                scale = 1;
                panOffset.set( 0, 0, 0 );

                // update condition is:
                // min(camera displacement, camera rotation in radians)^2 > EPS
                // using small-angle approximation cos(x/2) = 1 - x^2 / 8

                if ( zoomChanged ||
                    lastPosition.distanceToSquared( this.object.position ) > EPS ||
                    8 * ( 1 - lastQuaternion.dot( this.object.quaternion ) ) > EPS ) {

                    lastPosition.copy( this.object.position );
                    lastQuaternion.copy( this.object.quaternion );
                    zoomChanged = false;

                    return true;

                }

                return false;

            };

        }();

    };


    // This set of controls performs orbiting, dollying (zooming), and panning. It maintains
    // the "up" direction as +Y, unlike the TrackballControls. Touch on tablet and phones is
    // supported.
    //
    //    Orbit - left mouse / touch: one finger move
    //    Zoom - middle mouse, or mousewheel / touch: two finger spread or squish
    //    Pan - right mouse, or arrow keys / touch: three finter swipe

    THREE.OrbitControls = function ( object, domElement ) {

        var constraint = new OrbitConstraint( object );

        this.domElement = ( domElement !== undefined ) ? domElement : document;

        // API

        Object.defineProperty( this, 'constraint', {

            get: function() {

                return constraint;

            }

        } );

        this.getPolarAngle = function () {

            return constraint.getPolarAngle();

        };

        this.getAzimuthalAngle = function () {

            return constraint.getAzimuthalAngle();

        };

        // Set to false to disable this control
        this.enabled = true;

        // center is old, deprecated; use "target" instead
        this.center = this.target;

        // This option actually enables dollying in and out; left as "zoom" for
        // backwards compatibility.
        // Set to false to disable zooming
        this.enableZoom = true;
        this.zoomSpeed = 1.0;

        // Set to false to disable rotating
        this.enableRotate = true;
        this.rotateSpeed = 1.0;

        // Set to false to disable panning
        this.enablePan = true;
        this.keyPanSpeed = 7.0;	// pixels moved per arrow key push

        // Set to true to automatically rotate around the target
        // If auto-rotate is enabled, you must call controls.update() in your animation loop
        this.autoRotate = false;
        this.autoRotateSpeed = 2.0; // 30 seconds per round when fps is 60

        // Set to false to disable use of the keys
        this.enableKeys = true;

        // The four arrow keys
        this.keys = { LEFT: 37, UP: 38, RIGHT: 39, BOTTOM: 40 };

        // Mouse buttons
        this.mouseButtons = { ORBIT: THREE.MOUSE.LEFT, ZOOM: THREE.MOUSE.MIDDLE, PAN: THREE.MOUSE.RIGHT };

        ////////////
        // internals

        var scope = this;

        var rotateStart = new THREE.Vector2();
        var rotateEnd = new THREE.Vector2();
        var rotateDelta = new THREE.Vector2();

        var panStart = new THREE.Vector2();
        var panEnd = new THREE.Vector2();
        var panDelta = new THREE.Vector2();

        var dollyStart = new THREE.Vector2();
        var dollyEnd = new THREE.Vector2();
        var dollyDelta = new THREE.Vector2();

        var STATE = { NONE : - 1, ROTATE : 0, DOLLY : 1, PAN : 2, TOUCH_ROTATE : 3, TOUCH_DOLLY : 4, TOUCH_PAN : 5 };

        var state = STATE.NONE;

        // for reset

        this.target0 = this.target.clone();
        this.position0 = this.object.position.clone();
        this.zoom0 = this.object.zoom;

        // events

        var changeEvent = { type: 'change' };
        var startEvent = { type: 'start' };
        var endEvent = { type: 'end' };

        // pass in x,y of change desired in pixel space,
        // right and down are positive
        function pan( deltaX, deltaY ) {

            var element = scope.domElement === document ? scope.domElement.body : scope.domElement;

            constraint.pan( deltaX, deltaY, element.clientWidth, element.clientHeight );

        }

        this.update = function () {

            if ( this.autoRotate && state === STATE.NONE ) {

                constraint.rotateLeft( getAutoRotationAngle() );

            }

            if ( constraint.update() === true ) {

                this.dispatchEvent( changeEvent );

            }

        };

        this.reset = function () {

            state = STATE.NONE;

            this.target.copy( this.target0 );
            this.object.position.copy( this.position0 );
            this.object.zoom = this.zoom0;

            this.object.updateProjectionMatrix();
            this.dispatchEvent( changeEvent );

            this.update();

        };

        function getAutoRotationAngle() {

            return 2 * Math.PI / 60 / 60 * scope.autoRotateSpeed;

        }

        function getZoomScale() {

            return Math.pow( 0.95, scope.zoomSpeed );

        }

        function onMouseDown( event ) {

            if ( scope.enabled === false ) return;

            event.preventDefault();

            if ( event.button === scope.mouseButtons.ORBIT ) {

                if ( scope.enableRotate === false ) return;

                state = STATE.ROTATE;

                rotateStart.set( event.clientX, event.clientY );

            } else if ( event.button === scope.mouseButtons.ZOOM ) {

                if ( scope.enableZoom === false ) return;

                state = STATE.DOLLY;

                dollyStart.set( event.clientX, event.clientY );

            } else if ( event.button === scope.mouseButtons.PAN ) {

                if ( scope.enablePan === false ) return;

                state = STATE.PAN;

                panStart.set( event.clientX, event.clientY );

            }

            if ( state !== STATE.NONE ) {

                document.addEventListener( 'mousemove', onMouseMove, false );
                document.addEventListener( 'mouseup', onMouseUp, false );
                scope.dispatchEvent( startEvent );

            }

        }

        function onMouseMove( event ) {

            if ( scope.enabled === false ) return;

            event.preventDefault();

            var element = scope.domElement === document ? scope.domElement.body : scope.domElement;

            if ( state === STATE.ROTATE ) {

                if ( scope.enableRotate === false ) return;

                rotateEnd.set( event.clientX, event.clientY );
                rotateDelta.subVectors( rotateEnd, rotateStart );

                // rotating across whole screen goes 360 degrees around
                constraint.rotateLeft( 2 * Math.PI * rotateDelta.x / element.clientWidth * scope.rotateSpeed );

                // rotating up and down along whole screen attempts to go 360, but limited to 180
                constraint.rotateUp( 2 * Math.PI * rotateDelta.y / element.clientHeight * scope.rotateSpeed );

                rotateStart.copy( rotateEnd );

            } else if ( state === STATE.DOLLY ) {

                if ( scope.enableZoom === false ) return;

                dollyEnd.set( event.clientX, event.clientY );
                dollyDelta.subVectors( dollyEnd, dollyStart );

                if ( dollyDelta.y > 0 ) {

                    constraint.dollyIn( getZoomScale() );

                } else if ( dollyDelta.y < 0 ) {

                    constraint.dollyOut( getZoomScale() );

                }

                dollyStart.copy( dollyEnd );

            } else if ( state === STATE.PAN ) {

                if ( scope.enablePan === false ) return;

                panEnd.set( event.clientX, event.clientY );
                panDelta.subVectors( panEnd, panStart );

                pan( panDelta.x, panDelta.y );

                panStart.copy( panEnd );

            }

            if ( state !== STATE.NONE ) scope.update();

        }

        function onMouseUp( /* event */ ) {

            if ( scope.enabled === false ) return;

            document.removeEventListener( 'mousemove', onMouseMove, false );
            document.removeEventListener( 'mouseup', onMouseUp, false );
            scope.dispatchEvent( endEvent );
            state = STATE.NONE;

        }

        function onMouseWheel( event ) {

            if ( scope.enabled === false || scope.enableZoom === false || state !== STATE.NONE ) return;

            event.preventDefault();
            event.stopPropagation();

            var delta = 0;

            if ( event.wheelDelta !== undefined ) {

                // WebKit / Opera / Explorer 9

                delta = event.wheelDelta;

            } else if ( event.detail !== undefined ) {

                // Firefox

                delta = - event.detail;

            }

            if ( delta > 0 ) {

                constraint.dollyOut( getZoomScale() );

            } else if ( delta < 0 ) {

                constraint.dollyIn( getZoomScale() );

            }

            scope.update();
            scope.dispatchEvent( startEvent );
            scope.dispatchEvent( endEvent );

        }

        function onKeyDown( event ) {

            if ( scope.enabled === false || scope.enableKeys === false || scope.enablePan === false ) return;

            switch ( event.keyCode ) {

                case scope.keys.UP:
                    pan( 0, scope.keyPanSpeed );
                    scope.update();
                    break;

                case scope.keys.BOTTOM:
                    pan( 0, - scope.keyPanSpeed );
                    scope.update();
                    break;

                case scope.keys.LEFT:
                    pan( scope.keyPanSpeed, 0 );
                    scope.update();
                    break;

                case scope.keys.RIGHT:
                    pan( - scope.keyPanSpeed, 0 );
                    scope.update();
                    break;

            }

        }

        function touchstart( event ) {

            if ( scope.enabled === false ) return;

            switch ( event.touches.length ) {

                case 1:	// one-fingered touch: rotate

                    if ( scope.enableRotate === false ) return;

                    state = STATE.TOUCH_ROTATE;

                    rotateStart.set( event.touches[ 0 ].pageX, event.touches[ 0 ].pageY );
                    break;

                case 2:	// two-fingered touch: dolly

                    if ( scope.enableZoom === false ) return;

                    state = STATE.TOUCH_DOLLY;

                    var dx = event.touches[ 0 ].pageX - event.touches[ 1 ].pageX;
                    var dy = event.touches[ 0 ].pageY - event.touches[ 1 ].pageY;
                    var distance = Math.sqrt( dx * dx + dy * dy );
                    dollyStart.set( 0, distance );
                    break;

                case 3: // three-fingered touch: pan

                    if ( scope.enablePan === false ) return;

                    state = STATE.TOUCH_PAN;

                    panStart.set( event.touches[ 0 ].pageX, event.touches[ 0 ].pageY );
                    break;

                default:

                    state = STATE.NONE;

            }

            if ( state !== STATE.NONE ) scope.dispatchEvent( startEvent );

        }

        function touchmove( event ) {

            if ( scope.enabled === false ) return;

            event.preventDefault();
            event.stopPropagation();

            var element = scope.domElement === document ? scope.domElement.body : scope.domElement;

            switch ( event.touches.length ) {

                case 1: // one-fingered touch: rotate

                    if ( scope.enableRotate === false ) return;
                    if ( state !== STATE.TOUCH_ROTATE ) return;

                    rotateEnd.set( event.touches[ 0 ].pageX, event.touches[ 0 ].pageY );
                    rotateDelta.subVectors( rotateEnd, rotateStart );

                    // rotating across whole screen goes 360 degrees around
                    constraint.rotateLeft( 2 * Math.PI * rotateDelta.x / element.clientWidth * scope.rotateSpeed );
                    // rotating up and down along whole screen attempts to go 360, but limited to 180
                    constraint.rotateUp( 2 * Math.PI * rotateDelta.y / element.clientHeight * scope.rotateSpeed );

                    rotateStart.copy( rotateEnd );

                    scope.update();
                    break;

                case 2: // two-fingered touch: dolly

                    if ( scope.enableZoom === false ) return;
                    if ( state !== STATE.TOUCH_DOLLY ) return;

                    var dx = event.touches[ 0 ].pageX - event.touches[ 1 ].pageX;
                    var dy = event.touches[ 0 ].pageY - event.touches[ 1 ].pageY;
                    var distance = Math.sqrt( dx * dx + dy * dy );

                    dollyEnd.set( 0, distance );
                    dollyDelta.subVectors( dollyEnd, dollyStart );

                    if ( dollyDelta.y > 0 ) {

                        constraint.dollyOut( getZoomScale() );

                    } else if ( dollyDelta.y < 0 ) {

                        constraint.dollyIn( getZoomScale() );

                    }

                    dollyStart.copy( dollyEnd );

                    scope.update();
                    break;

                case 3: // three-fingered touch: pan

                    if ( scope.enablePan === false ) return;
                    if ( state !== STATE.TOUCH_PAN ) return;

                    panEnd.set( event.touches[ 0 ].pageX, event.touches[ 0 ].pageY );
                    panDelta.subVectors( panEnd, panStart );

                    pan( panDelta.x, panDelta.y );

                    panStart.copy( panEnd );

                    scope.update();
                    break;

                default:

                    state = STATE.NONE;

            }

        }

        function touchend( /* event */ ) {

            if ( scope.enabled === false ) return;

            scope.dispatchEvent( endEvent );
            state = STATE.NONE;

        }

        function contextmenu( event ) {

            event.preventDefault();

        }

        this.dispose = function() {

            this.domElement.removeEventListener( 'contextmenu', contextmenu, false );
            this.domElement.removeEventListener( 'mousedown', onMouseDown, false );
            this.domElement.removeEventListener( 'mousewheel', onMouseWheel, false );
            this.domElement.removeEventListener( 'DOMMouseScroll', onMouseWheel, false ); // firefox

            this.domElement.removeEventListener( 'touchstart', touchstart, false );
            this.domElement.removeEventListener( 'touchend', touchend, false );
            this.domElement.removeEventListener( 'touchmove', touchmove, false );

            document.removeEventListener( 'mousemove', onMouseMove, false );
            document.removeEventListener( 'mouseup', onMouseUp, false );

            window.removeEventListener( 'keydown', onKeyDown, false );

        }

        this.domElement.addEventListener( 'contextmenu', contextmenu, false );

        this.domElement.addEventListener( 'mousedown', onMouseDown, false );
        this.domElement.addEventListener( 'mousewheel', onMouseWheel, false );
        this.domElement.addEventListener( 'DOMMouseScroll', onMouseWheel, false ); // firefox

        this.domElement.addEventListener( 'touchstart', touchstart, false );
        this.domElement.addEventListener( 'touchend', touchend, false );
        this.domElement.addEventListener( 'touchmove', touchmove, false );

        window.addEventListener( 'keydown', onKeyDown, false );

        // force an update at start
        this.update();

    };

    THREE.OrbitControls.prototype = Object.create( THREE.EventDispatcher.prototype );
    THREE.OrbitControls.prototype.constructor = THREE.OrbitControls;

    Object.defineProperties( THREE.OrbitControls.prototype, {

        object: {

            get: function () {

                return this.constraint.object;

            }

        },

        target: {

            get: function () {

                return this.constraint.target;

            },

            set: function ( value ) {

                console.warn( 'THREE.OrbitControls: target is now immutable. Use target.set() instead.' );
                this.constraint.target.copy( value );

            }

        },

        minDistance : {

            get: function () {

                return this.constraint.minDistance;

            },

            set: function ( value ) {

                this.constraint.minDistance = value;

            }

        },

        maxDistance : {

            get: function () {

                return this.constraint.maxDistance;

            },

            set: function ( value ) {

                this.constraint.maxDistance = value;

            }

        },

        minZoom : {

            get: function () {

                return this.constraint.minZoom;

            },

            set: function ( value ) {

                this.constraint.minZoom = value;

            }

        },

        maxZoom : {

            get: function () {

                return this.constraint.maxZoom;

            },

            set: function ( value ) {

                this.constraint.maxZoom = value;

            }

        },

        minPolarAngle : {

            get: function () {

                return this.constraint.minPolarAngle;

            },

            set: function ( value ) {

                this.constraint.minPolarAngle = value;

            }

        },

        maxPolarAngle : {

            get: function () {

                return this.constraint.maxPolarAngle;

            },

            set: function ( value ) {

                this.constraint.maxPolarAngle = value;

            }

        },

        minAzimuthAngle : {

            get: function () {

                return this.constraint.minAzimuthAngle;

            },

            set: function ( value ) {

                this.constraint.minAzimuthAngle = value;

            }

        },

        maxAzimuthAngle : {

            get: function () {

                return this.constraint.maxAzimuthAngle;

            },

            set: function ( value ) {

                this.constraint.maxAzimuthAngle = value;

            }

        },

        enableDamping : {

            get: function () {

                return this.constraint.enableDamping;

            },

            set: function ( value ) {

                this.constraint.enableDamping = value;

            }

        },

        dampingFactor : {

            get: function () {

                return this.constraint.dampingFactor;

            },

            set: function ( value ) {

                this.constraint.dampingFactor = value;

            }

        },

        // backward compatibility

        noZoom: {

            get: function () {

                console.warn( 'THREE.OrbitControls: .noZoom has been deprecated. Use .enableZoom instead.' );
                return ! this.enableZoom;

            },

            set: function ( value ) {

                console.warn( 'THREE.OrbitControls: .noZoom has been deprecated. Use .enableZoom instead.' );
                this.enableZoom = ! value;

            }

        },

        noRotate: {

            get: function () {

                console.warn( 'THREE.OrbitControls: .noRotate has been deprecated. Use .enableRotate instead.' );
                return ! this.enableRotate;

            },

            set: function ( value ) {

                console.warn( 'THREE.OrbitControls: .noRotate has been deprecated. Use .enableRotate instead.' );
                this.enableRotate = ! value;

            }

        },

        noPan: {

            get: function () {

                console.warn( 'THREE.OrbitControls: .noPan has been deprecated. Use .enablePan instead.' );
                return ! this.enablePan;

            },

            set: function ( value ) {

                console.warn( 'THREE.OrbitControls: .noPan has been deprecated. Use .enablePan instead.' );
                this.enablePan = ! value;

            }

        },

        noKeys: {

            get: function () {

                console.warn( 'THREE.OrbitControls: .noKeys has been deprecated. Use .enableKeys instead.' );
                return ! this.enableKeys;

            },

            set: function ( value ) {

                console.warn( 'THREE.OrbitControls: .noKeys has been deprecated. Use .enableKeys instead.' );
                this.enableKeys = ! value;

            }

        },

        staticMoving : {

            get: function () {

                console.warn( 'THREE.OrbitControls: .staticMoving has been deprecated. Use .enableDamping instead.' );
                return ! this.constraint.enableDamping;

            },

            set: function ( value ) {

                console.warn( 'THREE.OrbitControls: .staticMoving has been deprecated. Use .enableDamping instead.' );
                this.constraint.enableDamping = ! value;

            }

        },

        dynamicDampingFactor : {

            get: function () {

                console.warn( 'THREE.OrbitControls: .dynamicDampingFactor has been renamed. Use .dampingFactor instead.' );
                return this.constraint.dampingFactor;

            },

            set: function ( value ) {

                console.warn( 'THREE.OrbitControls: .dynamicDampingFactor has been renamed. Use .dampingFactor instead.' );
                this.constraint.dampingFactor = value;

            }

        }

    } );

}() );
;/**
 * @author Eberhard Graether / http://egraether.com/
 * @author Mark Lundin 	/ http://mark-lundin.com
 * @author Simone Manini / http://daron1337.github.io
 * @author Luca Antiga 	/ http://lantiga.github.io
 */

THREE.TrackballControls = function ( object, domElement ) {

    var _this = this;
    var STATE = { NONE: - 1, ROTATE: 0, ZOOM: 1, PAN: 2, TOUCH_ROTATE: 3, TOUCH_ZOOM_PAN: 4 };

    this.object = object;
    this.domElement = ( domElement !== undefined ) ? domElement : document;

    // API

    this.enabled = true;

    this.screen = { left: 0, top: 0, width: 0, height: 0 };

    this.rotateSpeed = 1.0;
    this.zoomSpeed = 1.2;
    this.panSpeed = 0.3;

    this.noRotate = false;
    this.noZoom = false;
    this.noPan = false;

    this.staticMoving = false;
    this.dynamicDampingFactor = 0.2;

    this.minDistance = 0;
    this.maxDistance = Infinity;

    this.keys = [ 65 /*A*/, 83 /*S*/, 68 /*D*/ ];

    // internals

    this.target = new THREE.Vector3();

    var EPS = 0.000001;

    var lastPosition = new THREE.Vector3();

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
        _panEnd = new THREE.Vector2();

    // for reset

    this.target0 = this.target.clone();
    this.position0 = this.object.position.clone();
    this.up0 = this.object.up.clone();

    // events

    var changeEvent = { type: 'change' };
    var startEvent = { type: 'start' };
    var endEvent = { type: 'end' };


    // methods

    this.handleResize = function () {

        if ( this.domElement === document ) {

            this.screen.left = 0;
            this.screen.top = 0;
            this.screen.width = window.innerWidth;
            this.screen.height = window.innerHeight;

        } else {

            var box = this.domElement.getBoundingClientRect();
            // adjustments come from similar code in the jquery offset() function
            var d = this.domElement.ownerDocument.documentElement;
            this.screen.left = box.left + window.pageXOffset - d.clientLeft;
            this.screen.top = box.top + window.pageYOffset - d.clientTop;
            this.screen.width = box.width;
            this.screen.height = box.height;

        }

    };

    this.handleEvent = function ( event ) {

        if ( typeof this[ event.type ] == 'function' ) {

            this[ event.type ]( event );

        }

    };

    var getMouseOnScreen = ( function () {

        var vector = new THREE.Vector2();

        return function getMouseOnScreen( pageX, pageY ) {

            vector.set(
                ( pageX - _this.screen.left ) / _this.screen.width,
                ( pageY - _this.screen.top ) / _this.screen.height
            );

            return vector;

        };

    }() );

    var getMouseOnCircle = ( function () {

        var vector = new THREE.Vector2();

        return function getMouseOnCircle( pageX, pageY ) {

            vector.set(
                ( ( pageX - _this.screen.width * 0.5 - _this.screen.left ) / ( _this.screen.width * 0.5 ) ),
                ( ( _this.screen.height + 2 * ( _this.screen.top - pageY ) ) / _this.screen.width ) // screen.width intentional
            );

            return vector;

        };

    }() );

    this.rotateCamera = ( function() {

        var axis = new THREE.Vector3(),
            quaternion = new THREE.Quaternion(),
            eyeDirection = new THREE.Vector3(),
            objectUpDirection = new THREE.Vector3(),
            objectSidewaysDirection = new THREE.Vector3(),
            moveDirection = new THREE.Vector3(),
            angle;

        return function rotateCamera() {

            moveDirection.set( _moveCurr.x - _movePrev.x, _moveCurr.y - _movePrev.y, 0 );
            angle = moveDirection.length();

            if ( angle ) {

                _eye.copy( _this.object.position ).sub( _this.target );

                eyeDirection.copy( _eye ).normalize();
                objectUpDirection.copy( _this.object.up ).normalize();
                objectSidewaysDirection.crossVectors( objectUpDirection, eyeDirection ).normalize();

                objectUpDirection.setLength( _moveCurr.y - _movePrev.y );
                objectSidewaysDirection.setLength( _moveCurr.x - _movePrev.x );

                moveDirection.copy( objectUpDirection.add( objectSidewaysDirection ) );

                axis.crossVectors( moveDirection, _eye ).normalize();

                angle *= _this.rotateSpeed;
                quaternion.setFromAxisAngle( axis, angle );

                _eye.applyQuaternion( quaternion );
                _this.object.up.applyQuaternion( quaternion );

                _lastAxis.copy( axis );
                _lastAngle = angle;

            } else if ( ! _this.staticMoving && _lastAngle ) {

                _lastAngle *= Math.sqrt( 1.0 - _this.dynamicDampingFactor );
                _eye.copy( _this.object.position ).sub( _this.target );
                quaternion.setFromAxisAngle( _lastAxis, _lastAngle );
                _eye.applyQuaternion( quaternion );
                _this.object.up.applyQuaternion( quaternion );

            }

            _movePrev.copy( _moveCurr );

        };

    }() );


    this.zoomCamera = function () {

        var factor;

        if ( _state === STATE.TOUCH_ZOOM_PAN ) {

            factor = _touchZoomDistanceStart / _touchZoomDistanceEnd;
            _touchZoomDistanceStart = _touchZoomDistanceEnd;
            _eye.multiplyScalar( factor );

        } else {

            factor = 1.0 + ( _zoomEnd.y - _zoomStart.y ) * _this.zoomSpeed;

            if ( factor !== 1.0 && factor > 0.0 ) {

                _eye.multiplyScalar( factor );

                if ( _this.staticMoving ) {

                    _zoomStart.copy( _zoomEnd );

                } else {

                    _zoomStart.y += ( _zoomEnd.y - _zoomStart.y ) * this.dynamicDampingFactor;

                }

            }

        }

    };

    this.panCamera = ( function() {

        var mouseChange = new THREE.Vector2(),
            objectUp = new THREE.Vector3(),
            pan = new THREE.Vector3();

        return function panCamera() {

            mouseChange.copy( _panEnd ).sub( _panStart );

            if ( mouseChange.lengthSq() ) {

                mouseChange.multiplyScalar( _eye.length() * _this.panSpeed );

                pan.copy( _eye ).cross( _this.object.up ).setLength( mouseChange.x );
                pan.add( objectUp.copy( _this.object.up ).setLength( mouseChange.y ) );

                _this.object.position.add( pan );
                _this.target.add( pan );

                if ( _this.staticMoving ) {

                    _panStart.copy( _panEnd );

                } else {

                    _panStart.add( mouseChange.subVectors( _panEnd, _panStart ).multiplyScalar( _this.dynamicDampingFactor ) );

                }

            }

        };

    }() );

    this.checkDistances = function () {

        if ( ! _this.noZoom || ! _this.noPan ) {

            if ( _eye.lengthSq() > _this.maxDistance * _this.maxDistance ) {

                _this.object.position.addVectors( _this.target, _eye.setLength( _this.maxDistance ) );
                _zoomStart.copy( _zoomEnd );

            }

            if ( _eye.lengthSq() < _this.minDistance * _this.minDistance ) {

                _this.object.position.addVectors( _this.target, _eye.setLength( _this.minDistance ) );
                _zoomStart.copy( _zoomEnd );

            }

        }

    };

    this.update = function () {

        _eye.subVectors( _this.object.position, _this.target );

        if ( ! _this.noRotate ) {

            _this.rotateCamera();

        }

        if ( ! _this.noZoom ) {

            _this.zoomCamera();

        }

        if ( ! _this.noPan ) {

            _this.panCamera();

        }

        _this.object.position.addVectors( _this.target, _eye );

        _this.checkDistances();

        _this.object.lookAt( _this.target );

        if ( lastPosition.distanceToSquared( _this.object.position ) > EPS ) {

            _this.dispatchEvent( changeEvent );

            lastPosition.copy( _this.object.position );

        }

    };

    this.reset = function () {

        _state = STATE.NONE;
        _prevState = STATE.NONE;

        _this.target.copy( _this.target0 );
        _this.object.position.copy( _this.position0 );
        _this.object.up.copy( _this.up0 );

        _eye.subVectors( _this.object.position, _this.target );

        _this.object.lookAt( _this.target );

        _this.dispatchEvent( changeEvent );

        lastPosition.copy( _this.object.position );

    };

    // listeners

    function keydown( event ) {

        if ( _this.enabled === false ) return;

        window.removeEventListener( 'keydown', keydown );

        _prevState = _state;

        if ( _state !== STATE.NONE ) {

            return;

        } else if ( event.keyCode === _this.keys[ STATE.ROTATE ] && ! _this.noRotate ) {

            _state = STATE.ROTATE;

        } else if ( event.keyCode === _this.keys[ STATE.ZOOM ] && ! _this.noZoom ) {

            _state = STATE.ZOOM;

        } else if ( event.keyCode === _this.keys[ STATE.PAN ] && ! _this.noPan ) {

            _state = STATE.PAN;

        }

    }

    function keyup( event ) {

        if ( _this.enabled === false ) return;

        _state = _prevState;

        window.addEventListener( 'keydown', keydown, false );

    }

    function mousedown( event ) {

        if ( _this.enabled === false ) return;

        event.preventDefault();
        event.stopPropagation();

        if ( _state === STATE.NONE ) {

            _state = event.button;

        }

        if ( _state === STATE.ROTATE && ! _this.noRotate ) {

            _moveCurr.copy( getMouseOnCircle( event.pageX, event.pageY ) );
            _movePrev.copy( _moveCurr );

        } else if ( _state === STATE.ZOOM && ! _this.noZoom ) {

            _zoomStart.copy( getMouseOnScreen( event.pageX, event.pageY ) );
            _zoomEnd.copy( _zoomStart );

        } else if ( _state === STATE.PAN && ! _this.noPan ) {

            _panStart.copy( getMouseOnScreen( event.pageX, event.pageY ) );
            _panEnd.copy( _panStart );

        }

        document.addEventListener( 'mousemove', mousemove, false );
        document.addEventListener( 'mouseup', mouseup, false );

        _this.dispatchEvent( startEvent );

    }

    function mousemove( event ) {

        if ( _this.enabled === false ) return;

        event.preventDefault();
        event.stopPropagation();

        if ( _state === STATE.ROTATE && ! _this.noRotate ) {

            _movePrev.copy( _moveCurr );
            _moveCurr.copy( getMouseOnCircle( event.pageX, event.pageY ) );

        } else if ( _state === STATE.ZOOM && ! _this.noZoom ) {

            _zoomEnd.copy( getMouseOnScreen( event.pageX, event.pageY ) );

        } else if ( _state === STATE.PAN && ! _this.noPan ) {

            _panEnd.copy( getMouseOnScreen( event.pageX, event.pageY ) );

        }

    }

    function mouseup( event ) {

        if ( _this.enabled === false ) return;

        event.preventDefault();
        event.stopPropagation();

        _state = STATE.NONE;

        document.removeEventListener( 'mousemove', mousemove );
        document.removeEventListener( 'mouseup', mouseup );
        _this.dispatchEvent( endEvent );

    }

    function mousewheel( event ) {

        if ( _this.enabled === false ) return;

        event.preventDefault();
        event.stopPropagation();

        var delta = 0;

        if ( event.wheelDelta ) {

            // WebKit / Opera / Explorer 9

            delta = event.wheelDelta / 40;

        } else if ( event.detail ) {

            // Firefox

            delta = - event.detail / 3;

        }

        _zoomStart.y += delta * 0.01;
        _this.dispatchEvent( startEvent );
        _this.dispatchEvent( endEvent );

    }

    function touchstart( event ) {

        if ( _this.enabled === false ) return;

        switch ( event.touches.length ) {

            case 1:
                _state = STATE.TOUCH_ROTATE;
                _moveCurr.copy( getMouseOnCircle( event.touches[ 0 ].pageX, event.touches[ 0 ].pageY ) );
                _movePrev.copy( _moveCurr );
                break;

            case 2:
                _state = STATE.TOUCH_ZOOM_PAN;
                var dx = event.touches[ 0 ].pageX - event.touches[ 1 ].pageX;
                var dy = event.touches[ 0 ].pageY - event.touches[ 1 ].pageY;
                _touchZoomDistanceEnd = _touchZoomDistanceStart = Math.sqrt( dx * dx + dy * dy );

                var x = ( event.touches[ 0 ].pageX + event.touches[ 1 ].pageX ) / 2;
                var y = ( event.touches[ 0 ].pageY + event.touches[ 1 ].pageY ) / 2;
                _panStart.copy( getMouseOnScreen( x, y ) );
                _panEnd.copy( _panStart );
                break;

            default:
                _state = STATE.NONE;

        }
        _this.dispatchEvent( startEvent );


    }

    function touchmove( event ) {

        if ( _this.enabled === false ) return;

        event.preventDefault();
        event.stopPropagation();

        switch ( event.touches.length ) {

            case 1:
                _movePrev.copy( _moveCurr );
                _moveCurr.copy( getMouseOnCircle(  event.touches[ 0 ].pageX, event.touches[ 0 ].pageY ) );
                break;

            case 2:
                var dx = event.touches[ 0 ].pageX - event.touches[ 1 ].pageX;
                var dy = event.touches[ 0 ].pageY - event.touches[ 1 ].pageY;
                _touchZoomDistanceEnd = Math.sqrt( dx * dx + dy * dy );

                var x = ( event.touches[ 0 ].pageX + event.touches[ 1 ].pageX ) / 2;
                var y = ( event.touches[ 0 ].pageY + event.touches[ 1 ].pageY ) / 2;
                _panEnd.copy( getMouseOnScreen( x, y ) );
                break;

            default:
                _state = STATE.NONE;

        }

    }

    function touchend( event ) {

        if ( _this.enabled === false ) return;

        switch ( event.touches.length ) {

            case 1:
                _movePrev.copy( _moveCurr );
                _moveCurr.copy( getMouseOnCircle(  event.touches[ 0 ].pageX, event.touches[ 0 ].pageY ) );
                break;

            case 2:
                _touchZoomDistanceStart = _touchZoomDistanceEnd = 0;

                var x = ( event.touches[ 0 ].pageX + event.touches[ 1 ].pageX ) / 2;
                var y = ( event.touches[ 0 ].pageY + event.touches[ 1 ].pageY ) / 2;
                _panEnd.copy( getMouseOnScreen( x, y ) );
                _panStart.copy( _panEnd );
                break;

        }

        _state = STATE.NONE;
        _this.dispatchEvent( endEvent );

    }

    function contextmenu( event ) {

        event.preventDefault();

    }

    this.dispose = function() {

        this.domElement.removeEventListener( 'contextmenu', contextmenu, false );
        this.domElement.removeEventListener( 'mousedown', mousedown, false );
        this.domElement.removeEventListener( 'mousewheel', mousewheel, false );
        this.domElement.removeEventListener( 'DOMMouseScroll', mousewheel, false ); // firefox

        this.domElement.removeEventListener( 'touchstart', touchstart, false );
        this.domElement.removeEventListener( 'touchend', touchend, false );
        this.domElement.removeEventListener( 'touchmove', touchmove, false );

        document.removeEventListener( 'mousemove', mousemove, false );
        document.removeEventListener( 'mouseup', mouseup, false );

        window.removeEventListener( 'keydown', keydown, false );
        window.removeEventListener( 'keyup', keyup, false );

    }

    this.domElement.addEventListener( 'contextmenu', contextmenu, false );
    this.domElement.addEventListener( 'mousedown', mousedown, false );
    this.domElement.addEventListener( 'mousewheel', mousewheel, false );
    this.domElement.addEventListener( 'DOMMouseScroll', mousewheel, false ); // firefox

    this.domElement.addEventListener( 'touchstart', touchstart, false );
    this.domElement.addEventListener( 'touchend', touchend, false );
    this.domElement.addEventListener( 'touchmove', touchmove, false );

    window.addEventListener( 'keydown', keydown, false );
    window.addEventListener( 'keyup', keyup, false );

    this.handleResize();

    // force an update at start
    this.update();

};

THREE.TrackballControls.prototype = Object.create( THREE.EventDispatcher.prototype );
THREE.TrackballControls.prototype.constructor = THREE.TrackballControls;
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

    Tour.prototype.checkForDuplicates = function () {
        var i;
        for (i = 0; i < this.tour.length; i++) {
            var p = this.tour[i];
            if (this.tour.lastIndexOf(p) !== i) {
                throw new Error('Tour contains a duplicate element');
            }
        }
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
        child.checkForDuplicates();

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
