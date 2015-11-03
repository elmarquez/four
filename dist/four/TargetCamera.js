'use strict';

var FOUR = FOUR || {};

FOUR.TargetCamera = (function () {

    /**
     * @todo setters to intercept changes on position, target, distance properties
     * @todo setters to intercept changes on THREE.Camera properties
     */
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
        self.position.set(0,-1,0);
        self.distance = self.getDistance(self.position, self.target);
        self.lookAt(self.target);
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
        this.distance = new THREE.Vector3().subVectors(this.position, this.target).length();
        return this.distance;
    };

    TargetCamera.prototype.getTarget = function () {
        return this.target;
    };

    /**
     * Hide the camera frustrum.
     */
    TargetCamera.prototype.hideFrustrum = function () {
        this.frustrum.visible = false;
        this.dispatchEvent({type:'update'});
    };

    /**
     * Hide the camera target.
     */
    TargetCamera.prototype.hideTarget = function () {
        this.targetHelper.visible = false;
        this.dispatchEvent({type:'update'});
    };

    /**
     * Handle window resize.
     */
    TargetCamera.prototype.onWindowResize = function () {
        // TODO handle resize event
        throw new Error('not implemented');
    };

    /**
     * Reset camera orientation so that camera.up aligns with +Z.
     * @param {Function} progress Progress callback
     * @param {Boolean} animate Animate the change
     */
    TargetCamera.prototype.resetOrientation = function (progress, animate) {
        var self = this;
        return self.planner.tweenToOrientation(self, new THREE.Vector3(0,0,1), progress || self.emit.bind(self));
    };

    /**
     * Set the distance from the camera to the target. Keep the target position
     * fixed and move the camera position as required.
     * @param {Number} dist Distance from target to camera
     */
    TargetCamera.prototype.setDistance = function (dist) {
        //console.log('update the camera distance from target');
        var offset, next, self = this;
        self.distance = dist;
        // get the offset from the target to the camera
        offset = new THREE.Vector3().subVectors(self.position, self.target);
        if (offset.equals(new THREE.Vector3())) {
            offset.y = 1;
        }
        // compute the new camera position
        offset.setLength(dist);
        next = new THREE.Vector3().addVectors(self.target, offset);
        // set the position and lookAt direction
        self.position.copy(next);
        self.lookAt(self.target);
    };

    TargetCamera.prototype.setUp = function (vec) {
        this.up = vec;
        this.dispatchEvent({type:'update'});
    };

    /**
     * Orient the camera to look at the specified position. Keep the camera
     * distance the same as it currently is. Update the target position as
     * required. Animate the transition to the new orientation.
     * @param {THREE.Vector3} lookAt Look at direction
     * @param {Boolean} animate Animate the change
     * @returns {Promise}
     */
    TargetCamera.prototype.setLookAt = function (lookAt, animate) {
        var offset, self = this;
        // direction from camera to new look at position
        offset = new THREE.Vector3().subVectors(lookAt, self.position);
        offset.setLength(self.distance);
        var target = new THREE.Vector3().addVectors(self.position, offset);
        return self.planner.tweenToPosition(self, self.position, target, self.emit.bind(self));
    };

    /**
     * Move the camera to the specified position. Maintain the current target
     * position.
     * @param {THREE.Vector3} pos Position
     * @param {Boolean} animate Animate the change
     * @returns {Promise}
     */
    TargetCamera.prototype.setPosition = function (pos, animate) {
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
     * @param {Boolean} animate Animate the change
     * @returns {Promise}
     */
    TargetCamera.prototype.setPositionAndTarget = function (pos, target, animate) {
        var self = this;
        return self.planner.tweenToPosition(self, pos, target, self.emit.bind(self));
    };

    /**
     * Set the camera target. Maintain the distance from the camera to the
     * target.
     * @param {THREE.Vector3} target Target position
     * @param {Boolean} animate Animate the change
     * @returns {Promise}
     */
    TargetCamera.prototype.setTarget = function (target, animate) {
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
     * @param {Boolean} animate Animate the change
     * @returns {Promise}
     */
    TargetCamera.prototype.setView = function (view, bbox, animate) {
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
        this.dispatchEvent({type:'update'});
    };

    /**
     * Show the camera target.
     */
    TargetCamera.prototype.showTarget = function () {
        this.targetHelper.visible = true;
        this.dispatchEvent({type:'update'});
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
    TargetCamera.prototype.zoomIn = function (animate) {
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
    TargetCamera.prototype.zoomOut = function (animate) {
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
    TargetCamera.prototype.zoomToFit = function (bbox, animate) {
        //console.log('zoom to fit all or selected items');
        var distance, next, offset, self = this;
        // get the direction from the current target to the camera
        offset = new THREE.Vector3().subVectors(self.position, self.target);
        // get the distance required to fit all entities within the view
        distance = bbox.getRadius() / Math.tan(Math.PI * self.fov / 360);
        // compute the new camera position
        offset.setLength(distance);
        var center = bbox.getCenter();
        next = new THREE.Vector3().addVectors(bbox.getCenter(), offset);
        // move the camera to the new position
        return self.planner.tweenToPosition(self, next, bbox.getCenter(), self.emit.bind(self));
    };

    /**
     * Zoom the view to fit the window selection.
     */
    TargetCamera.prototype.zoomToWindow = function (animate) {
        throw new Error('zoom in to window');
    };

    return TargetCamera;

}());
