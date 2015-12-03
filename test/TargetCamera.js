'use strict';

/**
 * Target camera tests.
 */
describe('TargetCamera', function () {

    var after, before, bbox, camera, scene;

    beforeEach(function (done) {
        scene = new FOUR.Scene();
        camera = new FOUR.TargetCamera(45, 1, 0.1, 1000);
        scene.add(camera);
        done();
    });

    //-------------------------------------------------------------------------
    // Camera defaults

    describe('default direction', function () {
        it('should be 0,1,0', function (done) {
            var direction = camera.getDirection();
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
            var position = camera.getPosition();
            var target = camera.getTarget();
            var direction = new THREE.Vector3().subVectors(position, target);
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
            var position = camera.getPosition();
            expect(position.equals(new THREE.Vector3(0,-1,0))).toBe(true);
            done();
        });
    });
    describe('default target', function () {
        it('should be 0,0,0', function (done) {
            var target = camera.getTarget();
            expect(target.equals(new THREE.Vector3())).toBe(true);
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
                var position = camera.getPosition();
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
            before = camera.getPosition();
            camera.setTarget(t).then(function () {
                after = camera.getPosition();
                expect(after.equals(new THREE.Vector3())).toBe(true);
                done();
            });
        });
        it ('should update the target', function (done) {
            camera.setTarget(t).then(function () {
                after = camera.target;
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
            before = camera.getPosition();
            camera.setDistance(d).then(function () {
                after = camera.getPosition();
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
    // Rotation

    //describe('reset orientation', function () {
    //    it('should set the camera up direction to 0,0,1', function (done) {
    //        done(false);
    //    });
    //});
    //
    //describe('set lookAt', function () {
    //   it('should set the target and ', function (done) {
    //       done(false);
    //   });
    //});
    //
    //describe('set up direction', function () {
    //    it('should update the camera up direction', function (done) {
    //        done(false);
    //    });
    //});

    //-------------------------------------------------------------------------
    // Zoom in, zoom out, zoom to fit

    describe('zoom in', function () {
        it('should reduce the distance to the target incrementally', function (done) {
            before = camera.getDistance();
            camera.zoomIn(false).then(function () {
                after = camera.getDistance();
                expect(after <= before).toBe(true);
                done();
            });
        });
        it('should not zoom in closer than the minimum distance', function (done) {
            before = camera.getDistance();
            camera.zoomIn(false).then(function () {
                camera.zoomIn(false).then(function () {
                    after = camera.getDistance();
                    expect(after >= camera.MINIMUM_DISTANCE).toBe(true);
                    done();
                });
            });
        });
    });

    describe('zoom out', function () {
        it('should increase the distance to the target incrementally', function (done) {
            before = camera.getDistance();
            camera.zoomOut(false).then(function () {
                after = camera.getDistance();
                expect(after > before).toBe(true);
                done();
            });
        });
        it('should not zoom out farther than the maximum distance', function (done) {
            camera.MAXIMUM_DISTANCE = 10;
            camera.ZOOM_FACTOR = 100;
            before = camera.getDistance();
            camera.zoomOut(false).then(function () {
                after = camera.getDistance();
                expect(after <= camera.MAXIMUM_DISTANCE).toBe(true);
                done();
            });
        });
    });

    describe('zoom to fit', function () {
        bbox = new FOUR.BoundingBox();
        bbox.position.copy(new THREE.Vector3(1,1,1));
        it('should set the camera a minimum distance from the target', function (done) {
            before = camera.getDistance();
            camera.zoomToFit(bbox, false).then(function () {
                after = camera.getDistance();
                expect(after > before).toBe(true);
                done();
            });
        });
        it('should set the target to the bounding box center position', function (done) {
            before = camera.getPosition();
            camera.zoomToFit(bbox, false).then(function () {
                after = camera.getPosition();
                expect(after.equals(before)).toBe(false);
                done();
            });
        });
    });

    //-------------------------------------------------------------------------
    // Predefined views

    describe('predefined views', function () {
        var d1, d2, p1, p2, t1, t2;
        bbox = new FOUR.BoundingBox();

        beforeEach(function (done) {
            camera.setView(camera.VIEWS.PERSPECTIVE, bbox, false).then(function () {
                done();
            });
        });

        describe('top', function () {
            it ('should update the direction', function (done) {
                d1 = camera.getDirection();
                camera.setView(camera.VIEWS.TOP, bbox, false).then(function () {
                    d2 = camera.getDirection();
                    expect(d1.equals(d2)).toBe(false);
                    done();
                });
            });
            it ('should update the position', function (done) {
                p1 = camera.getPosition();
                t1 = camera.getTarget();
                camera.setView(camera.VIEWS.TOP, bbox, false).then(function () {
                    p2 = camera.getPosition();
                    t2 = camera.getTarget();
                    expect(p2.z >= 2).toBe(true);
                    expect(t2.equals(bbox.position)).toBe(true);
                    done();
                });
            });
        });
        describe('front', function () {
            it ('should update the direction', function (done) {
                d1 = camera.getDirection();
                camera.setView(camera.VIEWS.FRONT, bbox, false).then(function () {
                    d2 = camera.getDirection();
                    expect(d1.equals(d2)).toBe(false);
                    done();
                });
            });
            it ('should update the position', function (done) {
                p1 = camera.getPosition();
                t1 = camera.getTarget();
                camera.setView(camera.VIEWS.FRONT, bbox, false).then(function () {
                    p2 = camera.getPosition();
                    t2 = camera.getTarget();
                    expect(p2.y <= -2).toBe(true);
                    expect(t2.equals(bbox.position)).toBe(true);
                    done();
                });
            });
        });
        describe('right', function () {
            it ('should update the direction', function (done) {
                d1 = camera.getDirection();
                camera.setView(camera.VIEWS.RIGHT, bbox, false).then(function () {
                    d2 = camera.getDirection();
                    expect(d1.equals(d2)).toBe(false);
                    done();
                });
            });
            it ('should update the position', function (done) {
                p1 = camera.getPosition();
                t1 = camera.getTarget();
                camera.setView(camera.VIEWS.RIGHT, bbox, false).then(function () {
                    p2 = camera.getPosition();
                    t2 = camera.getTarget();
                    expect(p2.x >= 2).toBe(true);
                    expect(t2.equals(bbox.position)).toBe(true);
                    done();
                });
            });
        });
        describe('back', function () {
            it ('should update the direction', function (done) {
                d1 = camera.getDirection();
                camera.setView(camera.VIEWS.BACK, bbox, false).then(function () {
                    d2 = camera.getDirection();
                    expect(d1.equals(d2)).toBe(false);
                    done();
                });
            });
            it ('should update the position', function (done) {
                p1 = camera.getPosition();
                t1 = camera.getTarget();
                camera.setView(camera.VIEWS.BACK, bbox, false).then(function () {
                    p2 = camera.getPosition();
                    t2 = camera.getTarget();
                    expect(p2.y >= 2).toBe(true);
                    expect(t2.equals(bbox.position)).toBe(true);
                    done();
                });
            });
        });
        describe('left', function () {
            it ('should update the direction', function (done) {
                d1 = camera.getDirection();
                camera.setView(camera.VIEWS.LEFT, bbox, false).then(function () {
                    d2 = camera.getDirection();
                    expect(d1.equals(d2)).toBe(false);
                    done();
                });
            });
            it ('should update the position', function (done) {
                p1 = camera.getPosition();
                t1 = camera.getTarget();
                camera.setView(camera.VIEWS.LEFT, bbox, false).then(function () {
                    p2 = camera.getPosition();
                    t2 = camera.getTarget();
                    expect(p2.x <= -2).toBe(true);
                    expect(t2.equals(bbox.position)).toBe(true);
                    done();
                });
            });
        });
        describe('bottom', function () {
            it ('should update the direction', function (done) {
                d1 = camera.getDirection();
                camera.setView(camera.VIEWS.BOTTOM, bbox, false).then(function () {
                    d2 = camera.getDirection();
                    expect(d1.equals(d2)).toBe(false);
                    done();
                });
            });
            it ('should update the position', function (done) {
                p1 = camera.getPosition();
                t1 = camera.getTarget();
                camera.setView(camera.VIEWS.BOTTOM, bbox, false).then(function () {
                    p2 = camera.getPosition();
                    t2 = camera.getTarget();
                    expect(p2.z <= -2).toBe(true);
                    expect(t2.equals(bbox.position)).toBe(true);
                    done();
                });
            });
        });
        describe('perspective', function () {
            it ('should update the direction', function (done) {
                camera.setView(camera.VIEWS.TOP, bbox, false).then(function () {
                    d1 = camera.getDirection();
                    camera.setView(camera.VIEWS.PERSPECTIVE, bbox, false).then(function () {
                        d2 = camera.getDirection();
                        expect(d1.equals(d2)).toBe(false);
                        done();
                    });
                });
            });
            it ('should update the position', function (done) {
                p1 = camera.getPosition();
                t1 = camera.getTarget();
                camera.setView(camera.VIEWS.PERSPECTIVE, bbox, false).then(function () {
                    p2 = camera.getPosition();
                    t2 = camera.getTarget();
                    expect(p2.x < 0).toBe(true);
                    expect(p2.y < 0).toBe(true);
                    expect(p2.z > 0).toBe(true);
                    expect(t2.equals(bbox.position)).toBe(true);
                    done();
                });
            });
        });
    });

});
