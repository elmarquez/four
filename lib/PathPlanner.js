FOUR.PathPlanner = (function () {

    /**
     * Camera path navigation utilities.
     * @param {Object} config Configuration
     * @constructor
     */
    function PathPlanner (config) {
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
        var self = this;
        if (this.strategy === this.PLANNING_STRATEGY.GENETIC) {
            return new Promise(function (resolve, reject) {
                try {
                    var worker = new Worker(self.workersPath + 'GeneticPlanner.js');
                    worker.onmessage = function (e) {
                        resolve(e.data);
                    };
                    worker.postMessage({cmd:'run', itinerary:features, generations:500, populationSize:50});
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
                    worker.postMessage({cmd:'run', array:features, initialTemperature:10000, coolingRate:0.00001});
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
    PathPlanner.prototype.setStrategy = function (strategy) {
        this.strategy = strategy;
    };

    return PathPlanner;

}());
