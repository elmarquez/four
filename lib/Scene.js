var Scene3D = (function () {

    function Scene3D () {
        this.DEFAULT_CAMERA_NAME = 'camera1';

        this.scene = new THREE.Scene();
        this.setupCamera();
        this.setupGeometry();
        this.setupLights();
    }

    Scene3D.prototype.getDefaultCamera = function () {
        return this.getCamera(this.DEFAULT_CAMERA_NAME);
    };

    Scene3D.prototype.getCamera = function (name) {
      throw new Error('not implemented');
    };

    Scene3D.prototype.getCameras = function () {
        var cameras = [], self = this;
        self.scene.traverse(function (obj) {
            console.dir(obj);
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

    Scene3D.prototype.setupCamera = function () {
        var self = this;
        var camera = new TargetCamera(self.fov, self.with / self.height, self.near, self.far);
        camera.name = this.DEFAULT_CAMERA_NAME;
        self.scene.add(camera);
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
            self.scene.add(obj);
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
            self.scene.add(obj);
        });
    };

    Scene3D.prototype.setupLights = function () {
        var self = this;
        var ambientLight = new THREE.AmbientLight(0x383838);
        ambientLight.name = 'ambient';
        self.scene.add(ambientLight);

        // add spotlight for the shadows
        var spotLight = new THREE.SpotLight(0xffffff);
        spotLight.intensity = 2;
        spotLight.name = 'spotlight';
        spotLight.position.set(100, 140, 130);
        self.scene.add(spotLight);
    };

    return Scene3D;

}());