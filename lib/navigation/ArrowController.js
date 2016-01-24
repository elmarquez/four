/**
 * Arrow key controller is used to translate the camera along the orthogonal
 * axes relative to the camera direction. CTRL+ALT+Arrow key is used to rotate
 * camera view around the current position.
 */
FOUR.ArrowController = (function () {

    function ArrowController (config) {
        THREE.EventDispatcher.call(this);
        config = config || {};
        var self = this;

        self.EVENT = {
            UPDATE: {type:'update'},
            UPDATE_END: {type:'continuous-update-end'},
            UPDATE_START: {type:'continuous-update-start'}
        };
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
        self.domElement = config.domElement || config.viewport.domElement;
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
        self.movementSpeed = 100.0;
        self.temp = {};
        self.timeout = null;
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
        });
    };

    ArrowController.prototype.enable = function () {
        var self = this;
        function addListener(element, event, fn) {
            self.listeners[event] = {
                element: element,
                event: event,
                fn: fn.bind(self)
            };
            element.addEventListener(event, self.listeners[event].fn, false);
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
        switch(event.keyCode) {
            case this.KEY.CTRL:
                this.modifiers[this.KEY.CTRL] = true;
                break;
            case this.KEY.MOVE_TO_EYE_HEIGHT:
                this.setWalkHeight();
                this.dispatchEvent(this.EVENT.UPDATE_START);
                break;
            case this.KEY.MOVE_FORWARD:
                this.move.forward = true;
                this.dispatchEvent(this.EVENT.UPDATE_START);
                break;
            case this.KEY.MOVE_BACK:
                this.move.backward = true;
                this.dispatchEvent(this.EVENT.UPDATE_START);
                break;
            case this.KEY.MOVE_LEFT:
                this.move.left = true;
                this.dispatchEvent(this.EVENT.UPDATE_START);
                break;
            case this.KEY.MOVE_RIGHT:
                this.move.right = true;
                this.dispatchEvent(this.EVENT.UPDATE_START);
                break;
            case this.KEY.MOVE_UP:
                this.move.up = true;
                this.dispatchEvent(this.EVENT.UPDATE_START);
                break;
            case this.KEY.MOVE_DOWN:
                this.move.down = true;
                this.dispatchEvent(this.EVENT.UPDATE_START);
                break;
        }
    };

    /**
     * Handle key up event.
     * @param event
     */
    ArrowController.prototype.onKeyUp = function (event) {
        switch(event.keyCode) {
            case this.KEY.CTRL:
                this.modifiers[this.KEY.CTRL] = false;
                break;
            case this.KEY.MOVE_FORWARD:
                this.move.forward = false;
                this.dispatchEvent(this.EVENT.UPDATE_END);
                break;
            case this.KEY.MOVE_BACK:
                this.move.backward = false;
                this.dispatchEvent(this.EVENT.UPDATE_END);
                break;
            case this.KEY.MOVE_LEFT:
                this.move.left = false;
                this.dispatchEvent(this.EVENT.UPDATE_END);
                break;
            case this.KEY.MOVE_RIGHT:
                this.move.right = false;
                this.dispatchEvent(this.EVENT.UPDATE_END);
                break;
            case this.KEY.MOVE_UP:
                this.move.up = false;
                this.dispatchEvent(this.EVENT.UPDATE_END);
                break;
            case this.KEY.MOVE_DOWN:
                this.move.down = false;
                this.dispatchEvent(this.EVENT.UPDATE_END);
                break;
            case this.KEY.CANCEL:
                var self = this;
                Object.keys(this.move).forEach(function (key) {
                    self.move[key] = false;
                });
                this.lookChange = false;
                this.dispatchEvent(this.EVENT.UPDATE_END);
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

        if (change) {
            this.dispatchEvent(this.EVENT.UPDATE);
            this.temp.change = false;
        }
    };

    return ArrowController;

}());
