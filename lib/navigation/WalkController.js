FOUR.WalkController = (function () {

    /**
     * First person navigation controller. Uses keys to control movement in
     * cardinal directions. Assumes that +Z is up. Accepts a function that
     * maintains a minimum Z position.
     */
    function WalkController(config) {
        THREE.EventDispatcher.call(this);
        config = config || {};
        var self = this;

        self.KEY = {
            CANCEL: FOUR.KEY.ESC,
            CTRL: FOUR.KEY.CTRL,
            MOVE_TO_EYE_HEIGHT: FOUR.KEY.GRAVE_ACCENT,
            MOVE_FORWARD: FOUR.KEY.ARROW_UP,
            MOVE_LEFT: FOUR.KEY.ARROW_LEFT,
            MOVE_BACK: FOUR.KEY.ARROW_DOWN,
            MOVE_RIGHT: FOUR.KEY.ARROW_RIGHT,
            MOVE_UP: -1,
            MOVE_DOWN: -1,
            ROTATE_LEFT: -1,
            ROTATE_RIGHT: -1
        };
        self.MOUSE_STATE = {
            DOWN: 0,
            UP: 1
        };

        self.camera = config.camera || config.viewport.camera;
        self.domElement = config.domElement || config.viewport.domElement;
        self.enabled = false;
        self.enforceWalkHeight = true;
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
            end: {x: 0, y: 0},
            start: {x: 0, y: 0},
            state: self.MOUSE_STATE.UP
        };
        self.move = {
            forward: false,
            backward: false,
            left: false,
            right: false,
            up: false,
            down: false
        };
        self.movementSpeed = 100.0;
        self.raycaster = new THREE.Raycaster();
        self.timeout = null;
        self.viewport = config.viewport;
        self.walkHeight = null;

        self.viewHalfX = self.domElement.offsetWidth / 2;
        self.viewHalfY = self.domElement.offsetHeight / 2;

        self.domElement.setAttribute('tabindex', -1);

        // done
        Object.keys(config).forEach(function (key) {
            self[key] = config[key];
        });
    }

    WalkController.prototype = Object.create(THREE.EventDispatcher.prototype);

    WalkController.prototype.constructor = WalkController;

    WalkController.prototype.WALK_HEIGHT = 2;

    WalkController.prototype.contextMenu = function (event) {
        event.preventDefault();
    };

    WalkController.prototype.disable = function () {
        var self = this;
        self.enabled = false;
        Object.keys(self.listeners).forEach(function (key) {
            var listener = self.listeners[key];
            listener.element.removeEventListener(listener.event, listener.fn);
            delete self.listeners[key];
        });
    };

    WalkController.prototype.enable = function () {
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

        addListener(window, 'keydown', self.onKeyDown);
        addListener(window, 'keyup', self.onKeyUp);
        self.enabled = true;
        self.setWalkHeight();
    };

    /**
     * Get the walking height at the specified position.
     * @param {THREE.Vector3} position Camera position
     * @returns {THREE.Vector3} Position
     */
    WalkController.prototype.getWalkHeight = function (position) {
        return 0 + this.WALK_HEIGHT;
    };

    WalkController.prototype.onKeyDown = function (event) {
        var self = this;
        if (!self.enabled) {
            return;
        }
        switch (event.keyCode) {
            case FOUR.KEY.CTRL:
                self.modifiers[FOUR.KEY.CTRL] = true;
                break;
            case self.KEY.MOVE_TO_EYE_HEIGHT:
                self.setWalkHeight();
                self.dispatchEvent({type: FOUR.EVENT.CONTINUOUS_UPDATE_START});
                break;
            case self.KEY.MOVE_FORWARD:
                self.move.forward = true;
                self.dispatchEvent({type: FOUR.EVENT.CONTINUOUS_UPDATE_START});
                break;
            case self.KEY.MOVE_BACK:
                self.move.backward = true;
                self.dispatchEvent({type: FOUR.EVENT.CONTINUOUS_UPDATE_START});
                break;
            case self.KEY.MOVE_LEFT:
                self.move.left = true;
                self.dispatchEvent({type: FOUR.EVENT.CONTINUOUS_UPDATE_START});
                break;
            case self.KEY.MOVE_RIGHT:
                self.move.right = true;
                self.dispatchEvent({type: FOUR.EVENT.CONTINUOUS_UPDATE_START});
                break;
            case self.KEY.MOVE_UP:
                self.move.up = true;
                self.dispatchEvent({type: FOUR.EVENT.CONTINUOUS_UPDATE_START});
                break;
            case self.KEY.MOVE_DOWN:
                self.move.down = true;
                self.dispatchEvent({type: FOUR.EVENT.CONTINUOUS_UPDATE_START});
                break;
        }
    };

    WalkController.prototype.onKeyUp = function (event) {
        var self = this;
        switch (event.keyCode) {
            case FOUR.KEY.CTRL:
                self.modifiers[FOUR.KEY.CTRL] = false;
                break;
            case self.KEY.MOVE_FORWARD:
                self.move.forward = false;
                self.dispatchEvent({type: FOUR.EVENT.CONTINUOUS_UPDATE_END});
                break;
            case self.KEY.MOVE_BACK:
                self.move.backward = false;
                self.dispatchEvent({type: FOUR.EVENT.CONTINUOUS_UPDATE_END});
                break;
            case self.KEY.MOVE_LEFT:
                self.move.left = false;
                self.dispatchEvent({type: FOUR.EVENT.CONTINUOUS_UPDATE_END});
                break;
            case self.KEY.MOVE_RIGHT:
                self.move.right = false;
                self.dispatchEvent({type: FOUR.EVENT.CONTINUOUS_UPDATE_END});
                break;
            case self.KEY.MOVE_UP:
                self.move.up = false;
                self.dispatchEvent({type: FOUR.EVENT.CONTINUOUS_UPDATE_END});
                break;
            case self.KEY.MOVE_DOWN:
                self.move.down = false;
                self.dispatchEvent({type: FOUR.EVENT.CONTINUOUS_UPDATE_END});
                break;
            case FOUR.KEY.CANCEL:
                Object.keys(self.move).forEach(function (key) {
                    self.move[key] = false;
                });
                self.lookChange = false;
                self.dispatchEvent({type: FOUR.EVENT.CONTINUOUS_UPDATE_END});
                break;
        }
    };

    WalkController.prototype.setWalkHeight = function () {
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
        return self.camera
            .resetOrientation(true)
            .then(function () {
                return self.camera.setPositionAndTarget(pos, target);
            });
    };

    WalkController.prototype.update = function (delta) {
        var change = false, cross, distance, height, next, offset, self = this;
        if (!self.enabled) {
            return;
        }
        distance = delta * self.movementSpeed;
        offset = new THREE.Vector3().subVectors(self.camera.position, self.camera.target);
        offset.setLength(distance);
        cross = new THREE.Vector3().crossVectors(offset, self.camera.up);

        // translate the camera
        if (self.move.forward) {
            offset.negate();
            next = new THREE.Vector3().addVectors(self.camera.position, offset);
            self.camera.position.copy(next);
            next = new THREE.Vector3().addVectors(self.camera.target, offset);
            self.camera.target.copy(next);
            change = true;
        }
        if (self.move.backward) {
            next = new THREE.Vector3().addVectors(self.camera.position, offset);
            self.camera.position.copy(next);
            next = new THREE.Vector3().addVectors(self.camera.target, offset);
            self.camera.target.copy(next);
            change = true;
        }
        if (self.move.right) {
            cross.negate();
            next = new THREE.Vector3().addVectors(self.camera.position, cross);
            self.camera.position.copy(next);
            next = new THREE.Vector3().addVectors(self.camera.target, cross);
            self.camera.target.copy(next);
            change = true;
        }
        if (self.move.left) {
            next = new THREE.Vector3().addVectors(self.camera.position, cross);
            self.camera.position.copy(next);
            next = new THREE.Vector3().addVectors(self.camera.target, cross);
            self.camera.target.copy(next);
            change = true;
        }
        if (self.move.up) {
            offset = new THREE.Vector3().copy(self.camera.up);
            offset.setLength(distance);
            next = new THREE.Vector3().addVectors(self.camera.position, offset);
            self.camera.position.copy(next);
            next = new THREE.Vector3().addVectors(self.camera.target, offset);
            self.camera.target.copy(next);
            change = true;
        }
        if (self.move.down) {
            height = self.getWalkHeight(self.camera.position);
            offset = new THREE.Vector3().copy(self.camera.up).negate();
            offset.setLength(distance);
            next = new THREE.Vector3().addVectors(self.camera.position, offset);
            next.z = next.z < height ? height : next.z;
            self.camera.position.copy(next);
            next = new THREE.Vector3().addVectors(self.camera.target, offset);
            next.z = next.z < height ? height : next.z;
            self.camera.target.copy(next);
            change = true;
        }

        if (change) {
            self.dispatchEvent({type: FOUR.EVENT.RENDER});
        }
    };

    return WalkController;

}());
