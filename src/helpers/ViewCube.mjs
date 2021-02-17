import { EVENT } from '../Globals.mjs';
import { 
    AmbientLight,
    AxisHelper,
    BoxGeometry,
    CircleGeometry,
    DoubleSide,
    Euler,
    EventDispatcher,
    ImageUtils,
    Mesh,
    MeshBasicMaterial,
    MultiMaterial,
    Object3D,
    PerspectiveCamera,
    PlaneGeometry,
    Quaternion,
    Raycaster,
    Scene,
    SpotLight,
    Vector2,
    Vector3,
    WebGLRenderer } from 'three';
import TWEEN from 'tween.js';

const ViewCube = (function () {

    /**
     * View orientation controller.
     * @param {Object} config Configurations
     * @constructor
     */
    function ViewCube(config) {
        EventDispatcher.call(this);
        config = config || {};

        var self = this;

        self.CUBE_FACE_SIZE = 70;
        self.CUBE_EDGE_SIZE = 15;
        self.CUBE_LABEL_SIZE = 99;
        self.COMPASS_COLOR = 0x666666;
        self.COMPASS_OPACITY = 0.8;

        self.FACE_COLOUR = 0x4a5f70;
        self.FACE_OPACITY_MOUSE_OFF = 0;
        self.FACE_OPACITY_MOUSE_NOT_OVER = 0.1;
        self.FACE_OPACITY_MOUSE_OVER = 0.8;
        //self.FACE_COLOUR = 0xff0000;
        //self.FACE_OPACITY_MOUSE_NOT_OVER = 1;
        //self.FACE_OPACITY_MOUSE_OVER = 1;
        self.FACES = {
            TOP: 0,
            FRONT: 1,
            RIGHT: 2,
            BACK: 3,
            LEFT: 4,
            BOTTOM: 5,

            TOP_FRONT_EDGE: 6,
            TOP_RIGHT_EDGE: 7,
            TOP_BACK_EDGE: 8,
            TOP_LEFT_EDGE: 9,

            FRONT_RIGHT_EDGE: 10,
            BACK_RIGHT_EDGE: 11,
            BACK_LEFT_EDGE: 12,
            FRONT_LEFT_EDGE: 13,

            BOTTOM_FRONT_EDGE: 14,
            BOTTOM_RIGHT_EDGE: 15,
            BOTTOM_BACK_EDGE: 16,
            BOTTOM_LEFT_EDGE: 17,

            TOP_FRONT_RIGHT_CORNER: 18,
            TOP_BACK_RIGHT_CORNER: 19,
            TOP_BACK_LEFT_CORNER: 20,
            TOP_FRONT_LEFT_CORNER: 21,

            BOTTOM_FRONT_RIGHT_CORNER: 22,
            BOTTOM_BACK_RIGHT_CORNER: 23,
            BOTTOM_BACK_LEFT_CORNER: 24,
            BOTTOM_FRONT_LEFT_CORNER: 25
        };

        self.LABELS_HOVER_OFF = 0.5;
        self.LABELS_HOVER = 1;
        self.MODES = {SELECT: 0, READONLY: 1};
        self.OFFSET = 1;

        self.ROTATION_0 = 0;
        self.ROTATION_90 = Math.PI / 2;
        self.ROTATION_180 = Math.PI;
        self.ROTATION_270 = Math.PI * 1.5;
        self.ROTATION_360 = Math.PI * 2;

        self.X_AXIS = new Vector3(1, 0, 0);
        self.Y_AXIS = new Vector3(0, 1, 0);
        self.Z_AXIS = new Vector3(0, 0, 1);

        self.camera = null; // ViewCube camera
        self.compass = new Object3D();
        self.control = new Object3D();
        self.cube = new Object3D();
        self.display = {
            axis: false,
            compass: true,
            cube: true,
            labels: true,
            normals: false
        };
        self.domElement = config.domElement;
        self.enabled = false;
        self.fov = 60; // 50
        self.frontFace = null;
        self.labelSize = 128;
        self.listeners = {};
        self.materials = {compass: null, face: null, faces: []};
        self.mouse = new Vector2();
        self.raycaster = new Raycaster();
        self.renderContinuous = false;
        self.scene = new Scene();
        self.view = new Object3D();
        self.viewport = config.viewport; // target viewport

        self.compass.name = 'compass';
        self.control.name = 'control';
        self.cube.name = 'cube';

        Object.keys(config).forEach(function (key) {
            self[key] = config[key];
        });

        // renderer
        self.renderer = new WebGLRenderer({alpha: true, antialias: true});
        self.renderer.setSize(self.domElement.clientWidth, self.domElement.clientHeight);
        self.domElement.appendChild(self.renderer.domElement);

        self.scene.add(self.control);
        self.scene.add(self.view);

        self.setupCamera();
        self.setupLights();
        self.setupMaterials();
        self.setupGeometry();

        setTimeout(function () {
            self.updateOrientation();
            self.onMouseLeave();
        }, 0);
    }

    ViewCube.prototype = Object.create(EventDispatcher.prototype);

    //ViewCube.prototype.constructor = ViewCube;

    ViewCube.prototype.disable = function () {
        var self = this;
        self.enabled = false;
        Object.keys(self.listeners).forEach(function (key) {
            var listener = self.listeners[key];
            listener.element.removeEventListener(listener.event, listener.fn);
        });
    };

    ViewCube.prototype.enable = function () {
        var self = this;

        function addListener(element, event, fn) {
            self.listeners[event] = {
                element: element,
                event: event,
                fn: fn.bind(self)
            };
            element.addEventListener(event, self.listeners[event].fn, false);
        }

        addListener(self.domElement, 'contextmenu', self.onContextMenu);
        addListener(self.domElement, 'mouseenter', self.onMouseEnter);
        addListener(self.domElement, 'mouseleave', self.onMouseLeave);
        addListener(self.domElement, 'mousemove', self.onMouseMove);
        addListener(self.domElement, 'mouseover', self.onMouseOver);
        addListener(self.domElement, 'mouseup', self.onMouseUp);
        addListener(window, 'keydown', self.render);
        addListener(window, 'mousemove', self.render);
        self.enabled = true;
    };

    ViewCube.prototype.getFaceLabel = function (val) {
        var match = null, self = this;
        Object.keys(self.FACES).forEach(function (key) {
            if (self.FACES[key] === val) {
                match = key;
            }
        });
        return match;
    };

    ViewCube.prototype.makeCompass = function (name, x, y, z, radius, segments, color, opacity) {
        var obj = new Object3D();
        var material = new MeshBasicMaterial({color: color});

        var circleGeometry = new CircleGeometry(radius, segments);
        var circle = new Mesh(circleGeometry, material);
        obj.add(circle);
        obj.name = name;
        obj.opacity = opacity;
        obj.position.x = x;
        obj.position.y = y;
        obj.position.z = z;
        return obj;
    };

    ViewCube.prototype.makeCorner = function (name, w, x, y, z, rotations) {
        var face1, face2, face3, geometry, material, obj, self = this;
        obj = new Object3D();
        material = self.materials.face.clone();
        self.materials.faces.push(material);

        geometry = new PlaneGeometry(w, w);
        face1 = new Mesh(geometry, material);
        face1.name = name;
        face1.position.setX(w / 2);
        face1.position.setY(w / 2);

        geometry = new PlaneGeometry(w, w);
        face2 = new Mesh(geometry, material);
        face2.name = name;
        face2.position.setX(w / 2);
        face2.position.setZ(-w / 2);
        face2.rotateOnAxis(new Vector3(1, 0, 0), Math.PI / 2);

        geometry = new PlaneGeometry(w, w);
        face3 = new Mesh(geometry, material);
        face3.name = name;
        face3.position.setY(w / 2);
        face3.position.setZ(-w / 2);
        face3.rotateOnAxis(new Vector3(0, 1, 0), -Math.PI / 2);

        obj.add(face1);
        obj.add(face2);
        obj.add(face3);
        obj.name = name;
        obj.position.x = x;
        obj.position.y = y;
        obj.position.z = z;
        rotations.forEach(function (rotation) {
            obj.rotateOnAxis(rotation.axis, rotation.rad);
        });
        return obj;
    };

    ViewCube.prototype.makeEdge = function (name, w, h, x, y, z, rotations) {
        var face1, face2, geometry, material, obj, self = this;
        material = self.materials.face.clone();
        self.materials.faces.push(material);

        obj = new Object3D();

        geometry = new PlaneGeometry(w, h);
        face1 = new Mesh(geometry, material);
        face1.name = name;
        face1.position.setY(h / 2);

        geometry = new PlaneGeometry(w, h);
        face2 = new Mesh(geometry, material);
        face2.name = name;
        face2.position.setZ(-h / 2);
        face2.rotateOnAxis(new Vector3(1, 0, 0), Math.PI / 2);

        obj.add(face1);
        obj.add(face2);
        obj.name = name;
        obj.position.x = x;
        obj.position.y = y;
        obj.position.z = z;
        rotations.forEach(function (rotation) {
            obj.rotateOnAxis(rotation.axis, rotation.rad);
        });
        return obj;
    };

    ViewCube.prototype.makeFace = function (name, w, x, y, z, rotations) {
        var face, geometry, material, self = this;
        geometry = new PlaneGeometry(w, w);
        material = self.materials.face.clone();
        self.materials.faces.push(material);

        face = new Mesh(geometry, material);
        face.name = name;
        face.position.setX(x);
        face.position.setY(y);
        face.position.setZ(z);
        rotations.forEach(function (rotation) {
            face.rotateOnAxis(rotation.axis, rotation.rad);
        });
        return face;
    };

    ViewCube.prototype.onContextMenu = function (event) {
        event.preventDefault();
    };

    ViewCube.prototype.onMouseEnter = function () {
        var self = this;
        self.tweenControlOpacity(self.materials.faces, self.FACE_OPACITY_MOUSE_OFF, self.FACE_OPACITY_MOUSE_NOT_OVER);
        self.tweenControlOpacity(self.materials.labels, self.LABELS_HOVER_OFF, self.LABELS_HOVER);
    };

    ViewCube.prototype.onMouseLeave = function () {
        var self = this;
        self.tweenControlOpacity(self.materials.face, self.FACE_OPACITY_MOUSE_NOT_OVER, self.FACE_OPACITY_MOUSE_OFF);
        self.tweenControlOpacity(self.materials.labels, self.LABELS_HOVER, self.LABELS_HOVER_OFF);
    };

    ViewCube.prototype.onMouseMove = function (event) {
        var self = this;
        //console.info(event);
        self.mouse.x = (event.offsetX / self.domElement.clientWidth) * 2 - 1;
        self.mouse.y = -(event.offsetY / self.domElement.clientHeight) * 2 + 1;
        self.raycaster.setFromCamera(self.mouse, self.camera);
        // reset opacity for all scene objects
        self.scene.traverse(function (obj) {
            if (obj.name !== 'labels' && obj.material) {
                obj.material.opacity = self.FACE_OPACITY_MOUSE_NOT_OVER;
            }
        });
        // calculate objects intersecting the picking ray
        var intersects = self.raycaster.intersectObjects(self.cube.children, true);
        if (intersects.length > 0 && intersects[0].object.name !== 'labels') {
            var label = self.getFaceLabel(intersects[0].object.name);
            //console.info('over', label, intersects);
            intersects[0].object.material.opacity = self.FACE_OPACITY_MOUSE_OVER;
        }
    };

    ViewCube.prototype.onMouseOver = function (event) {
    };

    ViewCube.prototype.onMouseUp = function (event) {
        var self = this;
        //console.info(event);
        // calculate mouse position in normalized device coordinates
        // (-1 to +1) for both components
        self.mouse.x = (event.offsetX / self.domElement.clientWidth) * 2 - 1;
        self.mouse.y = -(event.offsetY / self.domElement.clientHeight) * 2 + 1;
        // update the picking ray with the camera and mouse position
        self.raycaster.setFromCamera(self.mouse, self.camera);
        // calculate objects intersecting the picking ray
        var intersects = self.raycaster.intersectObjects(self.cube.children, true);
        if (intersects.length > 0) {
            var label = self.getFaceLabel(intersects[0].object.name);
            console.info('click', label, intersects);
            self.setView(intersects[0].object.name);
        }
    };

    ViewCube.prototype.render = function () {
        this.renderer.render(this.scene, this.camera);
    };

    ViewCube.prototype.setupCamera = function () {
        var self = this;
        self.camera = new PerspectiveCamera(self.fov, self.domElement.clientWidth / self.domElement.clientHeight, 0.1, 1000);
        self.camera.name = 'camera';
        self.camera.position.x = 0;
        self.camera.position.y = 0;
        self.camera.position.z = 250;
        self.camera.up = new Vector3(0, 1, 0);
        self.camera.lookAt(new Vector3(0, 0, 0));
        self.view.add(self.camera);
    };

    ViewCube.prototype.setupGeometry = function () {
        var self = this;
        // build cube control
        if (self.display.cube) {
            // FIXME this block is a duplicate
            var ROTATE_0 = 0;
            var ROTATE_90 = Math.PI / 2;
            var ROTATE_180 = Math.PI;
            var ROTATE_270 = Math.PI * 1.5;
            var ROTATE_360 = Math.PI * 2;

            if (self.display.labels) {
                var geometry = new BoxGeometry(self.CUBE_LABEL_SIZE, self.CUBE_LABEL_SIZE, self.CUBE_LABEL_SIZE);
                var labels = new Mesh(geometry, self.materials.labels);
                labels.name = 'labels';
                self.cube.add(labels);
            }

            // faces
            var topFace = self.makeFace(self.FACES.TOP, 70, 0, 0, 50, [{axis: self.Z_AXIS, rad: ROTATE_90}]);
            var frontFace = self.makeFace(self.FACES.FRONT, 70, 0, -50, 0, [{axis: self.X_AXIS, rad: ROTATE_90}]);
            var rightFace = self.makeFace(self.FACES.RIGHT, 70, 50, 0, 0, [{
                axis: self.X_AXIS,
                rad: ROTATE_90
            }, {axis: self.Y_AXIS, rad: ROTATE_90}]);
            var backFace = self.makeFace(self.FACES.BACK, 70, 0, 50, 0, [{axis: self.X_AXIS, rad: ROTATE_270}]);
            var leftFace = self.makeFace(self.FACES.LEFT, 70, -50, 0, 0, [{
                axis: self.Y_AXIS,
                rad: ROTATE_270
            }, {axis: self.Z_AXIS, rad: ROTATE_90}]);
            var bottomFace = self.makeFace(self.FACES.BOTTOM, 70, 0, 0, -50, [{
                axis: self.Y_AXIS,
                rad: ROTATE_180
            }, {axis: self.Z_AXIS, rad: ROTATE_90}]);
            self.frontFace = frontFace;

            // edges
            var topFrontEdge = self.makeEdge(self.FACES.TOP_FRONT_EDGE, 70, 15, 0, -50, 50, [{
                axis: self.Z_AXIS,
                rad: ROTATE_0
            }]);
            var topRightEdge = self.makeEdge(self.FACES.TOP_RIGHT_EDGE, 70, 15, 50, 0, 50, [{
                axis: self.Z_AXIS,
                rad: ROTATE_90
            }]);
            var topBackEdge = self.makeEdge(self.FACES.TOP_BACK_EDGE, 70, 15, 0, 50, 50, [{
                axis: self.Z_AXIS,
                rad: ROTATE_180
            }]);
            var topLeftEdge = self.makeEdge(self.FACES.TOP_LEFT_EDGE, 70, 15, -50, 0, 50, [{
                axis: self.Z_AXIS,
                rad: ROTATE_270
            }]);

            var bottomFrontEdge = self.makeEdge(self.FACES.BOTTOM_FRONT_EDGE, 70, 15, 0, -50, -50, [{
                axis: self.Z_AXIS,
                rad: ROTATE_0
            }, {axis: self.Y_AXIS, rad: ROTATE_180}]);
            var bottomRightEdge = self.makeEdge(self.FACES.BOTTOM_RIGHT_EDGE, 70, 15, 50, 0, -50, [{
                axis: self.Z_AXIS,
                rad: ROTATE_90
            }, {axis: self.Y_AXIS, rad: ROTATE_180}]);
            var bottomBackEdge = self.makeEdge(self.FACES.BOTTOM_BACK_EDGE, 70, 15, 0, 50, -50, [{
                axis: self.Z_AXIS,
                rad: ROTATE_180
            }, {axis: self.Y_AXIS, rad: ROTATE_180}]);
            var bottomLeftEdge = self.makeEdge(self.FACES.BOTTOM_LEFT_EDGE, 70, 15, -50, 0, -50, [{
                axis: self.Z_AXIS,
                rad: ROTATE_270
            }, {axis: self.Y_AXIS, rad: ROTATE_180}]);

            var frontRightEdge = self.makeEdge(self.FACES.FRONT_RIGHT_EDGE, 70, 15, 50, -50, 0, [{
                axis: self.X_AXIS,
                rad: ROTATE_0
            }, {axis: self.Y_AXIS, rad: ROTATE_90}]);
            var backRightEdge = self.makeEdge(self.FACES.BACK_RIGHT_EDGE, 70, 15, 50, 50, 0, [{
                axis: self.X_AXIS,
                rad: ROTATE_180
            }, {axis: self.Y_AXIS, rad: ROTATE_90}]);
            var backLeftEdge = self.makeEdge(self.FACES.BACK_LEFT_EDGE, 70, 15, -50, 50, 0, [{
                axis: self.X_AXIS,
                rad: ROTATE_180
            }, {axis: self.Y_AXIS, rad: ROTATE_270}]);
            var frontLeftEdge = self.makeEdge(self.FACES.FRONT_LEFT_EDGE, 70, 15, -50, -50, 0, [{
                axis: self.X_AXIS,
                rad: ROTATE_0
            }, {axis: self.Y_AXIS, rad: ROTATE_270}]);

            // corners
            var topFrontLeftCorner = self.makeCorner(self.FACES.TOP_FRONT_LEFT_CORNER, 15, -50, -50, 50, [{
                axis: self.Z_AXIS,
                rad: ROTATE_0
            }]);
            var topFrontRightCorner = self.makeCorner(self.FACES.TOP_FRONT_RIGHT_CORNER, 15, 50, -50, 50, [{
                axis: self.Z_AXIS,
                rad: ROTATE_90
            }]);
            var topBackRightCorner = self.makeCorner(self.FACES.TOP_BACK_RIGHT_CORNER, 15, 50, 50, 50, [{
                axis: self.Z_AXIS,
                rad: ROTATE_180
            }]);
            var topBackLeftCorner = self.makeCorner(self.FACES.TOP_BACK_LEFT_CORNER, 15, -50, 50, 50, [{
                axis: self.Z_AXIS,
                rad: ROTATE_270
            }]);

            var bottomFrontLeftCorner = self.makeCorner(self.FACES.BOTTOM_FRONT_LEFT_CORNER, 15, -50, -50, -50, [{
                axis: self.Y_AXIS,
                rad: ROTATE_180
            }, {axis: self.Z_AXIS, rad: ROTATE_90}]);
            var bottomFrontRightCorner = self.makeCorner(self.FACES.BOTTOM_FRONT_RIGHT_CORNER, 15, 50, -50, -50, [{
                axis: self.Y_AXIS,
                rad: ROTATE_180
            }, {axis: self.Z_AXIS, rad: ROTATE_0}]);
            var bottomBackRightCorner = self.makeCorner(self.FACES.BOTTOM_BACK_RIGHT_CORNER, 15, 50, 50, -50, [{
                axis: self.Y_AXIS,
                rad: ROTATE_180
            }, {axis: self.Z_AXIS, rad: ROTATE_270}]);
            var bottomBackLeftCorner = self.makeCorner(self.FACES.BOTTOM_BACK_LEFT_CORNER, 15, -50, 50, -50, [{
                axis: self.Y_AXIS,
                rad: ROTATE_180
            }, {axis: self.Z_AXIS, rad: ROTATE_180}]);

            self.cube.add(topFace);
            self.cube.add(frontFace);
            self.cube.add(rightFace);
            self.cube.add(backFace);
            self.cube.add(leftFace);
            self.cube.add(bottomFace);

            self.cube.add(topFrontEdge);
            self.cube.add(topRightEdge);
            self.cube.add(topBackEdge);
            self.cube.add(topLeftEdge);

            self.cube.add(bottomFrontEdge);
            self.cube.add(bottomRightEdge);
            self.cube.add(bottomBackEdge);
            self.cube.add(bottomLeftEdge);

            self.cube.add(frontRightEdge);
            self.cube.add(backRightEdge);
            self.cube.add(backLeftEdge);
            self.cube.add(frontLeftEdge);

            self.cube.add(topFrontLeftCorner);
            self.cube.add(topFrontRightCorner);
            self.cube.add(topBackRightCorner);
            self.cube.add(topBackLeftCorner);

            self.cube.add(bottomFrontLeftCorner);
            self.cube.add(bottomFrontRightCorner);
            self.cube.add(bottomBackRightCorner);
            self.cube.add(bottomBackLeftCorner);

            self.control.add(self.cube);
        }

        if (self.display.compass) {
            var compass = self.makeCompass('compass', 0, 0, -55, 90, 64, self.COMPASS_COLOR, self.COMPASS_OPACITY);
            self.control.add(compass);
        }

        if (self.display.controlAxis) {
            var controlAxis = new AxisHelper(100);
            self.cube.add(controlAxis);
        }

        if (self.display.sceneAxis) {
            var sceneAxis = new AxisHelper(150);
            self.scene.add(sceneAxis);
        }

        if (self.display.cameraAxis) {
            var cameraAxis = new AxisHelper(100);
            self.view.add(cameraAxis);
        }

        self.scene.add(self.control);
    };

    ViewCube.prototype.setupLights = function () {
        var self = this;

        // ambient light
        var ambientLight = new AmbientLight(0x545454);
        self.view.add(ambientLight);

        // top, left spotlight
        var topLeftSpot = new SpotLight(0xffffff);
        topLeftSpot.lookAt(0, 0, 0);
        topLeftSpot.position.set(250, -250, 250);
        topLeftSpot.intensity = 2;

        // top, right spotlight
        var topRightSpot = new SpotLight(0xffffff);
        topRightSpot.lookAt(0, 0, 0);
        topRightSpot.position.set(250, 250, 250);
        topRightSpot.intensity = 0.75;

        self.view.add(topLeftSpot);
        self.view.add(topRightSpot);
    };

    ViewCube.prototype.setupMaterials = function () {
        var self = this;
        // faces
        self.materials.face = new MeshBasicMaterial({
            alphaTest: 0.5,
            color: self.FACE_COLOUR,
            opacity: self.FACE_OPACITY_MOUSE_OFF,
            transparent: true
        });
        //self.materials.face = new MeshBasicMaterial({color: self.FACE_COLOUR, alphaTest: 0.5});
        self.materials.face.side = DoubleSide;
        // labels
        var label1 = new MeshPhongMaterial({
            color: 0xAAAAAA,
            map: ImageUtils.loadTexture('/lib/img/' + self.labelSize + '/top.png'),
            opacity: self.LABELS_HOVER_OFF,
            transparent: true
        });
        var label2 = new MeshPhongMaterial({
            color: 0xAAAAAA,
            map: ImageUtils.loadTexture('/lib/img/' + self.labelSize + '/front.png'),
            opacity: self.LABELS_HOVER_OFF,
            transparent: true
        });
        var label3 = new MeshPhongMaterial({
            color: 0xAAAAAA,
            map: ImageUtils.loadTexture('/lib/img/' + self.labelSize + '/right.png'),
            opacity: self.LABELS_HOVER_OFF,
            transparent: true
        });
        var label4 = new MeshPhongMaterial({
            color: 0xAAAAAA,
            map: ImageUtils.loadTexture('/lib/img/' + self.labelSize + '/left.png'),
            opacity: self.LABELS_HOVER_OFF,
            transparent: true
        });
        var label5 = new MeshPhongMaterial({
            color: 0xAAAAAA,
            map: ImageUtils.loadTexture('/lib/img/' + self.labelSize + '/back.png'),
            opacity: self.LABELS_HOVER_OFF,
            transparent: true
        });
        var label6 = new MeshPhongMaterial({
            color: 0xAAAAAA,
            map: ImageUtils.loadTexture('/lib/img/' + self.labelSize + '/bottom.png'),
            opacity: self.LABELS_HOVER_OFF,
            transparent: true
        });
        var labels = [label3, label4, label5, label2, label1, label6];
        self.materials.labels = new MeshFaceMaterial(labels);
    };

    ViewCube.prototype.setView = function (view) {
        var euler, self = this;
        switch (view) {
            case self.FACES.BACK:
                self.tweenViewRotation(Math.PI / 2, Math.PI, 0);
                self.dispatchEvent({
                    type: EVENT.UPDATE,
                    view: view,
                    direction: new Euler(Math.PI / 2, Math.PI, 0)
                });
                break;
            case self.FACES.BACK_LEFT_EDGE:
                self.tweenViewRotation(Math.PI / 2, Math.PI * 1.25, 0);
                break;
            case self.FACES.BACK_RIGHT_EDGE:
                self.tweenViewRotation(Math.PI / 2, Math.PI * 0.75, 0);
                break;
            case self.FACES.BOTTOM:
                self.tweenViewRotation(Math.PI, 0, 0);
                break;
            case self.FACES.BOTTOM_BACK_EDGE:
                self.tweenViewRotation(Math.PI * 1.25, 0, Math.PI);
                break;
            case self.FACES.BOTTOM_BACK_LEFT_CORNER:
                self.tweenViewRotation(-Math.PI * 0.75, -Math.PI / 4, Math.PI * 0.75);
                break;
            case self.FACES.BOTTOM_BACK_RIGHT_CORNER:
                self.tweenViewRotation(Math.PI * 0.75, Math.PI * 0.25, Math.PI * 1.25);
                break;
            case self.FACES.BOTTOM_FRONT_EDGE:
                self.tweenViewRotation(Math.PI * 0.75, 0, 0);
                break;
            case self.FACES.BOTTOM_FRONT_LEFT_CORNER:
                self.tweenViewRotation(0, -Math.PI / 4, Math.PI * 0.25);
                break;
            case self.FACES.BOTTOM_FRONT_RIGHT_CORNER:
                //self.tweenViewRotation(Math.PI * 0.5, Math.PI * 0.25, 0);
                //self.tweenViewRotation(0, Math.PI * 0.75, Math.PI / 2); // bottom right edge
                self.tweenViewRotation(Math.PI, Math.PI, Math.PI * 1.75); // front right edge
                break;
            case self.FACES.BOTTOM_LEFT_EDGE:
                self.tweenViewRotation(0, Math.PI * 1.25, Math.PI * 1.5);
                break;
            case self.FACES.BOTTOM_RIGHT_EDGE:
                self.tweenViewRotation(0, Math.PI * 0.75, Math.PI / 2);
                break;
            case self.FACES.FRONT:
                self.tweenViewRotation(Math.PI / 2, 0, 0);
                break;
            case self.FACES.FRONT_LEFT_EDGE:
                self.tweenViewRotation(Math.PI / 2, Math.PI * 1.75, 0);
                break;
            case self.FACES.FRONT_RIGHT_EDGE:
                self.tweenViewRotation(Math.PI / 2, Math.PI / 4, 0);
                break;
            case self.FACES.LEFT:
                self.tweenViewRotation(Math.PI / 2, Math.PI * 1.5, 0);
                break;
            case self.FACES.RIGHT:
                self.tweenViewRotation(Math.PI / 2, Math.PI / 2, 0);
                break;
            case self.FACES.TOP:
                self.tweenViewRotation(0, 0, 0);
                break;
            case self.FACES.TOP_BACK_EDGE:
                self.tweenViewRotation(Math.PI * 1.75, 0, Math.PI);
                break;
            case self.FACES.TOP_BACK_LEFT_CORNER:
                euler = new THREE
                    .Euler(0, 0, 0)
                    .setFromVector3(new Vector3(-1.5, -1.5, 2.75).normalize()); // good
                self.tweenViewRotation(euler.x, euler.y, euler.z * Math.PI * 1.5);
                break;
            case self.FACES.TOP_BACK_RIGHT_CORNER:
                euler = new THREE
                    .Euler(0, 0, 0)
                    .setFromVector3(new Vector3(-1.5, 1.5, 2.5).normalize());
                //.setFromVector3(new Vector3(-Math.sqrt(2),Math.sqrt(2),2.5).normalize());
                self.tweenViewRotation(euler.x, euler.y, euler.z * Math.PI);
                break;
            case self.FACES.TOP_FRONT_EDGE:
                self.tweenViewRotation(Math.PI / 4, 0, 0);
                break;
            case self.FACES.TOP_FRONT_LEFT_CORNER:
                euler = new THREE
                    .Euler(0, 0, 0)
                    .setFromVector3(new Vector3(1.5, -1.5, -2).normalize());
                //.setFromVector3(new Vector3(Math.sqrt(2),-Math.sqrt(2),-2).normalize());
                self.tweenViewRotation(euler.x, euler.y, euler.z);
                break;
            case self.FACES.TOP_FRONT_RIGHT_CORNER:
                euler = new THREE
                    .Euler(0, 0, 0)
                    .setFromVector3(new Vector3(1.5, 1.5, 2).normalize());
                //.setFromVector3(new Vector3(Math.sqrt(2),Math.sqrt(2),2).normalize());
                self.tweenViewRotation(euler.x, euler.y, euler.z);
                break;
            case self.FACES.TOP_LEFT_EDGE:
                self.tweenViewRotation(0, Math.PI * 1.75, Math.PI * 1.5);
                break;
            case self.FACES.TOP_RIGHT_EDGE:
                self.tweenViewRotation(0, Math.PI / 4, Math.PI / 2);
                break;
            default:
                console.warn('view not found', view);
        }
    };

    ViewCube.prototype.tweenControlOpacity = function (material, start, finish) {
        var self = this;
        return new Promise(function (resolve) {
            var o1 = {opacity: start};
            var o2 = {opacity: finish};
            var tween = new TWEEN.Tween(o1).to(o2, 1000);

            function setOpacity(material, opacity) {
                if (Array.isArray(material)) {
                    material.forEach(function (m) {
                        setOpacity(m, opacity);
                    });
                }
                if (material instanceof MultiMaterial) {
                    material.materials.forEach(function (m) {
                        m.opacity = opacity;
                    });
                } else {
                    material.opacity = opacity;
                }
            }

            tween.easing(TWEEN.Easing.Cubic.InOut);
            tween.onComplete(function () {
                setOpacity(material, this.opacity);
                self.render();
                self.renderContinuous = false;
                resolve();
            });
            tween.onUpdate(function () {
                setOpacity(material, this.opacity);
                self.render();
            });
            self.renderContinuous = true;
            tween.start();
            self.render();
        });
    };

    ViewCube.prototype.tweenViewRotation = function (rx, ry, rz, duration) {
        var self = this;
        return new Promise(function (resolve) {
            var targetEuler = new Euler(rx, ry, rz, 'XYZ');
            var startQuaternion = self.view.quaternion.clone();
            var endQuaternion = new Quaternion().setFromEuler(targetEuler);

            var start = {t: 0};
            var finish = {t: 1};

            var tween = new TWEEN.Tween(start).to(finish, duration || 1000);
            tween.easing(TWEEN.Easing.Cubic.InOut);
            tween.onComplete(function () {
                Quaternion.slerp(startQuaternion, endQuaternion, self.view.quaternion, this.t);
                self.render();
                self.renderContinuous = false;
                resolve();
            });
            tween.onUpdate(function () {
                Quaternion.slerp(startQuaternion, endQuaternion, self.view.quaternion, this.t);
                self.render();
            });
            self.renderContinuous = true;
            tween.start();
            self.render();
        });
    };

    ViewCube.prototype.update = function () {
        var self = this;
        TWEEN.update();
        if (self.renderContinuous) {
            requestAnimationFrame(self.update.bind(self));
        }
    };

    ViewCube.prototype.updateOrientation = function () {
        var self = this;
        var euler = new Euler(
            self.viewport.camera.rotation.x,
            self.viewport.camera.rotation.y,
            self.viewport.camera.rotation.z,
            'XZY'
        );
        self.view.quaternion.setFromEuler(euler);
        self.render();
    };

    return ViewCube;

}());

export default ViewCube;