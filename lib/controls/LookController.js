'use strict';

var FOUR = FOUR || {};

/**
 * A reimplementation of the THREE.OrbitController.
 * @see http://threejs.org/examples/js/controls/OrbitControls.js
 */
FOUR.LookController = (function () {

	function OrbitConstraint (camera) {

		this.camera = camera;

		// "target" sets the location of focus, where the camera orbits around
		// and where it pans with respect to.
		this.target = new THREE.Vector3();

		// Limits to how far you can dolly in and out (PerspectiveCamera only)
		this.minDistance = 0;
		this.maxDistance = Infinity;

		// Limits to how far you can zoom in and out (OrthographicCamera only)
		this.minZoom = 0;
		this.maxZoom = Infinity;

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
		var panOffset = new THREE.Vector3();
		var zoomChanged = false;

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

		this.dollyIn = function (dollyScale) {
			if (scope.camera instanceof THREE.PerspectiveCamera) {
				scale /= dollyScale;
			} else if (scope.camera instanceof THREE.OrthographicCamera) {
				scope.camera.zoom = Math.max(this.minZoom, Math.min(this.maxZoom, this.camera.zoom * dollyScale));
				scope.camera.updateProjectionMatrix();
				zoomChanged = true;
			} else {
				console.warn('WARNING: OrbitControls.js encountered an unknown camera type - dolly/zoom disabled.');
			}
		};

		this.dollyOut = function (dollyScale) {
			if (scope.camera instanceof THREE.PerspectiveCamera) {
				scale *= dollyScale;
			} else if (scope.camera instanceof THREE.OrthographicCamera) {
				scope.camera.zoom = Math.max(this.minZoom, Math.min(this.maxZoom, this.camera.zoom / dollyScale));
				scope.camera.updateProjectionMatrix();
				zoomChanged = true;
			} else {
				console.warn('WARNING: OrbitControls.js encountered an unknown camera type - dolly/zoom disabled.');
			}
		};

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

		// pass in distance in world space to move left
		this.panLeft = (function() {
			var v = new THREE.Vector3();
			return function panLeft (distance) {
				var te = this.camera.matrix.elements;
				// get X column of matrix
				v.set(te[ 0 ], te[ 1 ], te[ 2 ]);
				v.multiplyScalar(- distance);
				panOffset.add(v);
			};
		}());

		// pass in distance in world space to move up
		this.panUp = (function() {
			var v = new THREE.Vector3();
			return function panUp (distance) {
				var te = this.camera.matrix.elements;
				// get Y column of matrix
				v.set(te[ 4 ], te[ 5 ], te[ 6 ]);
				v.multiplyScalar(distance);
				panOffset.add(v);
			};
		}());

		// pass in x,y of change desired in pixel space,
		// right and down are positive
		this.pan = function (deltaX, deltaY, screenWidth, screenHeight) {
			if (scope.camera instanceof THREE.PerspectiveCamera) {
				// perspective
				var position = scope.camera.position;
				var offset = position.clone().sub(scope.target);
				var targetDistance = offset.length();

				// half of the fov is center to top of screen
				targetDistance *= Math.tan((scope.camera.fov / 2) * Math.PI / 180.0);

				// we actually don't use screenWidth, since perspective camera is fixed to screen height
				scope.panLeft(2 * deltaX * targetDistance / screenHeight);
				scope.panUp(2 * deltaY * targetDistance / screenHeight);
			} else if (scope.camera instanceof THREE.OrthographicCamera) {
				// orthographic
				scope.panLeft(deltaX * (scope.camera.right - scope.camera.left) / screenWidth);
				scope.panUp(deltaY * (scope.camera.top - scope.camera.bottom) / screenHeight);
			} else {
				// camera neither orthographic or perspective
				console.warn('WARNING: OrbitControls.js encountered an unknown camera type - pan disabled.');
			}
		};

		this.sync = function () {
			// target is a vec3
			this.target = new THREE.Vector3(0, 0, -1);
			//this.target.applyQuaternion(camera.quaternion);
			this.target.applyMatrix4(camera.matrixWorld);
		};

		this.update = function () {
			var position = this.camera.position;
			offset.copy(position).sub(this.target);
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
			// move target to panned location
			this.target.add(panOffset);
			offset.x = radius * Math.sin(phi) * Math.sin(theta);
			offset.y = radius * Math.cos(phi);
			offset.z = radius * Math.sin(phi) * Math.cos(theta);

			// rotate offset back to "camera-up-vector-is-up" space
			offset.applyQuaternion(quatInverse);
			position.copy(this.target).add(offset);
			this.camera.lookAt(this.target);
			if (this.enableDamping === true) {
				thetaDelta *= (1 - this.dampingFactor);
				phiDelta *= (1 - this.dampingFactor);
			} else {
				thetaDelta = 0;
				phiDelta = 0;
			}
			scale = 1;
			panOffset.set(0, 0, 0);

			// update condition is:
			// min(camera displacement, camera rotation in radians)^2 > EPS
			// using small-angle approximation cos(x/2) = 1 - x^2 / 8
			if (zoomChanged ||
				 lastPosition.distanceToSquared(this.camera.position) > EPS ||
				8 * (1 - lastQuaternion.dot(this.camera.quaternion)) > EPS) {

				lastPosition.copy(this.camera.position);
				lastQuaternion.copy(this.camera.quaternion);
				zoomChanged = false;

				return true;
			}
			return false;
		};
	}

	function LookController (config) {
		THREE.EventDispatcher.call(this);
		config = config || {};

		var self = this;

		self.EVENT = {
			UPDATE: {type:'update'},
			END: {type:'end'},
			START: {type:'start'}
		};
		self.KEYS = {LEFT: 37, UP: 38, RIGHT: 39, BOTTOM: 40};
		self.STATE = { NONE : - 1, ROTATE : 0, DOLLY : 1, PAN : 2, TOUCH_ROTATE : 3, TOUCH_DOLLY : 4, TOUCH_PAN : 5 };

		// Set to true to automatically rotate around the target
		// If auto-rotate is enabled, you must call controls.update() in your animation loop
		self.autoRotate = false;
		self.autoRotateSpeed = 2.0; // 30 seconds per round when fps is 60

		self.camera = config.camera || config.viewport.camera;
		self.constraint = new OrbitConstraint(self.camera);
		self.dollyDelta = new THREE.Vector2();
		self.dollyEnd = new THREE.Vector2();
		self.dollyStart = new THREE.Vector2();
		self.domElement = config.domElement || config.viewport.domElement;
		self.enabled = false;
		self.enableKeys = true;
		self.enablePan = true;
		self.enableRotate = true;
		self.enableZoom = true;
		self.keyPanSpeed = 7.0;	// pixels moved per arrow key push
		self.keys = { LEFT: 37, UP: 38, RIGHT: 39, BOTTOM: 40 };
		self.listeners = {};
		self.mouseButtons = { ORBIT: THREE.MOUSE.LEFT, ZOOM: THREE.MOUSE.MIDDLE, PAN: THREE.MOUSE.RIGHT };
		self.panStart = new THREE.Vector2();
		self.panEnd = new THREE.Vector2();
		self.panDelta = new THREE.Vector2();
		self.rotateDelta = new THREE.Vector2();
		self.rotateEnd = new THREE.Vector2();
		self.rotateSpeed = 1.0;
		self.rotateStart = new THREE.Vector2();
		self.state = self.STATE.NONE;
		self.viewport = config.viewport;
		self.zoomSpeed = 1.0;

		// TODO do we need these?
		// for reset
		self.target0 = self.target.clone();
		self.position0 = self.camera.position.clone();
		self.zoom0 = self.camera.zoom;
	}

	LookController.prototype = Object.create(THREE.EventDispatcher.prototype);

	LookController.prototype.constructor = LookController;

	LookController.prototype.contextmenu = function (event) {
		event.preventDefault();
	};

	LookController.prototype.disable = function () {
		var self = this;
		self.enabled = false;
		Object.keys(self.listeners).forEach(function (key) {
			var listener = self.listeners[key];
			listener.element.removeEventListener(listener.event, listener.fn);
		});
	};

	LookController.prototype.enable = function () {
		var self = this;
		function addListener(element, event, fn) {
			self.listeners[event] = {
				element: element,
				event: event,
				fn: fn.bind(self)
			};
			element.addEventListener(event, self.listeners[event].fn, false);
		}
		addListener(self.domElement, 'contextmenu', self.contextmenu);
		addListener(self.domElement, 'mousedown', self.onMouseDown);
		addListener(self.domElement, 'mousemove', self.onMouseMove);
		addListener(self.domElement, 'mouseup', self.onMouseUp);
		addListener(self.domElement, 'mousewheel', self.onMouseWheel);
		addListener(self.domElement, 'DOMMouseScroll', self.onMouseWheel);
		addListener(window, 'keydown', self.onKeyDown);
		addListener(window, 'keyup', self.onKeyUp);
		self.constraint.sync();
		self.enabled = true;
	};

	LookController.prototype.getAutoRotationAngle = function () {
		var self = this;
		return 2 * Math.PI / 60 / 60 * self.autoRotateSpeed;
	};

	LookController.prototype.getAzimuthalAngle = function () {
		return this.constraint.getAzimuthalAngle();
	};

	LookController.prototype.getPolarAngle = function () {
		return this.constraint.getPolarAngle();
	};

	LookController.prototype.getZoomScale = function () {
		var self = this;
		return Math.pow(0.95, self.zoomSpeed);
	};

	LookController.prototype.onKeyDown = function (event) {
		//console.info(event);
	};

	LookController.prototype.onKeyUp = function (event) {
		//console.info(event);
	};

	LookController.prototype.onMouseDown = function (event) {
		var self = this;
		if (self.enabled === false) {
			return;
		}
		event.preventDefault();
		if (event.button === self.mouseButtons.ORBIT) {
			if (self.enableRotate === false) {
				return;
			}
			self.state = self.STATE.ROTATE;
			self.rotateStart.set(event.clientX, event.clientY);
		} else if (event.button === self.mouseButtons.ZOOM) {
			if (self.enableZoom === false) {
				return;
			}
			self.state = self.STATE.DOLLY;
			self.dollyStart.set(event.clientX, event.clientY);
		} else if (event.button === self.mouseButtons.PAN) {
			if (self.enablePan === false) {
				return;
			}
			self.state = self.STATE.PAN;
			self.panStart.set(event.clientX, event.clientY);
		}

		if (self.state !== self.STATE.NONE) {
			self.dispatchEvent(self.EVENT.START);
		}
	};

	LookController.prototype.onMouseMove = function (event) {
		var self = this;
		if (self.enabled === false) {
			return;
		}
		event.preventDefault();
		var element = self.domElement;
		if (self.state === self.STATE.ROTATE) {
			if (self.enableRotate === false) {
				return;
			}
			self.rotateEnd.set(event.clientX, event.clientY);
			self.rotateDelta.subVectors(self.rotateEnd, self.rotateStart);
			// rotating across whole screen goes 360 degrees around
			self.constraint.rotateLeft(2 * Math.PI * self.rotateDelta.x / element.clientWidth * self.rotateSpeed);
			// rotating up and down along whole screen attempts to go 360, but limited to 180
			self.constraint.rotateUp(2 * Math.PI * self.rotateDelta.y / element.clientHeight * self.rotateSpeed);
			self.rotateStart.copy(self.rotateEnd);
		} else if (self.state === self.STATE.DOLLY) {
			if (self.enableZoom === false) {
				return;
			}
			self.dollyEnd.set(event.clientX, event.clientY);
			self.dollyDelta.subVectors(self.dollyEnd, self.dollyStart);
			if (self.dollyDelta.y > 0) {
				self.constraint.dollyIn(self.getZoomScale());
			} else if (self.dollyDelta.y < 0) {
				self.constraint.dollyOut(self.getZoomScale());
			}
			self.dollyStart.copy(self.dollyEnd);
		} else if (self.state === self.STATE.PAN) {
			if (self.enablePan === false) {
				return;
			}
			self.panEnd.set(event.clientX, event.clientY);
			self.panDelta.subVectors(self.panEnd, self.panStart);
			self.pan(self.panDelta.x, self.panDelta.y);
			self.panStart.copy(self.panEnd);
		}
		if (self.state !== self.STATE.NONE) {
			self.update();
		}
	};

	LookController.prototype.onMouseUp = function (event) {
		var self = this;
		if (self.enabled === false) {
			return;
		}
		self.dispatchEvent(self.EVENT.END);
		self.state = self.STATE.NONE;
	};

	LookController.prototype.onMouseWheel = function (event) {
		var self = this;
		if (self.enabled === false || self.enableZoom === false || self.state !== self.STATE.NONE) {
			return;
		}
		event.preventDefault();
		event.stopPropagation();
		var delta = 0;
		if (event.wheelDelta !== undefined) {
			// WebKit / Opera / Explorer 9
			delta = event.wheelDelta;
		} else if (event.detail !== undefined) {
			// Firefox
			delta = - event.detail;
		}
		if (delta > 0) {
			self.constraint.dollyOut(self.getZoomScale());
		} else if (delta < 0) {
			self.constraint.dollyIn(self.getZoomScale());
		}
		self.update();
		self.dispatchEvent(self.EVENT.START);
		self.dispatchEvent(self.EVENT.END);
	};

	LookController.prototype.onWindowResize = function () {
		console.warn('Not implemented');
	};

	/**
	 * pass in x,y of change desired in pixel space, right and down are positive
	 * @param deltaX
	 * @param deltaY
	 */
	LookController.prototype.pan = function (deltaX, deltaY) {
		var self = this;
		var element = self.domElement === document ? self.domElement.body : self.domElement;
		self.constraint.pan(deltaX, deltaY, element.clientWidth, element.clientHeight);
	};

	LookController.prototype.reset = function () {
		var self = this;
		self.state = self.STATE.NONE;

		self.target.copy(self.target0);
		self.camera.position.copy(self.position0);
		self.camera.zoom = self.zoom0;

		self.camera.updateProjectionMatrix();
		self.dispatchEvent(self.EVENT.UPDATE);

		self.update();
	};

	LookController.prototype.update = function () {
		var self = this;
		if (self.autoRotate && self.state === self.STATE.NONE) {
			self.constraint.rotateLeft(self.getAutoRotationAngle());
		}
		if (self.constraint.update() === true) {
			self.dispatchEvent(self.EVENT.UPDATE);
		}
	};

	Object.defineProperties(LookController.prototype, {
		//camera: {
		//	get: function () {
		//		return this.constraint.camera;
		//	},
		//	set: function (value) {
		//		this.constraint.camera = camera;
		//	}
		//},

		target: {
			get: function () {
				return this.constraint.target;
			},
			set: function (value) {
				console.warn('THREE.OrbitControls: target is now immutable. Use target.set() instead.');
				this.constraint.target.copy(value);
			}
		},

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

		minZoom : {
			get: function () {
				return this.constraint.minZoom;
			},
			set: function (value) {
				this.constraint.minZoom = value;
			}
		},

		maxZoom : {
			get: function () {
				return this.constraint.maxZoom;
			},
			set: function (value) {
				this.constraint.maxZoom = value;
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
		},

		// backward compatibility

		noZoom: {
			get: function () {
				console.warn('THREE.OrbitControls: .noZoom has been deprecated. Use .enableZoom instead.');
				return ! this.enableZoom;
			},
			set: function (value) {
				console.warn('THREE.OrbitControls: .noZoom has been deprecated. Use .enableZoom instead.');
				this.enableZoom = ! value;
			}
		},

		noRotate: {
			get: function () {
				console.warn('THREE.OrbitControls: .noRotate has been deprecated. Use .enableRotate instead.');
				return ! this.enableRotate;
			},
			set: function (value) {
				console.warn('THREE.OrbitControls: .noRotate has been deprecated. Use .enableRotate instead.');
				this.enableRotate = ! value;
			}
		},

		noPan: {
			get: function () {
				console.warn('THREE.OrbitControls: .noPan has been deprecated. Use .enablePan instead.');
				return ! this.enablePan;
			},
			set: function (value) {
				console.warn('THREE.OrbitControls: .noPan has been deprecated. Use .enablePan instead.');
				this.enablePan = ! value;
			}
		},

		noKeys: {
			get: function () {
				console.warn('THREE.OrbitControls: .noKeys has been deprecated. Use .enableKeys instead.');
				return ! this.enableKeys;
			},
			set: function (value) {
				console.warn('THREE.OrbitControls: .noKeys has been deprecated. Use .enableKeys instead.');
				this.enableKeys = ! value;
			}
		},

		staticMoving : {
			get: function () {
				console.warn('THREE.OrbitControls: .staticMoving has been deprecated. Use .enableDamping instead.');
				return ! this.constraint.enableDamping;
			},
			set: function (value) {
				console.warn('THREE.OrbitControls: .staticMoving has been deprecated. Use .enableDamping instead.');
				this.constraint.enableDamping = ! value;
			}
		},

		dynamicDampingFactor : {
			get: function () {
				console.warn('THREE.OrbitControls: .dynamicDampingFactor has been renamed. Use .dampingFactor instead.');
				return this.constraint.dampingFactor;
			},
			set: function (value) {
				console.warn('THREE.OrbitControls: .dynamicDampingFactor has been renamed. Use .dampingFactor instead.');
				this.constraint.dampingFactor = value;
			}
		}

	});

	return LookController;

}());
