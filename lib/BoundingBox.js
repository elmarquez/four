'use strict';

/**
 *
 * @param selection Selection set
 * @constructor
 */
function BoundingBox (selection) {
  this.TYPE = 'scene-bounding-box';
  this.sceneObject = new THREE.Object3D();
  this.selection = null;
  this.visible = false;
}

/**
 * Get the bounding box scene object.
 * @returns {THREE.Object3D|*}
 */
BoundingBox.prototype.getSceneObject = function () {
  return this.sceneObject;
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
  this.sceneObject.visible = !this.sceneObject.visible;
};

/**
 * Update the bounding box geometry and position.
 */
BoundingBox.prototype.update = function () {
  var self = this;
  var envelope = new THREE.Box3(new THREE.Vector3(0,0,0), new THREE.Vector3(0,0,0));
  // clear the existing bounding box object
  self.sceneObject.children.forEach(function (obj) {
    self.sceneObject.remove(obj);
  });
  // update the bounding box
  self.selection.getObjects().forEach(function (obj) {
    // update bounding envelope
    var objEnv = new THREE.Box3(new THREE.Vector3(0,0,0), new THREE.Vector3(0,0,0));
    objEnv.setFromObject(obj);
    envelope.union(objEnv);
  });
  // bounding box dimensions
  var dx = envelope.max.x - envelope.min.x;
  var dy = envelope.max.y - envelope.min.y;
  var dz = envelope.max.z - envelope.min.z;
  // create a mesh to represent the bounding box volume
  var geom = new THREE.BoxGeometry(dx, dy, dz);
  var mesh = new THREE.Mesh(geom);
  // create a helper to visualize the bounding box
  var bbox = new THREE.BoxHelper(mesh);
  bbox.userData.type = me.TYPE;
  // add the helper to the scene object
  self.sceneObject.add(bbox);
  self.sceneObject.position.set(envelope.min.x + (dx / 2), envelope.min.y + (dy / 2), envelope.min.z + (dz / 2));
};
