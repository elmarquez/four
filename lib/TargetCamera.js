FOUR.TargetCamera = (function () {

    /**
     * The camera has a default position of 0,-1,0, a default target of 0,0,0 and
     * distance of 1.
     */
    function TargetCamera(fov, aspect, near, far) {
        THREE.PerspectiveCamera.call(this);
        var self = this;

        self.MAXIMUM_DISTANCE = far < 10000 ? far : 10000;
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
        self.position.set(0, -1, 0);
        self.target = new THREE.Vector3(0, 0, 0);

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
        this.distance = new THREE.Vector3().subVectors(this.position, this.target).length();
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
     * Handle window resize event.
     * @param {Object} event Event
     */
    TargetCamera.prototype.onWindowResize = function (event) {
        // FIXME implement
    };

    /**
     * Reset camera orientation so that camera.up aligns with +Z.
     * @param {Boolean} animate Animate the change
     * @returns {Promise}
     */
    TargetCamera.prototype.resetOrientation = function (animate) {
        var self = this, up = new THREE.Vector3(0, 0, 1);
        animate = animate || false;
        if (animate) {
            return self.tweenToOrientation(up);
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
            self.dispatchEvent({type: FOUR.EVENT.UPDATE});
            return Promise.resolve();
        }
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
        // FIXME use quaternions!!
        // FIXME update this to set the target, rotate the camera toward it or just rotate the camera
        var offset, self = this;
        animate = animate || false;
        // direction from camera to new look at position
        offset = new THREE.Vector3().subVectors(lookAt, self.position);
        offset.setLength(self.distance);
        var target = new THREE.Vector3().addVectors(self.position, offset);
        if (animate) {
            return self.tweenToPosition(self.position, target);
        } else {

        }
    };

    /**
     * Move the camera to the specified position. Update the camera target.
     * Maintain the current distance.
     * @param {THREE.Vector3} position Position
     * @param {Boolean} animate Animate the change
     * @returns {Promise}
     */
    TargetCamera.prototype.setPosition = function (position, animate) {
        animate = animate || false;
        var offset = this.getOffset(), self = this;
        var target = new THREE.Vector3().addVectors(offset, position);
        if (animate) {
            return self.tweenToPosition(position, target);
        } else {
            self.position.copy(position);
            self.target.copy(target);
            self.dispatchEvent({type: FOUR.EVENT.UPDATE});
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
        animate = animate || false;
        var offset = this.getOffset().negate(), self = this;
        var position = new THREE.Vector3().addVectors(offset, target);
        if (animate) {
            return self.tweenToPosition(position, target);
        } else {
            self.position.copy(position);
            self.target.copy(target);
            self.dispatchEvent({type: FOUR.EVENT.UPDATE});
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
        self.dispatchEvent({type: FOUR.EVENT.UPDATE});
        if (animate) {
            return Promise.resolve();
        } else {
            self.dispatchEvent({type: FOUR.EVENT.UPDATE});
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
        var center = bbox.getCenter(), direction = new THREE.Vector3(),
            distance, position, radius = bbox.getRadius(), rotation,
            self = this, target;
        animate = animate || false;
        // new camera position, target, direction, orientation
        position = new THREE.Vector3().copy(center);
        target = new THREE.Vector3().copy(center);
        distance = radius / Math.tan(Math.PI * self.fov / 360);
        // reorient the camera relative to the bounding box
        if (orientation === self.VIEWS.TOP) {
            position.z = center.z + distance;
            rotation = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, 0));
            direction.set(0, 0, -1);
        }
        else if (orientation === self.VIEWS.FRONT) {
            position.y = center.y - distance;
            rotation = new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.PI / 2, 0, 0));
            direction.set(0, -1, 0);
        }
        else if (orientation === self.VIEWS.BACK) {
            position.y = center.y + distance;
            rotation = new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.PI / 2, Math.PI, 0));
            direction.set(0, 1, 0);
        }
        else if (orientation === self.VIEWS.RIGHT) {
            position.x = center.x + distance;
            rotation = new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.PI / 2, Math.PI / 2, 0));
            direction.set(-1, 0, 0);
        }
        else if (orientation === self.VIEWS.LEFT) {
            position.x = center.x - distance;
            rotation = new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.PI / 2, Math.PI * 1.5, 0));
            direction.set(1, 0, 0);
        }
        else if (orientation === self.VIEWS.BOTTOM) {
            position.z = center.z - distance;
            direction.set(0, 0, 1);
        }
        else if (orientation === self.VIEWS.PERSPECTIVE) {
            position.set(center.x - 100, center.y - 100, center.z + 100);
            direction.set(1, 1, -1);
        }
        if (animate) {
            return self.tweenToPosition(position, target, rotation);
        } else {
            self.position.copy(position);
            self.target.copy(target);
            self.lookAt(self.target);
            self.distance = new THREE.Vector3().subVectors(self.position, self.target).length();
            self.dispatchEvent({type: FOUR.EVENT.UPDATE});
            return Promise.resolve();
        }
    };

    /**
     * Tween camera up orientation. This function will emit a continuous-update
     * event that is intended to signal the viewport to both continuously
     * render the camera view and tween the camera position. You must create an
     * event handler that listens for this event from the camera and then adds
     * and removes a render task from the viewport. The render task is
     * identified by the event id.
     * @param {THREE.Euler} orientation
     * @returns {Promise}
     */
    TargetCamera.prototype.tweenToOrientation = function (orientation) {
        var self = this;
        return new Promise(function (resolve) {
            var start = {x: self.up.x, y: self.up.y, z: self.up.z};
            var finish = {x: orientation.x, y: orientation.y, z: orientation.z};
            var tween = new TWEEN.Tween(start).to(finish, 1000);
            var taskId = THREE.Math.generateUUID();
            tween.easing(TWEEN.Easing.Cubic.InOut);
            tween.onComplete(function () {
                self.up.set(this.x, this.y, this.z);
                self.dispatchEvent({type: FOUR.EVENT.UPDATE});
                self.dispatchEvent({type: FOUR.EVENT.CONTINUOUS_UPDATE_END, id: taskId, task: 'tween-to-orientation'});
                resolve();
            });
            tween.onUpdate(function () {
                self.up.set(this.x, this.y, this.z);
                self.dispatchEvent({type: FOUR.EVENT.UPDATE});
            });
            tween.start();
            self.dispatchEvent({type: FOUR.EVENT.CONTINUOUS_UPDATE_START, id: taskId, task: 'tween-to-orientation'});
        });
    };

    /**
     * Tween the camera to the specified position.  This function will emit a
     * continuous-update event that is intended to signal the viewport to both
     * continuously render the camera view and tween the camera position. You
     * must create an event handler that listens for this event from the camera
     * and then adds and removes a render task from the viewport. The render
     * task is identified by the event id.
     * @param {THREE.Vector3} position Camera position
     * @param {THREE.Vector3} target Target position
     * @param {THREE.Quaternion} rotation Camera rotation
     * @returns {Promise}
     */
    TargetCamera.prototype.tweenToPosition = function (position, target, rotation) {
        var q1, q2, self = this;
        return new Promise(function (resolve) {
            // start and end tween values
            var start = {
                i: 0,
                x: self.position.x, y: self.position.y, z: self.position.z,
                tx: self.target.x, ty: self.target.y, tz: self.target.z
            };
            var finish = {
                i: 1,
                x: position.x, y: position.y, z: position.z,
                tx: target.x, ty: target.y, tz: target.z
            };
            // start/end rotation values
            if (rotation) {
                q1 = new THREE.Quaternion().copy(self.quaternion).normalize();
                q2 = rotation.normalize();
            }
            // TODO calculate the animation duration
            var cameraDistance = new THREE.Vector3().subVectors(self.position, position).length;
            var targetDistance = new THREE.Vector3().subVectors(self.target, target).length();
            var distance = cameraDistance > targetDistance ? cameraDistance : targetDistance;
            // execute animation
            var taskId = THREE.Math.generateUUID();
            var tween = new TWEEN.Tween(start).to(finish, 1500);
            tween.easing(TWEEN.Easing.Cubic.InOut);
            tween.onComplete(function () {
                var d = this;
                self.position.set(d.x, d.y, d.z);
                self.target.set(d.tx, d.ty, d.tz);
                if (rotation) {
                    THREE.Quaternion.slerp(q1, q2, self.quaternion, d.i);
                } else {
                    self.lookAt(self.target);
                }
                self.distance = new THREE.Vector3().subVectors(self.position, self.target).length();
                self.dispatchEvent({type: FOUR.EVENT.UPDATE, id: taskId});
                self.dispatchEvent({type: FOUR.EVENT.CONTINUOUS_UPDATE_END, id: taskId, task: 'tween-to-position'});
                resolve();
            });
            tween.onUpdate(function () {
                var d = this;
                self.position.set(d.x, d.y, d.z);
                self.target.set(d.tx, d.ty, d.tz);
                if (rotation) {
                    THREE.Quaternion.slerp(q1, q2, self.quaternion, d.i);
                } else {
                    self.lookAt(self.target);
                }
                self.distance = new THREE.Vector3().subVectors(self.position, self.target).length();
                self.dispatchEvent({type: FOUR.EVENT.UPDATE});
            });
            tween.start();
            self.dispatchEvent({type: FOUR.EVENT.CONTINUOUS_UPDATE_START, id: taskId, task: 'tween-to-position'});
        });
    };

    /**
     * Zoom in incrementally.
     * @param {Boolean} animate Animate the change
     * @returns {Promise}
     */
    TargetCamera.prototype.zoomIn = function (animate) {
        animate = animate || false;
        var distance = this.getDistance() / this.ZOOM_FACTOR, self = this;
        // ensure that the distance is never less than the minimum
        distance = distance <= this.MINIMUM_DISTANCE ? this.MINIMUM_DISTANCE : distance;
        return self.setDistance(distance, animate);
    };

    /**
     * Zoom out incrementally.
     * @param {Boolean} animate Animate the change
     * @returns {Promise}
     */
    TargetCamera.prototype.zoomOut = function (animate) {
        animate = animate || false;
        var distance = this.getDistance() * this.ZOOM_FACTOR, self = this;
        // ensure that the distance is never greater than the maximum
        distance = distance >= this.MAXIMUM_DISTANCE ? this.MAXIMUM_DISTANCE : distance;
        return self.setDistance(distance, animate);
    };

    /**
     * Zoom to fit the bounding box.
     * @param {BoundingBox} bbox Bounding box
     * @param {Boolean} animate Animate the change
     * @returns {Promise}
     */
    TargetCamera.prototype.zoomToFit = function (bbox, animate) {
        animate = animate || false;
        var distance, self = this;
        // get the distance required to fit all entities within the view
        distance = bbox.getRadius() / Math.tan(Math.PI * self.fov / 360);
        // move the camera to the new position
        return self.setTarget(bbox.getCenter(), animate).then(function () {
            return self.setDistance(distance, animate);
        });
    };

    return TargetCamera;

}());
