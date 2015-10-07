'use strict';

var FOUR = FOUR || {};

FOUR.TourController = (function () {

    /**
     * Tour controller provides automated navigation between selected features.
     * @param camera
     * @param domElement
     */
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
        self.current = -1; // index of the tour feature
        self.domElement = domElement;
        self.path = [];
        self.planner = new FOUR.PathPlanner();
    }

    TourController.prototype = Object.create(THREE.EventDispatcher.prototype);

    TourController.prototype.constructor = TourController;

    /**
     * Calculate the distance between points.
     * @param {THREE.Vector3} p1 Point
     * @param {THREE.Vector3} p2 Point
     * @returns {number} Distance
     */
    TourController.prototype.distanceBetween = function (p1, p2) {
        var dx = Math.abs(p2.x - p1.x);
        var dy = Math.abs(p2.y - p1.y);
        var dz = Math.abs(p2.z - p1.z);
        return Math.sqrt((dx * dx) + (dy * dy) + (dz * dz));
    };

    TourController.prototype.init = function () {};

    /**
     * Navigate to the current tour feature.
     */
    TourController.prototype.navigate = function () {};

    /**
     * Find the tour feature nearest to position P.
     * @param {THREE.Vector3} p Point
     * @returns {THREE.Vector3} Position of nearest tour feature.
     */
    TourController.prototype.nearest = function (p) {
        var self = this;
        var nearest = self.path.reduce(function (last, current) {
            var dist = self.distanceBetween(p, current);
            if (dist <= last.dist) {
                last = {x: current.x, y: current.y, z: current.z, dist: dist};
            }
            return last;
        }, {x: p.x, y: p.y, z: p.z, dist: Infinity }); // TODO include the feature identifier
        return nearest;
    };

    TourController.prototype.next = function () {};

    TourController.prototype.previous = function () {};

    /**
     * Update the tour itinerary.
     */
    TourController.prototype.update = function () {
        var self = this;
        // get the list of features
        var features = [];
        self.planner
          .generateTourSequence(features)
          .then(function (path) {
              self.path = path;
          });
    };

    return TourController;

}());
