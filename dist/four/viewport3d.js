/* global Mousetrap, THREE, TWEEN */
'use strict';

var FOUR = FOUR || {};

/**
 * Renders the view from a scene camera to the DOM.
 */
FOUR.Viewport3D = (function () {

    function Viewport3D(elementId, scene) {
        THREE.EventDispatcher.call(this);
        this.COLORS = {
            SELECTED: 0xffa500
        };
        this.CONTROLLERS = {
            ORBIT: 'orbit',
            SELECT: 'select',
            TRACKBALL: 'trackball',
            WALK: 'walk'
        };
        this.MODES = {
            INSPECT: -1,
            ORBIT: 0,
            SELECT: 1,
            TRACKBALL: 2,
            WALK: 3
        };
        this.MODIFIERS = {
            ALT: 'ALT',
            CTRL: 'CTRL',
            SHIFT: 'SHIFT'
        };
        this.WALK_HEIGHT = 7.5;

        this.backgroundColor = new THREE.Color(0x000, 1.0);
        this.camera = null;
        this.clock = new THREE.Clock();
        this.continuous = false; // render continuously
        this.controller = {};
        this.domElement = null;
        this.domElementId = elementId;
        this.mode = this.MODES.SELECT;
        this.modifiers = {
            'ALT': false,
            'CTRL': false,
            'SHIFT': false
        };
        this.renderer = null;
        this.scene = scene;

        this.walk = {
            index: 0,
            path: []
        };
    }

    Viewport3D.prototype = Object.create(THREE.EventDispatcher.prototype);

    Viewport3D.prototype.constructor = Viewport3D;

    Viewport3D.prototype.getViewBoundingBox = function () {
        var self = this;
        if (self.scene.selection.count > 0) {
            return self.scene.selection.getBoundingBox();
        } else {
            var bbox = new FOUR.BoundingBox('scene-bounding-box');
            bbox.update(self.scene.model.children);
            return bbox;
        }
    };

    /**
     * Initialize the viewport.
     */
    Viewport3D.prototype.init = function () {
        var self = this;
        self.domElement = document.getElementById(self.domElementId);
        // renderer
        self.renderer = new THREE.WebGLRenderer({antialias: true});
        self.renderer.setClearColor(self.backgroundColor);
        self.renderer.setSize(self.domElement.clientWidth, self.domElement.clientHeight);
        self.renderer.shadowMap.enabled = true;
        self.domElement.appendChild(self.renderer.domElement);
        // set the camera
        self.setCamera(self.scene.DEFAULT_CAMERA_NAME);
        // setup interactions
        self.setupKeyboardBindings();
        self.setupControllers();
        // listen for events
        self.domElement.addEventListener('mousemove', function () {
            requestAnimationFrame(self.render.bind(self));
        });
    };

    // TODO need to wire this function up
    Viewport3D.prototype.onWindowResize = function () {
        var self = this;
        var height = self.domElement.clientHeight;
        var width = self.domElement.clientWidth;
        self.camera.aspect = width / height;
        self.camera.updateProjectionMatrix();
        self.renderer.setSize(width, height);
        self.render();
    };

    /**
     * Render the viewport once.
     */
    Viewport3D.prototype.render = function () {
        var self = this;
        var delta = self.clock.getDelta();
        // update scene state
        TWEEN.update();
        if (self.mode === self.MODES.ORBIT) {
            self.controller[self.CONTROLLERS.ORBIT].update(delta);
        }
        if (self.mode === self.MODES.TRACKBALL) {
            self.controller[self.CONTROLLERS.TRACKBALL].update(delta);
        } else if (self.mode === self.MODES.WALK) {
            self.controller[self.CONTROLLERS.WALK].update(delta);
        }
        // render the frame
        self.renderer.render(self.scene, self.camera);
        // enqueue the next rendering task
        if (self.continuous) {
            requestAnimationFrame(self.render.bind(self));
        }
    };

    /**
     * Set the viewport camera
     * @param {String} name Camera name
     */
    Viewport3D.prototype.setCamera = function (name) {
        var self = this;
        if (self.camera) {
            self.camera.removeEventListener('continuous-update-end', self.stopContinuousRendering);
            self.camera.removeEventListener('continuous-update-start', self.startContinuousRendering);
            self.camera.removeEventListener('update', self.render);
        }
        self.camera = self.scene.getCamera(name);
        self.camera.addEventListener('continuous-update-end', self.stopContinuousRendering.bind(self));
        self.camera.addEventListener('continuous-update-start', self.startContinuousRendering.bind(self));
        self.camera.addEventListener('update', self.render.bind(self));
        self.render();
    };

    Viewport3D.prototype.setMode = function (mode) {
        var self = this;
        self.mode = mode;
        // disable the existing controller
        Object.keys(self.controller).forEach(function (key) {
            var controller = self.controller[key];
            if (controller && controller.hasOwnProperty('disable')) {
                controller.disable();
            }
        });
        // enable the new controller
        if (self.mode === self.MODES.SELECT) {
            console.log('select mode');
            self.controller.selection.enable();
        } else if (self.mode === self.MODES.ORBIT) {
            console.log('orbit mode');
            self.controller.orbit.enable();
        } else if (self.mode === self.MODES.TRACKBALL) {
            console.log('trackball mode');
            //self.controller.trackball.enable();
        } else if (self.mode === self.MODES.WALK) {
            console.log('walk mode');
            self.controller.walk.enable();
        } else if (self.mode === self.MODES.INSPECT) {
            // center the camera on the bounding box, zoom to fit, then enable the orbit controller
            console.log('INSPECT mode');
        }
    };

    Viewport3D.prototype.setupControllers = function () {
        // TODO this code should be outside of the viewport
        var self = this;

        // selection controller
        self.controller.selection = new FOUR.SelectionControl({viewport: self});
        self.controller.selection.addEventListener('update', self.render.bind(self), false);

        // trackball controller
        //self.controller.trackball = new THREE.TrackballControls(self.camera, self.domElement);
        //self.controller.trackball.rotateSpeed = 1.0;
        //self.controller.trackball.zoomSpeed = 1.2;
        //self.controller.trackball.panSpeed = 0.8;
        //self.controller.trackball.noZoom = false;
        //self.controller.trackball.noPan = false;
        //self.controller.trackball.staticMoving = true;
        //self.controller.trackball.dynamicDampingFactor = 0.3;
        //self.controller.trackball.keys = [65, 83, 68];
        //self.controller.trackball.addEventListener('change', self.render.bind(self));
        //self.controller.trackball.disable();

        //// first person navigation controller
        //self.controller.walk = new THREE.FirstPersonControls(self.camera, document);
        //self.controller.walk.constrainVertical = true;
        //self.controller.walk.lookSpeed = 0.2;
        //self.controller.walk.lookVertical = true;
        //self.controller.walk.movementSpeed = 10;
        //self.controller.walk.noFly = true;
        //self.controller.walk.verticalMax = 2.0;
        //self.controller.walk.verticalMin = 1.0;
        //self.controller.walk.lon = -150;
        //self.controller.walk.lat = 120;
        //self.controller.walk.phi = 0;
        //self.controller.walk.theta = 1;
        //self.controller.walk.moveBackward = true;
        //self.controller.walk.moveForward = true;
        //self.controller.walk.target.set(0,0,0);
        ////self.controller.walk.disable();

        self.controller.walk = new FOUR.WalkController(self.camera, self.domElement);
        self.controller.walk.disable();

        // orbit controller
        //self.controller.orbit = new THREE.OrbitControls(self.camera, self.domElement);
        //self.controller.orbit.dampingFactor = 0.25;
        //self.controller.orbit.enableDamping = true;
        //self.controller.orbit.enablePan = true;
        //self.controller.orbit.enableZoom = true;
        //self.controller.orbit.target.set(0,0,0);
        //self.controller.orbit.disable();

        // keystate controller
        self.controller.keystate = new FOUR.KeyStateControl();
        self.controller.keystate.addEventListener('keydown', self.controller.selection.onKeyDown.bind(self.controller.selection));
        self.controller.keystate.addEventListener('keyup', self.controller.selection.onKeyUp.bind(self.controller.selection));
        self.controller.keystate.addEventListener('keydown', self.controller.walk.onKeyDown.bind(self.controller.selection));
        self.controller.keystate.addEventListener('keyup', self.controller.walk.onKeyUp.bind(self.controller.selection));

        // set the navigation mode
        this.setMode(this.mode);
    };

    Viewport3D.prototype.setupKeyboardBindings = function () {
        var self = this;


        // bounding box
        Mousetrap.bind('b', function () {
            console.log('toggle bounding box visibility');
            self.scene.boundingBox.toggleVisibility();
            self.render();
        });

        // viewport mode
        // TODO modify the cursor depending on the mode
        Mousetrap.bind('q', function () {
            self.setMode(self.MODES.SELECT);
        });
        Mousetrap.bind('w', function () {
            self.setMode(self.MODES.TRACKBALL);
        });
        Mousetrap.bind('e', function () {
            self.setMode(self.MODES.WALK);
        });
        Mousetrap.bind('r', function () {
            self.setMode(self.MODES.ORBIT);
        });

        // view controls
        Mousetrap.bind('f', function () {
            var bbox = self.getViewBoundingBox();
            self.camera.zoomToFit(bbox).then(function () {});
        });

        Mousetrap.bind('5', function () {
            var bbox = self.getViewBoundingBox();
            self.camera.setView(self.camera.VIEWS.TOP, bbox);
        });
        Mousetrap.bind('6', function () {
            var bbox = self.getViewBoundingBox();
            self.camera.setView(self.camera.VIEWS.FRONT, bbox);
        });
        Mousetrap.bind('7', function () {
            var bbox = self.getViewBoundingBox();
            self.camera.setView(self.camera.VIEWS.LEFT,bbox);
        });
        Mousetrap.bind('8', function () {
            var bbox = self.getViewBoundingBox();
            self.camera.setView(self.camera.VIEWS.RIGHT, bbox);
        });
        Mousetrap.bind('9', function () {
            var bbox = self.getViewBoundingBox();
            self.camera.setView(self.camera.VIEWS.BACK, bbox);
        });
        Mousetrap.bind('0', function () {
            var bbox = self.getViewBoundingBox();
            self.camera.setView(self.camera.VIEWS.PERSPECTIVE, bbox);
        });

        // walk controls
        Mousetrap.bind('g', function () {
            self.generateWalkPath();
        });
        Mousetrap.bind(',', function () {
            self.walkToPreviousPoint();
        });
        Mousetrap.bind('.', function () {
            self.walkToNextPoint();
        });
        Mousetrap.bind('/', function () {
            console.log('switch object focus');
            self.moveToNextWaypointFeature();
        });

        // camera controls
        Mousetrap.bind('t', function () {
            console.log('toggle camera target visibility');
            if (self.camera.target.visible) {
                self.camera.hideTarget();
            } else {
                self.camera.showTarget();
            }
        });
        Mousetrap.bind('y', function () {
            console.log('toggle camera frustrum visibility');
            if (self.camera.frustrum.visible) {
                self.camera.hideFrustrum();
            } else {
                self.camera.showFrustrum();
            }
        });
        Mousetrap.bind('=', function () {
            self.camera.zoomIn();
        });

        Mousetrap.bind('-', function () {
            self.camera.zoomOut();
        });

    };

    Viewport3D.prototype.startContinuousRendering = function () {
        this.continuous = true;
    };

    Viewport3D.prototype.stopContinuousRendering = function () {
        this.continuous = false;
    };

    return Viewport3D;

}());
