/* global THREE */
/* jshint unused:false */
'use strict';

var FOUR = FOUR || {};

FOUR.Scene3D = (function () {

    // default camera settings
    var camera = {
        far: 1000,
        fov: 45,
        height: 1,
        near: 0.1,
        width: 1
    };

    /**
     *
     * @constructor
     */
    function Scene3D () {
        THREE.Scene.call(this);

        var self = this;
        self.boundingBox = new FOUR.BoundingBox('scene-bounding-box');
        self.cameras = new THREE.Object3D();
        self.helpers = new THREE.Object3D();
        self.lights = new THREE.Object3D();
        self.model = new THREE.Object3D();
        self.selection = new FOUR.SelectionSet({scene: self});

        self.add(self.cameras);
        self.add(self.lights);
        self.add(self.model);
        self.add(self.helpers);

        // scene bounding box
        self.helpers.add(self.boundingBox);

        // listen for updates
        self.selection.addEventListener('update', function () {
            self.boundingBox.update(self.selection.getObjects());
        });
        self.selection.addEventListener('update', function () {
            // highlight selected objects
        });
    }

    Scene3D.prototype = Object.create(THREE.Scene.prototype);

    Scene3D.prototype.DEFAULT_CAMERA_NAME = 'camera1';

    Scene3D.prototype.ENTITIES = {
        GROUND: 'ground',
        POINT: 'point',
        POLE: 'pole'
    };

    Scene3D.prototype.constructor = Scene3D;

    /**
     * Create a default scene camera. A camera aspect ratio or DOM height
     * element and width must be specified.
     * @param config
     */
    Scene3D.prototype.createDefaultCamera = function (config) {
        // TODO rename to createCamera
        var self = this;
        Object.keys(config).forEach(function (key) {
           camera[key] = config[key];
        });
        var targetcamera = new FOUR.TargetCamera(camera.fov, camera.width / camera.height, camera.near, camera.far);
        targetcamera.name = self.DEFAULT_CAMERA_NAME; // use name field
        self.cameras.add(targetcamera);
        targetcamera.setPositionAndTarget(-50, -50, 50, 0, 0, 0); // use position, target fields
        targetcamera.addEventListener('continuous-update-end', function () { self.emit('continuous-update-end'); });
        targetcamera.addEventListener('continuous-update-start', function () { self.emit('continuous-update-start'); });
        targetcamera.addEventListener('update', function () { self.emit('update'); });
    };

    Scene3D.prototype.emit = function (type) {
      this.dispatchEvent({'type':type});
    };

    Scene3D.prototype.getCamera = function (name) {
        var self = this;
        return self.getCameras(function (obj) {
            return obj.name === name;
        }).pop();
    };

    Scene3D.prototype.getCameras = function (filter) {
        var cameras = [], self = this;
        if (!filter) {
            filter = filter || function () { return true; };
        }
        self.cameras.traverse(function (obj) {
            if (filter(obj)) {
                cameras.push(obj);
            }
        });
        return cameras;
    };

    Scene3D.prototype.getLight = function (name) {
        throw new Error('not implemented');
    };

    Scene3D.prototype.getLights = function () {
        throw new Error('not implemented');
    };

    Scene3D.prototype.load = function () {
        throw new Error('not implemented');
    };

    return Scene3D;

}());