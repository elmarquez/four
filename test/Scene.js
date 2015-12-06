'use strict';

/**
 * Scene.
 */
describe('Scene', function () {

    var scene;

    beforeEach(function (done) {
        scene = new FOUR.Scene();
        done();
    });

    describe('default configuration', function () {
       it('should have a camera group', function (done) {
           done(false);
       });
        it('should have a helpers group', function (done) {
            done(false);
        });
        it('should have a lights group', function (done) {
            done(false);
        });
        it('should have a model group', function (done) {
            done(false);
        });
    });

    describe('get layer', function () {
       it('returns the object representing the layer', function (done) {
           done(false);
       });
    });

    describe('get layers', function () {
        it('returns the list of layer objects', function (done) {
            done(false);
        });
    });

    describe('get layer entity by name', function () {
        it('returns the object', function (done) {
            done(false);
        });
    });

});
