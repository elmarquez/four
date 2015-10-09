'use strict';

var FOUR = FOUR || {};

/**
 * First person navigation controller. Uses U-I-O-J-K-L keys for navigation
 * and the mouse pointer for look control. Assumes that +Z is up.
 */
FOUR.WalkController = (function () {

    function WalkController (config) {
        THREE.EventDispatcher.call(this);
        var self = this;

        self.SINGLE_CLICK_TIMEOUT = 400; // milliseconds
        self.KEY = {
            CANCEL: 27,
            CTRL: 17,
            MOVE_TO_EYE_HEIGHT: 192,
            MOVE_FORWARD: 38,
            MOVE_LEFT: 37,
            MOVE_BACK: 40,
            MOVE_RIGHT: 39,
            MOVE_UP: 221,
            MOVE_DOWN: 219
        };
        self.MOUSE_STATE = {
            DOWN: 0,
            UP: 1
        };

        self.camera = config.camera || config.viewport.camera;
        self.domElement = config.domElement || config.viewport.domElement;
        self.enabled = false;
        self.enforceWalkHeight = false;
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
            end: { x: 0, y: 0 },
            start: { x: 0, y: 0 },
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
        });
    };

    WalkController.prototype.emit = function (event) {
        this.dispatchEvent({type: event || 'update'});
    };

    WalkController.prototype.enable = function () {
        var self = this;
        function addListener(element, event, fn) {
            self.listeners[event] = {
                element: element,
                event: event,
                fn: fn.bind(self)
            };
            element.addEventListener(event, self.listeners[event].fn, false);
        }
        addListener(self.domElement, 'mousedown', self.onMouseDown);
        addListener(self.domElement, 'mousemove', self.onMouseMove);
        addListener(self.domElement, 'mouseup', self.onMouseUp);
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
        return 0;
    };

    WalkController.prototype.handleDoubleClick = function (selected) {
        var self = this;
        // CTRL double click rotates the camera toward the selected point
        if (self.modifiers[self.KEY.CTRL]) {
            self.dispatchEvent({type:'lookat', position:selected.point, object:selected.object});
        }
        // double click navigates the camera to the selected point
        else {
            self.dispatchEvent({type:'navigate', position:selected.point, object:selected.object});
        }
    };

    WalkController.prototype.handleSingleClick = function () {};

    WalkController.prototype.onKeyDown = function (event) {
        var self = this;
        if (!self.enabled) {
            return;
        }
        switch(event.keyCode) {
            case self.KEY.CTRL:
                self.modifiers[self.KEY.CTRL] = true;
                break;
            case self.KEY.MOVE_TO_EYE_HEIGHT:
                self.setWalkHeight();
                break;
            case self.KEY.MOVE_FORWARD:
                self.move.forward = true;
                break;
            case self.KEY.MOVE_BACK:
                self.move.backward = true;
                break;
            case self.KEY.MOVE_LEFT:
                self.move.left = true;
                break;
            case self.KEY.MOVE_RIGHT:
                self.move.right = true;
                break;
            case self.KEY.MOVE_UP:
                self.move.up = true;
                break;
            case self.KEY.MOVE_DOWN:
                self.move.down = true;
                break;
        }
    };

    WalkController.prototype.onKeyUp = function (event) {
        var self = this;
        switch(event.keyCode) {
            case self.KEY.CTRL:
                self.modifiers[self.KEY.CTRL] = false;
                break;
            case self.KEY.MOVE_FORWARD:
                self.move.forward = false;
                break;
            case self.KEY.MOVE_BACK:
                self.move.backward = false;
                break;
            case self.KEY.MOVE_LEFT:
                self.move.left = false;
                break;
            case self.KEY.MOVE_RIGHT:
                self.move.right = false;
                break;
            case self.KEY.MOVE_UP:
                self.move.up = false;
                break;
            case self.KEY.MOVE_DOWN:
                self.move.down = false;
                break;
            case self.KEY.CANCEL:
                Object.keys(self.move).forEach(function (key) {
                    self.move[key] = false;
                });
                self.lookChange = false;
                break;
        }
    };

    WalkController.prototype.onMouseDown = function (event) {
        var self = this;
        self.lookChange = false;
        self.mouse.state = self.MOUSE_STATE.DOWN;
        // get mouse coordinates
        self.mouse.start = new THREE.Vector2(
            event.pageX - self.domElement.offsetLeft - self.viewHalfX,
            event.pageY - self.domElement.offsetTop - self.viewHalfY
        );
        // handle single and double click events
        if (self.timeout !== null) {
            //console.log('double click');
            clearTimeout(self.timeout);
            self.timeout = null;
            // calculate mouse position in normalized device coordinates (-1 to +1)
            self.mouse.end.x = (event.offsetX / self.viewport.domElement.clientWidth) * 2 - 1;
            self.mouse.end.y = -(event.offsetY / self.viewport.domElement.clientHeight) * 2 + 1;
            // update the picking ray with the camera and mouse position
            self.raycaster.setFromCamera(self.mouse.end, self.viewport.camera);
            // calculate objects intersecting the picking ray
            var intersects = self.raycaster.intersectObjects(self.viewport.scene.model.children, true); // TODO this is FOUR specific use of children
            // handle the action for the nearest object
            if (intersects && intersects.length > 0) {
                self.handleDoubleClick(intersects[0]);
            }
        } else {
            self.timeout = setTimeout(function () {
                //console.log('single click');
                clearTimeout(self.timeout);
                self.timeout = null;
            }, self.SINGLE_CLICK_TIMEOUT);
        }
    };

    WalkController.prototype.onMouseMove = function (event) {
        var self = this;
        if (self.mouse.state === self.MOUSE_STATE.DOWN) {
            self.lookChange = true;
            self.mouse.end = new THREE.Vector2(
              event.pageX - self.domElement.offsetLeft - self.viewHalfX,
              event.pageY - self.domElement.offsetTop - self.viewHalfY
            );
            self.mouse.direction = new THREE.Vector2(
              (self.mouse.end.x / self.domElement.clientWidth) * 2,
              (self.mouse.end.y / self.domElement.clientHeight) * 2
            );
        }
    };

    WalkController.prototype.onMouseUp = function (event) {
        var self = this;
        self.lookChange = false;
        self.mouse.state = self.MOUSE_STATE.UP;
    };

    WalkController.prototype.onResize = function () {
        console.log('resize');
    };

    WalkController.prototype.setWalkHeight = function () {
        var self = this;
        return self.camera
          .resetOrientation(self.emit.bind(self))
          .then(function () {
            self.camera.setPositionAndTarget(
              self.camera.position.x,
              self.camera.position.y,
              self.WALK_HEIGHT,
              self.camera.target.x,
              self.camera.target.y,
              self.WALK_HEIGHT);
        });
    };

    WalkController.prototype.update = function (delta) {
        var self = this;
        if (!self.enabled) {
            return;
        }
        var distance = delta * self.movementSpeed;
        var change = false;

        // translate the camera
        if (self.move.forward) {
            self.camera.translateZ(-distance);
            change = true;
        }
        if (self.move.backward) {
            self.camera.translateZ(distance);
            change = true;
        }
        if (self.move.right) {
            self.camera.translateX(distance);
            change = true;
        }
        if (self.move.left) {
            self.camera.translateX(-distance);
            change = true;
        }
        if (self.move.up) {
            self.camera.translateY(-distance);
            change = true;
        }
        if (self.move.down) {
            self.camera.translateY(distance);
            change = true;
        }

        // change the camera lookat direction
        if (self.lookChange) {
            //self.camera.rotateOnAxis(
            //    new THREE.Vector3(0,1,0),
            //    Math.PI * 2 / 360 * -self.mouse.direction.x * self.lookSpeed);
            // TODO clamp the amount of vertical rotation
            //self.camera.rotateOnAxis(
            //    new THREE.Vector3(1,0,0),
            //    Math.PI * 2 / 360 * -self.mouse.direction.y * self.lookSpeed * 0.5);
            change = true;
        }
        if (change) {
            self.dispatchEvent({'type':'change'});
        }
    };

    return WalkController;

}());
