'use strict';

var FOUR = FOUR || {};

/**
 * Camera pan controller. Panning can be performed using the right mouse button
 * or the combination of a keypress, left mouse button down and mouse move.
 */
FOUR.PanController = (function () {

    function PanController (config) {
        THREE.EventDispatcher.call(this);
        config = config || {};
        var self = this;

        self.EPS = 0.000001;
        self.EVENTS = {
            END: {type: 'end'},
            START: {type: 'start'},
            UPDATE: {type: 'update'}
        };
        self.KEY = {
            PAN: 17
        };
        self.MOUSE_STATE = {
            UP: 0,
            DOWN: 1
        };

        self.camera = config.camera || config.viewport.camera;
        self.domElement = config.domElement || config.viewport.domElement;
        self.dynamicDampingFactor = 0.2;
        self.enabled = false;
        self.keydown = false;
        self.listeners = {};
        self.maxDistance = Infinity;
        self.minDistance = 1;
        self.mouse = self.MOUSE_STATE.UP;
        self.offset = new THREE.Vector3();
        self.pan = {
            cameraUp: new THREE.Vector3(),
            delta: new THREE.Vector2(),
            end: new THREE.Vector3(),
            eye: new THREE.Vector3(),
            start: new THREE.Vector3(),
            vector: new THREE.Vector2()
        };
        self.panSpeed = 0.5;
        self.viewport = config.viewport;

        Object.keys(config).forEach(function (key) {
           self[key] = config[key];
        });
    }

    PanController.prototype = Object.create(THREE.EventDispatcher.prototype);

    PanController.prototype.disable = function () {
        var self = this;
        self.enabled = false;
        Object.keys(self.listeners).forEach(function (key) {
            var listener = self.listeners[key];
            listener.element.removeEventListener(listener.event, listener.fn);
        });
    };

    PanController.prototype.enable = function () {
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
        addListener(window, 'keydown', self.onKeyDown);
        addListener(window, 'keyup', self.onKeyUp);
        self.enabled = true;
    };

    PanController.prototype.getMouseOnCircle = function (pageX, pageY) {
        this.pan.vector.set(
          ((pageX - this.domElement.clientWidth * 0.5) / (this.domElement.clientWidth * 0.5)),
          ((this.domElement.clientHeight + 2 * pageY) / this.domElement.clientWidth) // screen.width intentional
        );
        return this.pan.vector;
    };

    PanController.prototype.getMouseOnScreen = function (pageX, pageY) {
        this.pan.vector.set(pageX / this.domElement.clientWidth, pageY / this.domElement.clientHeight);
        return this.pan.vector;
    };

    PanController.prototype.onContextMenu = function (event) {
        event.preventDefault();
    };

    PanController.prototype.onKeyDown = function (event) {
        if (event.keyCode === this.KEY.PAN) {
            this.keydown = true;
        }
    };

    PanController.prototype.onKeyUp = function (event) {
        if (event.keyCode === this.KEY.PAN) {
            this.keydown = false;
        }
    };

    PanController.prototype.onMouseDown = function (event) {
        event.preventDefault();
        event.stopPropagation();
        this.mouse = this.MOUSE_STATE.DOWN;
        this.pan.start.copy(this.getMouseOnScreen(event.offsetX, event.offsetY));
        this.pan.end.copy(this.pan.start);
        this.dispatchEvent(this.EVENTS.START);
    };

    PanController.prototype.onMouseMove = function (event) {
        if (this.mouse === this.MOUSE_STATE.DOWN) {
            this.pan.end.copy(this.getMouseOnScreen(event.clientX, event.clientY));
        }
    };

    PanController.prototype.onMouseUp = function (event) {
        event.preventDefault();
        event.stopPropagation();
        this.mouse = this.MOUSE_STATE.UP;
        this.pan.delta.set(0,0);
        this.dispatchEvent(this.EVENTS.END);
    };

    PanController.prototype.update = function () {
        var self = this;
        if (self.enabled === false) {
            return;
        }
        if (this.mouse === this.MOUSE_STATE.DOWN) {
            self.pan.eye.subVectors(self.camera.position, self.camera.target);
            self.pan.delta.copy(self.pan.end).sub(self.pan.start);
            if (self.pan.delta.lengthSq() > self.EPS) {
                // compute offset
                self.pan.delta.multiplyScalar(self.pan.eye.length() * self.panSpeed);
                self.offset.copy(self.pan.eye).cross(self.camera.up).setLength(self.pan.delta.x);
                self.offset.add(self.pan.cameraUp.copy(self.camera.up).setLength(self.pan.delta.y));

                // set the new camera position
                self.camera.position.add(self.offset);
                self.camera.target.add(self.offset);

                // consume the change
                this.pan.start.copy(this.pan.end);

                self.dispatchEvent(self.EVENTS.UPDATE);
            }
        }
    };

    return PanController;

}());
