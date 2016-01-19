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

  describe('get model objects', function () {

    it('should return a flat list', function (done) {
      expect(scene).not.toBeNull();

      var o1 = new THREE.Object3D();
      var o2 = new THREE.Object3D();
      var o3 = new THREE.Object3D();

      var geom = new THREE.BoxGeometry();
      var mat = new THREE.MeshBasicMaterial();
      var o4 = new THREE.Mesh(geom, mat);

      o3.add(o4);
      o2.add(o3);
      o1.add(o2);
      scene.model.add(o1);

      var objs = scene.getModelObjects();

      expect(objs).not.toBeNull();
      expect(objs.length).toEqual(4);
      done();
    });
  });

});
