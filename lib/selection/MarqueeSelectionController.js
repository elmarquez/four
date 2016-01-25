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
    // mouse action as marquee selection
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
    self.filters = {
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
      //x: 0,
      //y: 0,
      height: config.viewport.domElement.clientHeight,
      width: config.viewport.domElement.clientWidth
    });
    self.selectAction = self.SELECT_ACTIONS.SELECT;
    self.selection = [];
    self.viewport = config.viewport;

    Object.keys(self.KEY).forEach(function (key) {
      self.modifiers[self.KEY[key]] = false;
    });
  }

  MarqueeSelectionController.prototype = Object.create(THREE.EventDispatcher.prototype);

  /**
   * Build a quadtree index from the set of objects that are contained within
   * the camera frustum. Index each object by its projected screen coordinates.
   */
  MarqueeSelectionController.prototype.buildIndex = function () {
    // TODO perform indexing in a worker if possible
    var matrix, objs, self = this, total = 0;
    // clear the current index
    //self.quadtree.clear();
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
          if (child instanceof THREE.BufferGeometry) {
            total += self.indexBufferGeometryVertices(child, self.quadtree);
          } else if (child instanceof THREE.Points) {
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
    self.camera = self.viewport.getCamera();
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
    addListener(self.camera, 'update', self.onCameraUpdate);
    addListener(self.viewport, 'camera-change', self.onCameraChange);
    addListener(self.viewport.domElement, 'mousedown', self.onMouseDown);
    addListener(self.viewport.domElement, 'mousemove', self.onMouseMove);
    addListener(self.viewport.domElement, 'mouseup', self.onMouseUp);
    addListener(window, 'keydown', self.onKeyDown);
    addListener(window, 'keyup', self.onKeyUp);
    addListener(window, 'resize', self.onWindowResize);
    self.enabled = true;
    // FIXME the first time the index runs it appears to get every scene object
    self.buildIndex();
  };

  /**
   * Hide the selection marquee.
   */
  MarqueeSelectionController.prototype.hideMarquee = function () {
    this.marquee.setAttribute('style', 'display:none;');
  };

  /**
   * Index the THREE.BufferGeometry by its vertices.
   * @param {THREE.BufferGeometry} obj Scene object
   * @param {Quadtree} index Spatial index
   * @returns {number} Count of indexed entities
   */
  MarqueeSelectionController.prototype.indexBufferGeometryVertices = function (obj, index) {

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
    index.push({uuid: obj.uuid.slice(), x: x, y: y, height: height, width: width, index: -1, type: 'THREE.Object3D'});
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
        object: null,
        type: item.type,
        uuid: item.uuid
      };
    });
    // dispatch selection event
    if (this.selectAction === this.SELECT_ACTIONS.ADD) {
      this.dispatchEvent({type: 'add', selection: this.selection});
    } else if (this.selectAction === this.SELECT_ACTIONS.REMOVE) {
      this.dispatchEvent({type: 'remove', selection: this.selection});
    } else if (this.selectAction === this.SELECT_ACTIONS.SELECT) {
      this.dispatchEvent({type: 'select', selection: this.selection});
    }
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

}());