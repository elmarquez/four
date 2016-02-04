FOUR.TourController = (function () {

    /**
     * Tour controller provides automated navigation between selected features.
     * The configuration should include a workersPath value as part of the
     * config.planner object.
     * @param {Object} config Configuration
     */
    function TourController (config) {
        THREE.EventDispatcher.call(this);
        config = config || {};
        config.planner = config.planner || {};

        var self = this;
        self.EVENTS = {
            UPDATE: { type: 'update' },
            END: { type: 'end' },
            START: { type: 'start' }
        };
        self.KEY = {
            CANCEL: 27,     // esc
            NEXT: 190,      // .
            PREVIOUS: 188,  // ,
            NONE: -1,
            PLAN: -2,
            UPDATE: -3
        };
        self.PLANNING_STRATEGY = {
            GENETIC_EVOLUTION: 0,
            SIMULATED_ANNEALING: 1
        };

        self.camera = config.viewport.camera;
        self.current = -1; // index of the tour feature
        self.domElement = config.viewport.domElement;
        self.enabled = false;
        self.listeners = {};
        self.offset = 100; // distance between camera and feature when visiting
        self.path = [];
        self.planner = new FOUR.PathPlanner(config.planner);
        self.planningStrategy = self.PLANNING_STRATEGY.GENETIC_EVOLUTION;
        self.viewport = config.viewport;
    }

    TourController.prototype = Object.create(THREE.EventDispatcher.prototype);

    TourController.prototype.constructor = TourController;

    /**
     * Disable the controller.
     */
    TourController.prototype.disable = function () {
        var self = this;
        self.enabled = false;
        Object.keys(self.listeners).forEach(function (key) {
            var listener = self.listeners[key];
            listener.element.removeEventListener(listener.event, listener.fn);
            delete self.listeners[key];
        });
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
        var self = this;
        function addListener(element, event, fn) {
            if (!self.listeners[event]) {
                self.listeners[event] = {
                    element: element,
                    event: event,
                    fn: fn.bind(self)
                };
                element.addEventListener(event, self.listeners[event].fn, false);
            }
        }
        //addListener(self.selection, 'update', self.plan);
        addListener(window, 'keyup', self.onKeyUp);

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
        var feature = self.path[i];
        self.camera.setTarget(new THREE.Vector3(feature.x, feature.y, feature.z), true);
        // TODO zoom to fit object
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
        } else if (self.current < self.path.length - 1) {
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

    TourController.prototype.onKeyDown = function () {};

    TourController.prototype.onKeyUp = function () {
        var self = this;
        if (!self.enabled) {
            return;
        }
        switch(event.keyCode) {
            case self.KEY.CANCEL:
                self.current = -1;
                self.path = [];
                break;
            case self.KEY.NEXT:
                self.next();
                break;
            case self.KEY.PREVIOUS:
                self.previous();
                break;
        }
    };

    /**
     * Generate a tour plan.
     * @params {Array} features Features to visit. Features must be objects of the form {id:,x:,y:,z:}
     * @returns {Promise}
     */
    TourController.prototype.plan = function (features) {
        var self = this;
        // reset the current feature index
        self.current = -1;
        self.path = [];
        // generate the tour path
        return self.planner
          .generateTourSequence(features)
          .then(function (path) {
              self.path = path;
          }, function (err) {
              console.error(err);
          });
    };

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
     * Set camera.
     * @param {THREE.PerspectiveCamera} camera Camera
     */
    TourController.prototype.setCamera = function (camera) {
        this.camera = camera;
    };

    /**
     * Update the controller state.
     */
    TourController.prototype.update = function () {}; // noop

    return TourController;

}());
