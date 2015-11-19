'use strict';

var FOUR = FOUR || {};

/**
 * Camera rotation controller. Rotation can be performed using the middle
 * mouse button or the combination of a keypress, left mouse button down and
 * mouse move. A reimplementation of the THREE.OrbitController.
 * @see http://threejs.org/examples/js/controls/OrbitControls.js
 */
FOUR.RotateController = (function () {

    function OrbitConstraint (camera) {

        this.camera = camera;

        this.maxDistance = Infinity;
        this.minDistance = 1;

        // How far you can orbit vertically, upper and lower limits.
        // Range is 0 to Math.PI radians.
        this.minPolarAngle = 0; // radians
        this.maxPolarAngle = Math.PI; // radians

        // How far you can orbit horizontally, upper and lower limits.
        // If set, must be a sub-interval of the interval [ - Math.PI, Math.PI ].
        this.minAzimuthAngle = - Infinity; // radians
        this.maxAzimuthAngle = Infinity; // radians

        // Set to true to enable damping (inertia)
        // If damping is enabled, you must call controls.update() in your animation loop
        this.enableDamping = false;
        this.dampingFactor = 0.25;

        ////////////
        // internals

        var scope = this;

        var EPS = 0.000001;

        // Current position in spherical coordinate system.
        var theta;
        var phi;

        // Pending changes
        var phiDelta = 0;
        var thetaDelta = 0;
        var scale = 1;

        // Previously located in the update() closure. moved here so that we can
        // reset them when needed
        var offset = new THREE.Vector3();

        // so camera.up is the orbit axis
        var quat = new THREE.Quaternion().setFromUnitVectors(camera.up, new THREE.Vector3(0, 1, 0));
        var quatInverse = quat.clone().inverse();

        var lastPosition = new THREE.Vector3();
        var lastQuaternion = new THREE.Quaternion();

        //---------------------------------------------------------------------
        // API

        this.getPolarAngle = function () {
            return phi;
        };

        this.getAzimuthalAngle = function () {
            return theta;
        };

        this.rotateLeft = function (angle) {
            thetaDelta -= angle;
        };

        this.rotateUp = function (angle) {
            phiDelta -= angle;
        };

        this.update = function () {
            var position = this.camera.position;
            offset.copy(position).sub(this.camera.target);
            // rotate offset to "y-axis-is-up" space
            offset.applyQuaternion(quat);
            // angle from z-axis around y-axis
            theta = Math.atan2(offset.x, offset.z);
            // angle from y-axis
            phi = Math.atan2(Math.sqrt(offset.x * offset.x + offset.z * offset.z), offset.y);
            theta += thetaDelta;
            phi += phiDelta;
            // restrict theta to be between desired limits
            theta = Math.max(this.minAzimuthAngle, Math.min(this.maxAzimuthAngle, theta));
            // restrict phi to be between desired limits
            phi = Math.max(this.minPolarAngle, Math.min(this.maxPolarAngle, phi));
            // restrict phi to be betwee EPS and PI-EPS
            phi = Math.max(EPS, Math.min(Math.PI - EPS, phi));
            var radius = offset.length() * scale;
            // restrict radius to be between desired limits
            radius = Math.max(this.minDistance, Math.min(this.maxDistance, radius));

            offset.x = radius * Math.sin(phi) * Math.sin(theta);
            offset.y = radius * Math.cos(phi);
            offset.z = radius * Math.sin(phi) * Math.cos(theta);

            // rotate offset back to "camera-up-vector-is-up" space
            offset.applyQuaternion(quatInverse);
            position.copy(this.camera.target).add(offset);
            this.camera.lookAt(this.camera.target);
            if (this.enableDamping === true) {
                thetaDelta *= (1 - this.dampingFactor);
                phiDelta *= (1 - this.dampingFactor);
            } else {
                thetaDelta = 0;
                phiDelta = 0;
            }
            scale = 1;

            // update condition is:
            // min(camera displacement, camera rotation in radians)^2 > EPS
            // using small-angle approximation cos(x/2) = 1 - x^2 / 8
            if (lastPosition.distanceToSquared(this.camera.position) > EPS ||
                8 * (1 - lastQuaternion.dot(this.camera.quaternion)) > EPS) {

                lastPosition.copy(this.camera.position);
                lastQuaternion.copy(this.camera.quaternion);

                return true;
            }
            return false;
        };
    }

    function RotateController (config) {
        THREE.EventDispatcher.call(this);
        config = config || {};

        var self = this;

        self.CURSOR = {
            DEFAULT: 'default',
            ROTATE: 'crosshair'
        };
        self.EVENT = {
            UPDATE: {type:'update'},
            END: {type:'end'},
            START: {type:'start'}
        };
        self.KEY = {ALT: 18, LEFT: 37, UP: 38, RIGHT: 39, BOTTOM: 40};
        self.STATE = {NONE: -1, ROTATE: 0};

        self.camera = config.camera || config.viewport.camera;
        self.constraint = new OrbitConstraint(self.camera);
        self.domElement = config.domElement || config.viewport.domElement;
        self.enabled = false;
        self.enableKeys = true;
        self.enableRotate = true;
        self.keys = { LEFT: 37, UP: 38, RIGHT: 39, BOTTOM: 40 };
        self.listeners = {};
        self.rotateDelta = new THREE.Vector2();
        self.rotateEnd = new THREE.Vector2();
        self.rotateSpeed = 1.0;
        self.rotateStart = new THREE.Vector2();
        self.state = self.STATE.NONE;
        self.viewport = config.viewport;
    }

    RotateController.prototype = Object.create(THREE.EventDispatcher.prototype);

    RotateController.prototype.constructor = RotateController;

    RotateController.prototype.disable = function () {
        var self = this;
        self.enabled = false;
        Object.keys(self.listeners).forEach(function (key) {
            var listener = self.listeners[key];
            listener.element.removeEventListener(listener.event, listener.fn);
        });
    };

    RotateController.prototype.enable = function () {
        var self = this;
        function addListener(element, event, fn) {
            self.listeners[event] = {
                element: element,
                event: event,
                fn: fn.bind(self)
            };
            element.addEventListener(event, self.listeners[event].fn, false);
        }
        addListener(self.domElement, 'mousedown', self.onMouseDown);
        addListener(self.domElement, 'mousemove', self.onMouseMove);
        addListener(self.domElement, 'mouseup', self.onMouseUp);
        addListener(window, 'keydown', self.onKeyDown);
        addListener(window, 'keyup', self.onKeyUp);
        self.enabled = true;
    };

    RotateController.prototype.onKeyDown = function (event) {
        if (event.keyCode === this.KEY.ALT) {
            this.keydown = true;
        }
    };

    RotateController.prototype.onKeyUp = function (event) {
        if (event.keyCode === this.KEY.ALT) {
            this.keydown = false;
            this.state = this.STATE.NONE;
        }
    };

    RotateController.prototype.onMouseDown = function (event) {
        if (this.enabled === false) {
            return;
        }
        if ((this.keydown && event.button === THREE.MOUSE.LEFT) || event.button === THREE.MOUSE.MIDDLE) {
            this.state = this.STATE.ROTATE;
            this.domElement.style.cursor = this.CURSOR.ROTATE;
            this.rotateStart.set(event.clientX, event.clientY);
            this.dispatchEvent(this.EVENT.START);
        }
    };

    RotateController.prototype.onMouseMove = function (event) {
        if (this.enabled === false) {
            return;
        }
        if (this.state === this.STATE.ROTATE) {
            this.rotateEnd.set(event.clientX, event.clientY);
            this.rotateDelta.subVectors(this.rotateEnd, this.rotateStart);
            // rotating across whole screen goes 360 degrees around
            this.constraint.rotateLeft(2 * Math.PI * this.rotateDelta.x / this.domElement.clientWidth * this.rotateSpeed);
            // rotating up and down along whole screen attempts to go 360, but limited to 180
            this.constraint.rotateUp(2 * Math.PI * this.rotateDelta.y / this.domElement.clientHeight * this.rotateSpeed);
            this.rotateStart.copy(this.rotateEnd);
            this.update();
        }
    };

    RotateController.prototype.onMouseUp = function () {
        if (this.state === this.STATE.ROTATE) {
            this.domElement.style.cursor = this.CURSOR.DEFAULT;
            this.state = this.STATE.NONE;
            this.dispatchEvent(this.EVENT.END);
        }
    };

    RotateController.prototype.setCamera = function (camera) {
        this.constraint.camera = camera;
    };

    RotateController.prototype.update = function () {
        if (this.state === this.STATE.ROTATE) {
            if (this.constraint.update() === true) {
                this.dispatchEvent(this.EVENT.UPDATE);
            }
        }
    };

    Object.defineProperties(RotateController.prototype, {
        minDistance : {
            get: function () {
                return this.constraint.minDistance;
            },
            set: function (value) {
                this.constraint.minDistance = value;
            }
        },

        maxDistance : {
            get: function () {
                return this.constraint.maxDistance;
            },
            set: function (value) {
                this.constraint.maxDistance = value;
            }
        },

        minPolarAngle : {
            get: function () {
                return this.constraint.minPolarAngle;
            },
            set: function (value) {
                this.constraint.minPolarAngle = value;
            }
        },

        maxPolarAngle : {
            get: function () {
                return this.constraint.maxPolarAngle;
            },
            set: function (value) {
                this.constraint.maxPolarAngle = value;
            }
        },

        minAzimuthAngle : {
            get: function () {
                return this.constraint.minAzimuthAngle;
            },
            set: function (value) {
                this.constraint.minAzimuthAngle = value;
            }
        },

        maxAzimuthAngle : {
            get: function () {
                return this.constraint.maxAzimuthAngle;
            },
            set: function (value) {
                this.constraint.maxAzimuthAngle = value;
            }
        },

        enableDamping : {
            get: function () {
                return this.constraint.enableDamping;
            },
            set: function (value) {
                this.constraint.enableDamping = value;
            }
        },

        dampingFactor : {
            get: function () {
                return this.constraint.dampingFactor;
            },
            set: function (value) {
                this.constraint.dampingFactor = value;
            }
        }

    });

    return RotateController;

}());
