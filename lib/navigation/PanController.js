FOUR.PanController = (function () {

    /**
     * Camera pan controller. Panning can be performed using the right mouse
     * button or the combination of a keypress, left mouse button down and
     * mouse move. This controller is a reimplementation of the
     * THREE.OrbitController.
     * @see http://threejs.org/examples/js/controls/OrbitControls.js
     */
    function PanController(config) {
        THREE.EventDispatcher.call(this);
        config = config || {};
        var self = this;

        self.CURSOR = {
            DEFAULT: 'default',
            PAN: 'all-scroll'
        };
        self.EPS = 0.000001;
        self.KEY = {
            CTRL: 17
        };
        self.MODES = {
            NONE: 0,
            PAN: 1,
            ROTATE: 2,
            ZOOM: 3
        };

        self.domElement = config.domElement || config.viewport.domElement;
        self.dynamicDampingFactor = 0.2;
        self.enabled = false;
        self.keydown = false;
        self.listeners = {};
        self.maxDistance = Infinity;
        self.minDistance = 1;
        self.mode = self.MODES.NONE;
        self.offset = new THREE.Vector3();
        self.pan = {
            delta: new THREE.Vector2(),
            end: new THREE.Vector2(),
            start: new THREE.Vector2()
        };
        self.panSpeed = 0.2;
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
            delete self.listeners[key];
        });
    };

    PanController.prototype.enable = function () {
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

        addListener(self.domElement, 'mousedown', self.onMouseDown);
        addListener(self.domElement, 'mousemove', self.onMouseMove);
        addListener(self.domElement, 'mouseup', self.onMouseUp);
        self.enabled = true;
    };

    /**
     * Transform screen coordinates to normalized device coordinates (0,0 to 1,1).
     * @param {Number} x Screen X coordinate
     * @param {Number} y Screen Y coordinate
     * @param {Element} element DOM element
     * @returns {THREE.Vector2}
     */
    PanController.prototype.getNormalizedDeviceCoordinates = function (x, y, element) {
        var nx = (x - element.clientLeft) / element.clientWidth;
        var ny = (y - element.clientTop) / element.clientHeight;
        return new THREE.Vector2(nx, ny);
    };

    /**
     * Transform normalized device coordinates to world space coordinates for
     * the specified camera.
     * @param {THREE.Vector2} ndc Normalized device coordinates
     * @param {THREE.Camera} camera Camera
     * @returns {THREE.Vector3}
     */
    PanController.prototype.getWorldSpaceCoordinates = function (ndc, camera) {
        var mouse = new THREE.Vector3().set(-ndc.x * 2 - 1, ndc.y * 2 + 1, 0.5);
        return mouse.unproject(camera);
    };

    PanController.prototype.onMouseDown = function (event) {
        if (FOUR.utils.isMouseRightPressed(event)) {
            this.domElement.style.cursor = this.CURSOR.PAN;
            this.mode = this.MODES.PAN;
            var ndc = this.getNormalizedDeviceCoordinates(event.offsetX, event.offsetY, this.domElement);
            this.pan.start.copy(ndc);
            this.pan.end.copy(ndc);
            event.preventDefault();
        }
    };

    PanController.prototype.onMouseMove = function (event) {
        if (FOUR.utils.isMouseRightPressed(event)) {
            var ndc = this.getNormalizedDeviceCoordinates(event.offsetX, event.offsetY, this.domElement);
            //console.info('ndc', ndc);
            this.pan.end.copy(ndc);
            event.preventDefault();
            this.dispatchEvent({type: FOUR.EVENT.UPDATE});
        }
    };

    PanController.prototype.onMouseUp = function (event) {
        if (this.mode === this.MODES.PAN) {
            this.domElement.style.cursor = this.CURSOR.DEFAULT;
            this.mode = this.MODES.NONE;
            this.pan.delta.set(0, 0);
            event.preventDefault();
        }
    };

    PanController.prototype.update = function () {
        if (this.enabled === false) {
            return;
        } else if (this.mode === this.MODES.PAN) {
            this.pan.delta.subVectors(this.pan.end, this.pan.start);
            if (this.pan.delta.lengthSq() > this.EPS) {
                var camera = this.viewport.getCamera();
                // transform screen coordinates to world space coordinates
                var start = this.getWorldSpaceCoordinates(this.pan.start, camera);
                var end = this.getWorldSpaceCoordinates(this.pan.end, camera);
                // translate world space coordinates to camera movement delta
                var delta = end.sub(start).multiplyScalar(camera.getDistance() * this.panSpeed);
                // add delta to camera position
                var position = new THREE.Vector3().addVectors(delta, camera.position);
                camera.setPosition(position, false);
                // consume the change
                this.pan.start.copy(this.pan.end);
                this.dispatchEvent({type: FOUR.EVENT.RENDER});
            }
        }
    };

    return PanController;

}());
