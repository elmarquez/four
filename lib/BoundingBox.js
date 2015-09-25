'use strict';

/**
 * Bounding box object.
 * @param {String} name Bounding box name
 * @param {String} type Bounding type identifier
 * @constructor
 */
function BoundingBox (name, type) {
  // TODO need some clarification about the role of name, type here
  this.center = new THREE.Vector3(0,0,0);
  this.width = 0;
  this.depth = 0;
  this.height = 0;
  this.radius = 0;
  this.envelope = new THREE.Box3(new THREE.Vector3(0,0,0), new THREE.Vector3(0,0,0));
  this.name = name;
  this.sceneObject = new THREE.Object3D();
  this.type = type || 'scene-bounding-box';
}

/**
 * Get the bounding box center.
 * @returns {THREE.Vector3}
 */
BoundingBox.prototype.getCenter = function () {
  return this.center;
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
  return this.radius;
};

/**
 * Get the bounding box scene object.
 * @returns {THREE.Object3D|*}
 */
BoundingBox.prototype.getSceneObject = function () {
  return this.sceneObject;
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
  self.width = 0;
  self.depth = 0;
  self.height = 0;
  self.radius = 0;
  self.envelope = new THREE.Box3(new THREE.Vector3(0,0,0), new THREE.Vector3(0,0,0));
};

/**
 * Set visibility.
 */
BoundingBox.prototype.setVisibility = function (visible) {
  this.sceneObject.visible = visible;
};

/**
 * Toggle visibility.
 */
BoundingBox.prototype.toggleVisibility = function () {
  // display the bounding box only if it has a volume greater than 0
  if (self.width !== 0 || self.depth !== 0 || self.height !== 0) {
    this.sceneObject.visible = !this.sceneObject.visible;
  }
};

/**
 * Update the bounding box geometry and position.
 * @param {Array} objects List of scene objects
 */
BoundingBox.prototype.update = function (objects) {
  var self = this;
  self.sceneObject.visible = true;
  // reset values to base case
  self.reset();
  // clear the existing bounding box object
  self.sceneObject.children.forEach(function (obj) {
    self.sceneObject.remove(obj);
  });
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
    if (self.width > self.depth) {
      self.radius = (self.width > self.height ? self.width : self.height) / 2;
    } else {
      self.radius = (self.depth > self.height ? self.depth : self.height) / 2;
    }
    // create a mesh to represent the bounding box volume
    var geom = new THREE.BoxGeometry(self.width, self.depth, self.height);
    var mesh = new THREE.Mesh(geom);
    // create a helper to visualize the bounding box
    var bbox = new THREE.BoxHelper(mesh);
    bbox.userData.type = self.type;
    // add the helper to the scene object
    self.sceneObject.add(bbox);
  } else {
    self.sceneObject.visible = false;
  }
  self.center = new THREE.Vector3(
      self.envelope.min.x + (self.width / 2),
      self.envelope.min.y + (self.depth / 2),
      self.envelope.min.z + (self.height / 2)
  );
  self.sceneObject.position.set(self.center.x, self.center.y, self.center.z);
};
