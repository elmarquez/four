'use strict';

var FOUR = FOUR || {};

FOUR.ViewAxis = (function () {

    function ViewAxis (config) {
        THREE.EventDispatcher.call(this);

        var self = this;

        self.MODES = {
            SELECT: 0,
            READONLY: 1
        };
        self.ROTATION_0   = 0;
        self.ROTATION_90  = Math.PI / 2;
        self.ROTATION_180 = Math.PI;
        self.ROTATION_270 = Math.PI * 1.5;
        self.ROTATION_360 = Math.PI * 2;

        self.AXIS_OPACITY = 0.8;
        self.AXIS_THICKNESS = 2.0;
        self.FACE_COLOUR = 0x4a5f70;
        self.FACE_OPACITY_MOUSE_OFF = 0.0;
        self.FACE_OPACITY_MOUSE_OVER = 0.8;

        self.axis = null;
        self.axis_xy_plane = null;
        self.camera = null;
        self.control = new THREE.Object3D();
        self.domElement = config.domElement;
        self.enable = {
            axis: true,
            labels: true,
            xy_plane: true
        };
        self.fov = 60; // 50
        self.labelOffset = 0.1;
        self.material = {
            blue: new THREE.LineBasicMaterial({
                color: 0x0000ff,
                linewidth: self.AXIS_THICKNESS,
                opacity: self.AXIS_OPACITY,
                transparent: true
            }),
            green: new THREE.LineBasicMaterial({
                color: 0x00ff00,
                linewidth: self.AXIS_THICKNESS,
                opacity: self.AXIS_OPACITY,
                transparent: true
            }),
            red: new THREE.LineBasicMaterial({
                color: 0xff0000,
                linewidth: self.AXIS_THICKNESS,
                opacity: self.AXIS_OPACITY,
                transparent: true
            })
        };
        self.mouse = new THREE.Vector2();
        self.raycaster = new THREE.Raycaster();
        self.scene = new THREE.Scene();
        self.textCfg = {
            size: 0.35, height:0.01
        };
        self.viewport = config.viewport;
        self.up = new THREE.Vector3(0,0,1);

        Object.keys(config).forEach(function (key) {
            self[key] = config[key];
        });

        // renderer
        self.renderer = new THREE.WebGLRenderer({alpha: true, antialias: true});
        self.renderer.setSize(self.domElement.clientWidth, self.domElement.clientHeight);
        self.renderer.shadowMap.enabled = false;
        self.domElement.appendChild(self.renderer.domElement);

        self.setupCamera();
        self.setupGeometry();
        self.setupLights();
        self.setupNavigation();
    }

    ViewAxis.prototype = Object.create(THREE.EventDispatcher.prototype);

    ViewAxis.prototype.createAxis = function () {
        var axis = new THREE.Object3D(), geometry, line, self = this;
        axis.name = 'axis';

        geometry = new THREE.Geometry();
        geometry.vertices.push(
            new THREE.Vector3(0, 0, 0),
            new THREE.Vector3(1, 0, 0)
        );
        line = new THREE.Line(geometry, self.material.red);
        line.name = 'x';
        axis.add(line);

        geometry = new THREE.Geometry();
        geometry.vertices.push(
            new THREE.Vector3(0, 0, 0),
            new THREE.Vector3(0, 1, 0)
        );
        line = new THREE.Line(geometry, self.material.green);
        line.name = 'y';
        axis.add(line);

        geometry = new THREE.Geometry();
        geometry.vertices.push(
            new THREE.Vector3(0, 0, 0),
            new THREE.Vector3(0, 0, 1)
        );
        line = new THREE.Line(geometry, self.material.blue);
        line.name = 'z';
        axis.add(line);

        return axis;
    };

    ViewAxis.prototype.createLabel = function (text, color, position) {

    };

    ViewAxis.prototype.createLabels = function () {
        var labels = new THREE.Object3D(), geometry, self = this, x, y, z;
        labels.name = 'labels';

        geometry = new THREE.TextGeometry('x', self.textCfg);
        x = new THREE.Mesh(geometry, self.material.red);
        x.name = 'x';
        x.position.set(1 + self.labelOffset,0,0);
        labels.add(x);

        geometry = new THREE.TextGeometry('y', self.textCfg);
        y = new THREE.Mesh(geometry, self.material.green);
        y.name = 'y';
        y.position.set(0,1 + self.labelOffset,0);
        labels.add(y);

        geometry = new THREE.TextGeometry('z', self.textCfg);
        z = new THREE.Mesh(geometry, self.material.blue);
        z.name = 'z';
        z.position.set(0,0,1 + self.labelOffset);
        labels.add(z);

        return labels;
    };

    ViewAxis.prototype.createXYPlane = function () {
        var plane = new THREE.Object3D();
        var geometry = new THREE.PlaneGeometry(0.70,0.70);
        var material = new THREE.MeshBasicMaterial({color: 0xFF00FF, opacity:0.5, transparent:true});
        var mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(0.35, 0.35, 0);
        plane.add(mesh);
        plane.name = 'xy_plane';
        return plane;
    };

    ViewAxis.prototype.onCameraUpdate = function () {
        var self = this;
        var camera = self.viewport.camera;
        // rotate the ViewAxis to match the viewport camera
    };

    ViewAxis.prototype.onMouseMove = function (event) {
        var self = this;
        // calculate mouse position in normalized device coordinates
        // (-1 to +1) for both components
        self.mouse.x = (event.offsetX / self.domElement.clientWidth) * 2 - 1;
        self.mouse.y = - (event.offsetY / self.domElement.clientHeight) * 2 + 1;
        // update the picking ray with the camera and mouse position
        self.raycaster.setFromCamera(self.mouse, self.camera);
        // reset opacity for all scene objects
        self.scene.traverse(function (obj) {
            if (obj.name !== 'labels' && obj.material) {
                obj.material.opacity = self.FACE_OPACITY_MOUSE_OFF;
            }
        });
        // calculate objects intersecting the picking ray
        var intersects = self.raycaster.intersectObjects(self.scene.children, true);
        if (intersects.length > 0 && intersects[0].object.name !== 'labels') {
            intersects[0].object.material.opacity = self.FACE_OPACITY_MOUSE_OVER;
        }
    };

    ViewAxis.prototype.onMouseOver = function (event) {
        var self = this;
        // change opacity
    };

    ViewAxis.prototype.onMouseUp = function (event) {
        var self = this;
        // calculate mouse position in normalized device coordinates
        // (-1 to +1) for both components
        self.mouse.x = (event.offsetX / self.domElement.clientWidth) * 2 - 1;
        self.mouse.y = - (event.offsetX / self.domElement.clientWidth) * 2 + 1;
        // update the picking ray with the camera and mouse position
        self.raycaster.setFromCamera(self.mouse, self.camera);
        // calculate objects intersecting the picking ray
        self.selection = [];
        var intersects = self.raycaster.intersectObjects(self.scene.children, true);
        if (intersects.length > 0) {
            self.setView(intersects[0].object.name);
        }
    };

    ViewAxis.prototype.render = function () {
        var self = this;
        self.renderer.render(self.scene, self.camera);
    };

    ViewAxis.prototype.setupCamera = function () {
        var self = this;
        // position and point the camera to the center of the scene
        self.camera = new THREE.PerspectiveCamera(self.fov, self.domElement.clientWidth / self.domElement.clientHeight, 0.1, 1000);
        self.camera.position.x = 2;
        self.camera.position.y = 2;
        self.camera.position.z = 2;
        self.camera.up = new THREE.Vector3(0, 0, 1);
        self.camera.lookAt(new THREE.Vector3(0, 0, 0));
    };

    ViewAxis.prototype.setupGeometry = function () {
        var self = this;
        if (self.enable.axis) {
            self.axis = self.createAxis();
            self.scene.add(self.axis);
        }
        if (self.enable.labels) {
            var labels = self.createLabels();
            self.scene.add(labels);
        }
        if (self.enable.xy_plane) {
            self.axis_xy_plane = self.createXYPlane();
            self.axis.add(self.axis_xy_plane);
        }
    };

    ViewAxis.prototype.setupLights = function () {
        var light = new THREE.AmbientLight(0x404040), self = this;
        self.scene.add(light);

        light = new THREE.DirectionalLight(0xffffff);
        light.position.set(1, 1, 1);
        self.scene.add(light);
    };

    ViewAxis.prototype.setupNavigation = function () {
        // bind click events to views
    };

    ViewAxis.prototype.tweenCameraToPosition = function (x, y, z, rx, ry, rz) {
        var self = this;
        return new Promise(function (resolve) {
            var start = {
                x: self.camera.position.x,
                y: self.camera.position.y,
                z: self.camera.position.z
            };
            var finish = {x: x, y: y, z: z};
            var tween = new TWEEN.Tween(start).to(finish, 2000);
            tween.easing(TWEEN.Easing.Cubic.InOut);
            tween.onComplete(resolve);
            tween.onUpdate(function () {
                self.camera.lookAt(new THREE.Vector3(0, 0, 0));
                self.camera.position.set(this.x, this.y, this.z);
            });
            tween.start();
            self.render();
        });
    };

    ViewAxis.prototype.tweenControlRotation = function (rx, ry, rz) {
        var self = this;
        return new Promise(function (resolve) {
            var start = {
                rx: self.control.rotation.x,
                ry: self.control.rotation.y,
                rz: self.control.rotation.z
            };
            var finish = {rx: rx, ry: ry, rz: rz};
            var tween = new TWEEN.Tween(start).to(finish, 1000);
            tween.easing(TWEEN.Easing.Cubic.InOut);
            tween.onComplete(resolve);
            tween.onUpdate(function () {
                self.control.rotation.set(this.rx, this.ry, this.rz, 'XYZ');
            });
            tween.start();
            self.render();
        });
    };

    ViewAxis.prototype.update = function () {
        var self = this;
        TWEEN.update();
        requestAnimationFrame(self.render.bind(self));
    };

    return ViewAxis;

}());
