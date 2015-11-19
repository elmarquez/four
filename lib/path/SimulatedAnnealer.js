'use strict';

var FOUR = FOUR || {};

/**
 * Simulated annealing path planner.
 * @see http://www.theprojectspot.com/tutorial-post/simulated-annealing-algorithm-for-beginners/6
 */
var SimulatedAnnealer = (function () {

    /**
     * A proposed solution.
     * @constructor
     * @param {Number} size Itinerary size
     */
    function Tour(size) {
        this.distance = 0;
        this.fitness = 0;
        this.tour = [];
        if (size) {
            for (var i = 0; i < size; i++) {
                this.tour.push(null);
            }
        }
    }

    Tour.prototype.checkForDuplicateValues = function () {
        var i;
        for (i = 0; i < this.tour.length; i++) {
            var p = this.tour[i];
            if (this.tour.lastIndexOf(p) !== i) {
                throw new Error('Tour contains a duplicate element');
            }
        }
    };

    Tour.prototype.checkForNullValues = function () {
        var i;
        for (i = 0; i < this.tour.length; i++) {
            if (this.tour[i] === null) {
                throw new Error('Tour contains a null entry');
            }
        }
    };

    Tour.prototype.containsPoint = function (p) {
        var result = false;
        this.tour.forEach(function (point) {
            if (point !== null && point.x === p.x && point.y === p.y) {
                result = true;
            }
        });
        return result;
    };

    Tour.prototype.copy = function (tour) {
        this.tour = tour.slice();
        this.getFitness();
    };

    Tour.prototype.distanceBetween = function (p1, p2) {
        var dx = Math.abs(p2.x - p1.x);
        var dy = Math.abs(p2.y - p1.y);
        return Math.sqrt((dx * dx) + (dy * dy));
    };

    Tour.prototype.generateIndividual = function (itinerary) {
        this.tour = itinerary.slice();
        this.shuffle();
        this.getFitness();
    };

    Tour.prototype.getPoint = function (i) {
        return this.tour[i];
    };

    Tour.prototype.getFitness = function () {
        if (this.fitness === 0) {
            this.fitness = 1 / this.getDistance();
        }
        return this.fitness;
    };

    Tour.prototype.getDistance = function () {
        if (this.distance === 0) {
            var i, p1, p2, totalDistance = 0;
            // Loop through our tour's cities
            for (i = 0; i < this.tour.length; i++) {
                // point we're travelling from
                p1 = this.getPoint(i);
                // Check we're not on our tour's last point, if we are set our
                // tour's final destination point to our starting point
                if (i + 1 < this.tour.length) {
                    p2 = this.tour[i + 1];
                }
                else {
                    p2 = this.tour[0];
                }
                // Get the distance between the two cities
                totalDistance += this.distanceBetween(p1, p2);
            }
            this.distance = totalDistance;
        }
        return this.distance;
    };

    Tour.prototype.setPoint = function (i, point) {
        this.tour[i] = point;
        this.fitness = 0;
        this.distance = 0;
    };

    Tour.prototype.shuffle = function () {
        var currentIndex = this.tour.length, temporaryValue, randomIndex;
        // While there remain elements to shuffle...
        while (0 !== currentIndex) {
            // Pick a remaining element...
            randomIndex = Math.floor(Math.random() * currentIndex);
            currentIndex -= 1;
            // And swap it with the current element.
            temporaryValue = this.tour[currentIndex];
            this.tour[currentIndex] = this.tour[randomIndex];
            this.tour[randomIndex] = temporaryValue;
        }
    };

    Tour.prototype.tourSize = function () {
        return this.tour.length;
    };

    Tour.prototype.updateFitness = function () {
        this.fitness = 1 / this.getDistance();
    };

    function SimulatedAnnealer() {
        this.best = null; // best solution
        this.coolingRate = 0.003;
        this.itinerary = [];
        this.temp = 0;
    }

    SimulatedAnnealer.prototype.acceptanceProbability = function (energy, newEnergy, temperature) {
        // If the new solution is better, accept it
        if (newEnergy < energy) {
            return 1.0;
        }
        // If the new solution is worse, calculate an acceptance probability
        return Math.exp((energy - newEnergy) / temperature);
    };

    /**
     * Add point to itinerary.
     * @param {Object} p Point
     */
    SimulatedAnnealer.prototype.addPoint = function (p) {
        this.itinerary.push(p);
        this.checkForDuplicatePoints();
    };

    /**
     * Check for duplicate points in the itinerary. Throw an error when a
     * duplicate is found.
     */
    SimulatedAnnealer.prototype.checkForDuplicatePoints = function () {
        var i, p, px, py, x = [], y = [];
        // build an index of points
        for (i = 0; i < this.itinerary.length; i++) {
            x.push(this.itinerary[i].x);
            y.push(this.itinerary[i].y);
        }
        // check for duplicates
        for (i = 0; i < this.itinerary.length; i++) {
            p = this.itinerary[i];
            px = x.lastIndexOf(p.x);
            py = y.lastIndexOf(p.y);
            if (px === py && px !== i) {
                throw new Error('Tour contains a duplicate element');
            }
        }
    };

    SimulatedAnnealer.prototype.evolve = function (temperature) {
        var newSolution, pointSwap1, pointSwap2, currentEnergy, neighbourEnergy, tourPos1, tourPos2;

        this.temp = temperature;

        // Set as current best
        this.best = new Tour(0);
        this.best.copy(this.currentSolution.tour);

        // Loop until system has cooled
        while (this.temp > 1) {
            // Create new neighbour tour
            newSolution = new Tour(0);
            newSolution.copy(this.currentSolution.tour);

            // Get a random positions in the tour
            tourPos1 = Math.floor(newSolution.tourSize() * Math.random());
            tourPos2 = Math.floor(newSolution.tourSize() * Math.random());

            // Get the cities at selected positions in the tour
            pointSwap1 = newSolution.getPoint(tourPos1);
            pointSwap2 = newSolution.getPoint(tourPos2);

            // Swap them
            newSolution.setPoint(tourPos2, pointSwap1);
            newSolution.setPoint(tourPos1, pointSwap2);

            // Get energy of solutions
            currentEnergy = this.currentSolution.getDistance();
            neighbourEnergy = newSolution.getDistance();

            // Decide if we should accept the neighbour
            if (this.acceptanceProbability(currentEnergy, neighbourEnergy, this.temp) > Math.random()) {
                this.currentSolution = new Tour(0);
                this.currentSolution.copy(newSolution.tour);
            }

            // Keep track of the best solution found
            if (this.currentSolution.getDistance() < this.best.getDistance()) {
                this.best = new Tour(0);
                this.best.copy(this.currentSolution.tour);
            }

            // Cool system
            this.temp *= 1 - this.coolingRate;
        }
    };

    SimulatedAnnealer.prototype.getDistance = function () {
        return this.best.getDistance();
    };

    SimulatedAnnealer.prototype.getSolution = function () {
        return this.best.tour;
    };

    SimulatedAnnealer.prototype.init = function () {
        this.currentSolution = new Tour(0);
        this.currentSolution.generateIndividual(this.itinerary);
        this.best = this.currentSolution;
    };

    SimulatedAnnealer.prototype.reset = function () {
        this.itinerary = [];
        this.best = null;
    };

    return SimulatedAnnealer;

}());
