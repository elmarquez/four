FOUR.LookController = (function () {

    /**
     * The look controller rotates the view around the current camera position,
     * emulating a first person view.
     *
     * TODO record the camera start orientation
     * TODO when the GRAVE_ACCENT key is pressed, reset the camera to the start orientation
     */
    function LookController(config) {
        THREE.EventDispatcher.call(this);
        config = config || {};
        var self = this;

        self.EPS = 0.000001;
        self.MOUSE_STATE = {
            UP: 0,
            DOWN: 1
        };

        self.active = false;
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
            delete self.listeners[key];
        });
    };

    LookController.prototype.enable = function () {
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
        addListener(window, 'keydown', self.onKeyDown);
        addListener(window, 'keyup', self.onKeyUp);
        self.enabled = true;
    };

    LookController.prototype.onKeyDown = function (event) {
        if (event.keyCode === FOUR.KEY.CTRL) {
            this.active = true;
        }
    };

    LookController.prototype.onKeyUp = function (event) {
        if (event.keyCode === FOUR.KEY.GRAVE_ACCENT && !this.active) {
            this.camera.lookAt(this.camera.target);
        } else if (event.keyCode === FOUR.KEY.CTRL) {
            this.active = false;
        }
    };

    LookController.prototype.onMouseDown = function (event) {
        if (this.active && FOUR.utils.isMouseMiddlePressed(event)) {
            this.domElement.style.cursor = FOUR.CURSOR.LOOK;
            this.mouse = this.MOUSE_STATE.DOWN;
            this.look.start.set(event.offsetX - this.domElement.clientLeft, event.offsetY - this.domElement.clientTop);
            this.look.end.copy(this.look.start);
        }
    };

    LookController.prototype.onMouseMove = function (event) {
        if (this.active && this.mouse === this.MOUSE_STATE.DOWN && FOUR.utils.isMouseMiddlePressed(event)) {
            this.look.end.set(event.offsetX - this.domElement.clientLeft, event.offsetY - this.domElement.clientTop);
            this.dispatchEvent({type: FOUR.EVENT.UPDATE});
        }
    };

    LookController.prototype.onMouseUp = function () {
        if (this.active && this.mouse === this.MOUSE_STATE.DOWN && FOUR.utils.isMouseMiddlePressed(event)) {
            this.domElement.style.cursor = FOUR.CURSOR.DEFAULT;
            this.mouse = this.MOUSE_STATE.UP;
            this.look.start.copy(this.look.end);
            this.active = false;
        }
    };

    LookController.prototype.update = function () {
        if (this.enabled === false) {
            return;
        }
        if (this.active && this.mouse === this.MOUSE_STATE.DOWN && FOUR.utils.isMouseMiddlePressed(event)) {
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
                //this.look.end.copy(this.look.start); // consume the change
                this.dispatchEvent({type: FOUR.EVENT.RENDER});
            }
        }
    };

    return LookController;

}());
