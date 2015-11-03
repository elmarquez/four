'use strict';

var FOUR = FOUR || {};

/**
 * Camera rotation controller. Rotation can be performed using the middle
 * mouse button or the combination of a keypress, left mouse button down and
 * mouse move.
 */
FOUR.RotationController = (function () {

    function RotationController (config) {
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
        self.rotate = {
            cameraUp: new THREE.Vector3(),
            delta: new THREE.Vector2(),
            dir: new THREE.Vector3(),
            distance: 0,
            end: new THREE.Vector3(),
            eye: new THREE.Vector3(),
            left: new THREE.Vector3(),
            start: new THREE.Vector3(),
            up: new THREE.Vector3(),
            vector: new THREE.Vector2()
        };
        self.rotateSpeed = 0.5;
        self.viewport = config.viewport;

        Object.keys(config).forEach(function (key) {
           self[key] = config[key];
        });
    }

    RotationController.prototype = Object.create(THREE.EventDispatcher.prototype);

    RotationController.prototype.disable = function () {
        var self = this;
        self.enabled = false;
        Object.keys(self.listeners).forEach(function (key) {
            var listener = self.listeners[key];
            listener.element.removeEventListener(listener.event, listener.fn);
        });
    };

    RotationController.prototype.enable = function () {
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

    RotationController.prototype.getMouseOnCircle = function (pageX, pageY) {
        this.rotate.vector.set(
          ((pageX - this.domElement.clientWidth * 0.5) / (this.domElement.clientWidth * 0.5)),
          ((this.domElement.clientHeight + 2 * pageY) / this.domElement.clientWidth) // screen.width intentional
        );
        return this.rotate.vector;
    };

    RotationController.prototype.getMouseOnScreen = function (pageX, pageY) {
        this.rotate.vector.set(pageX / this.domElement.clientWidth, pageY / this.domElement.clientHeight);
        return this.rotate.vector;
    };

    RotationController.prototype.onContextMenu = function (event) {
        event.preventDefault();
    };

    RotationController.prototype.onKeyDown = function (event) {
        if (event.keyCode === this.KEY.PAN) {
            this.keydown = true;
        }
    };

    RotationController.prototype.onKeyUp = function (event) {
        if (event.keyCode === this.KEY.PAN) {
            this.keydown = false;
        }
    };

    RotationController.prototype.onMouseDown = function (event) {
        event.preventDefault();
        event.stopPropagation();
        this.mouse = this.MOUSE_STATE.DOWN;
        this.rotate.start.copy(this.getMouseOnScreen(event.offsetX, event.offsetY));
        this.rotate.end.copy(this.rotate.start);
        this.dispatchEvent(this.EVENTS.START);
    };

    RotationController.prototype.onMouseMove = function (event) {
        if (this.mouse === this.MOUSE_STATE.DOWN) {
            this.rotate.end.copy(this.getMouseOnScreen(event.clientX, event.clientY));
        }
    };

    RotationController.prototype.onMouseUp = function (event) {
        event.preventDefault();
        event.stopPropagation();
        this.mouse = this.MOUSE_STATE.UP;
        this.rotate.delta.set(0,0);
        this.dispatchEvent(this.EVENTS.END);
    };

    RotationController.prototype.update = function () {
        var self = this;
        if (self.enabled === false) {
            return;
        }
        if (this.mouse === this.MOUSE_STATE.DOWN) {

        }
    };

    return RotationController;

}());
