FOUR.PathPlanner = (function () {

    /**
     * Camera path navigation utilities. The workers path must be specified as
     * absolute path.
     * @param {Object} config Configuration
     * @constructor
     */
    function PathPlanner(config) {
        config = config || {};
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
        var message, path, self = this;
        if (this.strategy === this.PLANNING_STRATEGY.GENETIC) {
            path = self.workersPath + 'GeneticPlanner.js';
            message = {cmd: 'run', itinerary: features, generations: 500, populationSize: 50};
        } else if (this.strategy === this.PLANNING_STRATEGY.SIMULATED_ANNEALING) {
            path = self.workersPath + 'SimulatedAnnealer.js';
            message = {cmd: 'run', array: features, initialTemperature: 10000, coolingRate: 0.00001};
        }
        return new Promise(function (resolve, reject) {
            try {
                var worker = new Worker(path);
                worker.onerror = function (e) {
                    reject(e);
                };
                worker.onmessage = function (e) {
                    resolve(e.data);
                };
                worker.postMessage(message);
            } catch (err) {
                reject(err);
            }
        });
    };

    /**
     * Set the planning strategy.
     * @param strategy
     */
    PathPlanner.prototype.setStrategy = function (strategy) {
        this.strategy = strategy;
    };

    return PathPlanner;

}());
