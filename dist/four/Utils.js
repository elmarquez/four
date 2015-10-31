/* global THREE */
/* jshint unused:false */
'use strict';

var FOUR = FOUR || {};

FOUR.Utils = (function () {

    /**
     * Utility functions.
     * @constructor
     */
    function Utils (config) {
        config = config || {};
        var self = this;

        // default entity values
        self.DEFAULT = {
            CAMERA: {
                far: 1000,
                fov: 45,
                height: 1,
                name: 'camera',
                near: 0.1,
                width: 1
            }
        };

        Object.keys(config).forEach(function (key) {
            self[key] = config[key];
        });
    }

    ///**
    // * Create a default perspective camera. A camera aspect ratio or DOM height
    // * element and width must be specified.
    // * @param {Object} config Configuration
    // */
    //Utils.prototype.createDefaultCamera = function (config) {
    //    var cfg = {}, config = config || {};
    //    Object.keys(config).forEach(function (key) {
    //        cfg[key] = config[key];
    //    });
    //    var camera = new FOUR.TargetCamera(cfg.fov, cfg.width / cfg.height, cfg.near, cfg.far);
    //    camera.name = cfg.name;
    //    camera.setPositionAndTarget(new THREE.Vector3(-50, -50, 50), new THREE.Vector3()); // use position, target fields
    //    return camera;
    //};

    return Utils;

}());