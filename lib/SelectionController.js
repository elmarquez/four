'use strict';

var SelectionControl = (function () {

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

    self.enabled = config.enabled || false;
    self.mouse = new THREE.Vector2();
    self.raycaster = new THREE.Raycaster();
    self.selection = config.viewport.scene.selection;
    self.viewport = config.viewport;

    // listen for events
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
    console.log('select by mouse');
    event.preventDefault();
    event.stopPropagation();
    var self = this;
    if (self.enabled) {
      // calculate mouse position in normalized device coordinates (-1 to +1)
      self.mouse.x = (event.clientX / self.viewport.domElement.clientWidth) * 2 - 1;
      self.mouse.y = -(event.clientY / self.viewport.domElement.clientHeight) * 2 + 1;
      // update the picking ray with the camera and mouse position
      self.raycaster.setFromCamera(self.mouse, self.viewport.camera);
      // calculate objects intersecting the picking ray
      // TODO filter self.scene.children to prevent selection of a non-geometric objects
      var intersects = self.raycaster.intersectObjects(self.viewport.scene.children, true) || [];
      // update the selection set using only the nearest selected object
      var objs = intersects && intersects.length > 0 ? [intersects[0].object] : [];
      // add objects
      if (self.viewport.modifiers.SHIFT) {
        self.selection.addAll(objs);
      }
      // remove objects
      else if (self.viewport.modifiers.ALT) {
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
    this.selection.addAll(self.viewport.scene.children);
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
