/**
 * Camera view object and object element index. The index supports search for
 * object and object element selection. The indexer can accept a function to
 * enable indexing of arbitrary element properties.
 */
FOUR.ViewIndex = (function () {

  /**
   * ViewIndex constructor.
   * @param {Object} config Configuration
   * @constructor
   */
  function ViewIndex(config) {
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
    self.quadtree = new Quadtree({
      //x: 0,
      //y: 0,
      height: config.viewport.domElement.clientHeight,
      width: config.viewport.domElement.clientWidth
    });
    self.viewport = config.viewport;

    Object.keys(config).forEach(function (key) {
      self[key] = config[key];
    });
  }

  ViewIndex.prototype = Object.create(THREE.EventDispatcher.prototype);

  ViewIndex.prototype.constructor = ViewIndex;

  /**
   * Clear the index.
   */
  ViewIndex.prototype.clear = function (controller, name) {
  };

  ViewIndex.prototype.disable = function () {
    var self = this;
    self.enabled = false;
    self.hideMarquee();
    Object.keys(self.listeners).forEach(function (key) {
      var listener = self.listeners[key];
      listener.element.removeEventListener(listener.event, listener.fn);
    });
  };

  ViewIndex.prototype.enable = function () {
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
   * @param
   */
  ViewIndex.prototype.get = function (p1, p2, strategy) {
    throw new Error('not implemented');
  };

  /**
   * Get screen entities within a specified radius from the screen position.
   * @param {Object} pos Screen position
   * @param {Number} radius Radius from point
   * @returns {Array} List of scene objects.
   */
  ViewIndex.prototype.getNear = function (pos, radius) {
    throw new Error('not implemented');
  };

  /**
   * Get the entity nearest to the screen position.
   * @param {Object} pos Screen position
   * @returns {Object}
   */
  ViewIndex.prototype.getNearest = function (pos, radius) {
    throw new Error('not implemented');
  };

  /**
   * Build a quadtree index from the set of objects that are contained within
   * the camera frustum. Index each object by its projected screen coordinates.
   * @param {FOUR.Viewport3D} viewport Viewport
   * @param {THREE.Camera} camera Camera
   * @param {Array} objs Scene objects
   */
  ViewIndex.prototype.index = function (viewport, camera, objs) {
    // TODO perform indexing in a worker if possible
    var matrix, self = this, total = 0;
    // clear the current index
    //self.quadtree.clear();
    self.quadtree = new Quadtree({
      height: viewport.domElement.clientHeight,
      width: viewport.domElement.clientWidth
    });
    // build a frustum for the current camera view
    matrix = new THREE.Matrix4().multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
    self.frustum.setFromMatrix(matrix);
    // traverse the scene and add all entities within the frustum to the index
    objs.forEach(function (child) {
      if (child.matrixWorldNeedsUpdate) {
        child.updateMatrixWorld();
      }
      if (child.geometry && self.frustum.intersectsObject(child)) {
        // switch indexing strategy depending on the type of scene object
        if (child instanceof THREE.Points) {
          total += self.indexPointsVertices(child, self.quadtree);
        } else if (child instanceof THREE.Object3D) {
          self.indexObject3DVertices(child, self.quadtree);
          total += 1;
        }
      }
    });
    console.info('Added %s objects to the view index', total);
  };

  /**
   * Index the THREE.Object3D by its vertices.
   * @param {THREE.Object3D} obj Scene object
   * @param {Object} index Spatial index
   */
  ViewIndex.prototype.indexObject3DVertices = function (obj, index) {
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
    index.push({uuid: obj.uuid.slice(), x: x, y: y, height: height, width: width, index: -1, type: 'THREE.Object3D'});
    //console.info({uuid:obj.uuid.slice(), x:x, y:y, h:height, w:width, type:'THREE.Object3D'});
  };

  ViewIndex.prototype.indexPointsVertices = function (obj, index) {
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

  return ViewIndex;

}());
