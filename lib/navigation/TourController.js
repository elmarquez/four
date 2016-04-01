FOUR.TourController = (function () {

    /**
     * Tour controller provides automated navigation between features.
     * The configuration should include a workersPath value as part of the
     * config.planner object.
     * @param {Object} config Configuration
     */
    function TourController(config) {
        THREE.EventDispatcher.call(this);
        config = config || {};

        this.current = -1; // index of the tour feature
        this.enabled = false;
        this.listeners = {};
        this.path = [];
        this.planner = new FOUR.PathPlanner(config.planner || {});
        this.viewport = config.viewport;
    }

    TourController.prototype = Object.create(THREE.EventDispatcher.prototype);

    //TourController.prototype.constructor = TourController;

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
        // clear all listeners to ensure that we can never add multiple listeners
        // for the same events
        self.disable();
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
        //addListener(window, 'keyup', self.onKeyUp);
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
        var feature = this.path[i];
        var camera = this.viewport.getCamera();
        var point = new THREE.Vector3(feature.x, feature.y, feature.z);
        camera.setTarget(point, true);
        this.dispatchEvent({
            type: FOUR.EVENT.UPDATE,
            id: 'move',
            task: 'move-camera-target',
            target: new THREE.Vector3(feature.x, feature.y, feature.z)
        });
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
        }, {x: p.x, y: p.y, z: p.z, dist: Infinity, index: -1}); // TODO include the feature identifier
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
            var camera = self.viewport.getCamera();
            var nearest = self.nearest(camera.position);
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
        if (Array.isArray(features) && features.length > 2) {
            return self.planner
                .generateTourSequence(features)
                .then(function (result) {
                    self.path = result.path;
                }, function (err) {
                    console.error(err);
                });
        } else {
            self.path = features;
            return Promise.resolve();
        }
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
     * Update the controller state.
     */
    TourController.prototype.update = function () {}; // noop

    return TourController;

}());
