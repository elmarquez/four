FOUR.TargetCamera = (function () {

    /**
     * The camera has a default position of 0,-1,0, a default target of 0,0,0 and
     * distance of 1.
     * @todo setters to intercept changes on position, target, distance properties
     * @todo setters to intercept changes on THREE.Camera properties
     */
    function TargetCamera (fov, aspect, near, far) {
        THREE.PerspectiveCamera.call(this);
        var self = this;

        self.MAXIMUM_DISTANCE = 10000;
        self.MINIMUM_DISTANCE = 1;
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

        self.distance = 1;
        self.position.set(0,-1,0);
        self.target = new THREE.Vector3(0, 0, 0);

        // camera motion planner
        self.planner = new FOUR.PathPlanner();

        // set defaults
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
        return this.distance;
    };

    /**
     * Get direction from camera to target.
     * @returns {THREE.Vector}
     */
    TargetCamera.prototype.getDirection = function () {
        return this.getOffset().normalize();
    };

    /**
     * Get offset from camera to target.
     * @returns {THREE.Vector}
     */
    TargetCamera.prototype.getOffset = function () {
        return new THREE.Vector3().subVectors(this.target, this.position);
    };

    /**
     * Get camera position.
     * @returns {THREE.Vector}
     */
    TargetCamera.prototype.getPosition = function () {
        return new THREE.Vector3().copy(this.position);
    };

    /**
     * Get camera target.
     * @returns {THREE.Vector}
     */
    TargetCamera.prototype.getTarget = function () {
        return new THREE.Vector3().copy(this.target);
    };

    /**
     * Reset camera orientation so that camera.up aligns with +Z.
     * @param {Function} progress Progress callback
     * @param {Boolean} animate Animate the change
     */
    TargetCamera.prototype.resetOrientation = function (progress, animate) {
        var self = this, up = new THREE.Vector3(0,0,1);
        animate = animate || false;
        if (animate) {
            return self.planner.tweenToOrientation(self, up, progress || self.emit.bind(self));
        } else {
            return self.setUp(up);
        }
    };

    /**
     * Set the distance from the camera to the target. Keep the target position
     * fixed and move the camera position as required.
     * @param {Number} distance Distance from target to camera
     * @param {Boolean} animate Animate the change
     * @returns {Promise}
     */
    TargetCamera.prototype.setDistance = function (distance, animate) {
        var offset = this.getOffset(), position, self = this;
        animate = animate || false;
        // ensure that the offset is not less than the minimum distance
        self.distance = distance < this.MINIMUM_DISTANCE ? this.MINIMUM_DISTANCE : distance;
        offset.setLength(self.distance);
        // the new camera position
        position = new THREE.Vector3().addVectors(offset.negate(), self.target);
        if (animate) {
            return self.tweenToPosition(position, self.target);
        } else {
            self.position.copy(position);
            self.lookAt(self.target);
            self.dispatchEvent({type:'update'});
            return Promise.resolve();
        }
    };

    // FIXME update this to set the target, rotate the camera toward it or just rotate the camera
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
        animate = animate || false;
        // direction from camera to new look at position
        offset = new THREE.Vector3().subVectors(lookAt, self.position);
        offset.setLength(self.distance);
        var target = new THREE.Vector3().addVectors(self.position, offset);
        return self.tweenToPosition(self.position, target);
    };

    /**
     * Move the camera to the specified position. Update the camera target.
     * Maintain the current distance.
     * @param {THREE.Vector3} position Position
     * @param {Boolean} animate Animate the change
     * @returns {Promise}
     */
    TargetCamera.prototype.setPosition = function (position, animate) {
        var offset = this.getOffset(), self = this, target;
        animate = animate || false;
        target = new THREE.Vector3().addVectors(offset, position);
        if (animate) {
            return self.tweenToPosition(position, target);
        } else {
            self.position.copy(position);
            self.target.copy(target);
            self.lookAt(self.target);
            self.distance = new THREE.Vector3().subVectors(self.position, self.target).length();
            self.dispatchEvent({type:'update'});
            return Promise.resolve();
        }
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
        return self.tweenToPosition(pos, target);
    };

    /**
     * Move the camera so that the target is at the specified position.
     * Maintain the current camera orientation and distance.
     * @param {THREE.Vector3} target Target position
     * @param {Boolean} animate Animate the change
     * @returns {Promise}
     */
    TargetCamera.prototype.setTarget = function (target, animate) {
        var offset = this.getOffset().negate(), position, self = this;
        animate = animate || false;
        position = new THREE.Vector3().addVectors(offset, target);
        if (animate) {
            return self.tweenToPosition(position, target);
        } else {
            self.position.copy(position);
            self.target.copy(target);
            self.lookAt(self.target);
            self.distance = new THREE.Vector3().subVectors(self.position, self.target).length();
            self.dispatchEvent({type:'update'});
            return Promise.resolve();
        }
    };

    /**
     * Set camera up direction.
     * @param {THREE.Vector3} vec Up direction
     */
    TargetCamera.prototype.setUp = function (vec, animate) {
        var self = this;
        animate = animate || false;
        self.up = vec;
        self.dispatchEvent({type:'update'});
        if (animate) {
            return Promise.resolve();
        } else {
            self.dispatchEvent({type:'update'});
            return Promise.resolve();
        }
    };

    /**
     * Move the camera to the predefined orientation. Ensure that the entire
     * bounding box is visible within the camera view.
     * @param {String} orientation Orientation
     * @param {BoundingBox} bbox View bounding box
     * @param {Boolean} animate Animate the change
     * @returns {Promise}
     */
    TargetCamera.prototype.setView = function (orientation, bbox, animate) {
        var center = bbox.getCenter(), direction = new THREE.Vector3(), distance, position, radius = bbox.getRadius(), self = this, target;
        animate = animate || false;
        // new camera position, target, direction, orientation
        position = new THREE.Vector3().copy(center);
        target = new THREE.Vector3().copy(center);
        distance = radius / Math.tan(Math.PI * self.fov / 360);
        // reorient the camera relative to the bounding box
        if (orientation === self.VIEWS.TOP) {
            position.z = center.z + distance;
            direction.set(0,0,-1);
        }
        else if (orientation === self.VIEWS.FRONT) {
            position.y = center.y - distance;
            direction.set(0,-1,0);
        }
        else if (orientation === self.VIEWS.BACK) {
            position.y = center.y + distance;
            direction.set(0,1,0);
        }
        else if (orientation === self.VIEWS.RIGHT) {
            position.x = center.x + distance;
            direction.set(-1,0,0);
        }
        else if (orientation === self.VIEWS.LEFT) {
            position.x = center.x - distance;
            direction.set(1,0,0);
        }
        else if (orientation === self.VIEWS.BOTTOM) {
            position.z = center.z - distance;
            direction.set(0,0,1);
        }
        else if (orientation === self.VIEWS.PERSPECTIVE) {
            position.set(center.x - 100, center.y - 100, center.z + 100);
            direction.set(1,1,-1);
        }
        if (animate) {
            return self.tweenToPosition(position, target);
        } else {
            self.position.copy(position);
            self.target.copy(target);
            self.lookAt(self.target);
            self.distance = new THREE.Vector3().subVectors(self.position, self.target).length();
            self.dispatchEvent({type:'update'});
            return Promise.resolve();
        }
    };

    /**
     * Tween camera up orientation.
     * @param {THREE.Euler} orientation
     * @returns {Promise}
     */
    TargetCamera.prototype.tweenToOrientation = function (orientation) {
        var self = this;
        return new Promise(function (resolve) {
            var start = { x: self.up.x, y: self.up.y, z: self.up.z };
            var finish = { x: orientation.x, y: orientation.y, z: orientation.z };
            var tween = new TWEEN.Tween(start).to(finish, 1000);
            tween.easing(TWEEN.Easing.Cubic.InOut);
            tween.onComplete(function () {
                self.up.set(this.x, this.y, this.z);
                self.dispatchEvent({type:'update'});
                self.dispatchEvent({type:'continuous-update-end'});
                resolve();
            });
            tween.onUpdate(function () {
                self.up.set(this.x, this.y, this.z);
                self.dispatchEvent({type:'update'});
            });
            tween.start();
            self.dispatchEvent({type:'continuous-update-start'});
        });
    };

    /**
     * Tween the camera to the specified position.
     * @param {THREE.Vector3} position New camera position
     * @param {THREE.Vector3} target New camera target position
     * @param {THREE.Quaternion} orientation New camera orientation
     * @returns {Promise}
     */
    TargetCamera.prototype.tweenToPosition = function (position, target, orientation) {
        var self = this;
        return new Promise(function (resolve) {
            // start and end tween values
            var start = {
                x: self.position.x, y: self.position.y, z: self.position.z,
                tx: self.target.x, ty: self.target.y, tz: self.target.z
            };
            var finish = {
                x: position.x, y: position.y, z: position.z,
                tx: target.x, ty: target.y, tz: target.z
            };
            // TODO calculate the animation duration
            var cameraDistance = new THREE.Vector3().subVectors(self.position, position).length;
            var targetDistance = new THREE.Vector3().subVectors(self.target, target).length();
            var distance = cameraDistance > targetDistance ? cameraDistance : targetDistance;
            // execute animation
            var tween = new TWEEN.Tween(start).to(finish, 1500);
            tween.easing(TWEEN.Easing.Cubic.InOut);
            tween.onComplete(function () {
                var d = this;
                self.position.set(d.x, d.y, d.z);
                self.target.set(d.tx, d.ty, d.tz);
                self.lookAt(self.target);
                self.distance = new THREE.Vector3().subVectors(self.position, self.target).length();
                self.dispatchEvent({type:'update'});
                self.dispatchEvent({type:'continuous-update-end'});
                resolve();
            });
            tween.onUpdate(function () {
                var d = this;
                self.position.set(d.x, d.y, d.z);
                self.target.set(d.tx, d.ty, d.tz);
                self.lookAt(self.target);
                self.distance = new THREE.Vector3().subVectors(self.position, self.target).length();
                self.dispatchEvent({type:'update'});
            });
            tween.start();
            self.dispatchEvent({type:'continuous-update-start'});
        });
    };

    /**
     * Zoom in incrementally.
     * @param {Boolean} animate Animate the change
     * @returns {Promise}
     */
    TargetCamera.prototype.zoomIn = function (animate) {
        var distance = this.getDistance() / this.ZOOM_FACTOR, offset, position, self = this;
        animate = animate || false;
        // ensure that the distance is never less than the minimum
        distance = distance <= this.MINIMUM_DISTANCE ? this.MINIMUM_DISTANCE : distance;
        if (animate) {
            offset = this.getOffset();
            offset.setLength(distance);
            position = new THREE.Vector3().addVectors(self.target, offset);
            return self.tweenToPosition(position, self.target);
        } else {
            self.setDistance(distance, false);
            return Promise.resolve();
        }
    };

    /**
     * Zoom out incrementally.
     * @param {Boolean} animate Animate the change
     * @returns {Promise}
     */
    TargetCamera.prototype.zoomOut = function (animate) {
        var distance = this.getDistance() * this.ZOOM_FACTOR, offset, position, self = this;
        // ensure that the distance is never greater than the maximum
        distance = distance >= this.MAXIMUM_DISTANCE ? this.MAXIMUM_DISTANCE : distance;
        animate = animate || false;
        if (animate) {
            offset = this.getOffset();
            offset.setLength(distance);
            position = new THREE.Vector3().addVectors(self.target, offset);
            return self.tweenToPosition(position, self.target);
        } else {
            self.setDistance(distance, false);
            return Promise.resolve();
        }
    };

    /**
     * Zoom to fit the bounding box.
     * @param {BoundingBox} bbox Bounding box
     * @param {Boolean} animate Animate the change
     * @returns {Promise}
     */
    TargetCamera.prototype.zoomToFit = function (bbox, animate) {
        var distance, offset = this.getOffset(), position, self = this, target;
        animate = animate || false;
        // get the distance required to fit all entities within the view
        distance = bbox.getRadius() / Math.tan(Math.PI * self.fov / 360);
        // move the camera to the new position
        if (animate) {
            offset.setLength(distance);
            target = bbox.getCenter();
            position = new THREE.Vector3().addVectors(target, offset);
            return self.tweenToPosition(position, target);
        } else {
            self.setDistance(distance);
            return Promise.resolve();
        }
    };

    return TargetCamera;

}());
