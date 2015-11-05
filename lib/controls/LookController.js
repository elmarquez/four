'use strict';

var FOUR = FOUR || {};

/**
 * Camera look controller rotates the view by moving the camera target at a
 * fixed distance around the camera position. If a THREE.PerspectiveCamera
 * is used, then we assume a fixed target distance of 100.
 */
FOUR.LookController = (function () {

	function LookController (config) {
		THREE.EventDispatcher.call(this);
		config = config || {};
		var self = this;

		self.CURSOR = {
			DEFAULT: 'default',
			LOOK: 'crosshair'
		};
		self.EPS = 0.000001;
		self.EVENT = {
			UPDATE: {type: 'update'}
		};
		self.KEY = {
			ESC: 27
		};
		self.MOUSE_STATE = {
			UP: 0,
			DOWN: 1
		};

		self.camera = config.camera || config.viewport.camera;
		self.domElement = config.domElement || config.viewport.domElement;
		self.enabled = false;
		self.listeners = {};
		self.look = {
			delta: new THREE.Vector2(),
			dir: new THREE.Vector3(),
			end: new THREE.Vector2(),
			offset: new THREE.Vector3(),
			screen: new THREE.Vector3(),
			start: new THREE.Vector2(),
			target: new THREE.Vector3(),
			world: new THREE.Vector3()
		};
		self.lookSpeed = 0.75;
		self.mouse = self.MOUSE_STATE.UP;
		self.viewport = config.viewport;

		Object.keys(config).forEach(function (key) {
			self[key] = config[key];
		});
	}

	LookController.prototype = Object.create(THREE.EventDispatcher.prototype);

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
		addListener(self.domElement, 'mousedown', self.onMouseDown);
		addListener(self.domElement, 'mousemove', self.onMouseMove);
		addListener(self.domElement, 'mouseup', self.onMouseUp);
		addListener(self.domElement, 'keyup', self.onKeyUp);
		self.enabled = true;
	};

	LookController.prototype.onKeyUp = function (event) {
		if (event.keyCode === this.KEY.ESC) {
			this.camera.lookAt(this.camera.target);
			this.dispatchEvent(this.EVENT.UPDATE);
		}
	};

	LookController.prototype.onMouseDown = function (event) {
		if (event.button === THREE.MOUSE.LEFT) {
			this.domElement.style.cursor = this.CURSOR.LOOK;
			this.mouse = this.MOUSE_STATE.DOWN;
			this.look.end.set(0,0);
			this.look.start.set(event.offsetX - this.domElement.clientLeft, event.offsetY - this.domElement.clientTop);
		}
	};

	LookController.prototype.onMouseMove = function (event) {
		if (this.mouse === this.MOUSE_STATE.DOWN) {
			this.look.end.set(event.offsetX - this.domElement.clientLeft, event.offsetY - this.domElement.clientTop);
		}
	};

	LookController.prototype.onMouseUp = function () {
		this.domElement.style.cursor = this.CURSOR.DEFAULT;
		this.mouse = this.MOUSE_STATE.UP;
	};

	LookController.prototype.update = function () {
		if (this.enabled === false) {
			return;
		}
		if (this.mouse === this.MOUSE_STATE.DOWN) {
			// calculate mouse movement
			this.look.delta.set(this.look.end.x - this.look.start.x, this.look.end.y - this.look.start.y);
			if (this.look.delta.length() > 0) {
				// transform mouse screen space coordinates into world space position
				this.look.screen.set(
					(this.look.end.x / this.domElement.clientWidth) * 2 - 1,
					-(this.look.end.y / this.domElement.clientHeight) * 2 + 1,
					1);
				this.look.screen.unproject(this.camera);
				this.look.world.copy(this.look.screen).add(this.camera.position);
				// get the direction from the camera to the mouse world space position
				this.look.dir.subVectors(this.look.world, this.camera.position).normalize();
				// get the new target position
				this.look.target.copy(this.look.dir).multiplyScalar(this.camera.getDistance() * this.lookSpeed);
				// move the camera target
				if (this.camera instanceof FOUR.TargetCamera) {
					this.camera.lookAt(this.look.target);
					//console.info('TargetCamera', this.look.target);
				} else if (this.camera instanceof THREE.PerspectiveCamera) {
					//console.log('set THREE.PerspectiveCamera');
				}
				this.look.end.copy(this.look.start); // consume the change
				this.dispatchEvent(this.EVENT.UPDATE);
			}
		}
	};

	return LookController;

}());
