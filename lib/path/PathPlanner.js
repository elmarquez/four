/* global THREE, TravellingSalesman, TWEEN */
/* jshint unused:false */
'use strict';

var FOUR = FOUR || {};

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
    }

    /**
     * Generate tour sequence for a collection of features.
     * @param {Array} features Features
     * @param {*} strategy Planning strategy ID
     * @returns {Promise}
     */
    PathPlanner.prototype.generateTourSequence = function (features, strategy) {
        // TODO execute computation in a worker
        return new Promise(function (resolve, reject) {
            var path = [];
            if (features.length > 0) {
                var ts = new TravellingSalesman(50);
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

    PathPlanner.prototype.tweenToOrientation = function (camera, orientation, progress) {
        // TODO animation time needs to be relative to the distance traversed
        return new Promise(function (resolve) {
            var emit = progress;
            var start = { x: camera.up.x, y: camera.up.y, z: camera.up.z };
            var finish = { x: orientation.x, y: orientation.y, z: orientation.z };
            var tween = new TWEEN.Tween(start).to(finish, 1000);
            tween.easing(TWEEN.Easing.Cubic.InOut);
            tween.onComplete(function () {
                resolve();
            });
            tween.onUpdate(function () {
                camera.setUp(new THREE.Vector3(this.x, this.y, this.z));
                emit('update');
            });
            tween.start();
            emit('update');
        });
    };

    /**
     * Tween the camera to the specified position.
     * @param {THREE.Camera} camera Camera
     * @param {THREE.Vector3} position New camera position
     * @param {THREE.Vector3} target New camera target position
     * @param {Function} progress Progress callback
     * @returns {Promise}
     */
    PathPlanner.prototype.tweenToPosition = function (camera, position, target, progress) {
        // TODO animation time needs to be relative to the distance traversed
        // TODO need better path planning ... there is too much rotation happening right now
        return new Promise(function (resolve) {
            var emit = progress;
            // start and end tween values
            var start = {
                x: camera.position.x, y: camera.position.y, z: camera.position.z,
                tx: camera.target.x, ty: camera.target.y, tz: camera.target.z
            };
            var finish = {
                x: position.x, y: position.y, z: position.z,
                tx: target.x, ty: target.y, tz: target.z
            };
            // calculate the animation duration
            var cameraDistance = distance(camera.position, position);
            var targetDistance = distance(camera.target, target);
            var dist = cameraDistance > targetDistance ? cameraDistance : targetDistance;

            // animate
            var tween = new TWEEN.Tween(start).to(finish, 1500);
            tween.easing(TWEEN.Easing.Cubic.InOut);
            tween.onComplete(function () {
                var tweened = this;
                camera.distance = distance(camera.position, camera.target);
                camera.position.set(tweened.x, tweened.y, tweened.z);
                camera.lookAt(new THREE.Vector3(tweened.tx, tweened.ty, tweened.tz));
                camera.target = new THREE.Vector3(tweened.tx, tweened.ty, tweened.tz);
                emit('update');
                resolve();
            });
            tween.onUpdate(function () {
                var tweened = this;
                camera.distance = distance(camera.position, camera.target);
                camera.position.set(tweened.x, tweened.y, tweened.z);
                camera.target = new THREE.Vector3(tweened.tx, tweened.ty, tweened.tz);
                camera.lookAt(new THREE.Vector3(tweened.tx, tweened.ty, tweened.tz));
                console.info(tweened.tx,tweened.ty,tweened.tz);
                emit('update');
            });
            tween.start();
            emit('update');
        });
    };

    return PathPlanner;

}());
