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

    /**
     * @param {Object} config Configuration
     * @constructor
     */
    function PathPlanner (config) {
        var self = this;
        self.PLANNING_STRATEGY = {
            GENETIC: 0,
            SIMULATED_ANNEALING: 1
        };
        this.strategy = self.PLANNING_STRATEGY.SIMULATED_ANNEALING;
        this.workersPath = '/';
        Object.keys(config).forEach(function (key) {
            self[key] = config[key];
        });
    }

    /**
     * Generate tour sequence for a collection of features.
     * @param {Array} features Features
     * @returns {Promise}
     */
    PathPlanner.prototype.generateTourSequence = function (features) {
        var self = this;
        // transform
        var points = features.map(function (obj) {
            return {
                id: obj.uuid.toString(),
                x: Number(obj.position.x),
                y: Number(obj.position.y),
                z: Number(obj.position.z)
            };
        });
        if (this.strategy === this.PLANNING_STRATEGY.GENETIC) {
            return new Promise(function (resolve, reject) {
                try {
                    var worker = new Worker(self.workersPath + 'GeneticPlanner.js');
                    worker.onmessage = function (e) {
                        resolve(e.data);
                    };
                    worker.postMessage({cmd:'run', array:points, iterations:10000, populationSize:50});
                } catch (err) {
                    reject(err);
                }
            });
        } else if (this.strategy === this.PLANNING_STRATEGY.SIMULATED_ANNEALING) {
            return new Promise(function (resolve, reject) {
                try {
                    var worker = new Worker(self.workersPath + 'SimulatedAnnealer.js');
                    worker.onmessage = function (e) {
                        resolve(e.data);
                    };
                    worker.postMessage({cmd:'run', array:points, initialTemperature:10000, coolingRate:0.00001});
                } catch (err) {
                    reject(err);
                }
            });
        }
    };

    /**
     * Set the planning strategy.
     * @param strategy
     */
    PathPlanner.prototype.setStragegy = function (strategy) {
        this.strategy = strategy;
    };

    return PathPlanner;

}());
