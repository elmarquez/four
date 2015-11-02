'use strict';

var FOUR = FOUR || {};

/**
 * Camera zoom controller. Zooming can be performed using mouse wheel rotation
 * or the combination of a keypress, right mouse button down and mouse move.
 * Zooming is clamped to a maximum and minimum zoom distance.
 */
FOUR.ZoomController = (function () {

    function ZoomController (config) {
        THREE.EventDispatcher.call(this);
        config = config || {};
        var self = this;

        self.EPS = 0.000001;
        self.EVENTS = {
            UPDATE: {type: 'update'}
        };
        self.KEY = {};
        self.MOUSE_STATE = {
            UP: 0,
            DOWN: 1
        };

        // API
        self.camera = config.camera || config.viewport.camera;
        self.domElement = config.domElement || config.viewport.domElement;
        self.dynamicDampingFactor = 0.2;
        self.enabled = false;
        self.listeners = {};
        self.maxDistance = Infinity;
        self.minDistance = 1;
        self.modifiers = {};
        self.mouse = self.MOUSE_STATE.UP;
        self.viewport = config.viewport;
        self.zoom = {
            delta: 0,
            end: new THREE.Vector2(),
            start: new THREE.Vector2()
        };
        self.zoomSpeed = 1.2;

        Object.keys(self.KEY).forEach(function (key) {
            self.modifiers[self.KEY[key]] = false;
        });

        Object.keys(config).forEach(function (key) {
           self[key] = config[key];
        });
    }

    ZoomController.prototype = Object.create(THREE.EventDispatcher.prototype);

    ZoomController.prototype.checkDistances = function () {
        var self = this;
        if (self.allowZoom || self.allowPan) {
            if (_eye.lengthSq() > self.maxDistance * self.maxDistance) {
                self.camera.position.addVectors(self.target, _eye.setLength(self.maxDistance));
                _zoomStart.copy(_zoomEnd);
            }
            if (_eye.lengthSq() < self.minDistance * self.minDistance) {
                self.camera.position.addVectors(self.target, _eye.setLength(self.minDistance));
                _zoomStart.copy(_zoomEnd);
            }
        }
    };

    ZoomController.prototype.contextMenu = function (event) {
        event.preventDefault();
    };

    ZoomController.prototype.disable = function () {
        var self = this;
        self.enabled = false;
        Object.keys(self.listeners).forEach(function (key) {
            var listener = self.listeners[key];
            listener.element.removeEventListener(listener.event, listener.fn);
        });
    };

    ZoomController.prototype.enable = function () {
        var self = this;
        self.handleResize(); // update screen size settings
        function addListener(element, event, fn) {
            self.listeners[event] = {
                element: element,
                event: event,
                fn: fn.bind(self)
            };
            element.addEventListener(event, self.listeners[event].fn, false);
        }
        addListener(self.domElement, 'contextmenu', self.contextMenu);
        addListener(self.domElement, 'mousedown', self.mousedown);
        addListener(self.domElement, 'mouseup', self.mouseup);
        addListener(self.domElement, 'mousewheel', self.mousewheel);
        addListener(self.domElement, 'DOMMouseScroll', self.mousewheel);
        addListener(window, 'keydown', self.keydown);
        addListener(window, 'keyup', self.keyup);
        self.enabled = true;
    };

    ZoomController.prototype.handleResize = function () {};

    ZoomController.prototype.keydown = function (event) {};

    ZoomController.prototype.keyup = function (event) {};

    ZoomController.prototype.mousedown = function (event) {
        event.preventDefault();
        event.stopPropagation();
        this.mouse = this.MOUSE_STATE.DOWN;
        this.zoom.end = 0;
        this.zoom.start = 0;
        console.info('mouse down');
    };

    ZoomController.prototype.mousemove = function (event) {
        if (this.mouse === this.MOUSE_STATE.DOWN) {

        }
    };

    ZoomController.prototype.mouseup = function (event) {
        event.preventDefault();
        event.stopPropagation();
        this.mouse = this.MOUSE_STATE.UP;
        console.info('mouse up');
    };

    /**
     * Zoom the camera in or out using the mouse wheel as input.
     * @param {Object} event Mouse event
     */
    ZoomController.prototype.mousewheel = function (event) {
        var self = this;
        if (self.enabled === false) {
            return;
        }
        event.stopPropagation();
        if (event.wheelDeltaY) {
            // WebKit / Opera / Explorer 9
            self.zoom.delta = event.wheelDeltaY / 40;
        } else if (event.detail) {
            // TODO using Y wheel delta
            // Firefox
            self.zoom.delta = - event.detail / 3;
        } else {
            self.zoom.delta = 0;
        }
        console.info('mouse wheel', self.zoom.delta);
    };

    ZoomController.prototype.update = function () {
        var factor, self = this;
        if (self.enabled === false) {
            return;
        }
        if (self.zoom.delta !== 0) {
            

            self.zoom.delta = 0; // consume the change
        } else if (self.zoom.start.y !== self.zoom.end.y) {

        }
        factor = 1.0 + (self.zoom.end - self.zoom.start) * self.zoomSpeed;
        if (factor !== 1.0 && factor > 0.0) {
            self.zoom.start += (self.zoom.end - self.zoom.start) * self.dynamicDampingFactor;

            if (self.camera instanceof FOUR.TargetCamera) {

            } else if (self.camera instanceof THREE.PerspectiveCamera) {

            }

            _eye.subVectors(self.camera.position, self.camera.target);

            self.camera.position.addVectors(self.target, _eye);
            self.checkDistances();
            self.camera.lookAt(self.target);
            // if the change is larger than EPS then emit an update event

            if (change &&
                (self.lastPosition.distanceToSquared(self.camera.position) > self.EPS ||
                self.lastTarget.distanceToSquared(self.camera.target) > self.EPS)) {
                self.dispatchEvent(self.EVENTS.UPDATE);
                self.lastPosition.copy(self.camera.position);
                self.lastTarget.copy(self.camera.target);
            }
        }
    };

    return ZoomController;

}());
