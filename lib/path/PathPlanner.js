/**
 * Camera path navigation utilities.
 * @constructor
 */
FOUR.PathPlanner = (function () {

    /**
     * Get the distance from P1 to P2.
     * @param {THREE.Vector3} p1 Point 1
     * @param {THREE.Vector3} p2 Point 2
     * @returns {Number} Distance
     */
    function distance (p1, p2) {
        var dx = Math.pow(p2.x - p1.x, 2);
        var dy = Math.pow(p2.y - p1.y, 2);
        var dz = Math.pow(p2.z - p1.z, 2);
        return Math.sqrt(dx + dy + dz);
    }

    function PathPlanner () {
        var self = this;
        self.PLANNING_STRATEGY = {
            GENETIC: 0,
            SIMULATED_ANNEALING: 1
        };
        this.strategy = self.PLANNING_STRATEGY.GENETIC;
    }

    /**
     * Generate tour sequence for a collection of features.
     * @param {Array} features Features
     * @param {*} strategy Planning strategy ID
     * @returns {Promise}
     */
    PathPlanner.prototype.generateTourSequence = function (features) {
        // TODO execute computation in a worker
        return new Promise(function (resolve, reject) {
            var path = [];
            if (features.length > 0) {
                var ts = new TravellingSalesman();
                ts.setPopulationSize(50);
                // Add points to itinerary
                features.forEach(function (obj) {
                    ts.addPoint({
                        focus: 0,
                        obj: obj,
                        radius: obj.geometry.boundingSphere.radius,
                        x: obj.position.x,
                        y: obj.position.y,
                        z: obj.position.z
                    });
                });
                // Initialize the population
                ts.init();
                console.info('Initial distance: ' + ts.getPopulation().getFittest().getDistance());
                // Evolve the population
                try {
                    ts.evolve(100);
                    console.info('Final distance: ' + ts.getPopulation().getFittest().getDistance());
                    path = ts.getSolution();
                } catch (e) {
                    reject(e);
                }
            }
            resolve(path);
        });
    };

    PathPlanner.prototype.setPlanningStragegy = function (strategy) {
        this.strategy = strategy;
    };

    PathPlanner.prototype.tweenToOrientation = function (camera, orientation, progress) {
        // TODO animation time needs to be relative to the distance traversed
        return new Promise(function (resolve) {
            var emit = progress;
            var start = { x: camera.up.x, y: camera.up.y, z: camera.up.z };
            var finish = { x: orientation.x, y: orientation.y, z: orientation.z };
            var tween = new TWEEN.Tween(start).to(finish, 1000);
            tween.easing(TWEEN.Easing.Cubic.InOut);
            tween.onComplete(function () {
                camera.setUp(new THREE.Vector3(this.x, this.y, this.z));
                emit('update');
                emit('continuous-update-end');
                resolve();
            });
            tween.onUpdate(function () {
                camera.setUp(new THREE.Vector3(this.x, this.y, this.z));
                emit('update');
            });
            tween.start();
            emit('continuous-update-start');
            emit('update');
        });
    };

    return PathPlanner;

}());
