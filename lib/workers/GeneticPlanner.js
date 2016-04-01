/* jshint unused:false */
/* globals self */
'use strict';

/**
 * Travelling salesman path planner.
 * Based on http://www.theprojectspot.com/tutorial-post/applying-a-genetic-algorithm-to-the-travelling-salesman-problem/5
 */
var GeneticPlanner = (function () {

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

    Tour.prototype.distanceBetween = function (p1, p2) {
        var dx = Math.abs(p2.x - p1.x);
        var dy = Math.abs(p2.y - p1.y);
        return Math.sqrt((dx * dx) + (dy * dy));
    };

    Tour.prototype.generateRandomRoute = function (itinerary) {
        this.tour = itinerary.slice();
        this.shuffle();
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

    /**
     * A collection of potential tour solutions.
     * @param {Array} itinerary Itinerary
     * @param {Number} populationSize The number of solutions in the population
     * @param {Boolean} initialise Initialize the population with random solutions
     * @constructor
     */
    function Population(itinerary, populationSize, initialise) {
        var i, tour;
        this.populationSize = populationSize;
        this.tours = [];
        for (i = 0; i < this.populationSize; i++) {
            this.tours.push(null);
        }
        if (initialise) {
            for (i = 0; i < this.populationSize; i++) {
                tour = new Tour();
                tour.generateRandomRoute(itinerary);
                this.tours[i] = tour;
            }
        }
    }

    Population.prototype.getFittest = function () {
        var fittest = this.tours[0], i;
        for (i = 1; i < this.tours.length; i++) {
            if (fittest.getFitness() <= this.tours[i].getFitness()) {
                fittest = this.tours[i];
            }
        }
        return fittest;
    };

    Population.prototype.getPopulationSize = function () {
        return this.populationSize;
    };

    Population.prototype.getTour = function (i) {
        return this.tours[i];
    };

    Population.prototype.saveTour = function (i, tour) {
        this.tours[i] = tour;
    };


    /**
     * Genetic solver for the travelling salesman problem.
     * @param {Object} config Configuration
     * @constructor
     */
    function GeneticPlanner(config) {
        this.elitism = config.elitism || true;
        this.generations = config.generations || 500;
        this.itinerary = config.itinerary || [];
        this.mutationRate = config.mutationRate || 0.015;
        this.population = null;
        this.populationSize = config.populationSize || 50;
        this.tournamentSize = config.tournamentSize || 5;
    }

    GeneticPlanner.prototype.checkForDuplicatePoints = function () {
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

    GeneticPlanner.prototype.crossTours = function (parent1, parent2, start, end) {
        var child = new Tour(parent1.tourSize()), i, ii;
        // Loop and add the sub tour from parent1 to child
        for (i = 0; i < parent1.tourSize(); i++) {
            // If our start position is less than the end position
            if (start < end && i > start && i < end) {
                child.setPoint(i, parent1.getPoint(i));
            }
            // If our start position is larger
            else if (start > end) {
                if (!(i < start && i > end)) {
                    child.setPoint(i, parent1.getPoint(i));
                }
            } else {
                // mark the element so that we know we need to insert an element
                // from parent2
                child.setPoint(i, null);
            }
        }
        // Loop through parent2's point tour
        for (i = 0; i < parent2.tourSize(); i++) {
            // If child doesn't have the point add it
            if (!child.containsPoint(parent2.getPoint(i))) {
                // Loop to find a spare position in the child's tour
                for (ii = 0; ii < child.tourSize(); ii++) {
                    // Spare position found, add point
                    if (child.getPoint(ii) === null) {
                        child.setPoint(ii, parent2.getPoint(i));
                        break;
                    }
                }
            }
        }
        // force fitness value to update
        child.updateFitness();
        return child;
    };

    /**
     * Crossover mutation creates a new tour comprising a subsegment of parent1
     * combined with a subsegment of parent2.
     * @param {Tour} parent1 Tour
     * @param {Tour} parent2 Tour
     * @returns {Tour}
     */
    GeneticPlanner.prototype.crossover = function (parent1, parent2) {
        // Get start and end sub tour positions for parent1's tour
        var start = Math.floor(Math.random() * parent1.tourSize());
        var end = Math.floor(Math.random() * parent1.tourSize());
        var child = this.crossTours(parent1, parent2, start, end);
        child.checkForNullValues();
        child.checkForDuplicateValues();
        return child;
    };

    GeneticPlanner.prototype.evolve = function () {
        this.population = this.evolvePopulation(this.population);
        for (var i = 0; i < this.generations; i++) {
            this.population = this.evolvePopulation(this.population);
        }
    };

    GeneticPlanner.prototype.evolvePopulation = function (pop) {
        var i;
        var newPopulation = new Population(this.itinerary, pop.getPopulationSize(), false);
        // Keep our best individual if elitism is enabled
        var elitismOffset = 0;
        if (this.elitism) {
            newPopulation.saveTour(0, pop.getFittest());
            elitismOffset = 1;
        }
        // Crossover population
        // Loop over the new population's size and create individuals from
        // Current population
        for (i = elitismOffset; i < newPopulation.getPopulationSize(); i++) {
            // Select parents
            var parent1 = this.tournamentSelection(pop);
            var parent2 = this.tournamentSelection(pop);
            // Crossover parents
            var childTour = this.crossover(parent1, parent2);
            // Add child to new population
            newPopulation.saveTour(i, childTour);
        }
        // Mutate the new population a bit to add some new genetic material
        for (i = elitismOffset; i < newPopulation.getPopulationSize(); i++) {
            this.mutate(newPopulation.getTour(i));
        }
        return newPopulation;
    };

    GeneticPlanner.prototype.getPopulation = function () {
        return this.population;
    };

    GeneticPlanner.prototype.getSolution = function () {
        return this.population.getFittest();
    };

    /**
     * Create an initial population of candidate solutions.
     */
    GeneticPlanner.prototype.init = function () {
        this.population = new Population(this.itinerary, this.populationSize, true);
    };

    GeneticPlanner.prototype.mutate = function (tour) {
        // Loop through tour cities
        for (var tourPos1 = 0; tourPos1 < tour.tourSize(); tourPos1++) {
            // Apply mutation rate
            if (Math.random() < this.mutationRate) {
                // Get a second random position in the tour
                var tourPos2 = Math.floor(tour.tourSize() * Math.random());
                // Get the cities at target position in tour
                var point1 = tour.getPoint(tourPos1);
                var point2 = tour.getPoint(tourPos2);
                // Swap them around
                tour.setPoint(tourPos2, point1);
                tour.setPoint(tourPos1, point2);
            }
        }
    };

    GeneticPlanner.prototype.reset = function () {
        this.itinerary = [];
    };

    GeneticPlanner.prototype.setPopulationSize = function (size) {
        this.populationSize = size;
    };

    /**
     * Generate a solution for the itinerary.
     */
    GeneticPlanner.prototype.solve = function () {
        var startTime = new Date();
        // create an initial solution
        this.init();
        var initialSolution = this.getSolution();
        var initialDistance = initialSolution.getDistance();
        // evolve a new solution
        this.evolve();
        var finalSolution = this.getSolution();
        return {
            duration: new Date() - startTime,
            finalDistance: finalSolution.getDistance(),
            initialDistance: initialDistance,
            iterations: this.generations,
            path: finalSolution.tour
        };
    };

    GeneticPlanner.prototype.tour = function () {
        return new Tour();
    };

    GeneticPlanner.prototype.tournamentSelection = function (pop) {
        // Create a tournament population
        var tournament = new Population(this.itinerary, this.tournamentSize, false);
        // For each place in the tournament get a random candidate tour and
        // add it
        for (var i = 0; i < this.tournamentSize; i++) {
            var randomId = Math.floor(Math.random() * pop.getPopulationSize());
            tournament.saveTour(i, pop.getTour(randomId));
        }
        // Get the fittest tour
        return tournament.getFittest();
    };

    return GeneticPlanner;

}());

self.onmessage = function (e) {
    switch (e.data.cmd) {
        case 'run':
            var config = e.data || {};
            var gp = new GeneticPlanner(config);
            var solution = gp.solve();
            self.postMessage(solution);
            break;
        case 'quit':
            console.warn('Terminating simulated annealing path planner worker');
            self.close();
            break;
    }
};
