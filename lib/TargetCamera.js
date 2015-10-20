'use strict';

var FOUR = FOUR || {};

/**
 * Needs to know about the scene, selection set(s)
 * Dependencies: selection set, bounding box, scene, path planning, THREE.TransformControls
 */
FOUR.TargetCamera = (function () {

    function TargetCamera (fov, aspect, near, far) {
        THREE.PerspectiveCamera.call(this);
        var self = this;

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

        self.distance = 0;
        self.target = new THREE.Vector3(0, 0, 0);

        // camera motion planner
        self.planner = new FOUR.PathPlanner();

        // set default target and distance values
        self.distance = self.getDistance(self.position, self.target);
        self.lookAt(self.target); // TODO need to be able to intercept this call
    }

    TargetCamera.prototype = Object.create(THREE.PerspectiveCamera.prototype);

    TargetCamera.prototype.constructor = TargetCamera;

    /**
     * Dispatch event.
     */
    TargetCamera.prototype.emit = function (event) {
        this.dispatchEvent({type: event});
    };

    TargetCamera.prototype.getDistance = function () {
        return this.distance;
    };

    TargetCamera.prototype.getTarget = function () {
        return this.target;
    };

    TargetCamera.prototype.handleResize = function () {
        // TODO handle resize event
        throw new Error('not implemented');
    };

    /**
     * Hide the camera frustrum.
     */
    TargetCamera.prototype.hideFrustrum = function () {
        this.frustrum.visible = false;
        this.emit('update');
    };

    /**
     * Hide the camera target.
     */
    TargetCamera.prototype.hideTarget = function () {
        this.targetHelper.visible = false;
        this.emit('update');
    };

    /**
     * Reset camera orientation so that camera.up aligns with +Z.
     * @param {Function} progress Progress callback
     */
    TargetCamera.prototype.resetOrientation = function (progress) {
        var self = this;
        return self.planner.tweenToOrientation(self, new THREE.Vector3(0,0,1), progress || self.emit.bind(self));
    };

    /**
     * Set the distance from the camera to the target. Keep the target position
     * fixed and move the camera position as required.  Animate the transition
     * to the new orientation.
     * @param {Number} dist Distance from target to camera
     * @returns {Promise}
     */
    TargetCamera.prototype.setDistance = function (dist) {
        //console.log('update the camera distance from target');
        var offset, next, self = this;
        self.distance = dist;
        // get the direction from the target to the camera
        offset = new THREE.Vector3().subVectors(self.position, self.target);
        // compute the new camera position
        offset.setLength(self.distance);
        next = new THREE.Vector3().addVectors(self.target, offset);
        // move the camera to the new position
        return self.planner.tweenToPosition(self, next, self.target, self.emit.bind(self));
    };

    TargetCamera.prototype.setUp = function (vec) {
        this.up = vec;
        this.emit('update');
    };

    /**
     * Orient the camera to look at the specified position. Keep the camera
     * distance the same as it currently is. Update the target position as
     * required. Animate the transition to the new orientation.
     * @param {THREE.Vector3} lookAt Look at direction
     * @returns {Promise}
     */
    TargetCamera.prototype.setLookAt = function (lookAt) {
        var direction, self = this, target;
        // direction from camera to look at position
        direction = new THREE.Vector3().subVectors(self.position, lookAt);
        target = direction.length(self.distance);
        return self.setTarget(target);
    };

    /**
     * Move the camera to the specified position. Maintain the current target
     * position.
     * @param {THREE.Vector3} pos Position
     * @returns {Promise}
     */
    TargetCamera.prototype.setPosition = function (pos) {
        var offset, self = this, target;
        // offset from current position to new position
        offset = new THREE.Vector3().subVectors(self.position, pos);
        target = new THREE.Vector3().addVectors(self.target, offset);
        return self.planner.tweenToPosition(self, pos, target, self.emit.bind(self));
    };

    /**
     * Set camera position and target. Animate the transition.
     * @param {THREE.Vector3} pos Camera position
     * @param {THREE.Vector3} target Target position
     * @returns {Promise}
     */
    TargetCamera.prototype.setPositionAndTarget = function (pos, target) {
        var self = this;
        return self.planner.tweenToPosition(self, pos, target, self.emit.bind(self));
    };

    /**
     * Set the camera target. Maintain the distance from the camera to the
     * target.
     * @param {THREE.Vector3} target Target position
     * @returns {Promise}
     */
    TargetCamera.prototype.setTarget = function (target) {
        var offset, next, self = this;
        // get the current direction from the target to the camera
        offset = new THREE.Vector3().subVectors(self.position, self.target);
        offset.length(self.distance);
        // compute the new camera position
        next = new THREE.Vector3().addVectors(target, offset);
        // move the camera to the new position
        return self.planner.tweenToPosition(self, next, target, self.emit.bind(self));
    };

    /**
     * Move the camera to the predefined view position. Ensure that the entire
     * bounding box is visible within the camera view.
     * @param {String} view View
     * @param {BoundingBox} bbox View bounding box
     */
    TargetCamera.prototype.setView = function (view, bbox) {
        var dist, height, offset, self = this;
        var center = bbox.getCenter();
        // new camera position and target
        var pos = new THREE.Vector3(center.x, center.y, center.z);
        var target = new THREE.Vector3(center.x, center.y, center.z);
        // reorient the camera relative to the bounding box
        if (view === self.VIEWS.TOP) {
            height = bbox.getYDimension();
            offset = (bbox.getZDimension() / 2);
            dist = height / 2 / Math.tan(Math.PI * self.fov / 360);
            pos.z = center.z + dist + offset;
        }
        else if (view === self.VIEWS.FRONT) {
            height = bbox.getZDimension();
            offset = (bbox.getYDimension() / 2);
            dist = height / 2 / Math.tan(Math.PI * self.fov / 360);
            pos.y = center.y - dist - offset;
        }
        else if (view === self.VIEWS.BACK) {
            height = bbox.getZDimension();
            offset = (bbox.getYDimension() / 2);
            dist = height / 2 / Math.tan(Math.PI * self.fov / 360);
            pos.y = center.y + dist + offset;
        }
        else if (view === self.VIEWS.RIGHT) {
            height = bbox.getZDimension();
            offset = (bbox.getXDimension() / 2);
            dist = height / 2 / Math.tan(Math.PI * self.fov / 360);
            pos.x = center.x + dist + offset;
        }
        else if (view === self.VIEWS.LEFT) {
            height = bbox.getZDimension();
            offset = (bbox.getXDimension() / 2);
            dist = height / 2 / Math.tan(Math.PI * self.fov / 360);
            pos.x = center.x - dist - offset;
        }
        else if (view === self.VIEWS.PERSPECTIVE) {
            pos.set(center.x - 100, center.y - 100, center.z + 100);
        }
        self.planner.tweenToPosition(self, pos, target, self.emit.bind(self));
    };

    /**
     * Show the camera frustrum.
     */
    TargetCamera.prototype.showFrustrum = function () {
        var self = this;
        self.frustrum.visible = true;
        this.emit('update');
    };

    /**
     * Show the camera target.
     */
    TargetCamera.prototype.showTarget = function () {
        this.targetHelper.visible = true;
        this.emit('update');
    };

    TargetCamera.prototype.translate = function (x, y, z) {
        var self = this;
        var pos = new THREE.Vector3(x, y, z);
        var target = new THREE.Vector3(x, y, z);
        self.planner.tweenToPosition(self, pos, target, self.emit.bind(self));
    };

    /**
     * Zoom in incrementally.
     */
    TargetCamera.prototype.zoomIn = function () {
        //console.log('zoom in');
        var offset, distance, next, self = this;
        // get the direction and current distance from the target to the camera
        offset = new THREE.Vector3().subVectors(self.position, self.target);
        distance = offset.length();
        // compute the new camera distance and position
        offset.setLength(distance / self.ZOOM_FACTOR);
        next = new THREE.Vector3().addVectors(self.target, offset);
        // move the camera to the new position
        return self.planner.tweenToPosition(self, next, self.target, self.emit.bind(self));
    };

    /**
     * Zoom out incrementally.
     */
    TargetCamera.prototype.zoomOut = function () {
        //console.log('zoom out');
        var offset, distance, next, self = this;
        // get the direction and current distance from the target to the camera
        offset = new THREE.Vector3().subVectors(self.position, self.target);
        distance = offset.length();
        // compute the new camera distance and position
        offset.setLength(distance * self.ZOOM_FACTOR);
        next = new THREE.Vector3().addVectors(self.target, offset);
        // move the camera to the new position
        return self.planner.tweenToPosition(self, next, self.target, self.emit.bind(self));
    };

    /**
     * Zoom to fit the bounding box.
     * @param {BoundingBox} bbox Bounding box
     */
    TargetCamera.prototype.zoomToFit = function (bbox) {
        //console.log('zoom to fit all or selected items');
        var distance, next, offset, self = this;
        // get the direction from the current target to the camera
        offset = new THREE.Vector3().subVectors(self.position, self.target);
        // get the distance required to fit all entities within the view
        distance = bbox.getRadius() / Math.tan(Math.PI * self.fov / 360);
        // compute the new camera position
        offset.setLength(distance);
        next = new THREE.Vector3().addVectors(bbox.getCenter(), offset);
        // move the camera to the new position
        return self.planner.tweenToPosition(self, next, bbox.getCenter(), self.emit.bind(self));
    };

    /**
     * Zoom the view to fit the window selection.
     */
    TargetCamera.prototype.zoomToWindow = function () {
        throw new Error('zoom in to window');
    };

    return TargetCamera;

}());
