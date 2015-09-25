function Viewport3D(elementId) {
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
    this.VIEWS = {
        TOP: 0,
        LEFT: 1,
        RIGHT: 2,
        FRONT: 3,
        BACK: 4,
        PERSPECTIVE: 5
    };
    this.WALK_HEIGHT = 2;

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
    this.scene = new THREE.Scene();
    this.selection = new SelectionSet({scene: this.scene});
    this.walk = {
        index: 0,
        path: []
    };
}

Viewport3D.prototype.init = function () {
    var self = this;
    // DOM element
    self.domElement = document.getElementById(self.domElementId);
    // renderer
    self.webGLRenderer = new THREE.WebGLRenderer({antialias: true});
    self.webGLRenderer.setClearColor(self.backgroundColor);
    self.webGLRenderer.setSize(self.domElement.clientWidth, self.domElement.clientHeight);
    self.webGLRenderer.shadowMap.enabled = true;
    self.domElement.appendChild(self.webGLRenderer.domElement);
    // setup scene
    self.setupCamera();
    self.setupGeometry();
    self.setupLights();
    // setup interactions
    self.setupControllers();
    self.setupKeyboardBindings();
    self.setupSelection();
    // add scene helpers
    self.scene.add(self.boundingBox.getSceneObject());
    // update the scene bounding box when the selection set changes
    self.selection.addListener('update', function () {
        self.boundingBox.update(self.selection.getObjects());
    });
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

Viewport3D.prototype.selectAll = function () {
    var self = this;
    self.selection.addAll(self.scene.children);
};

Viewport3D.prototype.selectNone = function () {
    var self = this;
    self.selection.removeAll();
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
        self.tweenCameraToPosition(
            self.camera.position.x, self.camera.position.y, self.WALK_HEIGHT,
            0, 0, self.WALK_HEIGHT)
            //0, 0, self.WALK_HEIGHT, self.camera.rotation.x, self.camera.rotation.y, self.camera.rotation.z)
            .then(function () {
                self.controller.walk.enable();
            });
    } else if (self.mode === self.MODES.INSPECT) {
        // center the camera on the bounding box, zoom to fit, then enable the orbit controller
        console.log('INSPECT mode');
    }
};

Viewport3D.prototype.setupCamera = function () {
    var self = this;
    // position and point the camera to the center of the scene
    self.camera = new THREE.PerspectiveCamera(45, self.domElement.clientWidth / self.domElement.clientHeight, 0.1, 1000);
    self.camera.position.x = 100;
    self.camera.position.y = 50;
    self.camera.position.z = 50;
    self.camera.up = new THREE.Vector3(0, 0, 1);
    self.camera.lookAt(new THREE.Vector3(0, 0, 0));
    // self.cameraHelper = new THREE.CameraHelper(self.camera);
    // self.scene.add(self.cameraHelper);
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

    // set the default navigation mode
    this.setMode(this.mode);
};

Viewport3D.prototype.setupGeometry = function () {
    var self = this;
    // make some poles
    var count = 2, obj, geometry, material;
    //for (var i=0; i<count;i++) {
    //    geometry = new THREE.CylinderGeometry(0.5, 0.5, 15, 20, 4);
    //    material = new THREE.MeshPhongMaterial({color: 0x00ff00});
    //    obj = new THREE.Mesh(geometry, material);
    //    obj.rotateOnAxis(new THREE.Vector3(1,0,0), Math.PI / 2);
    //    obj.position.setX(i * Math.random() * 5);
    //    obj.position.setY(i * Math.random() * 5);
    //    obj.position.setZ(7.5);
    //    obj.userData.type = 'pole';
    //    self.scene.add(obj);
    //}

    geometry = new THREE.CylinderGeometry(0.5, 0.5, 15, 20, 4);
    material = new THREE.MeshPhongMaterial({color: 0x00ff00});
    obj = new THREE.Mesh(geometry, material);
    obj.rotateOnAxis(new THREE.Vector3(1, 0, 0), Math.PI / 2);
    obj.position.setX(0);
    obj.position.setY(0);
    obj.position.setZ(7.5);
    obj.userData.type = 'pole';
    self.scene.add(obj);

    geometry = new THREE.CylinderGeometry(0.5, 0.5, 15, 20, 4);
    material = new THREE.MeshPhongMaterial({color: 0x00ff00});
    obj = new THREE.Mesh(geometry, material);
    obj.rotateOnAxis(new THREE.Vector3(1, 0, 0), Math.PI / 2);
    obj.position.setX(10);
    obj.position.setY(0);
    obj.position.setZ(7.5);
    obj.userData.type = 'pole';
    self.scene.add(obj);

    geometry = new THREE.CylinderGeometry(0.5, 0.5, 15, 20, 4);
    material = new THREE.MeshPhongMaterial({color: 0x00ff00});
    obj = new THREE.Mesh(geometry, material);
    obj.rotateOnAxis(new THREE.Vector3(1, 0, 0), Math.PI / 2);
    obj.position.setX(10);
    obj.position.setY(20);
    obj.position.setZ(7.5);
    obj.userData.type = 'pole';
    self.scene.add(obj);

    geometry = new THREE.CylinderGeometry(0.5, 0.5, 15, 20, 4);
    material = new THREE.MeshPhongMaterial({color: 0x00ff00});
    obj = new THREE.Mesh(geometry, material);
    obj.rotateOnAxis(new THREE.Vector3(1, 0, 0), Math.PI / 2);
    obj.position.setX(0);
    obj.position.setY(20);
    obj.position.setZ(7.5);
    obj.userData.type = 'pole';
    self.scene.add(obj);

    // ground plane
    self.ground = new THREE.Object3D();
    self.ground.name = 'ground';
    geometry = new THREE.PlaneGeometry(100, 100);
    material = new THREE.MeshPhongMaterial({color: 0x666666});
    var plane = new THREE.Mesh(geometry, material);
    self.ground.add(plane);
    self.scene.add(self.ground);

    // line geometry
    material = new THREE.LineBasicMaterial({
        color: 0xffffff
    });
    geometry = new THREE.Geometry();
    geometry.vertices.push(
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(50, 50, 50)
    );
    var line = new THREE.Line(geometry, material);
    //self.scene.add(line);
};

Viewport3D.prototype.setupKeyboardBindings = function () {
    var self = this;
    Mousetrap.bind('b', function () {
        self.boundingBox.toggleVisibility();
    });

    // TODO modify the cursor depending on the mode
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

    Mousetrap.bind('ctrl+a', function () {
        self.selectAll();
    });
    Mousetrap.bind('ctrl+n', function () {
        self.selectNone();
    });

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
        self.zoomToFit();
    });

    Mousetrap.bind('5', function () {
        self.setView(self.VIEWS.TOP);
    });
    Mousetrap.bind('6', function () {
        self.setView(self.VIEWS.FRONT);
    });
    Mousetrap.bind('7', function () {
        self.setView(self.VIEWS.LEFT);
    });
    Mousetrap.bind('8', function () {
        self.setView(self.VIEWS.RIGHT);
    });
    Mousetrap.bind('9', function () {
        self.setView(self.VIEWS.BACK);
    });
    Mousetrap.bind('0', function () {
        self.setView(self.VIEWS.PERSPECTIVE);
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
};

Viewport3D.prototype.setupLights = function () {
    var ambientLight = new THREE.AmbientLight(0x383838);
    this.scene.add(ambientLight);

    // add spotlight for the shadows
    var spotLight = new THREE.SpotLight(0xffffff);
    spotLight.position.set(100, 140, 130);
    spotLight.intensity = 2;
    this.scene.add(spotLight);
};

Viewport3D.prototype.setupSelection = function () {
    // TODO move to selection controller
    var self = this;

    function onMouseUp(event) {
        if (self.mode == self.MODES.SELECT) {
            event.preventDefault();
            // calculate mouse position in normalized device coordinates (-1 to +1)
            self.mouse.x = (event.clientX / self.domElement.clientWidth) * 2 - 1;
            self.mouse.y = -(event.clientY / self.domElement.clientHeight) * 2 + 1;
            // update the picking ray with the camera and mouse position
            self.raycaster.setFromCamera(self.mouse, self.camera);
            // calculate objects intersecting the picking ray
            // TODO filter self.scene.children to prevent selection of a non-geometric objects
            var intersects = self.raycaster.intersectObjects(self.scene.children, true) || [];
            // update the selection set using only the nearest selected object
            var objs = intersects && intersects.length > 0 ? [intersects[0].object] : [];
            // add objects
            if (self.modifiers.SHIFT) {
                self.selection.addAll(objs);
            }
            // remove objects
            else if (self.modifiers.ALT) {
                self.selection.removeAll(objs);
            }
            // toggle selection state
            else {
                self.selection.toggle(objs);
            }
        }
    }

    self.domElement.addEventListener('mouseup', onMouseUp, false);
};

Viewport3D.prototype.setView = function (view) {
    var dist, height, offset = 10, self = this;
    // get the bounding box for the scene or selected entities
    var bbox = self.boundingBox;
    if (self.selection.getObjects().length < 1) {
        bbox = new BoundingBox('temporary');
        bbox.update(self.scene.children);
    }
    var center = bbox.getCenter();
    var cx = center.x; // camera position
    var cy = center.y;
    var cz = center.z;
    var tx = center.x; // camera target
    var ty = center.y;
    var tz = center.z;
    var rx = self.camera.rotation.x; // camera rotation in radians
    var ry = self.camera.rotation.y;
    var rz = self.camera.rotation.z;
    // reorient the camera relative to the bounding box
    if (view === self.VIEWS.TOP) { // correct
        height = bbox.getYDimension();
        offset += (bbox.getZDimension() / 2);
        dist = height / 2 / Math.tan(Math.PI * self.camera.fov / 360);
        cz = center.z + dist + offset;
        rx = 0;
        ry = 0;
        rz = Math.PI * 2;
    }
    else if (view === self.VIEWS.FRONT) { // correct
        height = bbox.getZDimension();
        offset += (bbox.getYDimension() / 2);
        dist = height / 2 / Math.tan(Math.PI * self.camera.fov / 360);
        cy = center.y - dist - offset;
        rx = Math.PI / 2;
        ry = 0;
        rz = Math.PI * 2;
    }
    else if (view === self.VIEWS.BACK) { // upside down!
        height = bbox.getZDimension();
        offset += (bbox.getYDimension() / 2);
        dist = height / 2 / Math.tan(Math.PI * self.camera.fov / 360);
        cy = center.y + dist + offset;
        rx = -Math.PI / 2;
        ry = 0;
        rz = Math.PI;
    }
    else if (view === self.VIEWS.RIGHT) { // correct
        height = bbox.getZDimension();
        offset += (bbox.getXDimension() / 2);
        dist = height / 2 / Math.tan(Math.PI * self.camera.fov / 360);
        cx = center.x + dist + offset;
        rx = 0;
        ry = Math.PI / 2;
        rz = Math.PI / 2;
    }
    else if (view === self.VIEWS.LEFT) { // correct
        height = bbox.getZDimension();
        offset += (bbox.getXDimension() / 2);
        dist = height / 2 / Math.tan(Math.PI * self.camera.fov / 360);
        cx = center.x - dist - offset;
        rx = 0;
        ry = -Math.PI / 2;
        rz = -Math.PI / 2;
    }
    else if (view === self.VIEWS.PERSPECTIVE) {
        cx = center.x - 50;
        cy = center.y - 50;
        cz = center.z + 50;
        tx = center.x;
        ty = center.y;
        tz = center.z;
        rx = Math.PI / 8;
        ry = -Math.PI / 4;
        rz = -Math.PI / 4;
    }
    this.tweenCameraToPosition(cx, cy, cz, tx, ty, tz, rx, ry, rz);
};

/**
 * Tween the camera to the specified position.
 * @param {Float} x Camera world X coordinate
 * @param {Float} y Camera world Y coordinate
 * @param {Float} z Camera world Z coordinate
 * @param {Float} tx Camera target X lookAt coordinate
 * @param {Float} ty Camera target Y lookAt coordinate
 * @param {Float} tz Camera target Z lookAt coordinate
 * @param {Float} rx Camera X axis rotation
 * @param {Float} ry Camera Y axis rotation
 * @param {Float} rz Camera Z axis rotation
 * @returns {Promise}
 */
Viewport3D.prototype.tweenCameraToPosition = function (x, y, z, tx, ty, tz, rx, ry, rz) {
    // TODO move to camera controller
    // TODO need better camera path planning ... there is too much rotation happening right now
    var self = this;
    return new Promise(function (resolve) {
        var start = {
            x: self.camera.position.x,
            y: self.camera.position.y,
            z: self.camera.position.z,
            tx: 0, // FIXME get the current camera lookat position
            ty: 0,
            tz: 0,
            rx: self.camera.rotation.x,
            ry: self.camera.rotation.y,
            rz: self.camera.rotation.z
        };
        var finish = {
            x: x, y: y, z: z,
            tx: tx, ty: ty, tz: tz,
            rx: rx, ry: ry, rz: rz
        };
        var tween = new TWEEN.Tween(start).to(finish, 1500);
        tween.easing(TWEEN.Easing.Cubic.InOut);
        tween.onComplete(resolve);
        tween.onUpdate(function () {
            var tweened = this;
            self.camera.position.setX(tweened.x);
            self.camera.position.setY(tweened.y);
            self.camera.position.setZ(tweened.z);
            if (!tweened.rx) {
                self.camera.lookAt(new THREE.Vector3(tweened.tx, tweened.ty, tweened.tz));
            } else {
                self.camera.rotation.set(tweened.rx, tweened.ry, tweened.rz, 'XYZ');
            }
        });
        tween.start();
        self.render();
    });
};

Viewport3D.prototype.zoomInWindow = function () {
    console.log('zoom into window');
};

Viewport3D.prototype.zoomOut = function () {
    console.log('zoom out');
};

Viewport3D.prototype.zoomToFit = function () {
    console.log('zoom to fit all or selected items');
    var diff, dist, next, offset = 5, self = this, target;
    // the bounding box for entities that we will zoom to fit
    var bbox = self.boundingBox;
    if (self.selection.getObjects().length < 1) {
        bbox = new BoundingBox();
        bbox.update(self.scene.children);
    }
    // the offset from the current camera position to the new camera position
    dist = bbox.getRadius() / Math.tan(Math.PI * self.camera.fov / 360);
    target = new THREE.Vector3(0, 0, -(dist + offset)); // 100 is the distance from the camera to the target, measured along the Z axis
    target.applyQuaternion(self.camera.quaternion);
    target.add(self.camera.position);
    diff = new THREE.Vector3().subVectors(bbox.getCenter(), target);
    // the next camera position
    next = new THREE.Vector3().add(self.camera.position, diff);
    // move the camera to the next position
    self.tweenCameraToPosition(next.x, next.y, next.z, bbox.x, bbox.y, bbox.z);
};

Viewport3D.prototype.generateWalkPath = function () {
    var material, geometry, i, line, self = this;
    var ts = new TravellingSalesman(50);
    // Add points to itinerary
    var selected = self.selection.getObjects();
    if (selected.length > 0) {
        selected.forEach(function (obj) {
            ts.addPoint({x: obj.position.x, y: obj.position.y});
        });
    } else {
        self.scene.traverse(function (child) {
            if (child.userData.type && child.userData.type === 'pole') {
                ts.addPoint(child.position.x, child.position.y);
            }
        });
    }
    // Initialize population
    ts.init();
    console.log("Initial distance: " + ts.getPopulation().getFittest().getDistance());
    // Evolve the population
    ts.evolve(100);
    // Print final results
    console.log("Final distance: " + ts.getPopulation().getFittest().getDistance());
    console.log(ts.getPopulation().getFittest());

    self.walk.path = ts.getSolution();
    var lastpoint = self.walk.path[0];
    for (i = 1; i < self.walk.path.length; i++) {
        var point = self.walk.path[i];
        // line geometry
        material = new THREE.LineBasicMaterial({color: 0x0000cc});
        geometry = new THREE.Geometry();
        geometry.vertices.push(
            new THREE.Vector3(lastpoint.x, lastpoint.y, 2),
            new THREE.Vector3(point.x, point.y, 2)
        );
        line = new THREE.Line(geometry, material);
        self.scene.add(line);
        lastpoint = point;
    }
    // select the nearest point and set the walk index to that item
    self.walk.index = 0;
};

Viewport3D.prototype.walkToNextPoint = function () {
    console.log('walk to next point');
    var self = this;
    if (self.walk.index >= self.walk.path.length - 1) {
        self.walk.index = 0;
    } else {
        self.walk.index += 1;
    }
    var point = self.walk.path[self.walk.index];
    var offset = 5;
    // the offset from the current camera position to the new camera position
    var dist = 20 / Math.tan(Math.PI * self.camera.fov / 360);
    var target = new THREE.Vector3(0, 0, -(dist + offset)); // 100 is the distance from the camera to the target, measured along the Z axis
    target.applyQuaternion(self.camera.quaternion);
    target.add(self.camera.position);
    var diff = new THREE.Vector3().subVectors(new THREE.Vector3(point.x, point.y, 2), target);
    // the next camera position
    var next = new THREE.Vector3().add(self.camera.position, diff);
    // move the camera to the next position
    self.tweenCameraToPosition(next.x, next.y, next.z, point.x, point.y, 2);
};

Viewport3D.prototype.walkToPreviousPoint = function () {
    console.log('walk to previous point');
    var self = this;
    if (self.walk.index <= 0) {
        self.walk.index = self.walk.path.length - 1;
    } else {
        self.walk.index -= 1;
    }
    var point = self.walk.path[self.walk.index];
    var offset = 5;
    // the offset from the current camera position to the new camera position
    var dist = 20 / Math.tan(Math.PI * self.camera.fov / 360);
    var target = new THREE.Vector3(0, 0, -(dist + offset)); // 100 is the distance from the camera to the target, measured along the Z axis
    target.applyQuaternion(self.camera.quaternion);
    target.add(self.camera.position);
    var diff = new THREE.Vector3().subVectors(new THREE.Vector3(point.x, point.y, 2), target);
    // the next camera position
    var next = new THREE.Vector3().add(self.camera.position, diff);
    // move the camera to the next position
    self.tweenCameraToPosition(next.x, next.y, next.z, point.x, point.y, 2);
};