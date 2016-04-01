/* globals params, rtn, self */
/**
 * Simulated annealing path planner.
 * @see http://www.theprojectspot.com/tutorial-post/simulated-annealing-algorithm-for-beginners/6
 */

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

/**
 * Compute the solution acceptance probability.
 * @param {Number} energy Energy
 * @param {Number} newEnergy New energy level
 * @param {Number} temperature Temperature
 * @returns {number} Probability
 */
function acceptanceProbability(energy, newEnergy, temperature) {
    // If the new solution is better, accept it
    if (newEnergy < energy) {
        return 1.0;
    }
    // If the new solution is worse, calculate an acceptance probability
    return Math.exp((energy - newEnergy) / temperature);
}

/**
 * Check for duplicate points in the itinerary.
 * @param {Array} itinerary Itinerary
 */
function itineraryHasDuplicatePoint(itinerary) {
    var i, key, points = {};
    for (i = 0; i < itinerary.length; i++) {
        key = String(itinerary[i].x) + String(itinerary[i].y + String(itinerary[i].z));
        if (points.hasOwnProperty(key)) {
            return true;
        }
    }
    return false;

    //// TODO hash the x, y values together instead of doing this dumb ass search
    //// build an index of points
    //for (i = 0; i < itinerary.length; i++) {
    //    x.push(itinerary[i].position.x);
    //    y.push(itinerary[i].position.y);
    //}
    //// check for duplicates
    //for (i = 0; i < itinerary.length; i++) {
    //    p = itinerary[i];
    //    px = x.lastIndexOf(p.x);
    //    py = y.lastIndexOf(p.y);
    //    if (px === py && px !== i) {
    //        return true;
    //    }
    //}
    //return false;
}

/**
 * Simulated annealing path planner.
 * @param {Object} config
 * @returns {Object} Solution and basic statistics
 */
function simulate(config) {
    var best, currentSolution, initialDistance, iterations = 0, newSolution, pointSwap1, pointSwap2,
        currentEnergy, neighbourEnergy,
        startTime = new Date(),
        tourPos1, tourPos2;

    // reset planner state
    var coolingRate = config.coolingRate;
    var itinerary = [];
    var temp = config.initialTemperature;

    // create itinerary from list of points
    config.array.forEach(function (point) {
        itinerary.push(point);
    });

    // Check for duplicate itinerary points
    if (itineraryHasDuplicatePoint(itinerary)) {
        window.alert('Duplicate itinerary points');
        throw new Error('Duplicate itinerary points');
    }

    // Set the initial best solution
    currentSolution = new Tour(0);
    currentSolution.generateIndividual(itinerary);
    best = currentSolution;
    initialDistance = best.getDistance();

    // Loop until system has cooled
    while (temp > 1) {
        // Create new neighbour tour
        newSolution = new Tour(0);
        newSolution.copy(currentSolution.tour);
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
        currentEnergy = currentSolution.getDistance();
        neighbourEnergy = newSolution.getDistance();
        // Decide if we should accept the neighbour
        if (acceptanceProbability(currentEnergy, neighbourEnergy, temp) > Math.random()) {
            currentSolution = new Tour(0);
            currentSolution.copy(newSolution.tour);
        }
        // Keep track of the best solution found
        if (currentSolution.getDistance() < best.getDistance()) {
            best = new Tour(0);
            best.copy(currentSolution.tour);
        }
        // Cool system
        temp *= 1 - coolingRate;
        iterations++;
    }

    return {
        duration: new Date() - startTime,
        finalDistance: best.getDistance(),
        initialDistance: initialDistance,
        iterations: iterations,
        path: best.tour
    };
}

self.onmessage = function (e) {
    switch (e.data.cmd) {
        case 'run':
            var solution = simulate(e.data);
            self.postMessage(solution);
            break;
        case 'quit':
            console.warn('Terminating simulated annealing path planner worker');
            self.close();
            break;
    }
};
