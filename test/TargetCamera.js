'use strict';

/**
 * Target camera tests.
 */
describe('TargetCamera', function () {

    var after, before, camera, scene;

    beforeEach(function (done) {
        scene = new FOUR.Scene();
        camera = new FOUR.TargetCamera(45, 1, 0.1, 1000);
        camera.name = 'TEST';
        scene.add(camera);
        done();
    });

    //-------------------------------------------------------------------------
    // Camera defaults

    describe('default', function () {

    });

    describe('default direction', function () {
        it('should be 0,1,0', function (done) {
            var direction = camera.getDirection();
            //console.info('direction', direction.x, direction.y, direction.z);
            expect(direction.equals(new THREE.Vector3(0,1,0))).toBe(true);
            done();
        });
    });
    describe('default distance', function () {
        it ('should be 1', function (done) {
            var distance = camera.getDistance();
            expect(distance).toBe(1);
            done();
        });
    });
    describe('default lookAt', function () {
        it('should be 0,1,0', function (done) {
            var direction = new THREE.Vector3().subVectors(camera.position, camera.target);
            expect(direction.equals(new THREE.Vector3(0,-1,0))).toBe(true);
            done();
        });
    });
    describe('default offset', function () {
        it ('should be 0,1,0', function (done) {
            var offset = camera.getOffset();
            expect(offset.equals(new THREE.Vector3(0,1,0))).toBe(true);
            done();
        });
    });
    describe('default position', function () {
        it('should be 0,-1,0', function (done) {
            expect(camera.position.equals(new THREE.Vector3(0,-1,0))).toBe(true);
            done();
        });
    });
    describe('default target', function () {
        it('should be 0,0,0', function (done) {
            expect(camera.target.equals(new THREE.Vector3())).toBe(true);
            done();
        });
    });

    //-------------------------------------------------------------------------
    // Set position

    describe('set position', function () {
        var p = new THREE.Vector3(0,-2,0);
        it('should not change the direction', function (done) {
            before = camera.getDirection();
            camera.setPosition(p).then(function () {
                after = camera.getDirection();
                expect(after.equals(before)).toBe(true);
                done();
            });
        });
        it('should not change the distance', function (done) {
            before = camera.getDistance();
            camera.setPosition(p).then(function () {
                after = camera.getDistance();
                expect(after).toBe(before);
                done();
            });
        });
        it('should update the position', function (done) {
            camera.setPosition(p).then(function () {
                var position = camera.position;
                expect(position.equals(p)).toBe(true);
                done();
            });
        });
        it('should update the target', function (done) {
            before = camera.getTarget();
            camera.setPosition(p).then(function () {
                after = camera.getTarget();
                expect(after.equals(new THREE.Vector3(0,-1,0))).toBe(true);
                done();
            });
        });
    });

    //-------------------------------------------------------------------------
    // Set target

    describe('set target', function () {
        var t = new THREE.Vector3(0,1,0);
        it ('should not change the direction', function (done) {
            before = camera.getDirection();
            camera.setTarget(t).then(function () {
                after = camera.getDirection();
                expect(after.equals(before)).toBe(true);
                done();
            });
        });
        it ('should not change the distance', function (done) {
            before = camera.getDistance();
            camera.setTarget(t).then(function () {
                after = camera.getDistance();
                expect(after).toBe(before);
                done();
            });
        });
        it ('should update the position', function (done) {
            before = camera.position;
            //console.info('position before', before.x, before.y, before.z);
            camera.setTarget(t).then(function () {
                after = camera.position;
                //console.info('position after', after.x, after.y, after.z);
                expect(after.equals(new THREE.Vector3())).toBe(true);
                done();
            });
        });
        it ('should update the target', function (done) {
            camera.setTarget(t).then(function () {
                after = camera.target;
                //console.info('target', after.x, after.y, after.z);
                expect(after.equals(t)).toBe(true);
                done();
            });
        });
    });

    //-------------------------------------------------------------------------
    // Set distance

    describe('set distance', function () {
        var d = 2;
        it ('should not change the direction', function (done) {
            before = camera.getDirection();
            camera.setDistance(d).then(function () {
                after = camera.getDirection();
                expect(after.equals(before)).toBe(true);
                done();
            });
        });
        it ('should change the distance', function (done) {
            before = camera.getDistance();
            camera.setDistance(d).then(function () {
                after = camera.getDistance();
                expect(after).toBe(d);
                done();
            });
        });
        it ('should change the position', function (done) {
            before = camera.position;
            camera.setDistance(d).then(function () {
                after = camera.position;
                expect(after.x).toBe(0);
                expect(after.y).toBe(-2);
                expect(after.z).toBe(0);
                done();
            });
        });
        it ('should not change the target', function (done) {
            before = camera.getTarget();
            camera.setDistance(d).then(function () {
                after = camera.getTarget();
                expect(after.equals(before)).toBe(true);
                done();
            });
        });
    });

    //-------------------------------------------------------------------------
    // Set lookAt

    describe('set lookAt', function () {
       it('should rotate the camera ', function (done) {
           done(false);
       });
    });

    //-------------------------------------------------------------------------
    // Zoom in, zoom out, zoom to fit

    describe('zoom in', function () {
        it('should reduce the distance to the target incrementally', function (done) {
            done(false);
        });
        it('should not zoom in closer than the minimum distance', function (done) {
            done(false);
        });
    });

    describe('zoom out', function () {
        it('should increase the distance to the target incrementally', function (done) {
            done(false);
        });
        it('should not zoom out farther than the maximum distance', function (done) {
            done(false);
        });
    });

    describe('zoom to fit', function () {
        it('should set the camera a minimum distance from the target', function (done) {
           done(false);
        });
    });

    //-------------------------------------------------------------------------
    // Predefined views

    xdescribe('predefined views', function () {
        describe('front', function () {
            it ('should look at 0,1,0', function (done) {
                done(false);
            });
        });
    });

});
