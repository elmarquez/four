'use strict';

var FOUR = FOUR || {};

/**
 * First person navigation controller. Uses U-I-O-J-K-L keys for navigation
 * and the mouse point for look control.
 */
FOUR.WalkController = (function () {

    function WalkController (camera, domElement) {
        THREE.EventDispatcher.call(this);
        var self = this;

        self.KEY = {
            CANCEL: 27,
            MOVE_FORWARD: 73,
            MOVE_LEFT: 74,
            MOVE_BACK: 75,
            MOVE_RIGHT: 76,
            MOVE_UP: 85,
            MOVE_DOWN: 79
        };

        self.camera = camera;
        self.domElement = domElement;
        self.enabled = false;
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
            start: { x: 0, y: 0 }
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
        self.enforceWalkHeight = false;

        self.viewHalfX = self.domElement.offsetWidth / 2;
        self.viewHalfY = self.domElement.offsetHeight / 2;
        self.domElement.setAttribute('tabindex', -1);
    }

    WalkController.prototype = Object.create(THREE.EventDispatcher.prototype);

    WalkController.prototype.constructor = WalkController;

    WalkController.prototype.WALK_HEIGHT = 2;

    WalkController.prototype.disable = function () {
        var self = this;
        self.enabled = false;
        self.domElement.removeEventListener('mousedown', self.onMouseDown);
    };

    WalkController.prototype.enable = function () {
        var self = this;
        // attach mousedown listener
        self.domElement.addEventListener('mousedown', self.onMouseDown.bind(self));
        // translate the camera to the walking height
        if (self.enforceWalkHeight) {
            self.setWalkHeight().then(function () {
                self.enabled = true;
            });
        } else {
            self.enabled = true;
        }
    };

    WalkController.prototype.onKeyDown = function (event) {
        var self = this;
        if (!self.enabled) {
            return;
        }
        switch(event.keyCode) {
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
        // get mouse coordinates
        self.mouse.start = new THREE.Vector2(
            event.pageX - self.domElement.offsetLeft - self.viewHalfX,
            event.pageY - self.domElement.offsetTop - self.viewHalfY
        );
        // bind mousemove, mouseup handlers
        self.domElement.addEventListener('mousemove', self.onMouseMove.bind(self), false);
        self.domElement.addEventListener('mouseup', self.onMouseUp.bind(self), false);
        self.lookChange = true;
    };

    WalkController.prototype.onMouseMove = function (event) {
        var self = this;
        // get mouse coordinates
        self.mouse.end = new THREE.Vector2(
            event.pageX - self.domElement.offsetLeft - self.viewHalfX,
            event.pageY - self.domElement.offsetTop - self.viewHalfY
        );
        self.mouse.direction = new THREE.Vector2(
            (self.mouse.end.x / self.domElement.clientWidth) * 2,
            (self.mouse.end.y / self.domElement.clientHeight) * 2
        );
    };

    WalkController.prototype.onMouseUp = function (event) {
        // detatch mousemove, mouseup handlers
        var self = this;
        self.domElement.removeEventListener('mousemove', self.onMouseMove);
        self.domElement.removeEventListener('mouseup', self.onMouseUp);
        self.lookChange = false;
    };

    WalkController.prototype.onResize = function () {
        console.log('resize');
    };

    WalkController.prototype.setWalkHeight = function () {
        var self = this;
        return self.camera.setPositionAndTarget(
            self.camera.position.x,
            self.camera.position.y,
            self.WALK_HEIGHT,
            self.camera.target.x,
            self.camera.target.y,
            self.WALK_HEIGHT);
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
            self.camera.rotateOnAxis(
                new THREE.Vector3(0,1,0),
                Math.PI * 2 / 360 * -self.mouse.direction.x * self.lookSpeed);
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
