/* global Mousetrap, THREE, TWEEN */
/* jshint unused:false */
'use strict';

var FOUR = FOUR || {};

FOUR.WalkController = (function () {

    function WalkController (camera, domElement) {
        THREE.EventDispatcher.call(this);
        var self = this;

        self.MODIFIERS = {
            ALT: 'ALT',
            CTRL: 'CTRL',
            SHIFT: 'SHIFT'
        };

        self.camera = camera;
        self.clock = new THREE.Clock();
        self.domElement = domElement;

        self.enabled = false;
        self.lookSpeed = 0.005;
        self.lookVertical = true;
        self.modifiers = {
            'ALT': false,
            'CTRL': false,
            'SHIFT': false
        };
        self.mouseX = 0;
        self.mouseY = 0;
        self.move = {
            forward: false,
            backward: false,
            left: false,
            right: false,
            up: false,
            down: false
        };
        self.movementSpeed = 1.0;
        self.planner = new FOUR.PathPlanner();
        self.rotate = {
            up: false,
            down: false,
            left: false,
            right: false
        };

        self.lat = 0;
        self.lon = 0;
        self.phi = 0;
        self.theta = 0;

        if ( self.domElement === document) {
            self.viewHalfX = window.innerWidth / 2;
            self.viewHalfY = window.innerHeight / 2;
        } else {
            self.viewHalfX = self.domElement.offsetWidth / 2;
            self.viewHalfY = self.domElement.offsetHeight / 2;
            self.domElement.setAttribute('tabindex', -1);
        }
    }

    WalkController.prototype = Object.create(THREE.EventDispatcher.prototype);

    WalkController.prototype.constructor = WalkController;

    WalkController.prototype.WALK_HEIGHT = 2;

    WalkController.prototype.disable = function () {
        this.enabled = false;
    };

    WalkController.prototype.enable = function () {
        var self = this;
        // translate the camera to the walking height
        self.camera.setPositionAndTarget(
            self.camera.position.x,
            self.camera.position.y,
            self.WALK_HEIGHT,
            self.camera.target.x,
            self.camera.target.y,
            self.WALK_HEIGHT)
            .then(function () {
                self.enabled = true;
            });
    };

    WalkController.prototype.onKeyDown = function (event) {
        // ALT key changes controller to look mode
        var self = this;
        switch(event.value) {
            case 'up': /*up*/
                self.move.forward = true;
                break;
            case 'left': /*left*/
                self.move.left = true;
                break;
            case 'down': /*down*/
                self.move.backward = true;
                break;
            case 'right': /*right*/
                self.move.right = true;
                break;
            //case 82: /*R*/ self.move.up = true;
            //    break;
            //case 70: /*F*/ self.move.down = true;
            //    break;
        }
    };

    WalkController.prototype.onKeyUp = function (event) {
        var self = this;
        switch(event.keyCode) {
            case 'up': /*up*/
                self.move.forward = false;
                break;
            case 'left': /*left*/
                self.move.left = false;
                break;
            case 'down': /*down*/
                self.move.backward = false;
                break;
            case 'right': /*right*/
                self.move.right = false;
                break;
            //case 82: /*R*/ self.move.up = false;
            //    break;
            //case 70: /*F*/ self.move.down = false;
            //    break;
        }
    };

    WalkController.prototype.onMouseDown = function () {
        console.log('mouse down');
    };

    WalkController.prototype.onMouseMove = function () {
        console.log('mouse move');
    };

    WalkController.prototype.onMouseUp = function () {
        console.log('mouse up');
    };

    WalkController.prototype.rotate = function () {
        console.log('rotate');
    };

    WalkController.prototype.translate = function () {
        console.log('translate');
        var direction = self.camera.target.sub(self.camera.position);

        self.camera.setPositionAndTarget();
    };

    WalkController.prototype.update = function () {
        console.log('update');
        var self = this;
        var delta = self.clock.getDelta(); // TODO move to singleton
        var actualMoveSpeed = delta * self.movementSpeed; // TODO uh oh ... delta a problem here?

        if (self.move.forward) {
            self.camera.translate(0, 0, -actualMoveSpeed);
        }
        if (self.move.backward) {
            self.camera.translate(0, 0, actualMoveSpeed);
        }
        if (self.move.left) {
            self.camera.translate(-actualMoveSpeed, 0, 0);
        }
        if (self.move.right) {
            self.camera.translate(actualMoveSpeed, 0, 0);
        }
        if (self.move.up) {
            self.camera.translate(0, actualMoveSpeed, 0);
        }
        if (self.move.down) {
            self.camera.translate(0, -actualMoveSpeed, 0);
        }
    };

    return WalkController;

}());
