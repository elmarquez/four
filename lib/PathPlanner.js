/**
 * Path navigation utilities.
 * @constructor
 */

var PathPlanner = (function () {

    function PathPlanner () {}

    PathPlanner.prototype.generateWalkPath = function () {
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
        console.log("Initial distance: " + ts.getPopulation().getFittest().getDistance());
        // Evolve the population
        ts.evolve(100);
        // Print final results
        console.log("Final distance: " + ts.getPopulation().getFittest().getDistance());
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

    /**
     * Tween the camera to the specified position.
     * @param {Float} x Camera world X coordinate
     * @param {Float} y Camera world Y coordinate
     * @param {Float} z Camera world Z coordinate
     * @param {Float} tx Camera target X lookAt coordinate
     * @param {Float} ty Camera target Y lookAt coordinate
     * @param {Float} tz Camera target Z lookAt coordinate
     * @param {Float} rx Camera X axis rotation
     * @param {Float} ry Camera Y axis rotation
     * @param {Float} rz Camera Z axis rotation
     * @param {Function} progress Progress callback
     * @returns {Promise}
     */
    PathPlanner.prototype.tweenToPosition = function (obj, x, y, z, tx, ty, tz, rx, ry, rz, progress) {
        // TODO need better path planning ... there is too much rotation happening right now
        return new Promise(function (resolve) {
            var emit = progress;
            var start = {
                x: obj.position.x,
                y: obj.position.y,
                z: obj.position.z,
                tx: 0, // FIXME get the current camera lookat position
                ty: 0,
                tz: 0,
                rx: obj.rotation.x,
                ry: obj.rotation.y,
                rz: obj.rotation.z
            };
            var finish = {
                x: x, y: y, z: z,
                tx: tx, ty: ty, tz: tz,
                rx: rx, ry: ry, rz: rz
            };
            var tween = new TWEEN.Tween(start).to(finish, 1500);
            tween.easing(TWEEN.Easing.Cubic.InOut);
            tween.onComplete(function () {
                emit('continuous-update-end');
                resolve();
            });
            tween.onUpdate(function () {
                var tweened = this;
                obj.position.setX(tweened.x);
                obj.position.setY(tweened.y);
                obj.position.setZ(tweened.z);
                if (obj instanceof THREE.Camera && !tweened.rx) {
                    obj.lookAt(new THREE.Vector3(tweened.tx, tweened.ty, tweened.tz));
                } else {
                    obj.rotation.set(tweened.rx, tweened.ry, tweened.rz, 'XYZ');
                }
            });
            tween.start();
            emit('continuous-update-start');
            emit('update');
        });
    };

    PathPlanner.prototype.walkToNextPoint = function () {
        console.log('walk to next point');
        var self = this;
        if (self.walk.index >= self.walk.path.length - 1) {
            self.walk.index = 0;
        } else {
            self.walk.index += 1;
        }
        var point = self.walk.path[self.walk.index];
        var offset = 0;
        // the offset from the current camera position to the new camera position
        var dist = 10 / Math.tan(Math.PI * self.camera.fov / 360);
        var target = new THREE.Vector3(0, 0, -(dist + offset)); // 100 is the distance from the camera to the target, measured along the Z axis
        target.applyQuaternion(self.camera.quaternion);
        target.add(self.camera.position);
        var diff = new THREE.Vector3().subVectors(new THREE.Vector3(point.x, point.y, point.z), target);
        // the next camera position
        var next = new THREE.Vector3().add(self.camera.position, diff);
        // move the camera to the next position
        self.tweenCameraToPosition(next.x, next.y, next.z, point.x, point.y, 2);
    };

    PathPlanner.prototype.walkToPreviousPoint = function () {
        console.log('walk to previous point');
        var self = this;
        if (self.walk.index <= 0) {
            self.walk.index = self.walk.path.length - 1;
        } else {
            self.walk.index -= 1;
        }
        var point = self.walk.path[self.walk.index];
        var offset = 0;
        // the offset from the current camera position to the new camera position
        var dist = 10 / Math.tan(Math.PI * self.camera.fov / 360);
        var target = new THREE.Vector3(0, 0, -(dist + offset)); // 100 is the distance from the camera to the target, measured along the Z axis
        target.applyQuaternion(self.camera.quaternion);
        target.add(self.camera.position);
        var diff = new THREE.Vector3().subVectors(new THREE.Vector3(point.x, point.y, point.z), target);
        // the next camera position
        var next = new THREE.Vector3().add(self.camera.position, diff);
        // move the camera to the next position
        self.tweenCameraToPosition(next.x, next.y, next.z, point.x, point.y, 2);
    };

    return PathPlanner;

}());
