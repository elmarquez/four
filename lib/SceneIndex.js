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
   * Add objects to the scene index.
   * @param {Array} objs Scene objects
   */
  SceneIndex.prototype.indexScene = function (objs) {
    // TODO perform indexing in a worker
    var objects = 0, self = this, verticies = 0;
    objs.forEach(function (obj) {
      objects += 1;
      if (obj.matrixWorldNeedsUpdate) {
        obj.updateMatrixWorld();
      }
      if (obj.geometry) {
        // switch indexing strategy depending on the type of scene object
        if (obj instanceof THREE.Points) {
          verticies += self.indexPointsVertices(obj);
        } else if (obj instanceof THREE.Object3D) {
          verticies += self.indexObject3DVertices(obj);
        }
      }
    });
    console.info('Added %s objects, %s points to the scene index', objects, points);
  };

  /**
   * Add objects to the camera view index.
   * @param {THREE.Camera} camera Camera
   * @param {Array} objs Scene objects
   */
  SceneIndex.prototype.indexView = function (camera) {
    var objects = 0, matrix, self = this, vertices = 0;
    // build a frustum for the current camera view
    matrix = new THREE.Matrix4().multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
    self.frustum.setFromMatrix(matrix);
    // the list of cells intersecting the view frustum
    var cells = self.sceneIndex.getCellsIntersectingFrustum(self.frustum);
    // the list of entities intersecting the frustum


// get the list of cell intersecting the camera frustym


    objs.forEach(function (obj) {
      if (obj.matrixWorldNeedsUpdate) {
        obj.updateMatrixWorld();
      }
      if (obj.geometry && self.frustum.intersectsObject(obj)) {
        objects += 1;
        // switch indexing strategy depending on the type of scene object
        if (obj instanceof THREE.Points) {
          vertices += self.indexPointsVertices(obj);
        } else if (obj instanceof THREE.Object3D) {
          vertices += self.indexObject3DVertices(obj);
        }
      }
    });
    console.info('Added %s objects, %s points to the view index', objects, points);
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
