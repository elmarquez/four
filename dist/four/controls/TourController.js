'use strict';

var FOUR = FOUR || {};

/**
 * Tour controller provides automated navigation between selected features.
 */
FOUR.TourController = (function () {

    function TourController (camera, domElement) {
        THREE.EventDispatcher.call(this);

        var self = this;

        self.EVENTS = {
            CHANGE: { type: 'change' },
            END: { type: 'end' },
            START: { type: 'start' }
        };
        self.KEY = {
            NONE: -1,
            CANCEL: 0,
            NEXT: 1,
            PREVIOUS: 2,
            UPDATE: 3
        };

        self.camera = camera;
        self.domElement = domElement;
        self.planner = new FOUR.PathPlanner();
    }

    TourController.prototype = Object.create(THREE.EventDispatcher.prototype);

    TourController.prototype.constructor = TourController;

    TourController.prototype.init = function () {};

    TourController.prototype.nearest = function () {};

    TourController.prototype.next = function () {};

    TourController.prototype.previous = function () {};

    /**
     * Update the tour itinerary.
     */
    TourController.prototype.update = function () {

    };

    return TourController;

}());
