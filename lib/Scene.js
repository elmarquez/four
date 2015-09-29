var Scene3D = (function () {

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
        self.boundingBox = new BoundingBox('scene-bounding-box');
        self.cameras = new THREE.Object3D();
        self.helpers = new THREE.Object3D();
        self.lights = new THREE.Object3D();
        self.model = new THREE.Object3D();
        self.selection = new SelectionSet({scene: self});

        self.add(self.cameras);
        self.add(self.lights);
        self.add(self.model);
        self.add(self.helpers);

        // scene bounding box
        self.helpers.add(self.boundingBox);

        // demo content
        self.setupGeometry();
        self.setupLights();

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
        var self = this;
        Object.keys(config).forEach(function (key) {
           camera[key] = config[key];
        });
        var targetcamera = new TargetCamera(camera.fov, camera.width / camera.height, camera.near, camera.far);
        targetcamera.name = self.DEFAULT_CAMERA_NAME;
        targetcamera.position.set(-100, -100, 100);
        self.cameras.add(targetcamera);
    };

    Scene3D.prototype.getCamera = function (name) {
        var self = this;
        return self.getCameras(function (obj) {
            return obj.name === name;
        }).pop();
    };

    Scene3D.prototype.getCameras = function (filter) {
        var cameras = [], filter = filter || function () { return true; }, self = this;
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

    Scene3D.prototype.setupGeometry = function () {
        var self = this;
        // make some poles
        var obj, geometry, material;
        var poles = [
            [0,0],[20,0],[40,0],[60,0],[80,0],[100,0],
            [0,10],[20,10],[40,10],[60,10],[80,10],[100,10]
        ];
        poles.forEach(function (pole) {
            geometry = new THREE.CylinderGeometry(0.5, 0.5, 15, 20, 4);
            material = new THREE.MeshPhongMaterial({color: 0x00ff00});
            obj = new THREE.Mesh(geometry, material);
            obj.rotateOnAxis(new THREE.Vector3(1, 0, 0), Math.PI / 2);
            obj.position.setX(pole[0]);
            obj.position.setY(pole[1]);
            obj.position.setZ(7.5);
            obj.userData.type = 'pole';
            self.model.add(obj);
        });
        // make some catenaries
        var catenaries = [
            [0,0,20,0],[20,0,40,0],[40,0,60,0],[60,0,80,0],[80,0,100,0],
            [0,10,20,10],[20,10,40,10],[40,10,60,10],[60,10,80,10],[80,10,100,10]
        ];
        catenaries.forEach(function (c) {
            var height = 15;
            material = new THREE.LineBasicMaterial({color: 0xff0000, linewidth: 2.0});
            geometry = new THREE.Geometry();
            geometry.vertices.push(
                new THREE.Vector3(0,0,height / 2),
                new THREE.Vector3(20,0,height / 2)
            );
            obj = new THREE.Line(geometry, material);
            obj.position.setX(c[0]);
            obj.position.setY(c[1]);
            obj.position.setZ(height / 2);
            obj.userData.type = 'catenary';
            self.model.add(obj);
        });
        // axis helper
        var axisHelper = new THREE.AxisHelper(5);
        self.helpers.add(axisHelper);

        // update the bounding box
        self.boundingBox.update(self.children);
    };

    Scene3D.prototype.setupLights = function () {
        var self = this;
        var ambientLight = new THREE.AmbientLight(0x383838);
        ambientLight.name = 'ambient';
        self.lights.add(ambientLight);

        // add spotlight for the shadows
        var spotLight = new THREE.SpotLight(0xffffff);
        spotLight.intensity = 2;
        spotLight.name = 'spotlight';
        spotLight.position.set(100, 140, 130);
        self.lights.add(spotLight);
    };

    return Scene3D;

}());