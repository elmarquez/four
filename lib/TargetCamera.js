'use strict';

var FOUR = FOUR || {};

/**
 * Needs to know about the scene, selection set(s)
 * Dependencies: selection set, bounding box, scene, path planning, THREE.TransformControls
 */
FOUR.TargetCamera = (function () {

    /**
     * Get the distance from P1 to P2.
     * @param {THREE.Vector3} p1 Point 1
     * @param {THREE.Vector3} p2 Point 2
     * @returns {Number} Distance
     */
    function distance (p1, p2) {
        var dx = Math.pow(p2.x + p1.x, 2);
        var dy = Math.pow(p2.y + p1.y, 2);
        var dz = Math.pow(p2.z + p1.z, 2);
        return Math.sqrt(dx + dy + dz);
    }

    function TargetCamera (fov, aspect, near, far) {
        THREE.PerspectiveCamera.call(this);
        var geometry, material, self = this;

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

        self.distance = 100;
        self.target = new THREE.Vector3(0, 0, self.distance); // world space position

        // camera motion planner
        self.planner = new FOUR.PathPlanner();

        // camera frustrum
        // TODO the frustrum needs to be positioned in world space coordinates
        self.frustrum = new THREE.CameraHelper(self);
        self.frustrum.visible = false;
        self.add(self.frustrum);

        // target
        // TODO the target helper needs to be positioned in world space coordinates
        // rather than camera space coordinates
        geometry = new THREE.BoxGeometry(1, 1, 1);
        material = new THREE.MeshBasicMaterial({color: 0x0000ff});
        self.targetHelper = new THREE.Mesh(geometry, material);
        self.targetHelper.position.set(0,0,-100); // relative to the camera?
        self.targetHelper.name = 'target';
        self.targetHelper.visible = false;
        self.add(self.targetHelper);

        // set default positions
        self.lookAt(self.target); // TODO need to be able to intercept this call

        self.distance = self.getDistance(self.position, self.target);
    };

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
     */
    TargetCamera.prototype.resetOrientation = function () {
        var self = this;
        return self.planner.tweenToOrientation(self, new THREE.Vector3(0,0,1), self.emit.bind(self));
    };

    TargetCamera.prototype.setDistance = function (dist) {
        console.log('update the camera distance from target');
        var offset, distance, next, self = this;
        // get the direction and current distance from the target to the camera
        offset = new THREE.Vector3().subVectors(self.position, self.target);
        distance = offset.length();
        // compute the new camera distance and position
        offset.setLength(dist);
        next = new THREE.Vector3().addVectors(self.target, offset);
        // move the camera to the new position
        return self.planner.tweenToPosition(
            self,
            new THREE.Vector3(next.x, next.y, next.z),
            self.target,
            self.emit.bind(self));
    };

    TargetCamera.prototype.setPosition = function (x, y, z) {
        var self = this;
        // TODO need to update the target!!!
        return self.planner.tweenToPosition(
            self,
            new THREE.Vector3(x, y, z),
            self.target,
            self.emit.bind(self));
    };

    TargetCamera.prototype.setPositionAndTarget = function (x, y, z, tx ,ty, tz) {
        var self = this;
        self.distance = distance(new THREE.Vector3(x,y,z), new THREE.Vector3(tx, ty, tz));
        return self.planner.tweenToPosition(
            self,
            new THREE.Vector3(x, y, z),
            new THREE.Vector3(tx, ty, tz),
            self.emit.bind(self));
    };

    /**
     * Set the camera target position. Animate the camera target to the new
     * target position.
     * @param {Number} x X coordinate
     * @param {Number} y Y coordinate
     * @param {Number} z Z coordinate
     */
    TargetCamera.prototype.setTarget = function (x, y, z) {
        var self = this;
        return self.planner.tweenToPosition(
            self,
            self.position,
            new THREE.Vector3(x, y, z),
            self.emit.bind(self));
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
        var cx = center.x; // new camera position
        var cy = center.y;
        var cz = center.z;
        var tx = center.x; // new camera target
        var ty = center.y;
        var tz = center.z;
        // reorient the camera relative to the bounding box
        if (view === self.VIEWS.TOP) {
            height = bbox.getYDimension();
            offset = (bbox.getZDimension() / 2);
            dist = height / 2 / Math.tan(Math.PI * self.fov / 360);
            cz = center.z + dist + offset;
        }
        else if (view === self.VIEWS.FRONT) {
            height = bbox.getZDimension();
            offset = (bbox.getYDimension() / 2);
            dist = height / 2 / Math.tan(Math.PI * self.fov / 360);
            cy = center.y - dist - offset;
        }
        else if (view === self.VIEWS.BACK) {
            height = bbox.getZDimension();
            offset = (bbox.getYDimension() / 2);
            dist = height / 2 / Math.tan(Math.PI * self.fov / 360);
            cy = center.y + dist + offset;
        }
        else if (view === self.VIEWS.RIGHT) {
            height = bbox.getZDimension();
            offset = (bbox.getXDimension() / 2);
            dist = height / 2 / Math.tan(Math.PI * self.fov / 360);
            cx = center.x + dist + offset;
        }
        else if (view === self.VIEWS.LEFT) {
            height = bbox.getZDimension();
            offset = (bbox.getXDimension() / 2);
            dist = height / 2 / Math.tan(Math.PI * self.fov / 360);
            cx = center.x - dist - offset;
        }
        else if (view === self.VIEWS.PERSPECTIVE) {
            cx = center.x - 50;
            cy = center.y - 50;
            cz = center.z + 50;
            tx = center.x;
            ty = center.y;
            tz = center.z;
        }
        self.planner.tweenToPosition(
            self,
            new THREE.Vector3(cx, cy, cz),
            new THREE.Vector3(tx, ty, tz),
            self.emit.bind(self));
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
        self.position.add(new THREE.Vector3(x, y, z));
        self.target.add(new THREE.Vector3(x, y, z));
        //self.emit('update');
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
        return self.planner.tweenToPosition(
            self,
            new THREE.Vector3(next.x, next.y, next.z),
            self.target,
            self.emit.bind(self));
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
        return self.planner.tweenToPosition(
            self,
            new THREE.Vector3(next.x, next.y, next.z),
            self.target,
            self.emit.bind(self));
    };

    /**
     * Zoom to fit the bounding box.
     * @param {BoundingBox} bbox Bounding box
     */
    TargetCamera.prototype.zoomToFit = function (bbox) {
        //console.log('zoom to fit all or selected items');
        var direction, distance, next, self = this;
        // get the direction from the target to the camera
        direction = new THREE.Vector3().subVectors(self.position, self.target);
        // get the distance required to fit all entities within the view
        distance = bbox.getRadius() / Math.tan(Math.PI * self.fov / 360);
        // compute the new camera position
        direction.setLength(distance);
        next = new THREE.Vector3().addVectors(bbox.getCenter(), direction);
        // move the camera to the new position
        return self.planner.tweenToPosition(
            self,
            new THREE.Vector3(next.x, next.y, next.z),
            bbox.getCenter(),
            self.emit.bind(self));
    };

    /**
     * Zoom the view to fit the window selection.
     */
    TargetCamera.prototype.zoomToWindow = function () {
        throw new Error('zoom in to window');
    };

    return TargetCamera;

}());
