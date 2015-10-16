/* global THREE */
/* jshint unused:false */
'use strict';

var FOUR = FOUR || {};

FOUR.Scene = (function () {

    /**
     * Scene
     * @constructor
     */
    function Scene (config) {
        THREE.Scene.call(this);
        config = config || {};

        var self = this;
        self.DEFAULT_CAMERA_NAME = 'camera1';
        self.boundingBox = new FOUR.BoundingBox('scene-bounding-box');
        self.cameras = new THREE.Object3D();
        self.helpers = new THREE.Object3D();
        self.lights = new THREE.Object3D();
        self.model = new THREE.Object3D();
        self.selection = new FOUR.SelectionSet();

        self.cameras.name = 'cameras';
        self.lights.name = 'lights';
        self.model.name = 'model';
        self.helpers.name = 'helpers';

        self.add(self.cameras);
        self.add(self.lights);
        self.add(self.model);
        self.add(self.helpers);

        Object.keys(config).forEach(function (key) {
           self[key] = config[key];
        });

        // scene bounding box
        self.helpers.add(self.boundingBox);

        // listen for updates
        // TODO update the scene bounding box when the backing model changes
        self.selection.addEventListener('update', function () {
            self.boundingBox.update(self.selection.getObjects());
        });
    }

    Scene.prototype = Object.create(THREE.Scene.prototype);

    Scene.prototype.constructor = Scene;

    /**
     * Create a default scene camera. A camera aspect ratio or DOM height
     * element and width must be specified.
     * @param {Object} config Configuration
     */
    Scene.prototype.createDefaultCamera = function (config) {
        var self = this;
        config = config || {};
        // default camera settings
        var cfg = {
            far: 1000,
            fov: 45,
            height: 1,
            name: self.DEFAULT_CAMERA_NAME,
            near: 0.1,
            width: 1
        };
        Object.keys(config).forEach(function (key) {
           cfg[key] = config[key];
        });
        var camera = new FOUR.TargetCamera(cfg.fov, cfg.width / cfg.height, cfg.near, cfg.far);
        camera.name = cfg.name;
        camera.setPositionAndTarget(-50, -50, 50, 0, 0, 0); // use position, target fields
        camera.addEventListener('update', function () { self.emit('update'); });
        self.cameras.add(camera);
    };

    Scene.prototype.emit = function (type) {
      this.dispatchEvent({'type':type});
    };

    Scene.prototype.getCamera = function (name) {
        return this.getLayerObject('cameras', name);
    };

    Scene.prototype.getCameras = function () {
        return this.getLayerObjects('cameras');
    };

    Scene.prototype.getHelper = function (name) {
        return this.getLayerObject('helpers', name);
    };

    Scene.prototype.getHelpers = function () {
        return this.getLayerObjects('helpers');
    };

    Scene.prototype.getLayerObjects = function (layer) {
        return this.children.reduce(function (last, current) {
            return current.name === layer ? current.children : last;
        }, null);
    };

    Scene.prototype.getLayerObject = function (layer, name) {
        return this
          .getLayerObjects(layer)
          .reduce(function (last, current) {
            return current.name === name ? current : last;
        }, null);
    };

    Scene.prototype.getLight = function (name) {
        return this.getLayerObject('lights', name);
    };

    Scene.prototype.getLights = function () {
        return this.getLayerObjects('lights');
    };

    return Scene;

}());