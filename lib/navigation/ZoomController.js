/**
 * Camera zoom controller. Zooming can be performed using mouse wheel rotation
 * or the combination of a keypress, left mouse button down and mouse move.
 * Zooming is clamped to a maximum and minimum zoom distance when using a
 * FOUR.TargetCamera.
 */
FOUR.ZoomController = (function () {

    function ZoomController(config) {
        THREE.EventDispatcher.call(this);
        config = config || {};
        var self = this;

        // constans for wheel event
        self.PIXEL_STEP = 10;
        self.WHEEL_ZOOM_RATIO = 800;

        self.EPS = 0.000001;
        self.KEY = {
            ZOOM: 16
        };
        self.MOUSE_STATE = {
            UP: 0,
            DOWN: 1
        };

        self.domElement = config.domElement || config.viewport.domElement;
        self.dragZoomSpeed = 1.2;
        self.enabled = false;
        self.keydown = false;
        self.listeners = {};
        self.maxDistance = Infinity;
        self.minDistance = 1;
        self.mouse = self.MOUSE_STATE.UP;
        self.timeout = null;
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
            delete self.listeners[key];
        });
    };

    ZoomController.prototype.enable = function () {
        var self = this;
        // clear all listeners to ensure that we can never add multiple listeners
        // for the same events
        self.disable();
        function addListener(element, event, fn) {
            if (!self.listeners[event]) {
                self.listeners[event] = {
                    element: element,
                    event: event,
                    fn: fn.bind(self)
                };
                element.addEventListener(event, self.listeners[event].fn, false);
            }
        }

        //addListener(self.domElement, 'mousedown', self.onMouseDown);
        //addListener(self.domElement, 'mousemove', self.onMouseMove);
        //addListener(self.domElement, 'mouseup', self.onMouseUp);
        addListener(self.domElement, 'mousewheel', self.onMouseWheel);
        addListener(self.domElement, 'DOMMouseScroll', self.onMouseWheel);
        //addListener(window, 'keydown', self.onKeyDown);
        //addListener(window, 'keyup', self.onKeyUp);
        self.enabled = true;
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
        if (this.keydown && FOUR.utils.isMouseLeftPressed(event)) {
            this.domElement.style.cursor = FOUR.CURSOR.ZOOM;
            this.mouse = this.MOUSE_STATE.DOWN;
            this.zoom.end.set(0, 0);
            this.zoom.start.set(event.offsetX, event.offsetY);
        }
    };

    ZoomController.prototype.onMouseMove = function (event) {
        event.preventDefault();
        if (this.keydown && FOUR.utils.isMouseLeftPressed(event) && this.mouse === this.MOUSE_STATE.DOWN) {
            this.zoom.end.copy(this.zoom.start);
            this.zoom.start.set(event.offsetX, event.offsetY);
            this.zoom.delta = -((this.zoom.end.y - this.zoom.start.y) / this.domElement.clientHeight) * this.wheelZoomSpeed;
        }
    };

    ZoomController.prototype.onMouseUp = function (event) {
        event.preventDefault();
        if (FOUR.utils.isMouseLeftPressed(event)) {
            this.domElement.style.cursor = FOUR.CURSOR.DEFAULT;
            this.mouse = this.MOUSE_STATE.UP;
            this.zoom.delta = 0;
        }
    };

    /**
     * Normalize scroll movement
     * @param {Object} event Mouse event
     *
     * https://github.com/facebook/fixed-data-table/blob/master/src/vendor_upstream/dom/normalizeWheel.js
     */
    ZoomController.prototype.normalizeWheel = function (event) {
        var self = this;
        var sX = 0, sY = 0, // spinX, spinY
            pX, pY; // pixelX, pixelY

        // Legacy
        if ('detail'      in event) { sY = event.detail; }
        if ('wheelDelta'  in event) { sY = -event.wheelDelta / 120; }
        if ('wheelDeltaY' in event) { sY = -event.wheelDeltaY / 120; }
        if ('wheelDeltaX' in event) { sX = -event.wheelDeltaX / 120; }

        // side scrolling on FF with DOMMouseScroll
        if ( 'axis' in event && event.axis === event.HORIZONTAL_AXIS ) {
            sX = sY;
            sY = 0;
        }

        pX = sX * self.PIXEL_STEP;
        pY = sY * self.PIXEL_STEP;

        if ('deltaY' in event) { pY = event.deltaY; }
        if ('deltaX' in event) { pX = event.deltaX; }

        return [pX, pY];
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
        var pixels = self.normalizeWheel(event);
        if (event.ctrlKey) { // fine increment mode
            self.zoom.delta = (pixels[1] < 0) ? 1 : -1;
        } else {
            self.zoom.delta = -pixels[1] * self.wheelZoomSpeed / self.WHEEL_ZOOM_RATIO;
        }
        self.dispatchEvent({type: FOUR.EVENT.UPDATE});
    };

    /**
     * Update the controller state.
     */
    ZoomController.prototype.update = function () {
        var distance, lookAt;
        var camera = this.viewport.getCamera();
        if (this.enabled === false) {
            return;
        }
        if (this.zoom.delta !== 0) {
            //// show the move cursor
            //self.domElement.style.cursor = FOUR.CURSOR.ZOOM;
            //if (self.timeout !== null) {
            //    clearTimeout(self.timeout);
            //    self.timeout = setTimeout(function () {
            //        self.domElement.style.cursor = FOUR.CURSOR.DEFAULT;
            //        self.timeout = null;
            //    }, 250);
            //}
            if (camera instanceof FOUR.TargetCamera) {
                distance = camera.getDistance() + (-this.zoom.delta * this.dragZoomSpeed);
                distance = distance < this.minDistance ? this.minDistance : distance;
                if (Math.abs(distance) > this.EPS) {
                    camera.setDistance(distance);
                    this.dispatchEvent({type: FOUR.EVENT.RENDER});
                }
            } else if (camera instanceof THREE.PerspectiveCamera) {
                lookAt = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
                distance = this.zoom.delta * this.dragZoomSpeed;
                if (Math.abs(distance) > this.EPS) {
                    lookAt.setLength(distance);
                    camera.position.add(lookAt);
                    this.dispatchEvent({type: FOUR.EVENT.RENDER});
                }
            }
            this.zoom.delta = 0; // consume the change
        }
    };

    return ZoomController;

}());
