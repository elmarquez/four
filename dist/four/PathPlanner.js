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
        var dx = Math.pow(p2.x + p1.x, 2);
        var dy = Math.pow(p2.y + p1.y, 2);
        var dz = Math.pow(p2.z + p1.z, 2);
        return Math.sqrt(dx + dy + dz);
    }

    function PathPlanner () {}

    PathPlanner.prototype.generateTourSequence = function (features) {
        // TODO return a promise
        // TODO execute computation in a worker
        var material, geometry, i, line, self = this;
        var ts = new TravellingSalesman(50);
        // Add points to itinerary
        var selected = self.selection.getObjects();
        if (selected.length > 0) {
            selected.forEach(function (obj) {
                ts.addPoint({
                    focus: 0,
                    obj: obj,
                    radius: obj.geometry.boundingSphere.radius,
                    x: obj.position.x,
                    y: obj.position.y,
                    z: obj.position.z
                });
            });
        } else {
            // TODO filter entities
            self.scene.traverse(function (obj) {
                ts.addPoint({
                    focus: 0,
                    obj: obj,
                    radius: obj.geometry.boundingSphere.radius,
                    x: obj.position.x,
                    y: obj.position.y,
                    z: obj.position.z
                });
            });
        }
        // Initialize population
        ts.init();
        console.log('Initial distance: ' + ts.getPopulation().getFittest().getDistance());
        // Evolve the population
        ts.evolve(100);
        // Print final results
        console.log('Final distance: ' + ts.getPopulation().getFittest().getDistance());
        console.log(ts.getPopulation().getFittest());

        self.walk.path = ts.getSolution();
        var lastpoint = self.walk.path[0];
        for (i = 1; i < self.walk.path.length; i++) {
            var point = self.walk.path[i];
            // line geometry
            material = new THREE.LineBasicMaterial({color: 0x0000cc});
            geometry = new THREE.Geometry();
            geometry.vertices.push(
                new THREE.Vector3(lastpoint.x, lastpoint.y, lastpoint.z),
                new THREE.Vector3(point.x, point.y, point.z)
            );
            line = new THREE.Line(geometry, material);
            self.scene.add(line);
            lastpoint = point;
        }
        // select the nearest point and set the walk index to that item
        self.walk.index = 0;
    };

    PathPlanner.prototype.moveToNextWaypointFeature = function () {
        console.log('move to next bounding box focal point');
        var self = this;
        var waypoint = self.walk.path[self.walk.index];
        var obj = waypoint.obj;
        var x, y, z;
        // if entity is a pole, then move to middle, top, bottom
        if (obj.userData.type === 'pole') {
            console.log('pole');
            if (waypoint.focus === 0) {
                z = obj.geometry.boundingSphere.radius;
                waypoint.focus = 1;
            } else if (waypoint.focus === 1) {
                z = -(obj.geometry.boundingSphere.radius * 2);
                waypoint.focus = 2;
            } else if (waypoint.focus === 2) {
                z = obj.geometry.boundingSphere.radius;
                waypoint.focus = 0;
            }
            self.tweenCameraToPosition(
                self.camera.position.x,
                self.camera.position.y,
                self.camera.position.z + z,
                obj.position.x,
                obj.position.y,
                obj.position.z + z
            );
        }
        // if entity is a catenary, then move to middle, end, start
        else if (obj.userData.type === 'catenary') {
            console.log('catenary');
        }
    };

    PathPlanner.prototype.tweenToLevelOrientation = function (camera, progress) {
        // TODO animation time needs to be relative to the distance traversed
        return new Promise(function (resolve) {
            var emit = progress;
            var start = { x: camera.up.x, y: camera.up.y, z: camera.up.z };
            var finish = { x: 0, y: 1, z: 0 };
            var tween = new TWEEN.Tween(start).to(finish, 1000);
            tween.easing(TWEEN.Easing.Cubic.InOut);
            tween.onComplete(function () {
                resolve();
            });
            tween.onUpdate(function () {
                camera.up = new THREE.Vector3(this.x, this.y, this.z);
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
            var start = {
                x: camera.position.x, y: camera.position.y, z: camera.position.z,
                tx: camera.target.x, ty: camera.target.y, tz: camera.target.z
            };
            var finish = {
                x: position.x, y: position.y, z: position.z,
                tx: target.x, ty: target.y, tz: target.z
            };
            var tween = new TWEEN.Tween(start).to(finish, 1500);
            tween.easing(TWEEN.Easing.Cubic.InOut);
            tween.onComplete(function () {
                //console.info('tween done');
                resolve();
            });
            tween.onUpdate(function () {
                var tweened = this;
                camera.distance = distance(camera.position, camera.target);
                camera.lookAt(new THREE.Vector3(tweened.tx, tweened.ty, tweened.tz));
                camera.position.set(tweened.x, tweened.y, tweened.z);
                camera.target.set(tweened.tx, tweened.ty, tweened.tz);
                //console.log('tween');
                emit('update');
            });
            tween.start();
            emit('update');
        });
    };

    return PathPlanner;

}());
