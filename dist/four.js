"use strict";

var FOUR = FOUR || {};

/**
 * Cursor styles.
 * @type {{DEFAULT: string, PAN: string, ROTATE: string, ZOOM: string}}
 */
FOUR.CURSOR = {
  DEFAULT: 'default',
  PAN: 'all-scroll',
  ROTATE: 'crosshair',
  ZOOM: 'ns-resize'
};

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

/**
 * Common event identifiers.
 * @type {String}
 */
FOUR.EVENT = {
  BACKGROUND_CHANGE: 'background-change',
  CAMERA_CHANGE: 'camera-change',
  CONTINUOUS_UPDATE_END: 'continuous-update-end',
  CONTINUOUS_UPDATE_START: 'continuous-update-start',
  CONTROLLER_CHANGE: 'controller-change',
  KEY_DOWN: 'keydown',
  KEY_UP: 'keyup',
  MOUSE_DOWN: 'mousedown',
  MOUSE_MOVE: 'mousemove',
  MOUSE_UP: 'mouseup',
  RESIZE: 'resize',
  UPDATE: 'update'
};

FOUR.KEY = {
  ALT: 18,
  ARROW_DOWN: 40,
  ARROW_LEFT: 37,
  ARROW_RIGHT: 39,
  ARROW_UP: 38,
  CTRL: 17,
  SHIFT: 16
};

FOUR.MOUSE_STATE = {
  DOWN: 0,
  MOVE: 1,
  UP: 2
};

FOUR.POINTER_STATE = {};

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
};

/**
 * Utility functions namespace.
 * @type {*}
 */
FOUR.utils = {};

/**
 * Get the screen bounding box for the object 3D.
 * @param {THREE.Object3D} obj Scene object
 * @param {THREE.Camera} camera Camera
 * @param {Number} screenWidth Viewport width
 * @param {Number} screenHeight Viewport height
 * @param {String} strategy Strategy
 * @returns {Object} Screen coordinates, object metadata
 */
FOUR.utils.getObject3DScreenBoundingBox = function (obj, camera, screenWidth, screenHeight, strategy) {
  throw new Error('not implemented'); // FIXME implement function
};

/**
 * Transform object position to screen coordinates.
 * @see http://zachberry.com/blog/tracking-3d-objects-in-2d-with-three-js/
 * @param {THREE.Object3D} obj Object
 * @param {THREE.Camera} camera Camera
 * @param {Number} screenWidth Viewport width
 * @param {Number} screenHeight Viewport height
 * @returns {Object} Screen coordinates, object metadata
 */
FOUR.utils.getObjectScreenCoordinates = function (obj, camera, screenWidth, screenHeight) {
  var pos = new THREE.Vector3();
  //if (obj instanceof THREE.Sphere) {
  //  // bounding sphere
  //  pos.copy(obj.center);
  //} else
  if (obj instanceof THREE.Object3D) {
    obj.updateMatrixWorld();
    pos.setFromMatrixPosition(obj.matrixWorld);
  } else {
    pos.copy(obj);
  }
  pos.project(camera);
  // get screen coordinates
  pos.x = Math.round((pos.x + 1) * screenWidth / 2);
  pos.y = Math.round((-pos.y + 1) * screenHeight / 2);
  pos.z = 0;
  return pos;
};

/**
 * Transform vertex position to screen coordinates.
 * @param {THREE.Vector3} vertex Vertex
 * @param {THREE.Camera} camera Camera
 * @param {Number} screenWidth Viewport width
 * @param {Number} screenHeight Viewport height
 * @returns {Object} Screen coordinates, object metadata
 *
 * @todo should take an object and then return an array with screen coordinates
 */
FOUR.utils.getVertexScreenCoordinates = function (vertex, camera, screenWidth, screenHeight) {
  var pos = new THREE.Vector3().copy(vertex);
  pos.project(camera);
  // get screen coordinates
  pos.x = Math.round((pos.x + 1) * screenWidth / 2);
  pos.y = Math.round((-pos.y + 1) * screenHeight / 2);
  pos.z = 0;
  return pos;
};

/**
 * Determine if R1 intersects R2.
 * @param {Object} r1 Rectangle 1
 * @param {Object} r2 Rectangle 2
 */
FOUR.utils.intersects = function (r1, r2) {
  throw new Error('not implemented'); // FIXME implement function
};

/**
 * Determine if rectangle R1 is contained inside rectangle R2. Rectangles are
 * screen axes aligned.
 * @param {Object} r1 Rectangle 1
 * @param {Object} r2 Rectangle 2
 */
FOUR.utils.isContained = function (r1, r2) {
  // compare X dimension
  if (r1.p1.x >= r2.p1.x && r1.p1.x <= r2.p2.x) {
    if (r1.p2.x >= r2.p1.x && r1.p2.x <= r2.p2.x) {
      // compare y dimension
      if (r1.p1.y >= r2.p1.y && r1.p1.y <= r2.p2.y) {
        if (r1.p2.y >= r2.p1.y && r1.p2.y <= r2.p2.y) {
          return true;
        }
      }
    }
  }
  return false;
};
;

FOUR.KeyCommandController = (function () {

  /**
   * Key command controller. The controller allows you to define key command
   * sets that can be activated and deactivated as required. A key command set
   * called the 'default' set is always active.
   * @constructor
   */
  function KeyCommandController (config) {
    config = config || {};

    var self = this;
    self.active = null; // the active command set
    self.enabled = config.enabled || false;
    self.listeners = {};
    self.pressed = []; // list of keys that are currently pressed
    self.sets = {
      'default': []
    };

    Object.keys(config).forEach(function (key) {
      self.config[key] = config[key];
    });
  }

  /**
   * Define key command.
   * @param {String} group Group. Use 'default' for persistent commands.
   * @param {String} command Key command
   * @param {Function} fn Function
   * @param {Element} el DOM element that will listen for events. Defaults to window
   */
  KeyCommandController.prototype.bind = function (group, command, fn, el) {
    el = el || window;
    if (!this.sets.hasOwnProperty(group)) {
      this.sets[group] = [];
    }
    this.sets[group].push({
      command: command,
      fn: fn
    });
  };

  KeyCommandController.prototype.disable = function () {
    var self = this;
    self.enabled = false;
    Object.keys(self.listeners).forEach(function (key) {
      var listener = self.listeners[key];
      listener.element.removeEventListener(listener.event, listener.fn);
      delete self.listeners[key];
    });
  };

  KeyCommandController.prototype.enable = function () {
    var self = this;
    // clear all listeners to ensure that we can never add multiple listeners
    // for the same events
    self.disable();
    function addListener(element, event, fn) {
      if (!self.listeners[event]) {
        self.listeners[event] = {
          element: element,
          event: event,
          fn: fn.bind(self)
        };
        element.addEventListener(event, self.listeners[event].fn, false);
      }
    }
    addListener(window, 'keydown', self.onKeyDown);
    addListener(window, 'keyup', self.onKeyUp);
    self.enabled = true;
  };

  /**
   * @see http://api.jquery.com/event.which/
   * @param evt
   */
  KeyCommandController.prototype.keydown = function (evt) {
    var me = this;
    me.pressed.indexOf(evt.keyCode);
    // check the default command set
    Object.keys(me.sets.default).forEach(function (command) {
      var active = command.keys.reduce(function (last, key) {
        if (me.pressed.indexOf(key) > -1) {
          last = last === null ? true : last;
        }
        return last;
      }, null);
      console.info('check default command');
    });
    // check the current command set
    Object.keys(me.sets[me.current]).forEach(function (command) {
      console.info('check command');
    });
    me.dispatchEvent({'type': 'keyup', keyCode: evt.keyCode});
  };

  KeyCommandController.prototype.keyup = function (evt) {
    var i = this.pressed.indexOf(evt.keyCode);
    if (i > -1) {
      this.pressed.slice(i, i+1);
    }
    this.dispatchEvent({'type': 'keyup', keyCode: evt.keyCode});
  };

  /**
   * Register key event callback.
   * @param {String} command Key command
   * @param {Function} callback Callback
   * @param {String} commandSet Name of command set. Defaults to 'default'
   */
  KeyCommandController.prototype.register = function (command, callback, commandSet) {
    commandSet = commandSet || 'default';
    // create the set if it doesn't already exist
    if (!this.sets.hasOwnProperty(commandSet)) {
      this.sets[commandSet] = [];
    }
    // TODO transform English key descriptions into keycodes
    var keycodes = [];
    this.sets[commandSet].push({keys: keycodes, fn: callback});
    throw new Error('not implemented');
  };

  return KeyCommandController;

}());
;

FOUR.PathPlanner = (function () {

    /**
     * Camera path navigation utilities.
     * @param {Object} config Configuration
     * @constructor
     */
    function PathPlanner (config) {
        config = config || {};
        var self = this;
        self.PLANNING_STRATEGY = {
            GENETIC: 0,
            SIMULATED_ANNEALING: 1
        };
        this.strategy = self.PLANNING_STRATEGY.SIMULATED_ANNEALING;
        this.workersPath = '/';
        Object.keys(config).forEach(function (key) {
            self[key] = config[key];
        });
    }

    /**
     * Generate tour sequence for a collection of features.
     * @param {Array} features Features
     * @returns {Promise}
     */
    PathPlanner.prototype.generateTourSequence = function (features) {
        var self = this;
        if (this.strategy === this.PLANNING_STRATEGY.GENETIC) {
            return new Promise(function (resolve, reject) {
                try {
                    var worker = new Worker(self.workersPath + 'GeneticPlanner.js');
                    worker.onmessage = function (e) {
                        resolve(e.data);
                    };
                    worker.postMessage({cmd:'run', itinerary:features, generations:500, populationSize:50});
                } catch (err) {
                    reject(err);
                }
            });
        } else if (this.strategy === this.PLANNING_STRATEGY.SIMULATED_ANNEALING) {
            return new Promise(function (resolve, reject) {
                try {
                    var worker = new Worker(self.workersPath + 'SimulatedAnnealer.js');
                    worker.onmessage = function (e) {
                        resolve(e.data);
                    };
                    worker.postMessage({cmd:'run', array:features, initialTemperature:10000, coolingRate:0.00001});
                } catch (err) {
                    reject(err);
                }
            });
        }
    };

    /**
     * Set the planning strategy.
     * @param strategy
     */
    PathPlanner.prototype.setStrategy = function (strategy) {
        this.strategy = strategy;
    };

    return PathPlanner;

}());
;

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

    Scene.prototype.getModelLayerObject = function (name) {
        return this.getLayerObject('model', name);
    };

    /**
     * Get model objects.
     * @returns {Array} List of model objects.
     */
    Scene.prototype.getModelObjects = function () {
        function getChildren (obj) {
            var children = [];
            if (obj.children && obj.children.length > 0) {
                obj.children.forEach(function (child) {
                    children.push(child);
                    getChildren(child).forEach(function (obj) {
                        children.push(obj);
                    });
                });
            }
            return children;
        }
        return getChildren(this.model);
    };

    return Scene;

}());;

/**
 * Camera view object and object element index. The index supports search for
 * object and object element selection. The indexer can accept a function to
 * enable indexing of arbitrary element properties.
 */
FOUR.SceneIndex = (function () {

  /**
   * SceneIndex constructor.
   * @param {Object} config Configuration
   * @constructor
   */
  function SceneIndex(config) {
    THREE.EventDispatcher.call(this);
    config = config || {};
    var self = this;

    self.SELECTION_STRATEGY = {
      CONTAINED: 0,
      CROSSING: 1
    };

    self.filter = null;
    self.filters = {
      all: self.selectAll,
      nearest: self.selectNearest,
      objects: self.selectObjects,
      points: self.selectPoints
    };
    self.frustum = new THREE.Frustum();
    self.scene = config.scene;
    self.sceneIndex = new SpatialHash();
    self.viewIndex = new SpatialHash();
    self.viewport = config.viewport;

    Object.keys(config).forEach(function (key) {
      self[key] = config[key];
    });
  }

  SceneIndex.prototype = Object.create(THREE.EventDispatcher.prototype);

  SceneIndex.prototype.constructor = SceneIndex;

  /**
   * Clear the index.
   */
  SceneIndex.prototype.clear = function () {
    this.index.clear();
  };

  SceneIndex.prototype.disable = function () {
    var self = this;
    self.enabled = false;
    self.hideMarquee();
    Object.keys(self.listeners).forEach(function (key) {
      var listener = self.listeners[key];
      listener.element.removeEventListener(listener.event, listener.fn);
    });
  };

  SceneIndex.prototype.enable = function () {
    var self = this;
    self.camera = self.viewport.getCamera();
    function addListener(element, event, fn) {
      self.listeners[event] = {
        element: element,
        event: event,
        fn: fn.bind(self)
      };
      element.addEventListener(event, self.listeners[event].fn, false);
    }

    addListener(window, 'resize', self.onWindowResize);
    self.buildIndex();
  };

  /**
   * Get all entities within the rectangle defined by P1 and P2.
   * @param {THREE.Vector2} p1 Screen position
   * @param {THREE.Vector2} p2 Screen position
   * @param {FOUR.SceneIndex.SELECTION_STRATEGY} strategy
   */
  SceneIndex.prototype.get = function (p1, p2, strategy) {
    throw new Error('not implemented');
  };

  /**
   * Get screen entities within a specified radius from the screen position.
   * @param {Object} pos Screen position
   * @param {Number} radius Radius from point
   * @returns {Array} List of scene objects.
   */
  SceneIndex.prototype.getNear = function (pos, radius) {
    throw new Error('not implemented');
  };

  /**
   * Get the entity nearest to the screen position.
   * @param {Object} pos Screen position
   * @returns {Object}
   */
  SceneIndex.prototype.getNearest = function (pos, radius) {
    throw new Error('not implemented');
  };

  /**
   * Build 3D and 2D indicies for the objects that are contained within the
   * camera frustum.
   * @param {THREE.Camera} camera Camera
   * @param {Array} objs Scene objects
   */
  SceneIndex.prototype.index = function (camera, objs) {
    // TODO perform indexing in a worker
    var matrix, objects = 0, points = 0, self = this;
    // clear the current index
    self.index.clear();
    // build a frustum for the current camera view
    matrix = new THREE.Matrix4().multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
    self.frustum.setFromMatrix(matrix);
    // traverse the scene and add all entities within the frustum to the index
    objs.forEach(function (child) {
      if (child.matrixWorldNeedsUpdate) {
        child.updateMatrixWorld();
      }
      if (child.geometry && self.frustum.intersectsObject(child)) {
        objects += 1;
        // switch indexing strategy depending on the type of scene object
        if (child instanceof THREE.Points) {
          points += self.indexPointsVertices(child);
        } else if (child instanceof THREE.Object3D) {
          points += self.indexObject3DVertices(child);
        }
      }
    });
    console.info('Added %s objects, %s points to the view index', objects, points);
    self.dispatchEvent({type:FOUR.EVENT.UPDATE});
  };

  /**
   * Index the THREE.Object3D by its vertices.
   * @param {THREE.Object3D} obj Scene object
   */
  SceneIndex.prototype.indexObject3DScreenCoordinates = function (obj) {
    var height, maxX = 0, maxY = 0,
      minX = this.viewport.domElement.clientWidth,
      minY = this.viewport.domElement.clientHeight,
      p, self = this, width, x, y;
    if (obj.matrixWorldNeedsUpdate) {
      obj.updateMatrixWorld();
    }
    // project the object vertices into the screen space, then find the screen
    // space bounding box for the scene object
    obj.geometry.vertices.forEach(function (vertex) {
      p = vertex.clone();
      p.applyMatrix4(obj.matrixWorld); // absolute position of vertex
      p = FOUR.utils.getVertexScreenCoordinates(p, self.camera, self.viewport.domElement.clientWidth, self.viewport.domElement.clientHeight);
      maxX = p.x > maxX ? p.x : maxX;
      maxY = p.y > maxY ? p.y : maxY;
      minX = p.x < minX ? p.x : minX;
      minY = p.y < minY ? p.y : minY;
    });
    height = (maxY - minY) > 0 ? maxY - minY : 0;
    width = (maxX - minX) > 0 ? maxX - minX : 0;
    x = minX >= 0 ? minX : 0;
    y = minY >= 0 ? minY : 0;
    // add the object screen bounding box to the index
    self.viewIndex.insert(
      obj.uuid.slice() + ',-1',
      new THREE.Box3(new THREE.Vector3(x, y, 0), new THREE.Box3(x + width, y + height, 0))
    );
  };

  /**
   * Insert the object into the scene index.
   * @param {THREE.Object3D} obj Scene object
   */
  SceneIndex.prototype.indexObject3DVertices = function (obj) {
    if (obj.matrixWorldNeedsUpdate) {
      obj.updateMatrixWorld();
    }
    obj.computeBoundingBox();
    this.sceneIndex.insert(obj.uuid.slice() + ',-1', obj.geometry.boundingBox);
  };

  SceneIndex.prototype.indexPointsVertices = function (obj, index) {
    var i, p, self = this, total = 0, vertex;
    for (i = 0; i < obj.geometry.vertices.length; i++) {
      total += 1;
      vertex = obj.geometry.vertices[i];
      p = FOUR.utils.getObjectScreenCoordinates(vertex, self.camera, self.viewport.domElement.clientWidth, self.viewport.domElement.clientHeight);
      if (p.x >= 0 && p.y >= 0) {
        index.push({uuid:obj.uuid.slice(), x:Number(p.x), y:Number(p.y), width:0, height:0, index:i, type:'THREE.Points'});
        console.info({uuid:obj.uuid.slice(), x:Number(p.x), y:Number(p.y), width:0, height:0, index:i, type:'THREE.Points'});
      }
    }
    return total;
  };

  SceneIndex.prototype.selectAll = function () {};

  SceneIndex.prototype.selectNearest = function () {};

  SceneIndex.prototype.selectObjects = function () {};

  SceneIndex.prototype.selectPoints = function () {};

  return SceneIndex;

}());
;

FOUR.TargetCamera = (function () {

    /**
     * The camera has a default position of 0,-1,0, a default target of 0,0,0 and
     * distance of 1.
     * @todo setters to intercept changes on position, target, distance properties
     * @todo setters to intercept changes on THREE.Camera properties
     */
    function TargetCamera (fov, aspect, near, far) {
        THREE.PerspectiveCamera.call(this);
        var self = this;

        self.MAXIMUM_DISTANCE = far < 10000 ? far : 10000;
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

        // set defaults
        self.lookAt(self.target);
    }

    TargetCamera.prototype = Object.create(THREE.PerspectiveCamera.prototype);

    //TargetCamera.prototype.constructor = TargetCamera;

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
     * @param {Boolean} animate Animate the change
     * @returns {Promise}
     */
    TargetCamera.prototype.resetOrientation = function (animate) {
        var self = this, up = new THREE.Vector3(0,0,1);
        animate = animate || false;
        if (animate) {
            return self.tweenToOrientation(up);
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
            self.dispatchEvent({type:FOUR.EVENT.UPDATE});
            return Promise.resolve();
        }
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
        // FIXME use quaternions!!
        // FIXME update this to set the target, rotate the camera toward it or just rotate the camera
        var offset, self = this;
        animate = animate || false;
        // direction from camera to new look at position
        offset = new THREE.Vector3().subVectors(lookAt, self.position);
        offset.setLength(self.distance);
        var target = new THREE.Vector3().addVectors(self.position, offset);
        if (animate) {
            return self.tweenToPosition(self.position, target);
        } else {

        }
    };

    /**
     * Move the camera to the specified position. Update the camera target.
     * Maintain the current distance.
     * @param {THREE.Vector3} position Position
     * @param {Boolean} animate Animate the change
     * @returns {Promise}
     */
    TargetCamera.prototype.setPosition = function (position, animate) {
        animate = animate || false;
        var offset = this.getOffset(), self = this;
        var target = new THREE.Vector3().addVectors(offset, position);
        if (animate) {
            return self.tweenToPosition(position, target);
        } else {
            self.position.copy(position);
            self.target.copy(target);
            self.dispatchEvent({type:FOUR.EVENT.UPDATE});
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
        animate = animate || false;
        var offset = this.getOffset().negate(), self = this;
        var position = new THREE.Vector3().addVectors(offset, target);
        if (animate) {
            return self.tweenToPosition(position, target);
        } else {
            self.position.copy(position);
            self.target.copy(target);
            self.dispatchEvent({type:FOUR.EVENT.UPDATE});
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
        self.dispatchEvent({type:FOUR.EVENT.UPDATE});
        if (animate) {
            return Promise.resolve();
        } else {
            self.dispatchEvent({type:FOUR.EVENT.UPDATE});
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
        var center = bbox.getCenter(), direction = new THREE.Vector3(),
            distance, position, radius = bbox.getRadius(), rotation,
            self = this, target;
        animate = animate || false;
        // new camera position, target, direction, orientation
        position = new THREE.Vector3().copy(center);
        target = new THREE.Vector3().copy(center);
        distance = radius / Math.tan(Math.PI * self.fov / 360);
        // reorient the camera relative to the bounding box
        if (orientation === self.VIEWS.TOP) {
            position.z = center.z + distance;
            rotation = new THREE.Quaternion().setFromEuler(new THREE.Euler(0,0,0));
            direction.set(0,0,-1);
        }
        else if (orientation === self.VIEWS.FRONT) {
            position.y = center.y - distance;
            rotation = new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.PI / 2, 0, 0));
            direction.set(0,-1,0);
        }
        else if (orientation === self.VIEWS.BACK) {
            position.y = center.y + distance;
            rotation = new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.PI / 2, Math.PI, 0));
            direction.set(0,1,0);
        }
        else if (orientation === self.VIEWS.RIGHT) {
            position.x = center.x + distance;
            rotation = new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.PI / 2, Math.PI / 2, 0));
            direction.set(-1,0,0);
        }
        else if (orientation === self.VIEWS.LEFT) {
            position.x = center.x - distance;
            rotation = new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.PI / 2, Math.PI * 1.5, 0));
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
            return self.tweenToPosition(position, target, rotation);
        } else {
            self.position.copy(position);
            self.target.copy(target);
            self.lookAt(self.target);
            self.distance = new THREE.Vector3().subVectors(self.position, self.target).length();
            self.dispatchEvent({type:FOUR.EVENT.UPDATE});
            return Promise.resolve();
        }
    };

    /**
     * Tween camera up orientation. This function will emit a continuous-update
     * event that is intended to signal the viewport to both continuously
     * render the camera view and tween the camera position. You must create an
     * event handler that listens for this event from the camera and then adds
     * and removes a render task from the viewport. The render task is
     * identified by the event id.
     * @param {THREE.Euler} orientation
     * @returns {Promise}
     */
    TargetCamera.prototype.tweenToOrientation = function (orientation) {
        var self = this;
        return new Promise(function (resolve) {
            var start = { x: self.up.x, y: self.up.y, z: self.up.z };
            var finish = { x: orientation.x, y: orientation.y, z: orientation.z };
            var tween = new TWEEN.Tween(start).to(finish, 1000);
            var taskId = THREE.Math.generateUUID();
            tween.easing(TWEEN.Easing.Cubic.InOut);
            tween.onComplete(function () {
                self.up.set(this.x, this.y, this.z);
                self.dispatchEvent({type:FOUR.EVENT.UPDATE});
                self.dispatchEvent({type:FOUR.EVENT.CONTINUOUS_UPDATE_END, id:taskId, task:'tween-to-orientation'});
                resolve();
            });
            tween.onUpdate(function () {
                self.up.set(this.x, this.y, this.z);
                self.dispatchEvent({type:FOUR.EVENT.UPDATE});
            });
            tween.start();
            self.dispatchEvent({type:FOUR.EVENT.CONTINUOUS_UPDATE_START, id:taskId, task:'tween-to-orientation'});
        });
    };

    /**
     * Tween the camera to the specified position.  This function will emit a
     * continuous-update event that is intended to signal the viewport to both
     * continuously render the camera view and tween the camera position. You
     * must create an event handler that listens for this event from the camera
     * and then adds and removes a render task from the viewport. The render
     * task is identified by the event id.
     * @param {THREE.Vector3} position Camera position
     * @param {THREE.Vector3} target Target position
     * @param {THREE.Quaternion} rotation Camera rotation
     * @returns {Promise}
     */
    TargetCamera.prototype.tweenToPosition = function (position, target, rotation) {
        var q1, q2, self = this;
        return new Promise(function (resolve) {
            // start and end tween values
            var start = {
                i: 0,
                x: self.position.x, y: self.position.y, z: self.position.z,
                tx: self.target.x, ty: self.target.y, tz: self.target.z
            };
            var finish = {
                i: 1,
                x: position.x, y: position.y, z: position.z,
                tx: target.x, ty: target.y, tz: target.z
            };
            // start/end rotation values
            if (rotation) {
                q1 = new THREE.Quaternion().copy(self.quaternion).normalize();
                q2 = rotation.normalize();
            }
            // TODO calculate the animation duration
            var cameraDistance = new THREE.Vector3().subVectors(self.position, position).length;
            var targetDistance = new THREE.Vector3().subVectors(self.target, target).length();
            var distance = cameraDistance > targetDistance ? cameraDistance : targetDistance;
            // execute animation
            var taskId = THREE.Math.generateUUID();
            var tween = new TWEEN.Tween(start).to(finish, 1500);
            tween.easing(TWEEN.Easing.Cubic.InOut);
            tween.onComplete(function () {
                var d = this;
                self.position.set(d.x, d.y, d.z);
                self.target.set(d.tx, d.ty, d.tz);
                if (rotation) {
                    THREE.Quaternion.slerp(q1, q2, self.quaternion, d.i);
                } else {
                    self.lookAt(self.target);
                }
                self.distance = new THREE.Vector3().subVectors(self.position, self.target).length();
                self.dispatchEvent({type:FOUR.EVENT.UPDATE, id:taskId});
                self.dispatchEvent({type:FOUR.EVENT.CONTINUOUS_UPDATE_END, id:taskId, task:'tween-to-position'});
                resolve();
            });
            tween.onUpdate(function () {
                var d = this;
                self.position.set(d.x, d.y, d.z);
                self.target.set(d.tx, d.ty, d.tz);
                if (rotation) {
                    THREE.Quaternion.slerp(q1, q2, self.quaternion, d.i);
                } else {
                    self.lookAt(self.target);
                }
                self.distance = new THREE.Vector3().subVectors(self.position, self.target).length();
                self.dispatchEvent({type:FOUR.EVENT.UPDATE});
            });
            tween.start();
            self.dispatchEvent({type:FOUR.EVENT.CONTINUOUS_UPDATE_START, id:taskId, task:'tween-to-position'});
        });
    };

    /**
     * Zoom in incrementally.
     * @param {Boolean} animate Animate the change
     * @returns {Promise}
     */
    TargetCamera.prototype.zoomIn = function (animate) {
        animate = animate || false;
        var distance = this.getDistance() / this.ZOOM_FACTOR, self = this;
        // ensure that the distance is never less than the minimum
        distance = distance <= this.MINIMUM_DISTANCE ? this.MINIMUM_DISTANCE : distance;
        return self.setDistance(distance, animate);
    };

    /**
     * Zoom out incrementally.
     * @param {Boolean} animate Animate the change
     * @returns {Promise}
     */
    TargetCamera.prototype.zoomOut = function (animate) {
        animate = animate || false;
        var distance = this.getDistance() * this.ZOOM_FACTOR, self = this;
        // ensure that the distance is never greater than the maximum
        distance = distance >= this.MAXIMUM_DISTANCE ? this.MAXIMUM_DISTANCE : distance;
        return self.setDistance(distance, animate);
    };

    /**
     * Zoom to fit the bounding box.
     * @param {BoundingBox} bbox Bounding box
     * @param {Boolean} animate Animate the change
     * @returns {Promise}
     */
    TargetCamera.prototype.zoomToFit = function (bbox, animate) {
        animate = animate || false;
        var distance, self = this;
        // get the distance required to fit all entities within the view
        distance = bbox.getRadius() / Math.tan(Math.PI * self.fov / 360);
        // move the camera to the new position
        return self.setTarget(bbox.getCenter(), animate).then(function () {
            return self.setDistance(distance, animate);
        });
    };

    return TargetCamera;

}());
;

/* jshint -W069 */
/* jshint -W117 */
/**
 * Translate, rotate, scale controller. This controller is a reimplementation of the
 * THREE.TransformController.
 * @author arodic / https://github.com/arodic
 * @see http://threejs.org/examples/misc_controls_transform.html
 */
FOUR.TransformController = (function () {


  var GizmoMaterial = function (parameters) {
    THREE.MeshBasicMaterial.call(this);

    this.depthTest = false;
    this.depthWrite = false;
    this.side = THREE.FrontSide;
    this.transparent = true;
    this.setValues(parameters);

    this.oldColor = this.color.clone();
    this.oldOpacity = this.opacity;

    this.highlight = function (highlighted) {
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

  var TransformControls = function (camera, domElement) {
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

  };

  TransformControls.prototype = Object.create(THREE.Object3D.prototype);
  TransformControls.prototype.constructor = THREE.TransformControls;

  return TransformControls;

}());
;

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

    self.backgroundColor = config.backgroundColor || new THREE.Color(0x000, 1.0);
    self.camera = config.camera;
    self.clock = new THREE.Clock();
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
    self.tasks = [];

    // add the viewport to the DOM
    self.domElement.appendChild(self.renderer.domElement);

    // listen for events
    self.domElement.addEventListener('contextmenu', self.onContextMenu.bind(self));
    self.scene.addEventListener(FOUR.EVENT.UPDATE, self.render.bind(self), false);
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
   * Disable interactions with the viewport.
   */
  Viewport3D.prototype.disable = function () {
    if (this.controller) {
      this.controller.disable();
    }
  };

  /**
   * Clear all rendering tasks.
   */
  Viewport3D.prototype.clearTasks = function () {
    this.tasks.length = 0;
  };

  /**
   * Enable interactions with the viewport.
   */
  Viewport3D.prototype.enable = function () {
    if (this.controller) {
      this.controller.enable();
    }
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
   * Remove rendering task.
   * @param {Object} event
   */
  Viewport3D.prototype.onContinuousUpdateEnd = function (event) {
    console.info('render task end', event);
    event.id = event.id || 'anonymous';
    // remove the first task found with a matching id value
    for (var i = this.tasks.length - 1; i >= 0; i--) {
      if (this.tasks[i].id === event.id) {
        this.tasks.splice(i,1);
        return;
      }
    }
  };

  /**
   * Create new rendering task, start rendering and updating controller states
   * continuously. We currently keep track of
   * @param {Object} event
   */
  Viewport3D.prototype.onContinuousUpdateStart = function (event) {
    console.info('render task start', event);
    this.tasks.push({id:event.id || 'anonymous', task:event.task||null});
    this.update();
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
    this.renderer.render(this.scene, this.camera);
  };

  /**
   * Set the active viewport controller.
   * @param {String} name Controller name
   */
  Viewport3D.prototype.setActiveController = function (name) {
    // TODO need to enable/disable the controller event listeners as we do with navigation
    if (this.controller) {
      this.controller.disable();
      this.controller.removeEventListener(this.render);
    }
    console.info('Set active viewport controller to', name);
    this.controller = this.controllers[name];
    this.controller.addEventListener(FOUR.EVENT.UPDATE, this.render.bind(this), false);
    this.controller.addEventListener(FOUR.EVENT.CONTINUOUS_UPDATE_START, this.onContinuousUpdateStart.bind(this), false);
    this.controller.addEventListener(FOUR.EVENT.CONTINUOUS_UPDATE_END, this.onContinuousUpdateEnd.bind(this), false);
    this.controller.enable();
    this.dispatchEvent({type:FOUR.EVENT.CONTROLLER_CHANGE});
  };

  /**
   * Set viewport background color.
   * @param {THREE.Color} color Color
   */
  Viewport3D.prototype.setBackgroundColor = function (color) {
    this.background = color;
    this.renderer.setClearColor(this.backgroundColor);
    this.dispatchEvent({type:FOUR.EVENT.BACKGROUND_CHANGE});
    this.render();
  };

  /**
   * Set the viewport camera.
   * @param {THREE.Camera} camera Camera
   */
  Viewport3D.prototype.setCamera = function (camera) {
    this.camera = camera;
    this.camera.aspect = this.domElement.clientWidth / this.domElement.clientHeight;
    this.camera.updateProjectionMatrix();
    this.dispatchEvent({type:FOUR.EVENT.CAMERA_CHANGE});
    this.render();
  };

  /**
   * Update the controller and global tween state.
   * @param {Boolean} force Force update
   */
  Viewport3D.prototype.update = function (force) {
    if (this.tasks.length > 0 || (typeof force === 'boolean' && force)) {
      this.updateOnce();
      requestAnimationFrame(this.update.bind(this));
    }
  };

  /**
   * Update controller state once.
   */
  Viewport3D.prototype.updateOnce = function () {
    TWEEN.update();
    if (this.controller) {
      this.delta = this.clock.getDelta();
      this.controller.update(this.delta);
    }
  };

  return Viewport3D;

}());
;

FOUR.Overlay = (function () {

    /**
     * Scene overlay manager. Handles creation and positioning of scene overlay
     * labels.
     */
    function Overlay (config) {
        THREE.EventDispatcher.call(this);

        var self = this;

        // overlay positioning strategy
        self.POSITION = {
            CENTER: 0,
            TOP: 1,
            BOTTOM: 2,
            LEFT: 3,
            RIGHT: 4,
            FIXED: 6
        };

        self.domElement = config.domElement || config.viewport.domElement;
        self.elements = {};
        self.enabled = false;
        self.listeners = {};
        self.viewport = config.viewport;

        Object.keys(config).forEach(function (key) {
            self[key] = config[key];
        });
    }

    Overlay.prototype = Object.create(THREE.EventDispatcher.prototype);

    /**
     * Add overlay element.
     * @param {Object} config Configuration
     *
     * {
     *   position: self.POSITION.CENTER,
     *   innerHTML: '<h1>Title</h1><p>Content</p>',
     *   target: [scene entity UUID],
     *   index: [scene entity index if tracking a point]
     * }
     *
     */
    Overlay.prototype.add = function (config) {
        // generate a random ID
        config.id = 'overlay-' + Date.now();
        config.element = document.createElement('div');
        config.element.className = config.className || 'label';
        config.element.id = config.id;
        config.element.innerHTML = config.innerHTML;

        this.domElement.appendChild(config.element);
        this.elements[config.id] = config;
        this.update();
        return config;
    };

    /**
     * Remove all overlay elements.
     */
    Overlay.prototype.clear = function () {
        var self = this;
        Object.keys(this.elements).forEach(function (id) {
            self.remove(id);
        });
    };

    /**
     * Disable the controller.
     */
    Overlay.prototype.disable = function () {
        var self = this;
        self.enabled = false;
        Object.keys(self.listeners).forEach(function (key) {
            var listener = self.listeners[key];
            listener.element.removeEventListener(listener.event, listener.fn);
        });
    };

    /**
     * Enable the controller.
     */
    Overlay.prototype.enable = function () {
        var self = this;
        self.enabled = true;
    };

    Overlay.prototype.onMouseMove = function (event) {};

    Overlay.prototype.onMouseOver = function (event) {};

    Overlay.prototype.onMouseUp = function (event) {};

    /**
     * Remove overlay element.
     * @param {String} id Identifier
     */
    Overlay.prototype.remove = function (id) {
        var el = document.getElementById(id);
        this.domElement.removeChild(el);
        delete this.elements[id];
    };

    /**
     * Update the position of overlay elements.
     */
    Overlay.prototype.update = function () {
        var dummy, el, obj, offset, screen, self = this;
        var camera = this.viewport.getCamera();
        var scene = this.viewport.getScene();
        // compute the screen coordinates of the target
        Object.keys(this.elements).forEach(function (key) {
            el = self.elements[key];
            if (el.position !== self.POSITION.FIXED) {
                offset = el.offset || 0;
                if (el.target instanceof THREE.Vector3) {
                    dummy = new THREE.Object3D();
                    dummy.position.copy(el.target);
                } else {
                    obj = scene.getObjectByProperty('uuid', el.target);
                    if (el.index) {} // point elements
                    if (obj instanceof THREE.Line) {
                        obj.geometry.computeBoundingSphere();
                        dummy = new THREE.Object3D();
                        dummy.position.copy(obj.geometry.boundingSphere.center);
                    } else {
                        dummy = obj;
                    }
                }
                screen = FOUR.utils.getObjectScreenCoordinates(
                  dummy,
                  camera,
                  self.viewport.domElement.clientWidth,
                  self.viewport.domElement.clientHeight);
                el.element.style.left = (screen.x + offset) + 'px';
                el.element.style.top = (screen.y + offset) + 'px';
            } else {
                el.element.style.left = (el.left + offset) + 'px';
                el.element.style.top = (el.top + offset) + 'px';
            }
        });

        // TODO float the markers as required to ensure they are all visible
    };

    return Overlay;

}());
;

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
;

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
                self.dispatchEvent({type:FOUR.EVENT.UPDATE, view:view, direction:new THREE.Euler(Math.PI / 2, Math.PI, 0)});
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
;

/**
 * Arrow key controller is used to translate the camera along the orthogonal
 * axes relative to the camera direction. CTRL+ALT+Arrow key is used to rotate
 * camera view around the current position.
 */
FOUR.ArrowController = (function () {

  function ArrowController(config) {
    THREE.EventDispatcher.call(this);
    config = config || {};
    var self = this;

    self.KEY = {
      ALT: 18,
      CTRL: 17,
      SHIFT: 16, // FIXME is this one used??
      MOVE_FORWARD: 38,
      MOVE_LEFT: 37,
      MOVE_BACK: 40,
      MOVE_RIGHT: 39,
      MOVE_UP: 221,
      MOVE_DOWN: 219,
      ROTATE_LEFT: -1,
      ROTATE_RIGHT: -1
    };

    self.camera = config.camera || config.viewport.camera;
    self.enabled = false;
    self.listeners = {};
    self.modifiers = {};
    self.move = {
      forward: false,
      backward: false,
      left: false,
      right: false,
      up: false,
      down: false
    };
    self.movementSpeed = 5.0;
    self.tasks = {};
    self.temp = {};
    self.viewport = config.viewport;

    Object.keys(config).forEach(function (key) {
      self[key] = config[key];
    });
  }

  ArrowController.prototype = Object.create(THREE.EventDispatcher.prototype);

  ArrowController.prototype.constructor = ArrowController;

  ArrowController.prototype.disable = function () {
    var self = this;
    self.enabled = false;
    Object.keys(self.listeners).forEach(function (key) {
      var listener = self.listeners[key];
      listener.element.removeEventListener(listener.event, listener.fn);
      delete self.listeners[key];
    });
  };

  ArrowController.prototype.enable = function () {
    var self = this;
    // clear all listeners to ensure that we can never add multiple listeners
    // for the same events
    self.disable();
    function addListener(element, event, fn) {
      if (!self.listeners[event]) {
        self.listeners[event] = {
          element: element,
          event: event,
          fn: fn.bind(self)
        };
        element.addEventListener(event, self.listeners[event].fn, false);
      }
    }

    addListener(window, 'keydown', self.onKeyDown);
    addListener(window, 'keyup', self.onKeyUp);
    self.enabled = true;
  };

  /**
   * Handle key down event.
   * @param event
   */
  ArrowController.prototype.onKeyDown = function (event) {
    if (!this.enabled) {
      return;
    }
    switch (event.keyCode) {
      case this.KEY.CTRL:
        this.modifiers[this.KEY.CTRL] = true;
        break;
      case this.KEY.MOVE_TO_EYE_HEIGHT:
        this.setWalkHeight();
        this.dispatchEvent({type: FOUR.EVENT.CONTINUOUS_UPDATE_START, id:'move', task: 'arrow-move-to-eye-height'});
        break;
      case this.KEY.MOVE_FORWARD:
        if (!this.move.forward) {
          this.move.forward = true;
          this.dispatchEvent({type: FOUR.EVENT.CONTINUOUS_UPDATE_START, id:'move', task: 'arrow-move-forward'});
          return false;
        }
        break;
      case this.KEY.MOVE_BACK:
        if (!this.move.backward) {
          this.move.backward = true;
          this.dispatchEvent({type: FOUR.EVENT.CONTINUOUS_UPDATE_START, id:'move', task: 'arrow-move-back'});
          return false;
        }
        break;
      case this.KEY.MOVE_LEFT:
        if (!this.move.left) {
          this.move.left = true;
          this.dispatchEvent({type: FOUR.EVENT.CONTINUOUS_UPDATE_START, id:'move', task: 'arrow-move-left'});
        }
        break;
      case this.KEY.MOVE_RIGHT:
        if (!this.move.right) {
          this.move.right = true;
          this.dispatchEvent({type: FOUR.EVENT.CONTINUOUS_UPDATE_START, id:'move', task: 'arrow-move-right'});
        }
        break;
      case this.KEY.MOVE_UP:
        if (!this.move.up) {
          this.move.up = true;
          this.dispatchEvent({type: FOUR.EVENT.CONTINUOUS_UPDATE_START, id:'move', task: 'arrow-move-up'});
        }
        break;
      case this.KEY.MOVE_DOWN:
        if (!this.move.down) {
          this.move.down = true;
          this.dispatchEvent({type: FOUR.EVENT.CONTINUOUS_UPDATE_START, id:'move', task: 'arrow-move-down'});
        }
        break;
    }
  };

  /**
   * Handle key up event.
   * @param event
   */
  ArrowController.prototype.onKeyUp = function (event) {
    switch (event.keyCode) {
      case this.KEY.CTRL:
        this.modifiers[this.KEY.CTRL] = false;
        break;
      case this.KEY.MOVE_FORWARD:
        if (this.move.forward) {
          this.move.forward = false;
          this.dispatchEvent({type: FOUR.EVENT.CONTINUOUS_UPDATE_END, id:'move'});
          return false;
        }
        break;
      case this.KEY.MOVE_BACK:
        if (this.move.backward) {
          this.move.backward = false;
          this.dispatchEvent({type: FOUR.EVENT.CONTINUOUS_UPDATE_END, id:'move'});
          return false;
        }
        break;
      case this.KEY.MOVE_LEFT:
        if (this.move.left) {
          this.move.left = false;
          this.dispatchEvent({type: FOUR.EVENT.CONTINUOUS_UPDATE_END, id:'move'});
        }
        break;
      case this.KEY.MOVE_RIGHT:
        if (this.move.right) {
          this.move.right = false;
          this.dispatchEvent({type: FOUR.EVENT.CONTINUOUS_UPDATE_END, id:'move'});
        }
        break;
      case this.KEY.MOVE_UP:
        if (this.move.up) {
          this.move.up = false;
          this.dispatchEvent({type: FOUR.EVENT.CONTINUOUS_UPDATE_END, id:'move'});
        }
        break;
      case this.KEY.MOVE_DOWN:
        if (this.move.down) {
          this.move.down = false;
          this.dispatchEvent({type: FOUR.EVENT.CONTINUOUS_UPDATE_END, id:'move'});
        }
        break;
      case this.KEY.CANCEL:
        var self = this;
        Object.keys(this.move).forEach(function (key) {
          self.move[key] = false;
        });
        this.dispatchEvent({type: FOUR.EVENT.CONTINUOUS_UPDATE_END, id:'move'});
        break;
    }
  };

  /**
   * Update the controller and camera state.
   * @param delta
   */
  ArrowController.prototype.update = function (delta) {
    if (!this.enabled) {
      return;
    }
    this.temp.change = false;
    this.temp.distance = delta * this.movementSpeed;
    this.temp.offset = new THREE.Vector3().subVectors(this.camera.position, this.camera.target);
    this.temp.offset.setLength(this.temp.distance);
    this.temp.cross = new THREE.Vector3().crossVectors(this.temp.offset, this.camera.up);

    // translate the camera
    if (this.move.forward) {
      this.temp.offset.negate();
      this.temp.next = new THREE.Vector3().addVectors(this.camera.position, this.temp.offset);
      this.camera.position.copy(this.temp.next);
      this.temp.next = new THREE.Vector3().addVectors(this.camera.target, this.temp.offset);
      this.camera.target.copy(this.temp.next);
      this.temp.change = true;
    }
    if (this.move.backward) {
      this.temp.next = new THREE.Vector3().addVectors(this.camera.position, this.temp.offset);
      this.camera.position.copy(this.temp.next);
      this.temp.next = new THREE.Vector3().addVectors(this.camera.target, this.temp.offset);
      this.camera.target.copy(this.temp.next);
      this.temp.change = true;
    }
    if (this.move.right) {
      this.temp.cross.negate();
      this.temp.next = new THREE.Vector3().addVectors(this.camera.position, this.temp.cross);
      this.camera.position.copy(this.temp.next);
      this.temp.next = new THREE.Vector3().addVectors(this.camera.target, this.temp.cross);
      this.camera.target.copy(this.temp.next);
      this.temp.change = true;
    }
    if (this.move.left) {
      this.temp.next = new THREE.Vector3().addVectors(this.camera.position, this.temp.cross);
      this.camera.position.copy(this.temp.next);
      this.temp.next = new THREE.Vector3().addVectors(this.camera.target, this.temp.cross);
      this.camera.target.copy(this.temp.next);
      this.temp.change = true;
    }
    if (this.move.up) {
      this.temp.offset = new THREE.Vector3().copy(this.camera.up);
      this.temp.offset.setLength(this.temp.distance);
      this.temp.next = new THREE.Vector3().addVectors(this.camera.position, this.temp.offset);
      this.camera.position.copy(this.temp.next);
      this.temp.next = new THREE.Vector3().addVectors(this.camera.target, this.temp.offset);
      this.camera.target.copy(this.temp.next);
      this.temp.change = true;
    }
    if (this.move.down) {
      this.temp.offset = new THREE.Vector3().copy(this.camera.up).negate();
      this.temp.offset.setLength(this.temp.distance);
      this.temp.next = new THREE.Vector3().addVectors(this.camera.position, this.temp.offset);
      this.camera.position.copy(this.temp.next);
      this.temp.next = new THREE.Vector3().addVectors(this.camera.target, this.temp.offset);
      this.camera.target.copy(this.temp.next);
      this.temp.change = true;
    }
    if (this.temp.change) {
      this.dispatchEvent({type: FOUR.EVENT.UPDATE});
    }
  };

  return ArrowController;

}());
;

/**
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
			delete self.listeners[key];
		});
	};

	LookController.prototype.enable = function () {
		var self = this;
		// clear all listeners to ensure that we can never add multiple listeners
		// for the same events
		self.disable();
		function addListener(element, event, fn) {
			if (!self.listeners[event]) {
				self.listeners[event] = {
					element: element,
					event: event,
					fn: fn.bind(self)
				};
				element.addEventListener(event, self.listeners[event].fn, false);
			}
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
			this.dispatchEvent({type:FOUR.EVENT.UPDATE});
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
				this.dispatchEvent({type:FOUR.EVENT.UPDATE});
			}
		}
	};

	return LookController;

}());
;

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
            if (!self.listeners[name]) {
                self.listeners[name] = {
                    ctrl: ctrl,
                    event: event,
                    fn: fn.bind(self)
                };
                ctrl.addEventListener(event, self.listeners[name].fn, false);
            }
        }
        this.controllers[name] = controller;
        var events = [
            FOUR.EVENT.CONTINUOUS_UPDATE_END,
            FOUR.EVENT.CONTINUOUS_UPDATE_START,
            FOUR.EVENT.UPDATE
        ];
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
;

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
			delete self.listeners[key];
		});
	};

	OrbitController.prototype.enable = function () {
		var self = this;
		// clear all listeners to ensure that we can never add multiple listeners
		// for the same events
		self.disable();
		function addListener(element, event, fn) {
			if (!self.listeners[event]) {
				self.listeners[event] = {
					element: element,
					event: event,
					fn: fn.bind(self)
				};
				element.addEventListener(event, self.listeners[event].fn, false);
			}
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
			self.dispatchEvent({type:FOUR.EVENT.CONTINUOUS_UPDATE_START});
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
		self.dispatchEvent({type:FOUR.EVENT.CONTINUOUS_UPDATE_END});
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
		self.dispatchEvent({type:FOUR.EVENT.CONTINUOUS_UPDATE_START});
		self.dispatchEvent({type:FOUR.EVENT.CONTINUOUS_UPDATE_END});
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
			self.dispatchEvent({type:FOUR.EVENT.UPDATE});
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
;

FOUR.PanController = (function () {

    /**
     * Camera pan controller. Panning can be performed using the right mouse
     * button or the combination of a keypress, left mouse button down and
     * mouse move. This controller is a reimplementation of the
     * THREE.OrbitController.
     * @see http://threejs.org/examples/js/controls/OrbitControls.js
     */
    function PanController (config) {
        THREE.EventDispatcher.call(this);
        config = config || {};
        var self = this;

        self.CURSOR = {
            DEFAULT: 'default',
            PAN: 'all-scroll'
        };
        self.EPS = 0.000001;
        self.KEY = {
            CTRL: 17
        };
        self.MODES = {
            NONE: 0,
            PAN: 1,
            ROTATE: 2,
            ZOOM: 3
        };

        self.domElement = config.domElement || config.viewport.domElement;
        self.dynamicDampingFactor = 0.2;
        self.enabled = false;
        self.keydown = false;
        self.listeners = {};
        self.maxDistance = Infinity;
        self.minDistance = 1;
        self.mode = self.MODES.NONE;
        self.offset = new THREE.Vector3();
        self.pan = {
            delta: new THREE.Vector2(),
            end: new THREE.Vector2(),
            start: new THREE.Vector2()
        };
        self.panSpeed = 0.8;
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
            delete self.listeners[key];
        });
    };

    PanController.prototype.enable = function () {
        var self = this;
        // clear all listeners to ensure that we can never add multiple listeners
        // for the same events
        self.disable();
        function addListener(element, event, fn) {
            if (!self.listeners[event]) {
                self.listeners[event] = {
                    element: element,
                    event: event,
                    fn: fn.bind(self)
                };
                element.addEventListener(event, self.listeners[event].fn, false);
            }
        }
        addListener(self.domElement, 'mousedown', self.onMouseDown);
        addListener(self.domElement, 'mousemove', self.onMouseMove);
        addListener(self.domElement, 'mouseup', self.onMouseUp);
        self.enabled = true;
    };

    /**
     * Transform screen coordinates to normalized device coordinates (0,0 to 1,1).
     * @param {Number} x Screen X coordinate
     * @param {Number} y Screen Y coordinate
     * @param {Element} element DOM element
     * @returns {THREE.Vector2}
     */
    PanController.prototype.getNormalizedDeviceCoordinates = function (x, y, element) {
        var nx = (x - element.clientLeft) / element.clientWidth;
        var ny = (y - element.clientTop) / element.clientHeight;
        return new THREE.Vector2(nx, ny);
    };

    /**
     * Transform normalized device coordinates to world space coordinates for
     * the specified camera.
     * @param {THREE.Vector2} ndc Normalized device coordinates
     * @param {THREE.Camera} camera Camera
     * @returns {THREE.Vector3}
     */
    PanController.prototype.getWorldSpaceCoordinates = function (ndc, camera) {
        var mouse = new THREE.Vector3().set(-ndc.x * 2 - 1, ndc.y * 2 + 1, 0.5);
        return mouse.unproject(camera);
    };

    PanController.prototype.onMouseDown = function (event) {
        if (event.button === THREE.MOUSE.RIGHT) {
            this.domElement.style.cursor = this.CURSOR.PAN;
            this.mode = this.MODES.PAN;
            var ndc = this.getNormalizedDeviceCoordinates(event.offsetX, event.offsetY, this.domElement);
            this.pan.start.copy(ndc);
            this.pan.end.copy(ndc);
            this.dispatchEvent({type:FOUR.EVENT.CONTINUOUS_UPDATE_START});
            event.preventDefault();
        }
    };

    PanController.prototype.onMouseMove = function (event) {
        if (event.button === THREE.MOUSE.RIGHT) {
            var ndc = this.getNormalizedDeviceCoordinates(event.offsetX, event.offsetY, this.domElement);
            //console.info('ndc', ndc);
            this.pan.end.copy(ndc);
            event.preventDefault();
        }
    };

    PanController.prototype.onMouseUp = function (event) {
        if (this.mode === this.MODES.PAN) {
            this.domElement.style.cursor = this.CURSOR.DEFAULT;
            this.mode = this.MODES.NONE;
            this.pan.delta.set(0,0);
            this.dispatchEvent({type:FOUR.EVENT.CONTINUOUS_UPDATE_END});
            event.preventDefault();
        }
    };

    PanController.prototype.update = function () {
        if (this.enabled === false) {
            return;
        } else if (this.mode === this.MODES.PAN) {
            this.pan.delta.subVectors(this.pan.end, this.pan.start);
            if (this.pan.delta.lengthSq() > this.EPS) {
                var camera = this.viewport.getCamera();
                // transform screen coordinates to world space coordinates
                var start = this.getWorldSpaceCoordinates(this.pan.start, camera);
                var end = this.getWorldSpaceCoordinates(this.pan.end, camera);
                // translate world space coordinates to camera movement delta
                var delta = end.sub(start).multiplyScalar(camera.getDistance() * this.panSpeed);
                // add delta to camera position
                var position = new THREE.Vector3().addVectors(delta, camera.position);
                camera.setPosition(position, false);
                // consume the change
                this.pan.start.copy(this.pan.end);
                this.dispatchEvent({type:FOUR.EVENT.UPDATE});
            }
        }
    };

    return PanController;

}());
;

/**
 * Camera rotation controller. Rotation can be performed using the middle
 * mouse button or the combination of a keypress, left mouse button down and
 * mouse move. This controller is a reimplementation of the
 * THREE.OrbitController.
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
        self.KEY = {ALT: 18, CTRL: 17, SHIFT: 16};
        self.STATE = {NONE: -1, ROTATE: 0};

        self.camera = config.camera || config.viewport.camera;
        self.constraint = new OrbitConstraint(self.camera);
        self.domElement = config.domElement || config.viewport.domElement;
        self.enabled = false;
        self.enableKeys = true;
        self.enableRotate = true;
        self.modifiers = {};
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
            delete self.listeners[key];
        });
    };

    RotateController.prototype.enable = function () {
        var self = this;
        // clear all listeners to ensure that we can never add multiple listeners
        // for the same events
        self.disable();
        function addListener(element, event, fn) {
            if (!self.listeners[event]) {
                self.listeners[event] = {
                    element: element,
                    event: event,
                    fn: fn.bind(self)
                };
                element.addEventListener(event, self.listeners[event].fn, false);
            }
        }
        addListener(self.domElement, 'mousedown', self.onMouseDown);
        addListener(self.domElement, 'mousemove', self.onMouseMove);
        addListener(self.domElement, 'mouseup', self.onMouseUp);
        addListener(window, 'keydown', self.onKeyDown);
        addListener(window, 'keyup', self.onKeyUp);
        self.enabled = true;
    };

    RotateController.prototype.isActivated = function (event) {
        if (event.button === THREE.MOUSE.MIDDLE) {
            return true;
        } else if (this.modifiers[this.KEY.ALT] && this.modifiers[this.KEY.CTRL]) {
            return true;
        }
        return false;
    };

    RotateController.prototype.onKeyDown = function (event) {
        var self = this;
        Object.keys(self.KEY).forEach(function (key) {
            if (event.keyCode === self.KEY[key]) {
                self.modifiers[event.keyCode] = true;
            }
        });
    };

    RotateController.prototype.onKeyUp = function (event) {
        var self = this;
        Object.keys(self.KEY).forEach(function (key) {
            if (event.keyCode === self.KEY[key]) {
                self.modifiers[event.keyCode] = false;
            }
        });
    };

    RotateController.prototype.onMouseDown = function (event) {
        if (this.isActivated(event)) {
            console.info('rotate control active');
            this.state = this.STATE.ROTATE;
            this.domElement.style.cursor = this.CURSOR.ROTATE;
            this.rotateStart.set(event.clientX, event.clientY);
            this.dispatchEvent({type:FOUR.EVENT.CONTINUOUS_UPDATE_START});
            event.preventDefault();
        }
    };

    RotateController.prototype.onMouseMove = function (event) {
        if (this.isActivated(event) && this.state === this.STATE.ROTATE) {
            this.rotateEnd.set(event.clientX, event.clientY);
            this.rotateDelta.subVectors(this.rotateEnd, this.rotateStart);
            // rotating across whole screen goes 360 degrees around
            this.constraint.rotateLeft(2 * Math.PI * this.rotateDelta.x / this.domElement.clientWidth * this.rotateSpeed);
            // rotating up and down along whole screen attempts to go 360, but limited to 180
            this.constraint.rotateUp(2 * Math.PI * this.rotateDelta.y / this.domElement.clientHeight * this.rotateSpeed);
            this.rotateStart.copy(this.rotateEnd);
            this.update(); // TODO do we need this???
            event.preventDefault();
        }
    };

    RotateController.prototype.onMouseUp = function (event) {
        if (this.state === this.STATE.ROTATE) {
            this.domElement.style.cursor = this.CURSOR.DEFAULT;
            this.state = this.STATE.NONE;
            this.dispatchEvent({type:FOUR.EVENT.CONTINUOUS_UPDATE_END});
            event.preventDefault();
        }
    };

    RotateController.prototype.setCamera = function (camera) {
        this.constraint.camera = camera;
    };

    RotateController.prototype.update = function () {
        if (this.state === this.STATE.ROTATE) {
            if (this.constraint.update() === true) {
                this.dispatchEvent({type:FOUR.EVENT.UPDATE});
                this.viewport.getCamera().dispatchEvent({type:FOUR.EVENT.UPDATE});
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
;

FOUR.TourController = (function () {

    /**
     * Tour controller provides automated navigation between selected features.
     * The configuration should include a workersPath value as part of the
     * config.planner object.
     * @param {Object} config Configuration
     */
    function TourController (config) {
        THREE.EventDispatcher.call(this);
        config = config || {};
        config.planner = config.planner || {};

        var self = this;
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
        self.planner = new FOUR.PathPlanner(config.planner);
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
            delete self.listeners[key];
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
        // clear all listeners to ensure that we can never add multiple listeners
        // for the same events
        self.disable();
        function addListener(element, event, fn) {
            if (!self.listeners[event]) {
                self.listeners[event] = {
                    element: element,
                    event: event,
                    fn: fn.bind(self)
                };
                element.addEventListener(event, self.listeners[event].fn, false);
            }
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
        self.camera.setTarget(new THREE.Vector3(feature.x, feature.y, feature.z), true);
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
     * @params {Array} features Features to visit. Features must be objects of the form {id:,x:,y:,z:}
     * @returns {Promise}
     */
    TourController.prototype.plan = function (features) {
        var self = this;
        // reset the current feature index
        self.current = -1;
        self.path = [];
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
     * Set camera.
     * @param {THREE.PerspectiveCamera} camera Camera
     */
    TourController.prototype.setCamera = function (camera) {
        this.camera = camera;
    };

    /**
     * Update the controller state.
     */
    TourController.prototype.update = function () {}; // noop

    return TourController;

}());
;

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
            delete self.listeners[key];
        });
    };

    WalkController.prototype.enable = function () {
        var self = this;
        // clear all listeners to ensure that we can never add multiple listeners
        // for the same events
        self.disable();
        function addListener(element, event, fn) {
            if (!self.listeners[event]) {
                self.listeners[event] = {
                    element: element,
                    event: event,
                    fn: fn.bind(self)
                };
                element.addEventListener(event, self.listeners[event].fn, false);
            }
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
                self.dispatchEvent({type:FOUR.EVENT.CONTINUOUS_UPDATE_START});
                break;
            case self.KEY.MOVE_FORWARD:
                self.move.forward = true;
                self.dispatchEvent({type:FOUR.EVENT.CONTINUOUS_UPDATE_START});
                break;
            case self.KEY.MOVE_BACK:
                self.move.backward = true;
                self.dispatchEvent({type:FOUR.EVENT.CONTINUOUS_UPDATE_START});
                break;
            case self.KEY.MOVE_LEFT:
                self.move.left = true;
                self.dispatchEvent({type:FOUR.EVENT.CONTINUOUS_UPDATE_START});
                break;
            case self.KEY.MOVE_RIGHT:
                self.move.right = true;
                self.dispatchEvent({type:FOUR.EVENT.CONTINUOUS_UPDATE_START});
                break;
            case self.KEY.MOVE_UP:
                self.move.up = true;
                self.dispatchEvent({type:FOUR.EVENT.CONTINUOUS_UPDATE_START});
                break;
            case self.KEY.MOVE_DOWN:
                self.move.down = true;
                self.dispatchEvent({type:FOUR.EVENT.CONTINUOUS_UPDATE_START});
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
                self.dispatchEvent({type:FOUR.EVENT.CONTINUOUS_UPDATE_END});
                break;
            case self.KEY.MOVE_BACK:
                self.move.backward = false;
                self.dispatchEvent({type:FOUR.EVENT.CONTINUOUS_UPDATE_END});
                break;
            case self.KEY.MOVE_LEFT:
                self.move.left = false;
                self.dispatchEvent({type:FOUR.EVENT.CONTINUOUS_UPDATE_END});
                break;
            case self.KEY.MOVE_RIGHT:
                self.move.right = false;
                self.dispatchEvent({type:FOUR.EVENT.CONTINUOUS_UPDATE_END});
                break;
            case self.KEY.MOVE_UP:
                self.move.up = false;
                self.dispatchEvent({type:FOUR.EVENT.CONTINUOUS_UPDATE_END});
                break;
            case self.KEY.MOVE_DOWN:
                self.move.down = false;
                self.dispatchEvent({type:FOUR.EVENT.CONTINUOUS_UPDATE_END});
                break;
            case self.KEY.CANCEL:
                Object.keys(self.move).forEach(function (key) {
                    self.move[key] = false;
                });
                self.lookChange = false;
                self.dispatchEvent({type:FOUR.EVENT.CONTINUOUS_UPDATE_END});
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
          .resetOrientation(true)
          .then(function () {
            return self.camera.setPositionAndTarget(pos, target);
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
            self.dispatchEvent({type:self.EVENT.UPDATE});
        }
    };

    return WalkController;

}());
;

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
            delete self.listeners[key];
        });
    };

    ZoomController.prototype.enable = function () {
        var self = this;
        // clear all listeners to ensure that we can never add multiple listeners
        // for the same events
        self.disable();
        function addListener(element, event, fn) {
            if (!self.listeners[event]) {
                self.listeners[event] = {
                    element: element,
                    event: event,
                    fn: fn.bind(self)
                };
                element.addEventListener(event, self.listeners[event].fn, false);
            }
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
        self.dispatchEvent({type:FOUR.EVENT.UPDATE});
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
                    self.dispatchEvent({type:FOUR.EVENT.UPDATE});
                }
            } else if (self.camera instanceof THREE.PerspectiveCamera) {
                lookAt = new THREE.Vector3(0, 0, -1).applyQuaternion(self.camera.quaternion);
                distance = self.zoom.delta * self.dragZoomSpeed;
                if (Math.abs(distance) > self.EPS) {
                    lookAt.setLength(distance);
                    self.camera.position.add(lookAt);
                    self.dispatchEvent({type:FOUR.EVENT.UPDATE});
                }
            }
            self.zoom.delta = 0; // consume the change
        }
    };

    return ZoomController;

}());
;

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

;

FOUR.ClickSelectionController = (function () {

  /**
   * Mouse based selection controller. The controller emits the following
   * selection events:
   *
   * add    - add one or more objects to the selection set
   * clear  - clear the selection set
   * remove - remove one or more objects from the selection set
   * select - select only the identified items
   * toggle - toggle the selection state for one or more objects
   *
   * The controller emits the following camera related events:
   *
   * lookat    - look at the specified point
   * settarget - move the camera target to the specified point
   *
   * @param {Object} config Configuration
   * @constructor
   */
  function ClickSelectionController (config) {
    THREE.EventDispatcher.call(this);
    config = config || {};
    var self = this;

    // single clicking can be interpreted in one of two ways: as indicating that
    // the clicked entity and only that entity should be selected, or as
    // indicating that we should toggle the selection state of the clicked object.
    self.SINGLE_CLICK_ACTION = {
      SELECT: 0,
      TOGGLE: 1
    };

    // the maximum number of pixels that the mouse can move before we interpret
    // the mouse event as not being a click action
    self.EPS = 2;
    self.KEY = {ALT: 18, CTRL: 17, SHIFT: 16};
    self.MOUSE_STATE = {DOWN: 0, UP: 1};

    self.click = self.SINGLE_CLICK_ACTION.SELECT;
    self.domElement = config.viewport.domElement;
    self.filter = null;
    self.filters = {
      DEFAULT: function () { return true; }
    };
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

    self.filter = self.filters.DEFAULT;

    Object.keys(self.KEY).forEach(function (key) {
      self.modifiers[self.KEY[key]] = false;
    });
  }

  ClickSelectionController.prototype = Object.create(THREE.EventDispatcher.prototype);

  /**
   * Remove the current selection filter.
   */
  ClickSelectionController.prototype.clearFilter = function () {
    this.filter = function () { return true; };
  };

  ClickSelectionController.prototype.contextMenu = function (event) {
    event.preventDefault();
  };

  ClickSelectionController.prototype.disable = function () {
    var self = this;
    Object.keys(self.listeners).forEach(function (key) {
      var listener = self.listeners[key];
      listener.element.removeEventListener(listener.event, listener.fn);
      delete self.listeners[key];
    });
  };

  ClickSelectionController.prototype.enable = function () {
    var self = this;
    // clear all listeners to ensure that we can never add multiple listeners
    // for the same events
    self.disable();
    function addListener(element, event, fn) {
      if (!self.listeners[event]) {
        self.listeners[event] = {
          element: element,
          event: event,
          fn: fn.bind(self)
        };
        element.addEventListener(event, self.listeners[event].fn, false);
      }
    }
    addListener(self.viewport.domElement, 'contextmenu', self.onContextMenu);
    addListener(self.viewport.domElement, 'mousedown', self.onMouseDown);
    addListener(self.viewport.domElement, 'mousemove', self.onMouseMove);
    addListener(self.viewport.domElement, 'mouseup', self.onMouseUp);
    addListener(window, 'keydown', self.onKeyDown);
    addListener(window, 'keyup', self.onKeyUp);
  };

  /**
   * Get the selected scene object.
   * @returns {THREE.Object3D|null} Selected scene object
   */
  ClickSelectionController.prototype.getSelected = function () {
    // update the picking ray with the camera and mouse position
    this.raycaster.setFromCamera(this.mouse.end, this.viewport.camera);
    // calculate objects intersecting the picking ray
    this.intersects = this.raycaster.intersectObjects(this.viewport.scene.model.children, true); // TODO this is FOUR specific use of children
    if (this.intersects && this.intersects.length > 0) {
      // filter the intersect list
      this.intersects = this.intersects.filter(this.filter);
      return this.intersects.length > 0 ? this.intersects[0] : null;
    } else {
      return null;
    }
  };

  ClickSelectionController.prototype.onContextMenu = function () {};

  ClickSelectionController.prototype.onDoubleClick = function () {
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

  ClickSelectionController.prototype.onKeyDown = function (event) {
    if (event.keyCode === this.KEY.ALT || event.keyCode === this.KEY.CTRL || event.keyCode === this.KEY.SHIFT) {
      this.modifiers[event.keyCode] = true;
    }
  };

  ClickSelectionController.prototype.onKeyUp = function (event) {
    if (event.keyCode === this.KEY.ALT || event.keyCode === this.KEY.CTRL || event.keyCode === this.KEY.SHIFT) {
      this.modifiers[event.keyCode] = false;
    }
  };

  ClickSelectionController.prototype.onMouseDown = function (event) {
    event.preventDefault();
    if (event.button === THREE.MOUSE.LEFT) {
      this.mouse.state = this.MOUSE_STATE.DOWN;
      // TODO store both screen and ndc coordinates
      // calculate mouse position in normalized device coordinates (-1 to +1)
      this.mouse.start.x = (event.offsetX / this.domElement.clientWidth) * 2 - 1;
      this.mouse.start.y = -(event.offsetY / this.domElement.clientHeight) * 2 + 1;
      this.mouse.end.copy(this.mouse.start);
    }
  };

  ClickSelectionController.prototype.onMouseMove = function (event) {
    // calculate mouse position in normalized device coordinates (-1 to +1)
    this.mouse.end.x = (event.offsetX / this.domElement.clientWidth) * 2 - 1;
    this.mouse.end.y = -(event.offsetY / this.domElement.clientHeight) * 2 + 1;
  };

  ClickSelectionController.prototype.onMouseUp = function (event) {
    var self = this;
    if (event.button === THREE.MOUSE.LEFT && self.mouse.state === this.MOUSE_STATE.DOWN) {
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
        }, FOUR.SINGLE_CLICK_TIMEOUT);
      }
      self.mouse.state = self.MOUSE_STATE.UP;
      event.preventDefault();
    }
  };

  ClickSelectionController.prototype.onSingleClick = function () {
    var selection = this.getSelected();
    if (selection) {
      // TODO we need to check for exclusive SHIFT, ALT, etc. keydown
      if (this.modifiers[this.KEY.SHIFT] === true) {
        this.dispatchEvent({type:'add', selection: selection});
      } else if (this.modifiers[this.KEY.ALT] === true) {
        this.dispatchEvent({type:'remove', selection: selection});
      } else if (this.click === this.SINGLE_CLICK_ACTION.SELECT) {
        this.dispatchEvent({type:'select', selection: selection});
      } else if (this.click === this.SINGLE_CLICK_ACTION.TOGGLE) {
        this.dispatchEvent({type: 'toggle', selection: selection});
      }
    } else {
      this.dispatchEvent({type:'clear'});
    }
  };

  /**
   * Set the current filter.
   * @param {String} key Filter ID
   */
  ClickSelectionController.prototype.setFilter = function (key) {
    this.filter = this.filters[key];
  };

  ClickSelectionController.prototype.update = function () {}; // do nothing

  return ClickSelectionController;

}());
;

FOUR.HoverSelectionController = (function () {

  /**
   * Hover based selection controller. The controller emits the following
   * selection events:
   *
   * hover - mouse over an object
   *
   * @param {Object} config Configuration
   * @constructor
   */
  function HoverSelectionController (config) {
    THREE.EventDispatcher.call(this);
    config = config || {};
    var self = this;

    // the maximum number of pixels that the mouse can move before we interpret
    // the mouse event as not being a click action
    self.EPS = 2;
    self.HOVER_TIMEOUT = 1000;
    self.MOUSE_STATE = {DOWN: 0, UP: 1};

    self.domElement = config.viewport.domElement;
    self.filter = null;
    self.filters = {
      DEFAULT: function () { return true; }
    };
    self.intersects = [];
    self.listeners = {};
    self.mouse = {
      end: new THREE.Vector2(),
      start: new THREE.Vector2(),
      state: self.MOUSE_STATE.UP
    };
    self.raycaster = new THREE.Raycaster();
    self.timeout = null;
    self.viewport = config.viewport;

    self.filter = self.filters.DEFAULT;
  }

  HoverSelectionController.prototype = Object.create(THREE.EventDispatcher.prototype);

  /**
   * Remove the current selection filter.
   */
  HoverSelectionController.prototype.clearFilter = function () {
    this.filter = function () { return true; };
  };

  /**
   * Disable controller.
   */
  HoverSelectionController.prototype.disable = function () {
    var self = this;
    Object.keys(self.listeners).forEach(function (key) {
      var listener = self.listeners[key];
      listener.element.removeEventListener(listener.event, listener.fn);
      delete self.listeners[key];
    });
  };

  /**
   * Enable controller.
   */
  HoverSelectionController.prototype.enable = function () {
    var self = this;
    self.disable();
    function addListener(element, event, fn) {
      if (!self.listeners[event]) {
        self.listeners[event] = {
          element: element,
          event: event,
          fn: fn.bind(self)
        };
        element.addEventListener(event, self.listeners[event].fn, false);
      }
    }
    addListener(self.viewport.domElement, 'mousemove', self.onMouseMove);
  };

  /**
   * Get the selected scene object.
   * @returns {THREE.Object3D|null} Selected scene object
   */
  HoverSelectionController.prototype.getSelected = function () {
    // update the picking ray with the camera and mouse position
    this.raycaster.setFromCamera(this.mouse.end, this.viewport.camera);
    // calculate objects intersecting the picking ray
    this.intersects = this.raycaster.intersectObjects(this.viewport.scene.model.children, true); // TODO this is FOUR specific use of children
    if (this.intersects && this.intersects.length > 0) {
      // filter the intersect list
      this.intersects = this.intersects.filter(this.filter);
      return this.intersects.length > 0 ? this.intersects[0] : null;
    } else {
      return null;
    }
  };

  /**
   * Handle hover event.
   */
  HoverSelectionController.prototype.onHover = function () {
    this.dispatchEvent({type:'hover', selection: this.getSelected()});
  };

  /**
   * Handle mouse move event.
   * @param {Object} event Event
   */
  HoverSelectionController.prototype.onMouseMove = function (event) {
    // calculate mouse position in normalized device coordinates (-1 to +1)
    this.mouse.end.x = (event.offsetX / this.domElement.clientWidth) * 2 - 1;
    this.mouse.end.y = -(event.offsetY / this.domElement.clientHeight) * 2 + 1;
    // handle hover event
    if (this.timeout !== null) {
      clearTimeout(this.timeout);
      this.timeout = null;
    }
    this.timeout = setTimeout(this.onHover.bind(this), this.HOVER_TIMEOUT);
  };

  /**
   * Set the current filter.
   * @param {String} key Filter ID
   */
  HoverSelectionController.prototype.setFilter = function (key) {
    // TODO implement filtering
    this.filter = this.filters[key];
  };

  HoverSelectionController.prototype.update = function () {}; // do nothing

  return HoverSelectionController;

}());
;

FOUR.MarqueeSelectionController = (function () {

  /**
   * Marquee selection controller. On camera update, the controller filters the
   * scene to get the set of objects that are inside the camera frustum. It then
   * adds the projected screen coordinates for each object to a quadtree. When
   * a marquee selection event occurs, we then search for objects by their
   * screen coordinates.
   * @param {Object} config Configuration
   * @constructor
   */
  function MarqueeSelectionController(config) {
    THREE.EventDispatcher.call(this);
    config = config || {};
    var self = this;

    // the number of pixels that the mouse must move before we interpret the
    // mouse movement as marquee selection
    self.EPS = 2;

    // wait for the timeout to expire before indexing the scene
    self.INDEX_TIMEOUT = 500;

    self.KEY = {ALT: 18, CTRL: 17, SHIFT: 16};
    self.SELECT_ACTIONS = {ADD: 0, REMOVE: 1, SELECT: 2};
    self.MOUSE_STATE = {DOWN: 0, UP: 1};

    self.camera = config.camera;
    self.domElement = config.viewport.domElement;
    self.enabled = false;
    self.filter = null;
    self.filters = { // FIXME move into the view index
      all: self.selectAll,
      nearest: self.selectNearest,
      objects: self.selectObjects,
      points: self.selectPoints
    };
    self.frustum = new THREE.Frustum();
    self.indexingTimeout = null;
    self.listeners = {};
    self.marquee = document.getElementById('marquee');
    self.modifiers = {};
    self.mouse = {
      end: new THREE.Vector2(),
      start: new THREE.Vector2(),
      state: self.MOUSE_STATE.UP
    };
    self.quadtree = new Quadtree({
      x: 0,
      y: 0,
      height: config.viewport.domElement.clientHeight,
      width: config.viewport.domElement.clientWidth
    });
    self.sceneIndex = new SpatialHash();
    self.selectAction = self.SELECT_ACTIONS.SELECT;
    self.selection = [];
    self.viewIndex = new SpatialHash();
    self.viewport = config.viewport;

    Object.keys(self.KEY).forEach(function (key) {
      self.modifiers[self.KEY[key]] = false;
    });
  }

  MarqueeSelectionController.prototype = Object.create(THREE.EventDispatcher.prototype);

  /**
   * Add selection filter.
   * @param {String} key Key
   * @param {Function} fn Filter function
   */
  MarqueeSelectionController.prototype.addFilter = function (key, fn) {
    this.filters[key] = fn;
  };

  /**
   * Build a quadtree index from the set of objects that are contained within
   * the camera frustum. Index each object by its projected screen coordinates.
   */
  MarqueeSelectionController.prototype.buildIndex = function () {
    // TODO perform indexing in a worker if possible
    var matrix, objs, self = this, total = 0;
    // clear the current index
    self.quadtree = new Quadtree({
      height: self.viewport.domElement.clientHeight,
      width: self.viewport.domElement.clientWidth
    });
    // build a frustum for the current camera view
    matrix = new THREE.Matrix4().multiplyMatrices(self.camera.projectionMatrix, self.camera.matrixWorldInverse);
    self.frustum.setFromMatrix(matrix);
    // traverse the scene and add all entities within the frustum to the index
    objs = self.viewport.getScene().getModelObjects();
    objs.forEach(function (child) {
      if (child.matrixWorldNeedsUpdate) {
        child.updateMatrixWorld();
      }
      // objects without geometry will cause the frustrum intersection check to
      // fail
      try {
        if (child.geometry && self.frustum.intersectsObject(child)) {
          // switch indexing strategy depending on the type of scene object
          //if (child instanceof THREE.BufferGeometry) {
          //  total += self.indexBufferGeometryVertices(child, self.quadtree);
          //} else
          if (child instanceof THREE.Points) {
            total += self.indexPointsVertices(child, self.quadtree);
          } else if (child instanceof THREE.Object3D) {
            self.indexObject3DVertices(child, self.quadtree);
            total += 1;
          }
        }
      } catch (err) {
        // no need to do anything
      }
    });
    console.info('Added %s objects to the view index', total);
  };

  MarqueeSelectionController.prototype.clearFilter = function () {};

  MarqueeSelectionController.prototype.disable = function () {
    var self = this;
    self.enabled = false;
    self.hideMarquee();
    Object.keys(self.listeners).forEach(function (key) {
      var listener = self.listeners[key];
      listener.element.removeEventListener(listener.event, listener.fn);
      delete self.listeners[key];
    });
  };

  MarqueeSelectionController.prototype.enable = function () {
    var self = this;
    // clear all listeners to ensure that we can never add multiple listeners
    // for the same events
    self.disable();
    self.camera = self.viewport.getCamera();
    // add listeners
    function addListener(element, event, fn) {
      if (!self.listeners[event]) {
        self.listeners[event] = {
          element: element,
          event: event,
          fn: fn.bind(self)
        };
        element.addEventListener(event, self.listeners[event].fn, false);
      }
    }
    addListener(self.camera, FOUR.EVENT.UPDATE, self.onCameraUpdate);
    addListener(self.viewport, FOUR.EVENT.CAMERA_CHANGE, self.onCameraChange);
    addListener(self.viewport.domElement, 'mousedown', self.onMouseDown);
    addListener(self.viewport.domElement, 'mousemove', self.onMouseMove);
    addListener(self.viewport.domElement, 'mouseup', self.onMouseUp);
    addListener(window, 'keydown', self.onKeyDown);
    addListener(window, 'keyup', self.onKeyUp);
    addListener(window, 'resize', self.onWindowResize);
    // FIXME the first time the index runs it appears to get every scene object
    self.buildIndex();
    self.enabled = true;
  };

  /**
   * Hide the selection marquee.
   */
  MarqueeSelectionController.prototype.hideMarquee = function () {
    this.marquee.setAttribute('style', 'display:none;');
  };

  /**
   * Index the THREE.Object3D by its vertices.
   * @param {THREE.Object3D} obj Scene object
   * @param {Quadtree} index Spatial index
   * @returns {number} Count of indexed entities
   */
  MarqueeSelectionController.prototype.indexObject3DVertices = function (obj, index) {
    var height, maxX = 0, maxY = 0,
      minX = this.viewport.domElement.clientWidth,
      minY = this.viewport.domElement.clientHeight,
      p, self = this, width, x, y;
    if (obj.matrixWorldNeedsUpdate) {
      obj.updateMatrixWorld();
    }
    // project the object vertices into the screen space, then find the screen
    // space bounding box for the scene object
    obj.geometry.vertices.forEach(function (vertex) {
      p = vertex.clone();
      p.applyMatrix4(obj.matrixWorld); // absolute position of vertex
      p = FOUR.utils.getVertexScreenCoordinates(p, self.camera, self.viewport.domElement.clientWidth, self.viewport.domElement.clientHeight);
      maxX = p.x > maxX ? p.x : maxX;
      maxY = p.y > maxY ? p.y : maxY;
      minX = p.x < minX ? p.x : minX;
      minY = p.y < minY ? p.y : minY;
    });
    height = (maxY - minY) > 0 ? maxY - minY : 0;
    width = (maxX - minX) > 0 ? maxX - minX : 0;
    x = minX >= 0 ? minX : 0;
    y = minY >= 0 ? minY : 0;
    // add the object screen bounding box to the index
    index.push({uuid: obj.uuid.slice(), x: x, y: y, height: height, width: width, index: -1, type: 'THREE.Object3D', object: obj});
    //console.info({uuid:obj.uuid.slice(), x:x, y:y, h:height, w:width, type:'THREE.Object3D'});
    return 1;
  };

  /**
   * Index the THREE.Points object by its vertices.
   * @param {THREE.Points} obj Scene object
   * @param {Quadtree} index Spatial index
   * @returns {number} Count of indexed entities
   */
  MarqueeSelectionController.prototype.indexPointsVertices = function (obj, index) {
    var i, p, self = this, total = 0, vertex;
    if (obj.geometry.vertices) {
      for (i = 0; i < obj.geometry.vertices.length; i++) {
        total += 1;
        vertex = obj.geometry.vertices[i];
        p = FOUR.utils.getObjectScreenCoordinates(vertex, self.camera, self.viewport.domElement.clientWidth, self.viewport.domElement.clientHeight);
        if (p.x >= 0 && p.y >= 0) {
          index.push({uuid:obj.uuid.slice(), x:Number(p.x), y:Number(p.y), width:0, height:0, index:i, type:'THREE.Points'});
          console.info({uuid:obj.uuid.slice(), x:Number(p.x), y:Number(p.y), width:0, height:0, index:i, type:'THREE.Points'});
        }
      }
    } else if (obj.geometry.attributes.position) {
      console.warn('Indexing buffer geometry vertices will have a significant performance impact');
    }
    return total;
  };

  MarqueeSelectionController.prototype.onCameraChange = function () {
    this.disable();
    this.enable();
  };

  MarqueeSelectionController.prototype.onCameraUpdate = function () {
    this.reindex();
  };

  MarqueeSelectionController.prototype.onContextMenu = function (event) {
    event.preventDefault();
  };

  MarqueeSelectionController.prototype.onKeyDown = function (event) {
    if (event.keyCode === this.KEY.ALT) {
      this.selectAction = this.SELECT_ACTIONS.REMOVE;
    } else if (event.keyCode === this.KEY.SHIFT) {
      this.selectAction = this.SELECT_ACTIONS.ADD;
    }
  };

  MarqueeSelectionController.prototype.onKeyUp = function (event) {
    if (event.keyCode === this.KEY.ALT) {
      this.selectAction = this.SELECT_ACTIONS.SELECT;
    } else if (event.keyCode === this.KEY.SHIFT) {
      this.selectAction = this.SELECT_ACTIONS.SELECT;
    }
  };

  MarqueeSelectionController.prototype.onMouseDown = function (event) {
    if (event.button === THREE.MOUSE.LEFT) {
      event.preventDefault();
      this.mouse.state = this.MOUSE_STATE.DOWN;
      this.mouse.start.set(event.offsetX, event.offsetY);
      this.mouse.end.copy(event.offsetX, event.offsetY);
    }
  };

  MarqueeSelectionController.prototype.onMouseMove = function (event) {
    var delta = new THREE.Vector2(event.offsetX, event.offsetY).sub(this.mouse.start).length();
    if (this.mouse.state === this.MOUSE_STATE.DOWN && delta > this.EPS) {
      //console.info('marquee selection');
      event.preventDefault();
      event.stopPropagation();
      // draw the selection marquee
      this.mouse.end.set(event.offsetX, event.offsetY);
      var width = Math.abs(this.mouse.end.x - this.mouse.start.x);
      var height = Math.abs(this.mouse.end.y - this.mouse.start.y);
      // drawn from top left to bottom right
      if (this.mouse.end.x > this.mouse.start.x && this.mouse.end.y > this.mouse.start.y) {
        this.setMarqueePosition(this.mouse.start.x, this.mouse.start.y, width, height);
      }
      // drawn from the top right to the bottom left
      else if (this.mouse.end.x < this.mouse.start.x && this.mouse.end.y > this.mouse.start.y) {
        this.setMarqueePosition(this.mouse.end.x, this.mouse.start.y, width, height);
      }
      // drawn from the bottom left to the top right
      else if (this.mouse.end.x > this.mouse.start.x && this.mouse.end.y < this.mouse.start.y) {
        this.setMarqueePosition(this.mouse.start.x, this.mouse.end.y, width, height);
      }
      // drawn from the bottom right to the top left
      else if (this.mouse.end.x < this.mouse.start.x && this.mouse.end.y < this.mouse.start.y) {
        this.setMarqueePosition(this.mouse.end.x, this.mouse.end.y, width, height);
      }
    }
  };

  MarqueeSelectionController.prototype.onMouseUp = function (event) {
    if (this.mouse.state === this.MOUSE_STATE.DOWN && event.button === THREE.MOUSE.LEFT) {
      event.preventDefault();
      event.stopPropagation();
      this.mouse.state = this.MOUSE_STATE.UP;
      // hide the selection marquee
      this.hideMarquee();
      // emit the selection event
      var width = Math.abs(this.mouse.end.x - this.mouse.start.x);
      var height = Math.abs(this.mouse.end.y - this.mouse.start.y);
      // drawn from top left to bottom right
      if (this.mouse.end.x > this.mouse.start.x && this.mouse.end.y > this.mouse.start.y) {
        this.select(this.mouse.start.x, this.mouse.start.y, width, height);
      }
      // drawn from the top right to the bottom left
      else if (this.mouse.end.x < this.mouse.start.x && this.mouse.end.y > this.mouse.start.y) {
        this.select(this.mouse.end.x, this.mouse.start.y, width, height);
      }
      // drawn from the bottom left to the top right
      else if (this.mouse.end.x > this.mouse.start.x && this.mouse.end.y < this.mouse.start.y) {
        this.select(this.mouse.start.x, this.mouse.end.y, width, height);
      }
      // drawn from the bottom right to the top left
      else if (this.mouse.end.x < this.mouse.start.x && this.mouse.end.y < this.mouse.start.y) {
        this.select(this.mouse.end.x, this.mouse.end.y, width, height);
      }
    }
  };

  MarqueeSelectionController.prototype.onWindowResize = function () {
  };

  /**
   * Execute the indexing operation after the timeout expires to ensure that
   * we update the index only after the camera has stopped moving.
   */
  MarqueeSelectionController.prototype.reindex = function () {
    if (this.indexingTimeout) {
      clearTimeout(this.indexingTimeout);
      this.indexingTimeout = null;
    }
    this.indexingTimeout = setTimeout(this.buildIndex.bind(this), this.INDEX_TIMEOUT);
  };

  /**
   * Select entities by marquee.
   * @param {Number} x Selection top left screen X coordinate
   * @param {Number} y Selection top left screen Y coordinate
   * @param {Number} width Selection bottom right screen X coordinate
   * @param {Number} height Selection bottom right screen Y coordinate
   */
  MarqueeSelectionController.prototype.select = function (x, y, width, height) {
    // find entities that are wholly contained inside the selection marquee
    var r1 = {p1: {}, p2: {}}, r2 = {p1: {}, p2: {}};
    this.selection = this.quadtree.colliding({x: x, y: y, width: width, height: height}, function (selection, obj) {
      r1.p1.x = obj.x;
      r1.p1.y = obj.y;
      r1.p2.x = obj.x + obj.width;
      r1.p2.y = obj.y + obj.height;
      r2.p1.x = selection.x;
      r2.p1.y = selection.y;
      r2.p2.x = selection.x + selection.width;
      r2.p2.y = selection.y + selection.height;
      return FOUR.utils.isContained(r1, r2);
    });
    // transform index record into a format similar to the one returned by the
    // THREE.Raycaster
    this.selection = this.selection.map(function (item) {
      // index format: height, index, type, uuid, width, x, y
      // raycaster face intersect: distance, face, faceIndex, object, point, uv
      // raycaster point intersect: distance, distanceToRay, face, index, object, point
      return {
        distance: null,
        face: null,
        index: item.index,
        object: item.object || null,
        type: item.type,
        uuid: item.uuid
      };
    });
    // TODO filtering should happen in the view index. this is disabled for now since its causing problems
    // filter the selection results
    //this.selection = this.selection.filter(this.filter);
    // dispatch selection event
    if (this.selectAction === this.SELECT_ACTIONS.ADD) {
      this.dispatchEvent({type: 'add', selection: this.selection});
    } else if (this.selectAction === this.SELECT_ACTIONS.REMOVE) {
      this.dispatchEvent({type: 'remove', selection: this.selection});
    } else if (this.selectAction === this.SELECT_ACTIONS.SELECT) {
      this.dispatchEvent({type: 'select', selection: this.selection});
    }
  };

  MarqueeSelectionController.prototype.selectAll = function () {
    return true;
  };

  MarqueeSelectionController.prototype.selectNearest = function () {
    return true;
  };

  MarqueeSelectionController.prototype.selectObjects = function () {
    return true;
  };

  MarqueeSelectionController.prototype.selectPoints = function () {
    return true;
  };

  /**
   * Set selection filter.
   */
  MarqueeSelectionController.prototype.setFilter = function () {
    throw new Error('not implemented');
  };

  /**
   * Set the marquee screen position.
   * @param {Number} x Marquee top left screen X coordinate
   * @param {Number} y Marquee top left screen Y coordinate
   * @param {Number} w Marquee bottom right screen X coordinate
   * @param {Number} h Marquee bottom right screen Y coordinate
   */
  MarqueeSelectionController.prototype.setMarqueePosition = function (x, y, w, h) {
    this.marquee.setAttribute('style', 'display:block;left:' + x + 'px;top:' + y + 'px;width:' + w + 'px;height:' + h + 'px;');
  };

  MarqueeSelectionController.prototype.update = function () {}; // noop

  return MarqueeSelectionController;

}());;

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
   * @param {Object} obj THREE.Raycaster intersection record or FOUR.MarqueeSelectionController selection record
   * @param {Boolean} update Rebuild index and emit update event
   */
  SelectionSet.prototype.add = function (obj, update) {
    update = typeof update === 'undefined' ? true : update;
    // add the object if it is not already present in the selection set
    if (!this.contains(obj)) {
      // normalize selection record format
      if (!obj.uuid) {
        obj.index = obj.index || -1;
        obj.type = obj.type || this.getType(obj);
        obj.uuid = obj.object.uuid;
      }
      this.items.push(obj);
    }
    if (update) {
      this.updateIndex();
      this.dispatchEvent({type:FOUR.EVENT.UPDATE, added:[obj], removed:[], selected:this.items});
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
      self.dispatchEvent({type:FOUR.EVENT.UPDATE, added:objects, removed:[], selected:self.items});
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
   * Get type of object.
   * @param {Object} obj Object
   * @returns {String} Type
   */
  SelectionSet.prototype.getType = function (obj) {
    // this is very hackish but unfortunately necessary since the THREE types
    // can't be easily resolved
    var type = 'undefined';
    var types = {
      'THREE.Face3':THREE.Face3,
      'THREE.Line':THREE.Line,
      'THREE.LineSegments':THREE.LineSegments,
      'THREE.Mesh':THREE.Mesh,
      'THREE.Points':THREE.Points
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
      this.dispatchEvent({type:FOUR.EVENT.UPDATE, added:[], removed:removed, selected:this.items});
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
      this.dispatchEvent({type:FOUR.EVENT.UPDATE, added:[], removed:removed, selected: this.items});
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
    this.dispatchEvent({type:FOUR.EVENT.UPDATE, added:added, removed:removed, selected: this.items});
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
      this.dispatchEvent({type:FOUR.EVENT.UPDATE, added:added, removed:removed, selected:this.items});
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
