FOUR.Scene = (function () {

    /**
     * Scene with predefined layers.
     * @constructor
     */
    function Scene(config) {
        THREE.Scene.call(this);
        config = config || {};

        var self = this;

        self.cameras = new THREE.Object3D();
        self.helpers = new THREE.Object3D();
        self.lights = new THREE.Object3D();
        self.model = new THREE.Object3D();

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
    }

    Scene.prototype = Object.create(THREE.Scene.prototype);

    Scene.prototype.constructor = Scene;

    Scene.prototype.getCamera = function (name) {
        return this.getLayerObject('cameras', name);
    };

    Scene.prototype.getCameras = function () {
        return this.getLayerObjects('cameras');
    };

    Scene.prototype.getChildren = function (obj) {
        var children = [], self = this;
        if (obj.children && obj.children.length > 0) {
            obj.children.forEach(function (child) {
                children.push(child);
                self.getChildren(child).forEach(function (obj) {
                    children.push(obj);
                });
            });
        }
        return children;
    };

    Scene.prototype.getHelper = function (name) {
        return this.getLayerObject('helpers', name);
    };

    Scene.prototype.getHelpers = function () {
        return this.getLayerObjects('helpers');
    };

    Scene.prototype.getLayer = function (name) {
        return this.getLayers().reduce(function (last, current) {
            if (current.name === name) {
                last = current;
            }
            return last;
        }, null);
    };

    Scene.prototype.getLayers = function () {
        return this.children.reduce(function (last, current) {
            if (typeof current === THREE.Object3D) {
                last.push(current);
            }
            return last;
        }, []);
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

    Scene.prototype.getModelLayerObject = function (name) {
        return this.getLayerObject('model', name);
    };

    /**
     * Get model objects.
     * @returns {Array} List of model objects.
     */
    Scene.prototype.getModelObjects = function () {
        return this.getChildren(this.model);
    };

    return Scene;

}());