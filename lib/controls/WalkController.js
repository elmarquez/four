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
            I: 73,
            J: 74,
            K: 75,
            L: 76,
            U: 85,
            O: 79
        };

        self.MODIFIERS = {
            ALT: 'ALT',
            CTRL: 'CTRL',
            SHIFT: 'SHIFT'
        };

        self.actions = {};
        self.camera = camera;
        self.domElement = domElement;
        self.enabled = false;
        self.look = {
            up: false,
            down: false,
            left: false,
            right: false
        };
        self.lookChange = false;
        self.lookSpeed = 0.005;
        self.lookVertical = true;
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

        self.lat = 0;
        self.lon = 0;
        self.phi = 0;
        self.theta = 0;

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
        // ALT key changes controller to look mode
        var self = this;
        if (!self.enabled) {
            return;
        }
        switch(event.keyCode) {
            case self.KEY.I:
                self.move.forward = true;
                //self.actions['forward'] = self.translate(self.camera, self.modifiers);
                break;
            case self.KEY.K:
                self.move.backward = true;
                break;
            case self.KEY.J:
                self.move.left = true;
                break;
            case self.KEY.L:
                self.move.right = true;
                break;
            case self.KEY.U:
                self.move.up = true;
                break;
            case self.KEY.O:
                self.move.down = true;
                break;
        }
    };

    WalkController.prototype.onKeyUp = function (event) {
        var self = this;
        switch(event.keyCode) {
            case self.KEY.I:
                self.move.forward = false;
                //if (self.actions.hasOwnProperty('forward')) {
                //    delete self.actions.forward;
                //}
                break;
            case self.KEY.K:
                self.move.backward = false;
                break;
            case self.KEY.J:
                self.move.left = false;
                break;
            case self.KEY.L:
                self.move.right = false;
                break;
            case self.KEY.U:
                self.move.up = false;
                break;
            case self.KEY.O:
                self.move.down = false;
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
        Object.keys(self.look).forEach(function (key) {
            self.look[key] = false;
        });
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
            self.camera.rotateOnAxis(new THREE.Vector3(0,1,0), Math.PI * 2 / 360 * -self.mouse.direction.x);
            self.camera.rotateOnAxis(new THREE.Vector3(1,0,0), Math.PI * 2 / 360 * -self.mouse.direction.y);
            change = true;
        }
        if (change) {
            self.dispatchEvent({'type':'change'});
        }
    };

    //WalkController.prototype.update = function (delta) {
    //    var self = this;
    //    // execute all walk actions
    //    var actions = Object.keys(self.actions);
    //    if (actions.length > 0) {
    //        var direction = self.camera.getWorldDirection();
    //        var distance = delta * self.movementSpeed;
    //        var offset = new THREE.Vector3().copy(direction).setLength(distance);
    //        actions.forEach(function (key) {
    //            self.actions[key].apply(self, [delta, offset]);
    //        });
    //        self.dispatchEvent({'type':'change'});
    //    }
    //};

    return WalkController;

}());
