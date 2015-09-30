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
    console.dir(self);
  };

  return BoundingBox;

}());

;/* global Mousetrap, THREE */
/* jshint unused:false */
'use strict';

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

    self.KEYS = {};
    self.MODIFIERS = {
      ALT: 'alt',
      CTRL: 'ctrl',
      META: 'meta',
      SHIFT: 'shift'
    };
    self.enabled = config.enabled || false;
    self.modifiers = {};

    Object.keys(self.MODIFIERS).forEach(function (key) {
      self.modifiers[self.MODIFIERS[key]] = false;
    });

    // listen for events
    Mousetrap.bind('alt', function () { self.keydown(self.MODIFIERS.ALT); }, 'keydown');
    Mousetrap.bind('alt', function () { self.keyup(self.MODIFIERS.ALT); }, 'keyup');
    Mousetrap.bind('ctrl', function () { self.keydown(self.MODIFIERS.CTRL); }, 'keydown');
    Mousetrap.bind('ctrl', function () { self.keyup(self.MODIFIERS.CTRL); }, 'keyup');
    Mousetrap.bind('shift', function () { self.keydown(self.MODIFIERS.SHIFT); }, 'keydown');
    Mousetrap.bind('shift', function () { self.keyup(self.MODIFIERS.SHIFT); }, 'keyup');
    //Mousetrap.bind('shift shift', function () { self.keyDoublePress(self.MODIFIERS.SHIFT); });

    // selection
    Mousetrap.bind('ctrl+a', function () { self.controller.selection.selectAll(); });
    Mousetrap.bind('ctrl+n', function () { self.controller.selection.selectNone(); });
  }

  KeyStateController.prototype = Object.create(THREE.EventDispatcher.prototype);

  KeyStateController.prototype.constructor = KeyStateController;

  KeyStateController.prototype.keyDoublePress = function (key) {
    this.modifiers[key] = false;
    this.dispatchEvent({'type': 'key-double-press', value: key});
  };

  KeyStateController.prototype.keydown = function (key) {
    this.modifiers[key] = true;
    this.dispatchEvent({'type': 'keydown', value: key});
  };

  KeyStateController.prototype.keyup = function (key) {
    this.modifiers[key] = true;
    this.dispatchEvent({'type': 'keyup', value: key});
  };

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

    PathPlanner.prototype.generateWalkPath = function () {
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

    Scene3D.prototype.ENTITIES = {
        GROUND: 'ground',
        POINT: 'point',
        POLE: 'pole'
    };

    Scene3D.prototype.constructor = Scene3D;

    /**
     * Create a default scene camera. A camera aspect ratio or DOM height
     * element and width must be specified.
     * @param config
     */
    Scene3D.prototype.createDefaultCamera = function (config) {
        var self = this;
        Object.keys(config).forEach(function (key) {
           camera[key] = config[key];
        });
        var targetcamera = new FOUR.TargetCamera(camera.fov, camera.width / camera.height, camera.near, camera.far);
        targetcamera.name = self.DEFAULT_CAMERA_NAME;
        targetcamera.position.set(-100, -100, 100);
        self.cameras.add(targetcamera);
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

}());;/* global THREE */
/* jshint unused:false */
'use strict';

var FOUR = FOUR || {};

FOUR.SelectionControl = (function () {

  /**
   * Scene object selection control. Emits 'update' events when the selection
   * set changes.
   * @param {Object} config Configuration
   * @constructor
   */
  function SelectionControl (config) {
    THREE.EventDispatcher.call(this);
    config = config || {};
    var self = this;
    self.MODIFIERS = {
      ALT: 'alt',
      CTRL: 'ctrl',
      META: 'meta',
      SHIFT: 'shift'
    };

    self.enabled = config.enabled || false;
    self.modifiers = {};
    self.mouse = new THREE.Vector2();
    self.raycaster = new THREE.Raycaster();
    self.selection = config.viewport.scene.selection;
    self.viewport = config.viewport;

    Object.keys(self.MODIFIERS).forEach(function (key) {
      self.modifiers[self.MODIFIERS[key]] = false;
    });

    // listen for mouse events
    self.selection.addEventListener('update', self.update.bind(self), false);
    self.viewport.domElement.addEventListener('mousedown', self.onMouseDown.bind(self), false);
    self.viewport.domElement.addEventListener('mousemove', self.onMouseMove.bind(self), false);
    self.viewport.domElement.addEventListener('mouseover', self.onMouseOver.bind(self), false);
    self.viewport.domElement.addEventListener('mouseup', self.onMouseUp.bind(self), false);
  }

  SelectionControl.prototype = Object.create(THREE.EventDispatcher.prototype);

  SelectionControl.prototype.constructor = SelectionControl;

  SelectionControl.prototype.count = function () {
    // TODO consider implementing this as a property
    return this.selection.getObjects().length;
  };

  SelectionControl.prototype.disable = function () {
    this.enabled = false;
  };

  SelectionControl.prototype.enable = function () {
    this.enabled = true;
  };

  SelectionControl.prototype.onKeyDown = function (event) {
    if (event.value === 'alt' || event.value === 'ctrl' || event.value === 'shift') {
      this.modifiers[event.value] = true;
    }
  };

  SelectionControl.prototype.onKeyUp = function (event) {
    if (event.value === 'alt' || event.value === 'ctrl' || event.value === 'shift') {
      this.modifiers[event.value] = false;
    }
  };

  SelectionControl.prototype.onMouseDown = function (event) {
    //console.log('mouse down');
  };

  SelectionControl.prototype.onMouseMove = function (event) {
    //console.log('mouse move');
    //var self = this;
    //// calculate mouse position in normalized device coordinates (-1 to +1)
    //self.mouse.x = (event.clientX / self.viewport.domElement.clientWidth) * 2 - 1;
    //self.mouse.y = -(event.clientY / self.viewport.domElement.clientHeight) * 2 + 1;
  };

  SelectionControl.prototype.onMouseOver = function (event) {
    //console.log('mouse over');
  };

  SelectionControl.prototype.onMouseUp = function (event) {
    event.preventDefault();
    event.stopPropagation();
    var self = this;
    if (self.enabled) {
      // calculate mouse position in normalized device coordinates (-1 to +1)
      self.mouse.x = (event.offsetX / self.viewport.domElement.clientWidth) * 2 - 1;
      self.mouse.y = -(event.offsetY / self.viewport.domElement.clientHeight) * 2 + 1;
      // update the picking ray with the camera and mouse position
      self.raycaster.setFromCamera(self.mouse, self.viewport.camera);
      // calculate objects intersecting the picking ray
      var intersects = self.raycaster.intersectObjects(self.viewport.scene.model.children, true) || [];
      // update the selection set using only the nearest selected object
      var objs = intersects && intersects.length > 0 ? [intersects[0].object] : [];
      // add objects
      if (self.modifiers.shift === true) {
        self.selection.addAll(objs);
      }
      // remove objects
      else if (self.modifiers.alt === true) {
        self.selection.removeAll(objs);
      }
      // toggle selection state
      else {
        self.selection.toggle(objs);
      }
    }
  };

  SelectionControl.prototype.selectAll = function () {
    console.log('select all');
    this.selection.addAll(this.viewport.scene.model.children);
  };

  SelectionControl.prototype.selectByFilter = function (filter) {
    console.log('select by filter');
    var objs = [], self = this;
    self.viewport.scene.traverse(function (obj) {
      if (filter(obj)) {
        objs.push(obj);
      }
    });
    self.selection.addAll(objs);
  };

  SelectionControl.prototype.selectByMarquee = function (event) {
    console.log('select by marquee');
    throw new Error('not implemented');
  };

  SelectionControl.prototype.selectNone = function () {
    console.log('select none');
    this.selection.removeAll();
  };

  SelectionControl.prototype.update = function () {
    this.dispatchEvent({type: 'update'});
  };

  return SelectionControl;

}());
;/* globals THREE */
'use strict';

var FOUR = FOUR || {};

FOUR.SelectionSet = (function () {

  /**
   * Selection set. Emits 'update' events.
   * @param {Object} config Configuration
   * @constructor
   */
  function SelectionSet (config) {
    THREE.EventDispatcher.call(this);
    var self = this;
    config = config || {};
    self.count = 0;
    self.name = 'selection-set';
    self.selectedColor = 0xff5a00;
    self.scene = {};
    self.selection = {};
    Object.keys(config).forEach(function (key) {
      self[key] = config[key];
    });
  }

  SelectionSet.prototype = Object.create(THREE.EventDispatcher.prototype);

  SelectionSet.prototype.constructor = SelectionSet;

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
   * Get bounding box for all selected objects.
   */
  SelectionSet.prototype.getBoundingBox = function () {
    var self = this;
    var bbox = new FOUR.BoundingBox();
    bbox.name = self.name + '-bounding-box';
    bbox.update(self.selection);
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
;/* global Mousetrap, THREE, TWEEN */
/* jshint unused:false */
'use strict';

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
        // compute position using target as anchor point
    };

    TargetCamera.prototype.setPosition = function (x, y, z) {
      // update target
        // transition
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
        throw new Error('not implemented');
        //var self = this;
        //var direction = new THREE.Vector3().subVectors(self.target, self.position);
        //self.target.set(x, y, z);
        //var position = new THREE.Vector3().addVectors(self.target, direction);
        //self.distance = distance(position, self.target);
        //return self.planner.tweenToPosition(
        //    self,
        //    new THREE.Vector3(cx, cy, cz),
        //    new THREE.Vector3(tx, ty, tz),
        //    self.emit.bind(self));
    };

    /**
     * Move the camera to the predefined view position.
     * @param {Number} view View
     * @param {BoundingBox} bbox View bounding box
     */
    TargetCamera.prototype.setView = function (view, bbox) {
        var dist, height, offset = 10, self = this;
        var center = bbox.getCenter();
        var cx = center.x; // new camera position
        var cy = center.y;
        var cz = center.z;
        var tx = center.x; // new camera target
        var ty = center.y;
        var tz = center.z;
        var rx = self.rotation.x; // camera rotation in radians
        var ry = self.rotation.y;
        var rz = self.rotation.z;
        // reorient the camera relative to the bounding box
        if (view === self.VIEWS.TOP) {
            height = bbox.getYDimension();
            offset += (bbox.getZDimension() / 2);
            dist = height / 2 / Math.tan(Math.PI * self.fov / 360);
            cz = center.z + dist + offset;
            rx = 0;
            ry = 0;
            rz = Math.PI * 2;
        }
        else if (view === self.VIEWS.FRONT) {
            height = bbox.getZDimension();
            offset += (bbox.getYDimension() / 2);
            dist = height / 2 / Math.tan(Math.PI * self.fov / 360);
            cy = center.y - dist - offset;
            rx = Math.PI / 2;
            ry = 0;
            rz = Math.PI * 2;
        }
        else if (view === self.VIEWS.BACK) {
            height = bbox.getZDimension();
            offset += (bbox.getYDimension() / 2);
            dist = height / 2 / Math.tan(Math.PI * self.fov / 360);
            cy = center.y + dist + offset;
            rx = -Math.PI / 2;
            ry = 0;
            rz = Math.PI;
        }
        else if (view === self.VIEWS.RIGHT) {
            height = bbox.getZDimension();
            offset += (bbox.getXDimension() / 2);
            dist = height / 2 / Math.tan(Math.PI * self.fov / 360);
            cx = center.x + dist + offset;
            rx = 0;
            ry = Math.PI / 2;
            rz = Math.PI / 2;
        }
        else if (view === self.VIEWS.LEFT) {
            height = bbox.getZDimension();
            offset += (bbox.getXDimension() / 2);
            dist = height / 2 / Math.tan(Math.PI * self.fov / 360);
            cx = center.x - dist - offset;
            rx = 0;
            ry = -Math.PI / 2;
            rz = -Math.PI / 2;
        }
        else if (view === self.VIEWS.PERSPECTIVE) {
            cx = center.x - 50;
            cy = center.y - 50;
            cz = center.z + 50;
            tx = center.x;
            ty = center.y;
            tz = center.z;
            rx = Math.PI / 8;
            ry = -Math.PI / 4;
            rz = -Math.PI / 4;
        }
        self.planner.tweenToPosition(
            self,
            new THREE.Vector3(cx, cy, cz),
            new THREE.Vector3(tx, ty, tz),
            self.emit.bind(self));
        //self.planner.tweenToPositionAndRotation(
        //    self,
        //    new THREE.Vector3(cx, cy, cz),
        //    new THREE.Vector3(tx, ty, tz),
        //    new THREE.Euler(rx, ry, rz),
        //    self.emit.bind(self));
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

    /**
     * Zoom in incrementally.
     */
    TargetCamera.prototype.zoomIn = function () {
        console.log('zoom in');
        var self = this;
        var dist = self.distance / self.ZOOM_FACTOR;
    };

    /**
     * Zoom the view to fit the window selection.
     */
    TargetCamera.prototype.zoomInToWindow = function () {
        throw new Error('zoom in to window');
    };

    /**
     * Zoom out incrementally.
     */
    TargetCamera.prototype.zoomOut = function () {
        console.log('zoom out');
        var self = this;
        var dist = self.distance * self.ZOOM_FACTOR;
    };

    /**
     * Zoom to fit the bounding box.
     * @param {BoundingBox} bbox Bounding box
     */
    TargetCamera.prototype.zoomToFit = function (bbox) {
        console.log('zoom to fit all or selected items');
        var diff, dist, next, offset = 5, self = this, target;
        // the offset from the current camera position to the new camera position
        dist = bbox.getRadius() / Math.tan(Math.PI * self.fov / 360);
        target = new THREE.Vector3(0, 0, -(dist + offset)); // 100 is the distance from the camera to the target, measured along the Z axis
        target.applyQuaternion(self.quaternion);
        target.add(self.position);
        var center = bbox.getCenter();
        diff = new THREE.Vector3().subVectors(bbox.getCenter(), target);
        // the next camera position
        next = new THREE.Vector3().add(self.position, diff);
        // move the camera to the next position
        return self.planner.tweenToPosition(
            self,
            new THREE.Vector3(next.x, next.y, next.z),
            new THREE.Vector3(bbox.x, bbox.y, bbox.z),
            self.emit.bind(self));
    };

    return TargetCamera;

}());
;/* global Mousetrap, THREE, TWEEN */
/* jshint unused:false */
'use strict';

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
		var changeEvent = { type: 'change' };
		var startEvent = { type: 'start' };
		var endEvent = { type: 'end' };


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
				scope.dispatchEvent(startEvent);
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
			scope.dispatchEvent(endEvent);
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
;/* global Mousetrap, THREE, TWEEN */
/* jshint unused:false */
'use strict';

var FOUR = FOUR || {};

FOUR.WalkController = (function () {

    function WalkController (camera, domElement) {
        THREE.EventDispatcher.call(this);
        var self = this;

        self.MODIFIERS = {
            ALT: 'ALT',
            CTRL: 'CTRL',
            SHIFT: 'SHIFT'
        };

        self.camera = camera;
        self.domElement = domElement;

        self.enabled = false;
        self.lookSpeed = 0.005;
        self.lookVertical = true;
        self.modifiers = {
            'ALT': false,
            'CTRL': false,
            'SHIFT': false
        };
        self.mouseX = 0;
        self.mouseY = 0;
        self.movementSpeed = 1.0;
        self.planner = new FOUR.PathPlanner();

        self.lat = 0;
        self.lon = 0;
        self.phi = 0;
        self.theta = 0;

        if ( self.domElement === document ) {
            self.viewHalfX = window.innerWidth / 2;
            self.viewHalfY = window.innerHeight / 2;
        } else {
            self.viewHalfX = self.domElement.offsetWidth / 2;
            self.viewHalfY = self.domElement.offsetHeight / 2;
            self.domElement.setAttribute('tabindex', -1);
        }

        // movement keys
        Mousetrap.bind('up', function () { self.translate(); });
        Mousetrap.bind('down', function () { self.translate(); });
        Mousetrap.bind('left', function () { self.rotate(); });
        Mousetrap.bind('right', function () { self.rotate(); });
    }

    WalkController.prototype = Object.create(THREE.EventDispatcher.prototype);

    WalkController.prototype.constructor = WalkController;

    WalkController.prototype.WALK_HEIGHT = 2;

    WalkController.prototype.disable = function () {
        this.enabled = false;
    };

    WalkController.prototype.enable = function () {
        var self = this;
        // translate the camera to the walking height
        self.camera.setPositionAndTarget(
            self.camera.position.x,
            self.camera.position.y,
            self.WALK_HEIGHT,
            self.camera.target.x,
            self.camera.target.y,
            self.WALK_HEIGHT)
            .then(function () {
                self.enabled = true;
            });
    };

    WalkController.prototype.onKeyDown = function (event) {
        console.log('key down');
        // ALT key changes controller to look mode
    };

    WalkController.prototype.onKeyUp = function (event) {
        console.log('key up');
    };

    WalkController.prototype.onMouseDown = function () {
        console.log('mouse down');
    };

    WalkController.prototype.onMouseMove = function () {
        console.log('mouse move');
    };

    WalkController.prototype.onMouseUp = function () {
        console.log('mouse up');
    };

    WalkController.prototype.rotate = function () {
        console.log('rotate');
    };

    WalkController.prototype.translate = function () {
        console.log('translate');
    };

    WalkController.prototype.update = function (delta) {
        console.log('update');
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
;/* global Mousetrap, THREE, TWEEN */
'use strict';

var FOUR = FOUR || {};

/**
 * Renders the view from a scene camera to the DOM.
 */
FOUR.Viewport3D = (function () {

    function Viewport3D(elementId, scene) {
        THREE.EventDispatcher.call(this);
        this.COLORS = {
            SELECTED: 0xffa500
        };
        this.CONTROLLERS = {
            ORBIT: 'orbit',
            SELECT: 'select',
            TRACKBALL: 'trackball',
            WALK: 'walk'
        };
        this.MODES = {
            INSPECT: -1,
            ORBIT: 0,
            SELECT: 1,
            TRACKBALL: 2,
            WALK: 3
        };
        this.MODIFIERS = {
            ALT: 'ALT',
            CTRL: 'CTRL',
            SHIFT: 'SHIFT'
        };
        this.WALK_HEIGHT = 7.5;

        this.backgroundColor = new THREE.Color(0x000, 1.0);
        this.camera = null;
        this.clock = new THREE.Clock();
        this.continuous = false; // render continuously
        this.controller = {};
        this.domElement = null;
        this.domElementId = elementId;
        this.mode = this.MODES.SELECT;
        this.modifiers = {
            'ALT': false,
            'CTRL': false,
            'SHIFT': false
        };
        this.renderer = null;
        this.scene = scene;

        this.walk = {
            index: 0,
            path: []
        };
    }

    Viewport3D.prototype = Object.create(THREE.EventDispatcher.prototype);

    Viewport3D.prototype.constructor = Viewport3D;

    Viewport3D.prototype.getViewBoundingBox = function () {
        var self = this;
        if (self.scene.selection.count > 0) {
            return self.scene.selection.getBoundingBox();
        } else {
            var bbox = new FOUR.BoundingBox('scene-bounding-box');
            bbox.update(self.scene.model.children);
            return bbox;
        }
    };

    /**
     * Initialize the viewport.
     */
    Viewport3D.prototype.init = function () {
        var self = this;
        self.domElement = document.getElementById(self.domElementId);
        // renderer
        self.renderer = new THREE.WebGLRenderer({antialias: true});
        self.renderer.setClearColor(self.backgroundColor);
        self.renderer.setSize(self.domElement.clientWidth, self.domElement.clientHeight);
        self.renderer.shadowMap.enabled = true;
        self.domElement.appendChild(self.renderer.domElement);
        // set the camera
        self.setCamera(self.scene.DEFAULT_CAMERA_NAME);
        // setup interactions
        self.setupKeyboardBindings();
        self.setupControllers();
        // listen for events
        self.domElement.addEventListener('mousemove', function () {
            requestAnimationFrame(self.render.bind(self));
        });
    };

    // TODO need to wire this function up
    Viewport3D.prototype.onWindowResize = function () {
        var self = this;
        var height = self.domElement.clientHeight;
        var width = self.domElement.clientWidth;
        self.camera.aspect = width / height;
        self.camera.updateProjectionMatrix();
        self.renderer.setSize(width, height);
        self.render();
    };

    /**
     * Render the viewport once.
     */
    Viewport3D.prototype.render = function () {
        var self = this;
        var delta = self.clock.getDelta();
        // update scene state
        TWEEN.update();
        if (self.mode === self.MODES.ORBIT) {
            self.controller[self.CONTROLLERS.ORBIT].update(delta);
        }
        if (self.mode === self.MODES.TRACKBALL) {
            self.controller[self.CONTROLLERS.TRACKBALL].update(delta);
        } else if (self.mode === self.MODES.WALK) {
            self.controller[self.CONTROLLERS.WALK].update(delta);
        }
        // render the frame
        self.renderer.render(self.scene, self.camera);
        // enqueue the next rendering task
        if (self.continuous) {
            requestAnimationFrame(self.render.bind(self));
        }
    };

    /**
     * Set the viewport camera
     * @param {String} name Camera name
     */
    Viewport3D.prototype.setCamera = function (name) {
        var self = this;
        if (self.camera) {
            self.camera.removeEventListener('continuous-update-end', self.stopContinuousRendering);
            self.camera.removeEventListener('continuous-update-start', self.startContinuousRendering);
            self.camera.removeEventListener('update', self.render);
        }
        self.camera = self.scene.getCamera(name);
        self.camera.addEventListener('continuous-update-end', self.stopContinuousRendering.bind(self));
        self.camera.addEventListener('continuous-update-start', self.startContinuousRendering.bind(self));
        self.camera.addEventListener('update', self.render.bind(self));
        self.render();
    };

    Viewport3D.prototype.setMode = function (mode) {
        var self = this;
        self.mode = mode;
        // disable the existing controller
        Object.keys(self.controller).forEach(function (key) {
            var controller = self.controller[key];
            if (controller && controller.hasOwnProperty('disable')) {
                controller.disable();
            }
        });
        // enable the new controller
        if (self.mode === self.MODES.SELECT) {
            console.log('select mode');
            self.controller.selection.enable();
        } else if (self.mode === self.MODES.ORBIT) {
            console.log('orbit mode');
            self.controller.orbit.enable();
        } else if (self.mode === self.MODES.TRACKBALL) {
            console.log('trackball mode');
            //self.controller.trackball.enable();
        } else if (self.mode === self.MODES.WALK) {
            console.log('walk mode');
            self.controller.walk.enable();
        } else if (self.mode === self.MODES.INSPECT) {
            // center the camera on the bounding box, zoom to fit, then enable the orbit controller
            console.log('INSPECT mode');
        }
    };

    Viewport3D.prototype.setupControllers = function () {
        // TODO this code should be outside of the viewport
        var self = this;

        // selection controller
        self.controller.selection = new FOUR.SelectionControl({viewport: self});
        self.controller.selection.addEventListener('update', self.render.bind(self), false);

        // trackball controller
        //self.controller.trackball = new THREE.TrackballControls(self.camera, self.domElement);
        //self.controller.trackball.rotateSpeed = 1.0;
        //self.controller.trackball.zoomSpeed = 1.2;
        //self.controller.trackball.panSpeed = 0.8;
        //self.controller.trackball.noZoom = false;
        //self.controller.trackball.noPan = false;
        //self.controller.trackball.staticMoving = true;
        //self.controller.trackball.dynamicDampingFactor = 0.3;
        //self.controller.trackball.keys = [65, 83, 68];
        //self.controller.trackball.addEventListener('change', self.render.bind(self));
        //self.controller.trackball.disable();

        //// first person navigation controller
        //self.controller.walk = new THREE.FirstPersonControls(self.camera, document);
        //self.controller.walk.constrainVertical = true;
        //self.controller.walk.lookSpeed = 0.2;
        //self.controller.walk.lookVertical = true;
        //self.controller.walk.movementSpeed = 10;
        //self.controller.walk.noFly = true;
        //self.controller.walk.verticalMax = 2.0;
        //self.controller.walk.verticalMin = 1.0;
        //self.controller.walk.lon = -150;
        //self.controller.walk.lat = 120;
        //self.controller.walk.phi = 0;
        //self.controller.walk.theta = 1;
        //self.controller.walk.moveBackward = true;
        //self.controller.walk.moveForward = true;
        //self.controller.walk.target.set(0,0,0);
        ////self.controller.walk.disable();

        self.controller.walk = new FOUR.WalkController(self.camera, self.domElement);
        self.controller.walk.disable();

        // orbit controller
        //self.controller.orbit = new THREE.OrbitControls(self.camera, self.domElement);
        //self.controller.orbit.dampingFactor = 0.25;
        //self.controller.orbit.enableDamping = true;
        //self.controller.orbit.enablePan = true;
        //self.controller.orbit.enableZoom = true;
        //self.controller.orbit.target.set(0,0,0);
        //self.controller.orbit.disable();

        // keystate controller
        self.controller.keystate = new FOUR.KeyStateControl();
        self.controller.keystate.addEventListener('keydown', self.controller.selection.onKeyDown.bind(self.controller.selection));
        self.controller.keystate.addEventListener('keyup', self.controller.selection.onKeyUp.bind(self.controller.selection));
        self.controller.keystate.addEventListener('keydown', self.controller.walk.onKeyDown.bind(self.controller.selection));
        self.controller.keystate.addEventListener('keyup', self.controller.walk.onKeyUp.bind(self.controller.selection));

        // set the navigation mode
        this.setMode(this.mode);
    };

    Viewport3D.prototype.setupKeyboardBindings = function () {
        var self = this;


        // bounding box
        Mousetrap.bind('b', function () {
            console.log('toggle bounding box visibility');
            self.scene.boundingBox.toggleVisibility();
            self.render();
        });

        // viewport mode
        // TODO modify the cursor depending on the mode
        Mousetrap.bind('q', function () {
            self.setMode(self.MODES.SELECT);
        });
        Mousetrap.bind('w', function () {
            self.setMode(self.MODES.TRACKBALL);
        });
        Mousetrap.bind('e', function () {
            self.setMode(self.MODES.WALK);
        });
        Mousetrap.bind('r', function () {
            self.setMode(self.MODES.ORBIT);
        });

        // view controls
        Mousetrap.bind('f', function () {
            var bbox = self.getViewBoundingBox();
            self.camera.zoomToFit(bbox).then(function () {});
        });

        Mousetrap.bind('5', function () {
            var bbox = self.getViewBoundingBox();
            self.camera.setView(self.camera.VIEWS.TOP, bbox);
        });
        Mousetrap.bind('6', function () {
            var bbox = self.getViewBoundingBox();
            self.camera.setView(self.camera.VIEWS.FRONT, bbox);
        });
        Mousetrap.bind('7', function () {
            var bbox = self.getViewBoundingBox();
            self.camera.setView(self.camera.VIEWS.LEFT,bbox);
        });
        Mousetrap.bind('8', function () {
            var bbox = self.getViewBoundingBox();
            self.camera.setView(self.camera.VIEWS.RIGHT, bbox);
        });
        Mousetrap.bind('9', function () {
            var bbox = self.getViewBoundingBox();
            self.camera.setView(self.camera.VIEWS.BACK, bbox);
        });
        Mousetrap.bind('0', function () {
            var bbox = self.getViewBoundingBox();
            self.camera.setView(self.camera.VIEWS.PERSPECTIVE, bbox);
        });

        // walk controls
        Mousetrap.bind('g', function () {
            self.generateWalkPath();
        });
        Mousetrap.bind(',', function () {
            self.walkToPreviousPoint();
        });
        Mousetrap.bind('.', function () {
            self.walkToNextPoint();
        });
        Mousetrap.bind('/', function () {
            console.log('switch object focus');
            self.moveToNextWaypointFeature();
        });

        // camera controls
        Mousetrap.bind('t', function () {
            console.log('toggle camera target visibility');
            if (self.camera.target.visible) {
                self.camera.hideTarget();
            } else {
                self.camera.showTarget();
            }
        });
        Mousetrap.bind('y', function () {
            console.log('toggle camera frustrum visibility');
            if (self.camera.frustrum.visible) {
                self.camera.hideFrustrum();
            } else {
                self.camera.showFrustrum();
            }
        });
        Mousetrap.bind('=', function () {
            self.camera.zoomIn();
        });

        Mousetrap.bind('-', function () {
            self.camera.zoomOut();
        });

    };

    Viewport3D.prototype.startContinuousRendering = function () {
        this.continuous = true;
    };

    Viewport3D.prototype.stopContinuousRendering = function () {
        this.continuous = false;
    };

    return Viewport3D;

}());
