'use strict';

var FOUR = FOUR || {};

/**
 * Camera zoom controller. Zooming can be performed using mouse wheel rotation
 * or the combination of a keypress, left mouse button down and mouse move.
 * Zooming is clamped to a maximum and minimum zoom distance when using a
 * FOUR.TargetCamera.
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
        self.KEY = {
            ZOOM: 17
        };
        self.MOUSE_STATE = {
            UP: 0,
            DOWN: 1
        };

        self.camera = config.camera || config.viewport.camera;
        self.domElement = config.domElement || config.viewport.domElement;
        self.dragZoomSpeed = 1.2;
        self.enabled = false;
        self.keydown = false;
        self.listeners = {};
        self.maxDistance = Infinity;
        self.minDistance = 1;
        self.mouse = self.MOUSE_STATE.UP;
        self.viewport = config.viewport;
        self.wheelZoomSpeed = 500;
        self.zoom = {
            delta: 0,
            end: new THREE.Vector2(),
            start: new THREE.Vector2()
        };

        Object.keys(config).forEach(function (key) {
           self[key] = config[key];
        });
    }

    ZoomController.prototype = Object.create(THREE.EventDispatcher.prototype);

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
        function addListener(element, event, fn) {
            self.listeners[event] = {
                element: element,
                event: event,
                fn: fn.bind(self)
            };
            element.addEventListener(event, self.listeners[event].fn, false);
        }
        addListener(self.domElement, 'contextmenu', self.onContextMenu);
        addListener(self.domElement, 'mousedown', self.onMouseDown);
        addListener(self.domElement, 'mousemove', self.onMouseMove);
        addListener(self.domElement, 'mouseup', self.onMouseUp);
        addListener(self.domElement, 'mousewheel', self.onMouseWheel);
        addListener(self.domElement, 'DOMMouseScroll', self.onMouseWheel);
        addListener(window, 'keydown', self.onKeyDown);
        addListener(window, 'keyup', self.onKeyUp);
        self.enabled = true;
    };

    ZoomController.prototype.onContextMenu = function (event) {
        event.preventDefault();
    };

    ZoomController.prototype.onKeyDown = function (event) {
        if (event.keyCode === this.KEY.ZOOM) {
            this.keydown = true;
        }
    };

    ZoomController.prototype.onKeyUp = function (event) {
        if (event.keyCode === this.KEY.ZOOM) {
            this.keydown = false;
        }
    };

    ZoomController.prototype.onMouseDown = function (event) {
        event.preventDefault();
        event.stopPropagation();
        this.domElement.style.cursor = 'ns-resize';
        this.mouse = this.MOUSE_STATE.DOWN;
        this.zoom.end.set(0,0);
        this.zoom.start.set(event.offsetX, event.offsetY);
    };

    ZoomController.prototype.onMouseMove = function (event) {
        if (this.keydown && this.mouse === this.MOUSE_STATE.DOWN) {
            this.zoom.end.copy(this.zoom.start);
            this.zoom.start.set(event.offsetX, event.offsetY);
            this.zoom.delta = -((this.zoom.end.y - this.zoom.start.y) / this.domElement.clientHeight) * this.wheelZoomSpeed;
        }
    };

    ZoomController.prototype.onMouseUp = function (event) {
        event.preventDefault();
        event.stopPropagation();
        this.domElement.style.cursor = 'default';
        this.mouse = this.MOUSE_STATE.UP;
        this.zoom.delta = 0;
    };

    /**
     * Zoom the camera in or out using the mouse wheel as input.
     * @param {Object} event Mouse event
     */
    ZoomController.prototype.onMouseWheel = function (event) {
        var self = this;
        if (self.enabled === false) {
            return;
        }
        event.preventDefault();
        event.stopPropagation();
        //this.domElement.style.cursor = 'move';
        if (event.wheelDeltaY) {
            // WebKit / Opera / Explorer 9
            self.zoom.delta = event.wheelDeltaY / 40;
        } else if (event.detail) {
            // Firefox
            self.zoom.delta = - event.detail / 3;
        } else {
            self.zoom.delta = 0;
        }
    };

    ZoomController.prototype.update = function () {
        var distance, lookAt, self = this;
        if (self.enabled === false) {
            return;
        }
        if (self.zoom.delta !== 0) {
            if (self.camera instanceof FOUR.TargetCamera) {
                distance = self.camera.getDistance() + (-self.zoom.delta * self.dragZoomSpeed);
                distance = distance < self.minDistance ? self.minDistance : distance;
                if (Math.abs(distance) > self.EPS) {
                    self.camera.setDistance(distance);
                    self.dispatchEvent(self.EVENTS.UPDATE);
                }
            } else if (self.camera instanceof THREE.PerspectiveCamera) {
                lookAt = new THREE.Vector3(0, 0, -1).applyQuaternion(self.camera.quaternion);
                distance = self.zoom.delta * self.dragZoomSpeed;
                if (Math.abs(distance) > self.EPS) {
                    lookAt.setLength(distance);
                    self.camera.position.add(lookAt);
                    self.dispatchEvent(self.EVENTS.UPDATE);
                }
            }
            self.zoom.delta = 0; // consume the change
        }
    };

    return ZoomController;

}());
