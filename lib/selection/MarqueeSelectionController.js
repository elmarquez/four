FOUR.MarqueeSelectionController = (function () {

  /**
   * Marquees selection controller. A wholesale copy of Josh Staples' cached
   * marquee selection implementation.
   * @see http://blog.tempt3d.com/2013/12/cached-marquee-selection-with-threejs.html
   * @see http://tempt3d.com/webgl-code-samples/canvas-interaction/marquee-select-with-cache.html
   * @param {Object} config Configuration
   * @constructor
   */
  function MarqueeSelectionController (config) {
    THREE.EventDispatcher.call(this);
    config = config || {};
    var self = this;

    self.KEY = {ALT: 18, CTRL: 17, SHIFT: 16};
    self.MOUSE_STATE = {DOWN: 0, UP: 1};

    self.cache = new FOUR.SelectionCache(); // FIXME wants 'context' object
    self.domElement = config.viewport.domElement;
    self.enabled = false;
    self.filter = function () { return true; };
    self.filters = {};
    self.intersects = [];
    self.listeners = {};
    self.marquee = document.getElementById('marquee');
    self.modifiers = {};
    self.mouse = {
      end: new THREE.Vector2(),
      start: new THREE.Vector2(),
      state: self.MOUSE_STATE.UP
    };
    self.offset = {};
    self.raycaster = new THREE.Raycaster();
    self.timeout = null;
    self.viewport = config.viewport;

    Object.keys(self.KEY).forEach(function (key) {
      self.modifiers[self.KEY[key]] = false;
    });
  }

  MarqueeSelectionController.prototype = Object.create(THREE.EventDispatcher.prototype);

  MarqueeSelectionController.prototype.contextMenu = function (event) {
    event.preventDefault();
  };

  MarqueeSelectionController.prototype.disable = function () {
    var self = this;
    self.enabled = false;
    Object.keys(self.listeners).forEach(function (key) {
      var listener = self.listeners[key];
      listener.element.removeEventListener(listener.event, listener.fn);
    });
  };

  MarqueeSelectionController.prototype.enable = function () {
    var self = this;
    self.offset.x = self.domElement.clientLeft;
    self.offset.y = self.domElement.clientTop;
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

  MarqueeSelectionController.prototype.findBounds = function (pos1, pos2) {
    // calculating the origin and vector.
    var origin = {}, delta = {};

    if (pos1.y < pos2.y) {
      origin.y = pos1.y;
      delta.y = pos2.y - pos1.y;
    } else {
      origin.y = pos2.y;
      delta.y = pos1.y - pos2.y;
    }

    if (pos1.x < pos2.x) {
      origin.x = pos1.x;
      delta.x = pos2.x - pos1.x;
    } else {
      origin.x = pos2.x;
      delta.x = pos1.x - pos2.x;
    }
    return ({origin: origin, delta: delta});
  };

  MarqueeSelectionController.prototype.findCubesByVertices = function (location) {
    var currentMouse = {},
      mouseInitialDown = {},
      units,
      bounds,
      inside = false,
      selectedUnits = [],
      dupeCheck = {};

    currentMouse.x = location.x;
    currentMouse.y = location.y;

    mouseInitialDown.x = (this.mouseDownCoords.x - this.offset.x);
    mouseInitialDown.y = (this.mouseDownCoords.y - this.offset.y);

    units = this.context.cache.getUnitVertCoordinates();
    bounds = this.findBounds(currentMouse, this.mouseDownCoords);

    for (var i = 0; i < units.length; i++) {
      inside = this.withinBounds(units[i].pos, bounds);
      if(inside && (dupeCheck[units[i].id] === undefined)) {
        selectedUnits.push(units[i]);
        dupeCheck[units[i].name] = true;
      }
    }
    return selectedUnits;
  };

  MarqueeSelectionController.prototype.onContextMenu = function () {};

  MarqueeSelectionController.prototype.onKeyDown = function (event) {
    // TODO add, remove elements from selection set depending on pressed keys
  };

  MarqueeSelectionController.prototype.onKeyUp = function (event) {};

  MarqueeSelectionController.prototype.onMouseDown = function (event) {
    event.preventDefault();
    var pos = {};
    this.mouseDown = true;
    this.mouseDownCoords = { x: event.clientX, y: event.clientY };
    // adjust the mouse select
    pos.x = ((event.clientX - this.offset.x) / this.domElement.clientWidth) * 2 -1;
    pos.y = -((event.clientY - this.offset.y) / this.domElement.clientHeight) * 2 + 1;
    var vector = new THREE.Vector3(pos.x, pos.y, 1);
    this.context.projector.unprojectVector(vector, this.context.cameras.liveCam);
  };

  MarqueeSelectionController.prototype.onMouseMove = function (event) {
    event.preventDefault();
    event.stopPropagation();
    // make sure we are in a select mode.
    if(this.mouseDown){
      this.marquee.fadeIn();
      var pos = {};
      pos.x = event.clientX - this.mouseDownCoords.x;
      pos.y = event.clientY - this.mouseDownCoords.y;
      // square variations
      // (0,0) origin is the TOP LEFT pixel of the canvas.
      //
      //  1 | 2
      // ---.---
      //  4 | 3
      // there are 4 ways a square can be gestured onto the screen.  the following detects these four variations
      // and creates/updates the CSS to draw the square on the screen
      if (pos.x < 0 && pos.y < 0) {
        this.marquee.css({left: event.clientX + 'px', width: -pos.x + 'px', top: event.clientY + 'px', height: -pos.y + 'px'});
      } else if ( pos.x >= 0 && pos.y <= 0) {
        this.marquee.css({left: this.mouseDownCoords.x + 'px',width: pos.x + 'px', top: event.clientY, height: -pos.y + 'px'});
      } else if (pos.x >= 0 && pos.y >= 0) {
        this.marquee.css({left: this.mouseDownCoords.x + 'px', width: pos.x + 'px', height: pos.y + 'px', top: this.mouseDownCoords.y + 'px'});
      } else if (pos.x < 0 && pos.y >= 0) {
        this.marquee.css({left: event.clientX + 'px', width: -pos.x + 'px', height: pos.y + 'px', top: this.mouseDownCoords.y + 'px'});
      }
      var selectedCubes = this.findCubesByVertices({x: event.clientX, y: event.clientY});
      this.highlight(selectedCubes);
    }
  };

  MarqueeSelectionController.prototype.onMouseUp = function (event) {
    event.preventDefault();
    event.stopPropagation();
    this.resetMarquee();
  };

  MarqueeSelectionController.prototype.resetMarquee = function () {
    this.mouseUp = true;
    this.mouseDown = false;
    this.marquee.fadeOut();
    this.marquee.css({width: 0, height: 0});
    this.mouseDownCoords = {};
  };

  MarqueeSelectionController.prototype.setFilter = function () {};

  MarqueeSelectionController.prototype.update = function () {}; // do nothing

  /**
   * Checks to see if the unprojected vertex position is within the bounds of
   * the marquee selection.
   */
  MarqueeSelectionController.prototype.withinBounds = function (pos, bounds) {
    var ox = bounds.origin.x,
      dx = bounds.origin.x + bounds.delta.x,
      oy = bounds.origin.y,
      dy = bounds.origin.y + bounds.delta.y;
    if((pos.x >= ox) && (pos.x <= dx)) {
      if((pos.y >= oy) && (pos.y <= dy)) {
        return true;
      }
    }
    return false;
  };

  /**
   *   Change a group of meshes to random colors.
   */
  MarqueeSelectionController.prototype.highlight = function (meshes) {
    for (var i = 0; i < meshes.length; i++) {
      meshes[i].mesh.material.color = this.randomColor();
    }
  };

  /**
   *  Create a random color
   */
  MarqueeSelectionController.prototype.randomColor = function () {
    //cleverness via Paul Irish et al.  Thx Internets!
    return new THREE.Color().setHex('0x' + ('000000' + Math.floor(Math.random()*16777215).toString(16)).slice(-6));
  };

  return MarqueeSelectionController;

}());
