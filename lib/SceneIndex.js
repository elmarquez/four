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

    self.filter = null;
    self.filters = {
      all: self.selectAll,
      nearest: self.selectNearest,
      objects: self.selectObjects,
      points: self.selectPoints
    };
    self.frustum = new THREE.Frustum();
    self.sceneIndex = new SpatialHash();
    self.viewIndex = new SpatialHash();

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
   * Get all entities intersecting the rectangle defined by P1 and P2.
   * @param {THREE.Vector2} p1 Screen position
   * @param {THREE.Vector2} p2 Screen position
   */
  SceneIndex.prototype.get = function (p1, p2) {
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
   * Index the position of each vertex in the buffered geometry.
   * @param {THREE.Object3D} obj Scene object
   * @returns {number} Count of the number of indexed vertices
   */
  SceneIndex.prototype.indexBufferedGeometryPosition = function (obj) {
    var i, total = 0;
    console.info('point count', obj.geometry.attributes.position.count);
    for (i = 0; i < obj.geometry.attributes.position.count; i+= 3) {
      total += 1;
    }
    return total;
  };

  /**
   * Index the position of each vertex.
   * @param {THREE.Object3D|THREE.Points} obj Scene object
   * @returns {number} Count of the number of indexed vertices
   */
  SceneIndex.prototype.indexGeometryVertices = function (obj) {
    var aabb, i, id, metadata, total = 0, vertex;
    if (obj.geometry.vertices) {
      for (i = 0; i < obj.geometry.vertices.length; i++) {
        // TODO ensure that the vertex position is absolute
        vertex = obj.geometry.vertices[i].clone().add(obj.position);
        id = obj.uuid + ',' + i;
        aabb = {
          min: {x:vertex.x, y:vertex.y, z:vertex.z},
          max: {x:vertex.x, y:vertex.y, z:vertex.z}
        };
        metadata = {
          type:'THREE.Points'
        };
        this.sceneIndex.insert(id, aabb, metadata);
        total += 1;
      }
    }
    return total;
  };

  /**
   * Add objects to the scene index.
   * @param {Array} objs Scene objects to be indexed
   */
  SceneIndex.prototype.indexScene = function (objs) {
    objs = objs || [];
    var objects = 0, self = this, verticies = 0;

    // TODO perform indexing in a worker
    // reduce each scene entity to the properties that we want to index
    // for each element, record the uuid, index, aabb
    // prefix the array with any values required to build a camera frustum, etc.
    // in the worker:
    // build the 3D index
    // build the 2D index
    // take advantage of memoization

    //var objs = this.scene.getModelObjects().map(function (obj) {
    //  return {
    //    uuid: obj.uuid.slice(0),
    //    position: obj.position.toArray()
    //  }
    //});

    //hamsters.run({'array': objs}, function() {
    //  for (var i = 0; i < params.array.length; i += 1) {
    //    if (params.array[i].hasOwnProperty('uuid')) {
    //      rtn.data.push(params.array[i].uuid);
    //    } else {
    //      rtn.data.push(null);
    //    }
    //  }
    //}, function(output) {
    //  console.info(output);
    //  //callback.call();
    //}, hamsters.maxThreads, true);

    objs.forEach(function (obj) {
      objects += 1;
      if (obj.matrixWorldNeedsUpdate) {
        obj.updateMatrixWorld();
      }
      if (obj.geometry) {
        // switch indexing strategy depending on the type of scene object
        if (obj instanceof THREE.Points) {
          if (obj.geometry.vertices) {
            verticies += self.indexGeometryVertices(obj);
          } else if (obj.geometry.attributes.hasOwnProperty('position')) {
            verticies += self.indexBufferedGeometryPosition(obj);
          }
        } else if (obj instanceof THREE.Object3D) {
          verticies += self.indexObject3DVertices(obj);
        }
      }
    });
    console.info('Added %s objects, %s vertices to the scene index', objects, verticies);
  };

  /**
   * Add objects to the camera view index.
   * @param {THREE.Scene} scene Scene
   * @param {THREE.Camera} camera Camera
   * @param {number} width Viewport width
   * @param {number} height Viewport height
   */
  SceneIndex.prototype.indexView = function (scene, camera, width, height) {
    var id, obj, objects = 0, matrix, self = this, vertices = 0;
    // build a frustum for the current camera view
    matrix = new THREE.Matrix4().multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
    self.frustum.setFromMatrix(matrix);
    // the list of entities intersecting the frustum
    self.sceneIndex.getCellsIntersectingFrustum(self.frustum).forEach(function (cell) {

    });
    //self.sceneIndex
    //  .getEntitiesIntersectingFrustum(self.frustum)
    //  .forEach(function (id) {
    //    obj = scene.getObjectByProperty('uuid', uuid);
    //    if (obj.geometry && self.frustum.intersectsObject(obj)) {
    //      objects += 1;
    //      // switch indexing strategy depending on the type of scene object
    //      if (obj instanceof THREE.Points) {
    //        vertices += self.indexPointsVerticesScreenCoordinates(obj, width, height);
    //      } else if (obj instanceof THREE.Object3D) {
    //        vertices += self.indexObject3DScreenCoordinates(obj, width, height);
    //      }
    //    }
    //  });
    console.info('Added %s objects, %s vertices to the view index', objects, vertices);
  };

  /**
   * Index the THREE.Object3D by the screen coordinates of its vertices.
   * @param {THREE.Object3D} obj Scene object
   * @param {Number} clientWidth Screen width
   * @param {Number} clientHeight Screen height
   */
  SceneIndex.prototype.indexObject3DScreenCoordinates = function (obj, clientWidth, clientHeight) {
    var height, maxX = 0, maxY = 0, minX = clientWidth, minY = clientHeight, p, self = this, width, x, y;
    if (obj.matrixWorldNeedsUpdate) {
      obj.updateMatrixWorld();
    }
    // project the object vertices into the screen space, then find the screen
    // space bounding box for the scene object
    obj.geometry.vertices.forEach(function (vertex) {
      p = vertex.clone();
      p.applyMatrix4(obj.matrixWorld); // absolute position of vertex
      p = FOUR.utils.getVertexScreenCoordinates(p, self.camera, clientWidth, clientHeight);
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
    var total = 0;
    if (obj.geometry) {
      obj.geometry.computeBoundingBox();
      if (obj.geometry.vertices) {
        total += this.indexGeometryVertices(obj);
      } else {
        this.sceneIndex.insert(obj.uuid.slice() + ',-1', obj.geometry.boundingBox);
        total += 1;
      }
    }
    return total;
  };

  /**
   * Insert scene object into the index.
   * @param {THREE.Object3D|THREE.Points} obj Scene object
   */
  SceneIndex.prototype.insert = function (obj) {
    this.sceneIndex.insert(obj.uuid);
  };

  /**
   * Remove scene object from the index
   * @param {THREE.Object3D|THREE.Points} obj Scene object
   * @param {Number} index Element index
   */
  SceneIndex.prototype.remove = function (obj, index) {
    index = index || -1;
    this.sceneIndex.remove(obj);
  };

  SceneIndex.prototype.selectAll = function () {};

  SceneIndex.prototype.selectNearest = function () {};

  SceneIndex.prototype.selectObjects = function () {};

  SceneIndex.prototype.selectPoints = function () {};

  return SceneIndex;

}());
