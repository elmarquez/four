/**
 * Needs to know about the scene, selection set(s)
 * Dependencies: selection set, bounding box, scene, path planning
 */
var TargetCamera = (function () {

    var TargetCamera = function () {};

    TargetCamera.prototype = Object.create(THREE.PerspectiveCamera.prototype);

    TargetCamera.prototype.constructor = function () {
        var geometry, material, self = this;

        self.VIEWS = {
            TOP: 0,
            LEFT: 1,
            RIGHT: 2,
            FRONT: 3,
            BACK: 4,
            PERSPECTIVE: 5
        };
        self.ZOOM_OUT_FACTOR = 1.5;

        self.planner = new PathPlanner();

        // camera target
        geometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
        material = new THREE.MeshBasicMaterial();
        self.target = new THREE.Mesh(geometry, material);
        self.target.name = 'target';
        self.target.visible = false;
        self.add(self.target);

        // TODO headlamp
        if (self.headlamp) {}

        // set default positions
        self.position.x = -100;
        self.position.y = -100;
        self.position.z = 100;
        self.up = new THREE.Vector3(0, 0, 1);
        self.lookAt(self.target.position);

        // update target distance
        self.distance = self.getDistance(self.position, self.target.position);
    };

    /**
     * Get the distance from P1 to P2.
     * @param {THREE.Vector3} p1 Point 1
     * @param {THREE.Vector3} p2 Point 2
     * @returns {Number} Distance
     */
    TargetCamera.prototype.getDistance = function (p1, p2) {
        var dx = Math.pow(p2.x + p1.x, 2);
        var dy = Math.pow(p2.y + p1.y, 2);
        var dz = Math.pow(p2.z + p1.z, 2);
        return Math.sqrt(dx + dy + dz);
    };

    /**
     * Hide the camera frustrum.
     */
    TargetCamera.prototype.hideFrustrum = function () {
        this.cameraHelper.visible = false;
    };

    /**
     * Hide the camera target.
     */
    TargetCamera.prototype.hideTarget = function () {
        this.target.visible = false;
    };

    /**
     * Set the camera target position. Animate the camera target to the new
     * target position.
     * @param {Number} x X coordinate
     * @param {Number} y Y coordinate
     * @param {Number} z Z coordinate
     * @param {Boolean} animate Animate the camera move to the new target
     */
    TargetCamera.prototype.setTargetPosition = function (x, y, z, animate) {
        var self = this;
        self.target.position.set(x, y, z);
        self.distance = self.getDistance(self.camera.position, self.target.position);
        if (animate) {
            // tween the camera and target positions
            self.planner.tweenPosition(cx, cy, cz, tx, ty, tz);
        }
    };

    /**
     * Move the camera to the predefined view position.
     * @param view
     * @param selection
     */
    TargetCamera.prototype.setView = function (view, selection) {
        var dist, height, offset = 10, self = this;
        // get the bounding box for the scene or selected entities
        var bbox = self.boundingBox;
        if (selection.count < 1) {
            bbox = new BoundingBox('temporary');
            bbox.update(self.scene.children);
        }
        var center = bbox.getCenter();
        var cx = center.x; // camera position
        var cy = center.y;
        var cz = center.z;
        var tx = center.x; // camera target
        var ty = center.y;
        var tz = center.z;
        var rx = self.camera.rotation.x; // camera rotation in radians
        var ry = self.camera.rotation.y;
        var rz = self.camera.rotation.z;
        // reorient the camera relative to the bounding box
        if (view === self.VIEWS.TOP) { // correct
            height = bbox.getYDimension();
            offset += (bbox.getZDimension() / 2);
            dist = height / 2 / Math.tan(Math.PI * self.camera.fov / 360);
            cz = center.z + dist + offset;
            rx = 0;
            ry = 0;
            rz = Math.PI * 2;
        }
        else if (view === self.VIEWS.FRONT) { // correct
            height = bbox.getZDimension();
            offset += (bbox.getYDimension() / 2);
            dist = height / 2 / Math.tan(Math.PI * self.camera.fov / 360);
            cy = center.y - dist - offset;
            rx = Math.PI / 2;
            ry = 0;
            rz = Math.PI * 2;
        }
        else if (view === self.VIEWS.BACK) { // upside down!
            height = bbox.getZDimension();
            offset += (bbox.getYDimension() / 2);
            dist = height / 2 / Math.tan(Math.PI * self.camera.fov / 360);
            cy = center.y + dist + offset;
            rx = -Math.PI / 2;
            ry = 0;
            rz = Math.PI;
        }
        else if (view === self.VIEWS.RIGHT) { // correct
            height = bbox.getZDimension();
            offset += (bbox.getXDimension() / 2);
            dist = height / 2 / Math.tan(Math.PI * self.camera.fov / 360);
            cx = center.x + dist + offset;
            rx = 0;
            ry = Math.PI / 2;
            rz = Math.PI / 2;
        }
        else if (view === self.VIEWS.LEFT) { // correct
            height = bbox.getZDimension();
            offset += (bbox.getXDimension() / 2);
            dist = height / 2 / Math.tan(Math.PI * self.camera.fov / 360);
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
        self.planner.tweenCameraToPosition(cx, cy, cz, tx, ty, tz, rx, ry, rz);
    };

    /**
     * Show the camera frustrum.
     */
    TargetCamera.prototype.showFrustrum = function () {
        var self = this;
        if (!self.cameraHelper) {
            self.cameraHelper = new THREE.CameraHelper(self);
            self.cameraHelper.visible = false;
            self.add(self.cameraHelper);
        }
        self.cameraHelper.visible = true;
    };

    /**
     * Show the camera target.
     */
    TargetCamera.prototype.showTarget = function () {
        this.target.visible = true;
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
        throw new Error('zoom out');
    };

    /**
     * Zoom to fit the selection set.
     * @param {Object} selection Selection set
     */
    TargetCamera.prototype.zoomToFit = function (selection) {
        console.log('zoom to fit all or selected items');
        var diff, dist, next, offset = 5, self = this, target;
        // the bounding box for entities that we will zoom to fit
        var bbox = self.boundingBox;
        if (self.selection.getObjects().length < 1) {
            bbox = new BoundingBox();
            bbox.update(self.scene.children);
        }
        // the offset from the current camera position to the new camera position
        dist = bbox.getRadius() / Math.tan(Math.PI * self.camera.fov / 360);
        target = new THREE.Vector3(0, 0, -(dist + offset)); // 100 is the distance from the camera to the target, measured along the Z axis
        target.applyQuaternion(self.camera.quaternion);
        target.add(self.camera.position);
        diff = new THREE.Vector3().subVectors(bbox.getCenter(), target);
        // the next camera position
        next = new THREE.Vector3().add(self.camera.position, diff);
        // move the camera to the next position
        self.tweenCameraToPosition(next.x, next.y, next.z, bbox.x, bbox.y, bbox.z);
    };

    return TargetCamera;

}());
