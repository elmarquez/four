'use strict';

var FOUR = FOUR || {};

FOUR.SelectionControl = (function () {

  var _self; // TODO get rid of this ... its a bit hackish

  /**
   * Scene object selection control. Emits 'update' events when the selection
   * set changes.
   * @param {Object} config Configuration
   * @constructor
   */
  function SelectionControl (config) {
    THREE.EventDispatcher.call(this);
    config = config || {};
    var self = _self = this;
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
    return self.selection.getObjects().length;
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
    this.selection.addAll(self.viewport.scene.model.children);
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
