'use strict';

var FOUR = FOUR || {};

FOUR.TourController = (function () {

    /**
     * Tour controller provides automated navigation between selected features.
     * @param {Object} config Configuration
     */
    function TourController (config) {
        THREE.EventDispatcher.call(this);
        config = config || {};

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
        self.PLANNING_STRATEGY = {
            GENETIC: 0,
            SIMULATED_ANNEALING: 1
        };

        self.camera = config.camera;
        self.current = -1; // index of the tour feature
        self.domElement = config.domElement;
        self.enabled = config.enabled || true;
        self.offset = 100; // distance between camera and feature when visiting
        self.path = [];
        self.planner = new FOUR.PathPlanner();
        self.planningStrategy = self.PLANNING_STRATEGY.GENETIC;
        self.selection = config.selection;

        if (self.enabled) {
            self.enable();
        }
    }

    TourController.prototype = Object.create(THREE.EventDispatcher.prototype);

    TourController.prototype.constructor = TourController;

    /**
     * Disable the controller.
     */
    TourController.prototype.disable = function () {
        this.enabled = false;
        self.selection.removeEventListener('update', self.update);
    };

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

    /**
     * Enable the controller.
     */
    TourController.prototype.enable = function () {
        // listen for updates on the selection set
        self.selection.addEventListener('update', self.update.bind(self), false);
        // listen for key input events
        // TODO
        this.enabled = true;
    };

    /**
     * Get the tour path.
     * @returns {Array|*}
     */
    TourController.prototype.getPath = function () {
        return this.path;
    };

    /**
     * Navigate to the i-th feature.
     * @param {Integer} i Path index
     * @returns {Promise}
     */
    TourController.prototype.navigate = function (i) {
        var self = this;
        // the feature to visit
        var feature = self.path[i];
        // the offset from the current camera position to the new camera position
        // TODO what is 10??
        var dist = (10 / Math.tan(Math.PI * self.camera.fov / 360)) + self.offset;
        var target = new THREE.Vector3(0, 0, -dist);
        target.applyQuaternion(self.camera.quaternion);
        target.add(self.camera.position);
        var diff = new THREE.Vector3().subVectors(new THREE.Vector3(feature.x, feature.y, feature.z), target);
        // the next camera position
        var camera = new THREE.Vector3().add(self.camera.position, diff);
        // move the camera to the next position
        return self.planner.tweenToPosition(
          self.camera,
          new THREE.Vector3(camera.x, camera.y, camera.z),
          new THREE.Vector3(feature.x, feature.y, feature.z),
          self.noop
        );
    };

    /**
     * Find the tour feature nearest to position P.
     * @param {THREE.Vector3} p Point
     * @returns {THREE.Vector3} Position of nearest tour feature.
     */
    TourController.prototype.nearest = function (p) {
        var dist, nearest, self = this;
        nearest = self.path.reduce(function (last, current, index) {
            dist = self.distanceBetween(p, current);
            if (dist <= last.dist) {
                last = {x: current.x, y: current.y, z: current.z, dist: dist, index: index};
            }
            return last;
        }, {x: p.x, y: p.y, z: p.z, dist: Infinity, index: -1 }); // TODO include the feature identifier
        return nearest;
    };

    /**
     * Navigate to the next feature.
     * @returns {Promise}
     */
    TourController.prototype.next = function () {
        var self = this;
        if (self.current === -1) {
            // get the nearest feature to the camera
            var nearest = self.nearest(self.camera.position);
            self.current = nearest.index;
        } else if (self.current < self.path.length) {
            self.current++;
        } else {
            self.current = 0;
        }
        return self.navigate(self.current);
    };

    /**
     * Empty function.
     */
    TourController.prototype.noop = function () {};

    /**
     * Navigate to the previous feature.
     * @returns {Promise}
     */
    TourController.prototype.previous = function () {
        var self = this;
        if (self.current === -1) {
            // get the nearest feature to the camera
            var nearest = self.nearest(self.camera.position);
            self.current = nearest.index;
        } else if (self.current === 0) {
            self.current = self.path.length - 1;
        } else {
            self.current--;
        }
        return self.navigate(self.current);
    };

    /**
     * Update the tour itinerary.
     * @returns {Promise}
     */
    TourController.prototype.update = function () {
        var self = this;
        // reset the current feature index
        self.current = -1;
        // get the list of features
        var features = [];
        return self.planner
          .generateTourSequence(features)
          .then(function (path) {
              self.path = path;
          });
    };

    return TourController;

}());
