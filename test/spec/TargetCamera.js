'use strict';

//var client = require('../definitions');
//var q = require('q');
//var request = require('request');

/**
 * Target camera tests.
 */
describe('TargetCamera', function () {

    var camera, scene;

    beforeEach(function (done) {
        scene = new FOUR.Scene();
        camera = new FOUR.TargetCamera(45, 1, 0.1, 1000);
        camera.name = 'TEST';
        scene.add(camera);
        done();
    });

    describe('default position', function () {
        it('should be 0,0,0', function (done) {
            expect(camera.position.x).toBe(0);
            expect(camera.position.y).toBe(0);
            expect(camera.position.z).toBe(0);
            done();
        });
    });
    describe('default target', function () {
        it('should be 0,0,0', function (done) {
            expect(camera.target.x).toBe(0);
            expect(camera.target.y).toBe(0);
            expect(camera.target.z).toBe(0);
            done();
        });
    });
    describe('default lookAt direction', function () {
        var lookAt = new THREE.Vector3(0,0, -1);
        lookAt.applyQuaternion(camera.quaternion).normalize();

        it('should be 0,0,-1', function (done) {
            expect(lookAt.x).toBe(0);
            expect(lookAt.y).toBe(0);
            expect(lookAt.z).toBe(-1);
        });
        it('should be the same as the position to target direction', function (done) {
            var direction = new THREE.Vector3().subVectors(camera.position, camera.target);
            expect(direction).equals(lookAt);
        });
    });
    describe('default distance', function () {
        it ('should be 0', function (done) {
            done(false);
        });
    });
    describe('set position', function () {
        it ('something', function (done) {
            done(false);
        });
    });
    describe('set target', function () {
        it ('something', function (done) {
            done(false);
        });
    });
    describe('set distance', function () {
        it ('something', function (done) {
            done(false);
        });
    });

});
