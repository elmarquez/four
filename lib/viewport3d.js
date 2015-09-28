/**
 * Renders the view from a scene camera to the DOM, captures mouse and keyboard
 * events then relays them to the appropriate controllers.
 */
var Viewport3D = (function () {

    function Viewport3D(elementId, scene) {
        this.COLORS = {
            SELECTED: 0xffa500
        };
        this.CONTROLLERS = {
            ORBIT: 'orbit',
            SELECT: 'select',
            TRACKBALL: 'trackball',
            WALK: 'walk'
        };
        this.ENTITIES = {
            GROUND: 'ground',
            POINT: 'point',
            POLE: 'pole'
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
        this.boundingBox = new BoundingBox('scene-bounding-box');
        this.camera = null;
        this.clock = new THREE.Clock();
        this.controller = {};
        this.domElement = null;
        this.domElementId = elementId;
        this.mode = this.MODES.SELECT;
        this.modifiers = {
            'ALT': false,
            'CTRL': false,
            'SHIFT': false
        };
        this.mouse = new THREE.Vector2();
        this.raycaster = new THREE.Raycaster();
        this.scene = scene;
        this.selection = new SelectionSet({scene: this.scene});
        this.walk = {
            index: 0,
            path: []
        };
    }

    Viewport3D.prototype = Object.create(THREE.EventDispatcher.prototype);

    Viewport3D.prototype.constructor = Viewport3D;

    Viewport3D.prototype.init = function () {
        var self = this;
        self.domElement = document.getElementById(self.domElementId);
        self.scene = scene || new THREE.Scene();
        // renderer
        self.webGLRenderer = new THREE.WebGLRenderer({antialias: true});
        self.webGLRenderer.setClearColor(self.backgroundColor);
        self.webGLRenderer.setSize(self.domElement.clientWidth, self.domElement.clientHeight);
        self.webGLRenderer.shadowMap.enabled = true;
        self.domElement.appendChild(self.webGLRenderer.domElement);
        // setup interactions
        self.setupKeyboardBindings();
        self.setupControllers();
        self.setupSelection();
        // add scene helpers
        self.scene.add(self.boundingBox.getSceneObject());
        // get the default camera
        self.camera = self.scene.getDefaultCamera();
    };

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
        self.webGLRenderer.render(self.scene, self.camera);
        // enqueue next update
        requestAnimationFrame(self.render.bind(self));
    };

    Viewport3D.prototype.setCamera = function (name) {
        var self = this;
        self.camera = self.scene.getCamera(name);
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
            self.controller.trackball.enable();
        } else if (self.mode === self.MODES.WALK) {
            console.log('walk mode');
            throw new Error('not implemented');
            //self.tweenCameraToPosition(
            //    self.camera.position.x, self.camera.position.y, self.WALK_HEIGHT,
            //    0, 0, self.WALK_HEIGHT)
            //    //0, 0, self.WALK_HEIGHT, self.camera.rotation.x, self.camera.rotation.y, self.camera.rotation.z)
            //    .then(function () {
            //        self.controller.walk.enable();
            //    });
        } else if (self.mode === self.MODES.INSPECT) {
            // center the camera on the bounding box, zoom to fit, then enable the orbit controller
            console.log('INSPECT mode');
        }
    };

    Viewport3D.prototype.setupControllers = function () {
        var self = this;
        // selection controller
        self.controller.selection = new SelectionControl();

        // trackball controller
        self.controller.trackball = new THREE.TrackballControls(self.camera, self.domElement);
        self.controller.trackball.rotateSpeed = 1.0;
        self.controller.trackball.zoomSpeed = 1.2;
        self.controller.trackball.panSpeed = 0.8;
        self.controller.trackball.noZoom = false;
        self.controller.trackball.noPan = false;
        self.controller.trackball.staticMoving = true;
        self.controller.trackball.dynamicDampingFactor = 0.3;
        self.controller.trackball.keys = [65, 83, 68];
        self.controller.trackball.addEventListener('change', self.render.bind(self));
        self.controller.trackball.disable();

        // first person navigation controller
        self.controller.walk = new THREE.FirstPersonControls(self.camera, self.domElement);
        self.controller.walk.constrainVertical = true;
        self.controller.walk.lookSpeed = 0.4;
        self.controller.walk.lookVertical = true;
        self.controller.walk.movementSpeed = 20;
        self.controller.walk.noFly = true;
        self.controller.walk.verticalMax = 2.0;
        self.controller.walk.verticalMin = 1.0;
        self.controller.walk.lon = -150;
        self.controller.walk.lat = 120;
        self.controller.walk.phi = 0;
        self.controller.walk.theta = 1;
        self.controller.walk.disable();

        self.controller.orbit = new THREE.OrbitControls(self.camera, self.domElement);
        self.controller.orbit.dampingFactor = 0.25;
        self.controller.orbit.enableDamping = true;
        self.controller.orbit.enablePan = false;
        self.controller.orbit.enableZoom = true;
        self.controller.orbit.disable();

        // set the navigation mode
        this.setMode(this.mode);
    };

    Viewport3D.prototype.setupKeyboardBindings = function () {
        var self = this;
        Mousetrap.bind('b', function () {
            self.boundingBox.toggleVisibility();
        });

        // TODO modify the cursor depending on the mode
        // TODO set selectioncontroller modifier value too
        Mousetrap.bind('alt', function () {
            self.modifiers[self.MODIFIERS.ALT] = true;
        }, 'keydown');
        Mousetrap.bind('alt', function () {
            self.modifiers[self.MODIFIERS.ALT] = false;
        }, 'keyup');
        Mousetrap.bind('ctrl', function () {
            self.modifiers[self.MODIFIERS.CTRL] = true;
        }, 'keydown');
        Mousetrap.bind('ctrl', function () {
            self.modifiers[self.MODIFIERS.CTRL] = false;
        }, 'keyup');
        Mousetrap.bind('shift', function () {
            self.modifiers[self.MODIFIERS.SHIFT] = true;
        }, 'keydown');
        Mousetrap.bind('shift', function () {
            self.modifiers[self.MODIFIERS.SHIFT] = false;
        }, 'keyup');

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

        Mousetrap.bind('f', function () {
            self.camera.zoomToFit(self.selection);
        });

        Mousetrap.bind('5', function () {
            self.camera.setView(self.camera.VIEWS.TOP);
        });
        Mousetrap.bind('6', function () {
            self.camera.setView(self.camera.VIEWS.FRONT);
        });
        Mousetrap.bind('7', function () {
            self.camera.setView(self.camera.VIEWS.LEFT);
        });
        Mousetrap.bind('8', function () {
            self.camera.setView(self.camera.VIEWS.RIGHT);
        });
        Mousetrap.bind('9', function () {
            self.camera.setView(self.camera.VIEWS.BACK);
        });
        Mousetrap.bind('0', function () {
            self.camera.setView(self.camera.VIEWS.PERSPECTIVE);
        });

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
    };

    Viewport3D.prototype.setupSelection = function () {
        var self = this;
        self.selection = new SelectionControl({viewport: self.viewport});
        // keyboard events
        Mousetrap.bind('ctrl+a', function () { self.selection.selectAll(); });
        Mousetrap.bind('ctrl+n', function () { self.selection.selectNone(); });
        // mouse events
        self.domElement.addEventListener('mousedown', self.selection.onMouseDown.bind(self), false);
        self.domElement.addEventListener('mouseover', self.selection.onMouseOver.bind(self), false);
        self.domElement.addEventListener('mouseup', self.selection.onMouseUp.bind(self), false);
        // update the scene bounding box when the selection set changes
        self.selection.addListener('update', function () {
            self.boundingBox.update(self.selection.getObjects());
        });
    };

    return Viewport3D;

}());
