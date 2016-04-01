FOUR.ArrowController = (function () {

    /**
     * Arrow key controller is used to translate the camera along the orthogonal
     * axes relative to the camera direction. CTRL+ALT+Arrow key is used to rotate
     * camera view around the current position.
     * @param {Object} config Configuration
     */
    function ArrowController(config) {
        THREE.EventDispatcher.call(this);
        config = config || {};
        var self = this;

        self.KEY = {
            ALT: 18,
            CTRL: 17,
            SHIFT: 16, // FIXME is this one used??
            MOVE_FORWARD: 38,
            MOVE_LEFT: 37,
            MOVE_BACK: 40,
            MOVE_RIGHT: 39,
            MOVE_UP: 221,
            MOVE_DOWN: 219,
            ROTATE_LEFT: -1,
            ROTATE_RIGHT: -1
        };

        self.camera = config.camera || config.viewport.camera;
        self.enabled = false;
        self.listeners = {};
        self.modifiers = {};
        self.move = {
            forward: false,
            backward: false,
            left: false,
            right: false,
            up: false,
            down: false
        };
        self.movementSpeed = 5.0;
        self.tasks = {};
        self.temp = {};
        self.viewport = config.viewport;

        Object.keys(config).forEach(function (key) {
            self[key] = config[key];
        });
    }

    ArrowController.prototype = Object.create(THREE.EventDispatcher.prototype);

    ArrowController.prototype.constructor = ArrowController;

    ArrowController.prototype.disable = function () {
        var self = this;
        self.enabled = false;
        Object.keys(self.listeners).forEach(function (key) {
            var listener = self.listeners[key];
            listener.element.removeEventListener(listener.event, listener.fn);
            delete self.listeners[key];
        });
    };

    ArrowController.prototype.enable = function () {
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
    };

    /**
     * Handle key down event.
     * @param event
     */
    ArrowController.prototype.onKeyDown = function (event) {
        if (!this.enabled) {
            return;
        }
        switch (event.keyCode) {
            case this.KEY.CTRL:
                this.modifiers[this.KEY.CTRL] = true;
                break;
            case this.KEY.MOVE_TO_EYE_HEIGHT:
                this.setWalkHeight();
                this.dispatchEvent({
                    type: FOUR.EVENT.CONTINUOUS_UPDATE_START,
                    id: 'move',
                    task: 'arrow-move-to-eye-height'
                });
                break;
            case this.KEY.MOVE_FORWARD:
                if (!this.move.forward) {
                    this.move.forward = true;
                    this.dispatchEvent({
                        type: FOUR.EVENT.CONTINUOUS_UPDATE_START,
                        id: 'move',
                        task: 'arrow-move-forward'
                    });
                    return false;
                }
                break;
            case this.KEY.MOVE_BACK:
                if (!this.move.backward) {
                    this.move.backward = true;
                    this.dispatchEvent({type: FOUR.EVENT.CONTINUOUS_UPDATE_START, id: 'move', task: 'arrow-move-back'});
                    return false;
                }
                break;
            case this.KEY.MOVE_LEFT:
                if (!this.move.left) {
                    this.move.left = true;
                    this.dispatchEvent({type: FOUR.EVENT.CONTINUOUS_UPDATE_START, id: 'move', task: 'arrow-move-left'});
                }
                break;
            case this.KEY.MOVE_RIGHT:
                if (!this.move.right) {
                    this.move.right = true;
                    this.dispatchEvent({
                        type: FOUR.EVENT.CONTINUOUS_UPDATE_START,
                        id: 'move',
                        task: 'arrow-move-right'
                    });
                }
                break;
            case this.KEY.MOVE_UP:
                if (!this.move.up) {
                    this.move.up = true;
                    this.dispatchEvent({type: FOUR.EVENT.CONTINUOUS_UPDATE_START, id: 'move', task: 'arrow-move-up'});
                }
                break;
            case this.KEY.MOVE_DOWN:
                if (!this.move.down) {
                    this.move.down = true;
                    this.dispatchEvent({type: FOUR.EVENT.CONTINUOUS_UPDATE_START, id: 'move', task: 'arrow-move-down'});
                }
                break;
        }
    };

    /**
     * Handle key up event.
     * @param event
     */
    ArrowController.prototype.onKeyUp = function (event) {
        switch (event.keyCode) {
            case this.KEY.CTRL:
                this.modifiers[this.KEY.CTRL] = false;
                break;
            case this.KEY.MOVE_FORWARD:
                if (this.move.forward) {
                    this.move.forward = false;
                    this.dispatchEvent({type: FOUR.EVENT.CONTINUOUS_UPDATE_END, id: 'move'});
                    return false;
                }
                break;
            case this.KEY.MOVE_BACK:
                if (this.move.backward) {
                    this.move.backward = false;
                    this.dispatchEvent({type: FOUR.EVENT.CONTINUOUS_UPDATE_END, id: 'move'});
                    return false;
                }
                break;
            case this.KEY.MOVE_LEFT:
                if (this.move.left) {
                    this.move.left = false;
                    this.dispatchEvent({type: FOUR.EVENT.CONTINUOUS_UPDATE_END, id: 'move'});
                }
                break;
            case this.KEY.MOVE_RIGHT:
                if (this.move.right) {
                    this.move.right = false;
                    this.dispatchEvent({type: FOUR.EVENT.CONTINUOUS_UPDATE_END, id: 'move'});
                }
                break;
            case this.KEY.MOVE_UP:
                if (this.move.up) {
                    this.move.up = false;
                    this.dispatchEvent({type: FOUR.EVENT.CONTINUOUS_UPDATE_END, id: 'move'});
                }
                break;
            case this.KEY.MOVE_DOWN:
                if (this.move.down) {
                    this.move.down = false;
                    this.dispatchEvent({type: FOUR.EVENT.CONTINUOUS_UPDATE_END, id: 'move'});
                }
                break;
            case this.KEY.CANCEL:
                var self = this;
                Object.keys(this.move).forEach(function (key) {
                    self.move[key] = false;
                });
                this.dispatchEvent({type: FOUR.EVENT.CONTINUOUS_UPDATE_END, id: 'move'});
                break;
        }
    };

    /**
     * Update the controller and camera state.
     * @param delta
     */
    ArrowController.prototype.update = function (delta) {
        if (!this.enabled) {
            return;
        }
        this.temp.change = false;
        this.temp.distance = delta * this.movementSpeed;
        this.temp.offset = new THREE.Vector3().subVectors(this.camera.position, this.camera.target);
        this.temp.offset.setLength(this.temp.distance);
        this.temp.cross = new THREE.Vector3().crossVectors(this.temp.offset, this.camera.up);

        // translate the camera
        if (this.move.forward) {
            this.temp.offset.negate();
            this.temp.next = new THREE.Vector3().addVectors(this.camera.position, this.temp.offset);
            this.camera.position.copy(this.temp.next);
            this.temp.next = new THREE.Vector3().addVectors(this.camera.target, this.temp.offset);
            this.camera.target.copy(this.temp.next);
            this.temp.change = true;
        }
        if (this.move.backward) {
            this.temp.next = new THREE.Vector3().addVectors(this.camera.position, this.temp.offset);
            this.camera.position.copy(this.temp.next);
            this.temp.next = new THREE.Vector3().addVectors(this.camera.target, this.temp.offset);
            this.camera.target.copy(this.temp.next);
            this.temp.change = true;
        }
        if (this.move.right) {
            this.temp.cross.negate();
            this.temp.next = new THREE.Vector3().addVectors(this.camera.position, this.temp.cross);
            this.camera.position.copy(this.temp.next);
            this.temp.next = new THREE.Vector3().addVectors(this.camera.target, this.temp.cross);
            this.camera.target.copy(this.temp.next);
            this.temp.change = true;
        }
        if (this.move.left) {
            this.temp.next = new THREE.Vector3().addVectors(this.camera.position, this.temp.cross);
            this.camera.position.copy(this.temp.next);
            this.temp.next = new THREE.Vector3().addVectors(this.camera.target, this.temp.cross);
            this.camera.target.copy(this.temp.next);
            this.temp.change = true;
        }
        if (this.move.up) {
            this.temp.offset = new THREE.Vector3().copy(this.camera.up);
            this.temp.offset.setLength(this.temp.distance);
            this.temp.next = new THREE.Vector3().addVectors(this.camera.position, this.temp.offset);
            this.camera.position.copy(this.temp.next);
            this.temp.next = new THREE.Vector3().addVectors(this.camera.target, this.temp.offset);
            this.camera.target.copy(this.temp.next);
            this.temp.change = true;
        }
        if (this.move.down) {
            this.temp.offset = new THREE.Vector3().copy(this.camera.up).negate();
            this.temp.offset.setLength(this.temp.distance);
            this.temp.next = new THREE.Vector3().addVectors(this.camera.position, this.temp.offset);
            this.camera.position.copy(this.temp.next);
            this.temp.next = new THREE.Vector3().addVectors(this.camera.target, this.temp.offset);
            this.camera.target.copy(this.temp.next);
            this.temp.change = true;
        }
        if (this.temp.change) {
            this.dispatchEvent({type: FOUR.EVENT.RENDER});
        }
    };

    return ArrowController;

}());
