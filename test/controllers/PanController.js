'use strict';

/**
 * Pan controller tests.
 */
describe('Pan controller', function () {

    var after, before, camera, ctrl, scene, viewport;

    function MockCamera () {}

    function MockViewport () {
        this.camera = new MockCamera();
        this.clientHeight = 100;
        this.clientWidth = 100;
        this.offsetLeft = 50;
        this.offsetTop = 50;
        this.render = function () {};
    }

    beforeEach(function (done) {
        scene = new FOUR.Scene();
        camera = new FOUR.TargetCamera(45, 1, 0.1, 1000);
        scene.add(camera);
        viewport = new MockViewport();
        ctrl = new FOUR.PanController({viewport:viewport});
        done();
    });

    describe('transform mouse coordinates to screen size ratio', function () {
        it('should ', function (done) {
            done(false);
        });
    });

});
