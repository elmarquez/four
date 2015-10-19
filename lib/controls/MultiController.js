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
            UPDATE: { type: 'update' },
            END: { type: 'end' },
            START: { type: 'start' }
        };
        self.KEY = {
            ESC: 27,
            TILDE: 192,
            Q: 81,
            W: 87,
            E: 69,
            R: 82,
            ONE: 49,
            TWO: 50,
            THREE: 51,
            FOUR: 52
        };

        self.controller = null;
        self.controllers = {};
        self.domElement = domElement;
        self.listeners = {};
        self.viewport = viewport;
        self.viewports = {};
    }

    MultiController.prototype = Object.create(THREE.EventDispatcher.prototype);

    MultiController.prototype.constructor = MultiController;

    MultiController.prototype.addController = function (controller, name) {
        this.controllers[name] = controller;
    };

    MultiController.prototype.disable = function () {
        var self = this;
        Object.keys(self.listeners).forEach(function (key) {
            var listener = self.listeners[key];
            listener.element.removeEventListener(listener.event, listener.fn);
        });
    };

    MultiController.prototype.enable = function () {
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
        addListener(window, 'keyup', self.onKeyDown);
    };

    MultiController.prototype.init = function () {
        var self = this;
        self.controllers.orbit = new FOUR.OrbitController();
        self.controllers.trackball = new FOUR.TrackballController();
        self.controllers.walk = new FOUR.WalkController();
    };

    MultiController.prototype.onKeyDown = function () {};

    MultiController.prototype.onKeyUp = function () {
        var self = this;
        if (!self.enabled) {
            return;
        }
        switch(event.keyCode) {
            case self.KEY.ESC:
                // cancel all current operations
                // revert to default controller
                break;
            case self.KEY.TILDE:
                // reset camera orientation
                break;
            case self.KEY.ONE:
                // trackball
                break;
            case self.KEY.TWO:
                // first person
                break;
            case self.KEY.THREE:
                // tour
                break;
            case self.KEY.Q:
                // selection
                break;
            case self.KEY.W:
                // edit translate
                break;
            case self.KEY.E:
                // edit rotate
                break;
            case self.KEY.R:
                // edit scale
                break;
        }
    };

    /**
     * Set the active viewport controller.
     * @param {String} name Controller name
     */
    MultiController.prototype.setActiveController = function (name) {
        var self = this;
        self.controller.disable();
        if (!self.controllers[name]) {
            console.error('Controller ' + name + ' does not exist');
        } else {
            self.controller = self.controllers[name];
            self.controller.enable();
            self.dispatchEvent(self.EVENTS.UPDATE);
        }
    };

    return MultiController;

}());
