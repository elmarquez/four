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
        self.movementSpeed = 1.0;
        self.planner = new FOUR.PathPlanner();

        self.lat = 0;
        self.lon = 0;
        self.phi = 0;
        self.theta = 0;

        if ( self.domElement === document ) {
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
    };

    WalkController.prototype.onKeyUp = function (event) {
        var self = this;
        if (event.value === 'up') {
            self.translate();
        } else if (event.value === 'down') {

        } else if (event.value === 'left') {

        } else if (event.value === 'right') {

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
    };

    WalkController.prototype.update = function (delta) {
        console.log('update');
    };

    return WalkController;

}());
