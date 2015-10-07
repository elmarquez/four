'use strict';

var FOUR = FOUR || {};

/**
 * Hybrid selection, editing, trackball, orbit, first person controller.
 * Emits the following events:
 *
 * - change: Controller change
 *
 * @todo listen for camera change on the viewport
 * @todo listen for domelement resize events
 * @todo handle mouse position, sizing differences between document and domelements
 */
FOUR.MultiController = (function () {

    /**
     * Multi-mode interaction controller.
     * @param viewport Viewport 3D
     * @param domElement Viewport DOM element
     * @constructor
     */
    function MultiController (viewport, domElement) {
        THREE.EventDispatcher.call(this);

        var self = this;

        self.EVENTS = {
            CHANGE: { type: 'change' },
            END: { type: 'end' },
            START: { type: 'start' }
        };
        self.KEY = {
            NONE: -1,
            ROTATE: 0,
            ZOOM: 1,
            PAN: 2,
            TOUCH_ROTATE: 3,
            TOUCH_ZOOM_PAN: 4,
            TRANSLATE: 5,
            CANCEL: 27,
            MOVE_FORWARD: 73,
            MOVE_LEFT: 74,
            MOVE_BACK: 75,
            MOVE_RIGHT: 76,
            MOVE_UP: 85,
            MOVE_DOWN: 79,
            ROTATE_LEFT: -1,
            ROTATE_RIGHT: -1
        };
        self.MODE = {
            SELECTION: 0,
            TRACKBALL: 1,
            FIRSTPERSON: 2,
            ORBIT: 3
        };

        self.controller = null;
        self.controllers = {};
        self.domElement = domElement;
        self.viewport = viewport;
    }

    MultiController.prototype = Object.create(THREE.EventDispatcher.prototype);

    MultiController.prototype.constructor = MultiController;

    MultiController.prototype.init = function () {
        // Q, W, E, R
        var self = this;
        self.controllers.orbit = new FOUR.OrbitController();
        self.controllers.trackball = new FOUR.TrackballController();
        self.controllers.walk = new FOUR.WalkController();
    };

    /**
     * Set the controller mode.
     * @param {String} mode Controller mode
     */
    MultiController.prototype.setMode = function (mode) {
        var self = this;
        self.dispatchEvent({type: 'change'});
    };

    return MultiController;

}());
