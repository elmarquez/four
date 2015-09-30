/* global Mousetrap, THREE, TWEEN */
/* jshint unused:false */
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

    var TargetCamera = function (fov, aspect, near, far) {
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

    TargetCamera.prototype.setDistance = function (dist) {
        console.log('update the camera distance from target');
        // compute position using target as anchor point
    };

    TargetCamera.prototype.setPosition = function (x, y, z) {
      // update target
        // transition
    };

    TargetCamera.prototype.setPositionAndTarget = function (x, y, z, tx ,ty, tz) {
        var self = this;
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
        throw new Error('not implemented');
        //var self = this;
        //var direction = new THREE.Vector3().subVectors(self.target, self.position);
        //self.target.set(x, y, z);
        //var position = new THREE.Vector3().addVectors(self.target, direction);
        //self.distance = distance(position, self.target);
        //return self.planner.tweenToPosition(
        //    self,
        //    new THREE.Vector3(cx, cy, cz),
        //    new THREE.Vector3(tx, ty, tz),
        //    self.emit.bind(self));
    };

    /**
     * Move the camera to the predefined view position.
     * @param {Number} view View
     * @param {BoundingBox} bbox View bounding box
     */
    TargetCamera.prototype.setView = function (view, bbox) {
        var dist, height, offset = 10, self = this;
        var center = bbox.getCenter();
        var cx = center.x; // new camera position
        var cy = center.y;
        var cz = center.z;
        var tx = center.x; // new camera target
        var ty = center.y;
        var tz = center.z;
        var rx = self.rotation.x; // camera rotation in radians
        var ry = self.rotation.y;
        var rz = self.rotation.z;
        // reorient the camera relative to the bounding box
        if (view === self.VIEWS.TOP) {
            height = bbox.getYDimension();
            offset += (bbox.getZDimension() / 2);
            dist = height / 2 / Math.tan(Math.PI * self.fov / 360);
            cz = center.z + dist + offset;
            rx = 0;
            ry = 0;
            rz = Math.PI * 2;
        }
        else if (view === self.VIEWS.FRONT) {
            height = bbox.getZDimension();
            offset += (bbox.getYDimension() / 2);
            dist = height / 2 / Math.tan(Math.PI * self.fov / 360);
            cy = center.y - dist - offset;
            rx = Math.PI / 2;
            ry = 0;
            rz = Math.PI * 2;
        }
        else if (view === self.VIEWS.BACK) {
            height = bbox.getZDimension();
            offset += (bbox.getYDimension() / 2);
            dist = height / 2 / Math.tan(Math.PI * self.fov / 360);
            cy = center.y + dist + offset;
            rx = -Math.PI / 2;
            ry = 0;
            rz = Math.PI;
        }
        else if (view === self.VIEWS.RIGHT) {
            height = bbox.getZDimension();
            offset += (bbox.getXDimension() / 2);
            dist = height / 2 / Math.tan(Math.PI * self.fov / 360);
            cx = center.x + dist + offset;
            rx = 0;
            ry = Math.PI / 2;
            rz = Math.PI / 2;
        }
        else if (view === self.VIEWS.LEFT) {
            height = bbox.getZDimension();
            offset += (bbox.getXDimension() / 2);
            dist = height / 2 / Math.tan(Math.PI * self.fov / 360);
            cx = center.x - dist - offset;
            rx = 0;
            ry = -Math.PI / 2;
            rz = -Math.PI / 2;
        }
        else if (view === self.VIEWS.PERSPECTIVE) {
            cx = center.x - 50;
            cy = center.y - 50;
            cz = center.z + 50;
            tx = center.x;
            ty = center.y;
            tz = center.z;
            rx = Math.PI / 8;
            ry = -Math.PI / 4;
            rz = -Math.PI / 4;
        }
        self.planner.tweenToPosition(
            self,
            new THREE.Vector3(cx, cy, cz),
            new THREE.Vector3(tx, ty, tz),
            self.emit.bind(self));
        //self.planner.tweenToPositionAndRotation(
        //    self,
        //    new THREE.Vector3(cx, cy, cz),
        //    new THREE.Vector3(tx, ty, tz),
        //    new THREE.Euler(rx, ry, rz),
        //    self.emit.bind(self));
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

    /**
     * Zoom in incrementally.
     */
    TargetCamera.prototype.zoomIn = function () {
        console.log('zoom in');
        var self = this;
        var dist = self.distance / self.ZOOM_FACTOR;
    };

    /**
     * Zoom the view to fit the window selection.
     */
    TargetCamera.prototype.zoomInToWindow = function () {
        throw new Error('zoom in to window');
    };

    /**
     * Zoom out incrementally.
     */
    TargetCamera.prototype.zoomOut = function () {
        console.log('zoom out');
        var self = this;
        var dist = self.distance * self.ZOOM_FACTOR;
    };

    /**
     * Zoom to fit the bounding box.
     * @param {BoundingBox} bbox Bounding box
     */
    TargetCamera.prototype.zoomToFit = function (bbox) {
        console.log('zoom to fit all or selected items');
        var diff, dist, next, offset = 5, self = this, target;
        // the offset from the current camera position to the new camera position
        dist = bbox.getRadius() / Math.tan(Math.PI * self.fov / 360);
        target = new THREE.Vector3(0, 0, -(dist + offset)); // 100 is the distance from the camera to the target, measured along the Z axis
        target.applyQuaternion(self.quaternion);
        target.add(self.position);
        var center = bbox.getCenter();
        diff = new THREE.Vector3().subVectors(bbox.getCenter(), target);
        // the next camera position
        next = new THREE.Vector3().add(self.position, diff);
        // move the camera to the next position
        return self.planner.tweenToPosition(
            self,
            new THREE.Vector3(next.x, next.y, next.z),
            new THREE.Vector3(bbox.x, bbox.y, bbox.z),
            self.emit.bind(self));
    };

    return TargetCamera;

}());
