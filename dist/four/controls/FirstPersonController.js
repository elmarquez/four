'use strict';

var FOUR = FOUR || {};

/**
 * A reimplementation of the THREE.FirstPersonController.
 */
FOUR.FirstPersonController = (function () {

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

	function FirstPersonController (config) {
		THREE.EventDispatcher.call(this);
		config = config || {};
		var self = this;

		self.EVENT = {
			UPDATE: {type:'update'},
			END: {type:'end'},
			START: {type:'start'}
		};
		self.KEY = {
			CANCEL: 27,
			CTRL: 17,
			MOVE_TO_EYE_HEIGHT: 192,
			MOVE_FORWARD: 38,
			MOVE_LEFT: 37,
			MOVE_BACK: 40,
			MOVE_RIGHT: 39,
			MOVE_UP: 221,
			MOVE_DOWN: 219,
			ROTATE_LEFT: 37,
			ROTATE_RIGHT: 39,
			LEFT: 37, UP: 38, RIGHT: 39, BOTTOM: 40
		};
		self.MOUSE_STATE = {DOWN: 0, UP: 1};
		self.SINGLE_CLICK_TIMEOUT = 400; // milliseconds
		self.STATE = { NONE : - 1, ROTATE : 0, DOLLY : 1, PAN : 2, TOUCH_ROTATE : 3, TOUCH_DOLLY : 4, TOUCH_PAN : 5 };
		self.WALK_HEIGHT = 2;

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
		self.enforceWalkHeight = false;
		self.keyPanSpeed = 7.0;	// pixels moved per arrow key push
		self.keys = { LEFT: 37, UP: 38, RIGHT: 39, BOTTOM: 40 };
		self.listeners = {};
		self.lookChange = false;
		self.lookSpeed = 0.85;
		self.modifiers = {
			'ALT': false,
			'CTRL': false,
			'SHIFT': false
		};
		self.mouse = {
			direction: new THREE.Vector2(),
			end: { x: 0, y: 0 },
			start: { x: 0, y: 0 },
			state: self.MOUSE_STATE.UP
		};
		self.mouseButtons = { ORBIT: THREE.MOUSE.LEFT, ZOOM: THREE.MOUSE.MIDDLE, PAN: THREE.MOUSE.RIGHT };
		self.move = {
			forward: false,
			backward: false,
			left: false,
			right: false,
			up: false,
			down: false
		};
		self.movementSpeed = 100.0;
		self.panStart = new THREE.Vector2();
		self.panEnd = new THREE.Vector2();
		self.panDelta = new THREE.Vector2();
		self.raycaster = new THREE.Raycaster();
		self.rotateDelta = new THREE.Vector2();
		self.rotateEnd = new THREE.Vector2();
		self.rotateSpeed = 1.0;
		self.rotateStart = new THREE.Vector2();
		self.state = self.STATE.NONE;
		self.timeout = null;
		self.viewport = config.viewport;
		self.walkHeight = null;
		self.zoomSpeed = 1.0;

		Object.keys(config).forEach(function (key) {
			self[key] = config[key];
		});
	}

	FirstPersonController.prototype = Object.create(THREE.EventDispatcher.prototype);

	FirstPersonController.prototype.contextmenu = function (event) {
		event.preventDefault();
	};

	FirstPersonController.prototype.disable = function () {
		var self = this;
		self.enabled = false;
		Object.keys(self.listeners).forEach(function (key) {
			var listener = self.listeners[key];
			listener.element.removeEventListener(listener.event, listener.fn);
		});
	};

	FirstPersonController.prototype.emit = function (event) {
		this.dispatchEvent({type: event || 'update'});
	};

	FirstPersonController.prototype.enable = function () {
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

	FirstPersonController.prototype.getAutoRotationAngle = function () {
		var self = this;
		return 2 * Math.PI / 60 / 60 * self.autoRotateSpeed;
	};

	FirstPersonController.prototype.getAzimuthalAngle = function () {
		return this.constraint.getAzimuthalAngle();
	};

	FirstPersonController.prototype.getPolarAngle = function () {
		return this.constraint.getPolarAngle();
	};

	FirstPersonController.prototype.getWalkHeight = function (position) {
		return 0;
	};

	FirstPersonController.prototype.getZoomScale = function () {
		var self = this;
		return Math.pow(0.95, self.zoomSpeed);
	};

	FirstPersonController.prototype.handleDoubleClick = function (selected) {
		var self = this;
		// CTRL double click rotates the camera toward the selected point
		if (self.modifiers[self.KEY.CTRL]) {
			self.dispatchEvent({type:'lookat', position:selected.point, object:selected.object});
		}
		// double click navigates the camera to the selected point
		else {
			self.dispatchEvent({type:'navigate', position:selected.point, object:selected.object});
		}
	};

	FirstPersonController.prototype.handleSingleClick = function () {};

	FirstPersonController.prototype.onKeyDown = function (event) {
		var self = this;
		if (!self.enabled) {
			return;
		}
		switch(event.keyCode) {
			case self.KEY.CTRL:
				self.modifiers[self.KEY.CTRL] = true;
				break;
			case self.KEY.MOVE_TO_EYE_HEIGHT:
				self.setWalkHeight();
				break;
			case self.KEY.MOVE_FORWARD:
				self.move.forward = true;
				break;
			case self.KEY.MOVE_BACK:
				self.move.backward = true;
				break;
			case self.KEY.MOVE_LEFT:
				self.move.left = true;
				break;
			case self.KEY.MOVE_RIGHT:
				self.move.right = true;
				break;
			case self.KEY.MOVE_UP:
				self.move.up = true;
				break;
			case self.KEY.MOVE_DOWN:
				self.move.down = true;
				break;
		}
	};

	FirstPersonController.prototype.onKeyUp = function (event) {
		var self = this;
		switch(event.keyCode) {
			case self.KEY.CTRL:
				self.modifiers[self.KEY.CTRL] = false;
				break;
			case self.KEY.MOVE_FORWARD:
				self.move.forward = false;
				break;
			case self.KEY.MOVE_BACK:
				self.move.backward = false;
				break;
			case self.KEY.MOVE_LEFT:
				self.move.left = false;
				break;
			case self.KEY.MOVE_RIGHT:
				self.move.right = false;
				break;
			case self.KEY.MOVE_UP:
				self.move.up = false;
				break;
			case self.KEY.MOVE_DOWN:
				self.move.down = false;
				break;
			case self.KEY.CANCEL:
				Object.keys(self.move).forEach(function (key) {
					self.move[key] = false;
				});
				self.lookChange = false;
				break;
		}	};

	FirstPersonController.prototype.onMouseDown = function (event) {
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

	FirstPersonController.prototype.onMouseMove = function (event) {
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

	FirstPersonController.prototype.onMouseUp = function (event) {
		var self = this;
		if (self.enabled === false) {
			return;
		}
		self.dispatchEvent(self.EVENT.END);
		self.state = self.STATE.NONE;
	};

	FirstPersonController.prototype.onMouseWheel = function (event) {
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

	FirstPersonController.prototype.onWindowResize = function () {
		console.warn('Not implemented');
	};

	FirstPersonController.prototype.pan = function (deltaX, deltaY) {
		var self = this;
		var element = self.domElement === document ? self.domElement.body : self.domElement;
		self.constraint.pan(deltaX, deltaY, element.clientWidth, element.clientHeight);
	};

	FirstPersonController.prototype.reset = function () {
		var self = this;
		self.state = self.STATE.NONE;

		self.target.copy(self.camera.target);
		self.camera.position.copy(self.camera.position);
		self.camera.zoom = 1;

		self.camera.updateProjectionMatrix();
		self.dispatchEvent(self.EVENT.UPDATE);

		self.update();
	};

	FirstPersonController.prototype.setWalkHeight = function () {
		var self = this;
		var pos = new THREE.Vector3(
			self.camera.position.x,
			self.camera.position.y,
			self.WALK_HEIGHT
		);
		var target = new THREE.Vector3(
			self.camera.target.x,
			self.camera.target.y,
			self.WALK_HEIGHT
		);
		return self.viewport
			.camera
			.resetOrientation(self.emit.bind(self))
			.then(function () {
				self.camera.setPositionAndTarget(pos, target);
			});
	};

	FirstPersonController.prototype.update = function (delta) {
		var self = this;
		if (!self.enabled) {
			return;
		}
		// rotation
		if (self.autoRotate && self.state === self.STATE.NONE) {
			self.constraint.rotateLeft(self.getAutoRotationAngle());
		}
		// translation
		var change = false, distance = delta * self.movementSpeed;
		if (self.move.forward) {
			self.camera.translateZ(-distance);
			change = true;
		}
		if (self.move.backward) {
			self.camera.translateZ(distance);
			change = true;
		}
		if (self.move.right) {
			self.camera.translateX(distance);
			change = true;
		}
		if (self.move.left) {
			self.camera.translateX(-distance);
			change = true;
		}
		if (self.move.up) {
			self.camera.translateY(-distance);
			change = true;
		}
		if (self.move.down) {
			self.camera.translateY(distance);
			change = true;
		}
		// signal change
		if (self.constraint.update() === true || change === true) {
			self.dispatchEvent(self.EVENT.UPDATE);
		}
	};

	Object.defineProperties(FirstPersonController.prototype, {
		dampingFactor : {
			get: function () {
				return this.constraint.dampingFactor;
			},
			set: function (value) {
				this.constraint.dampingFactor = value;
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
		maxAzimuthAngle : {
			get: function () {
				return this.constraint.maxAzimuthAngle;
			},
			set: function (value) {
				this.constraint.maxAzimuthAngle = value;
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
		maxPolarAngle : {
			get: function () {
				return this.constraint.maxPolarAngle;
			},
			set: function (value) {
				this.constraint.maxPolarAngle = value;
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
		minAzimuthAngle : {
			get: function () {
				return this.constraint.minAzimuthAngle;
			},
			set: function (value) {
				this.constraint.minAzimuthAngle = value;
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
		minPolarAngle : {
			get: function () {
				return this.constraint.minPolarAngle;
			},
			set: function (value) {
				this.constraint.minPolarAngle = value;
			}
		},
		minZoom : {
			get: function () {
				return this.constraint.minZoom;
			},
			set: function (value) {
				this.constraint.minZoom = value;
			}
		}
	});

	return FirstPersonController;

}());
