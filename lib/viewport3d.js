
function Viewport3D (elementId) {
    this.COLORS = {
        SELECTED: 0xffa500
    };
    this.ENTITIES = {
        GROUND: 'ground',
        POINT: 'point',
        POLE: 'pole'
    };
    this.MODES = {
        SELECT: 0,
        ORBIT: 1,
        WALK: 2,
        VISIT: 3
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

    this.backgroundColor = new THREE.Color(0x000, 1.0);
    this.boundingBox = new BoundingBox('scene-bounding-box');
    this.camera = null;
    this.clock = new THREE.Clock();
    this.element = null;
    this.elementId = elementId;
    this.mode = this.MODES.SELECT;
    this.modifiers = {
        'ALT': false,
        'CTRL': false,
        'SHIFT': false
    };
    this.mouse = new THREE.Vector2();
    this.projector = new THREE.Projector();
    this.raycaster = new THREE.Raycaster();
    this.scene = new THREE.Scene();
    this.selection = new SelectionSet({scene: this.scene});
}

Viewport3D.prototype.init = function () {
    var self = this;
    // renderer
    self.webGLRenderer = new THREE.WebGLRenderer({antialias: true});
    self.webGLRenderer.setClearColor(self.backgroundColor);
    self.webGLRenderer.setSize(window.innerWidth, window.innerHeight);
    self.webGLRenderer.shadowMapEnabled = true;
    // add the output of the renderer to the html element
    self.element = document.getElementById(self.elementId);
    self.element.appendChild(self.webGLRenderer.domElement);
    // setup interactions
    self.setupKeyboardBindings();
    self.setupNavigation();
    self.setupSelection();
    // setup scene
    self.setupCamera();
    self.setupGeometry();
    self.setupLights();
    // when the selection set changes, update the bounding box
    self.scene.add(self.boundingBox.getSceneObject());
    self.selection.addListener('update', function () {
        self.boundingBox.update(self.selection.getObjects());
    });
};

Viewport3D.prototype.render = function () {
    var me = this;
    // update scene state
    TWEEN.update();
    var delta = me.clock.getDelta();
    if (me.controller && me.controller.hasOwnProperty('update')) {
        me.controller.update(delta);
    }
    // render the frame
    me.webGLRenderer.render(me.scene, me.camera);
    // enque next update
    requestAnimationFrame(me.render.bind(me));
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
    var me = this;
    me.mode = mode;
    // remove the existing controller
    if (me.controller && me.controller.hasOwnProperty('enabled')) {
        me.controller.enabled = false;
    }
    // add the new controller
    if (me.mode === me.MODES.SELECT) {
        console.log('selection mode');
        // DISABLE any listeners than may interfere with selection
    } else if (me.mode === me.MODES.ORBIT) {
        console.log('orbit mode');
        // consider adding a turntable feature to the orbit controller
    } else if (me.mode === me.MODES.WALK) {
        console.log('walk mode');
        var height = 2;
        me.tweenCameraToPosition(
            me.camera.position.x, me.camera.position.y, height,
            0, 0, height)
            .then(function () {
                me.controller = new THREE.FirstPersonControls(me.camera, me.domElement);
                me.controller.constrainVertical = true;
                me.controller.lookSpeed = 0.4;
                me.controller.lookVertical = true;
                me.controller.movementSpeed = 20;
                me.controller.noFly = true;
                //me.controller.verticalMax = 2.0;
                //me.controller.verticalMin = 1.0;
                me.controller.lon = -150;
                me.controller.lat = 120;
                me.controller.phi = 0;
                me.controller.theta = 1;
            });
    } else if (me.mode === me.MODES.VISIT) {
        console.log('visit mode');
        // create a feature visit plan
        // if there are any selected entities, then visit only those entities otherwise visit all entities
    }
};

Viewport3D.prototype.setupCamera = function () {
    var me = this;
    // position and point the camera to the center of the scene
    me.camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
    me.camera.position.x = 100;
    me.camera.position.y = 50;
    me.camera.position.z = 50;
    me.camera.up = new THREE.Vector3(0, 0, 1);
    me.camera.lookAt(new THREE.Vector3(0, 0, 0));
    // me.cameraHelper = new THREE.CameraHelper(me.camera);
    // me.scene.add(me.cameraHelper);
};

Viewport3D.prototype.setupGeometry = function () {
    var me = this;
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
    //    me.scene.add(obj);
    //}

    geometry = new THREE.CylinderGeometry(0.5, 0.5, 15, 20, 4);
    material = new THREE.MeshPhongMaterial({color: 0x00ff00});
    obj = new THREE.Mesh(geometry, material);
    obj.rotateOnAxis(new THREE.Vector3(1,0,0), Math.PI / 2);
    obj.position.setX(0);
    obj.position.setY(0);
    obj.position.setZ(7.5);
    obj.userData.type = 'pole';
    me.scene.add(obj);

    geometry = new THREE.CylinderGeometry(0.5, 0.5, 15, 20, 4);
    material = new THREE.MeshPhongMaterial({color: 0x00ff00});
    obj = new THREE.Mesh(geometry, material);
    obj.rotateOnAxis(new THREE.Vector3(1,0,0), Math.PI / 2);
    obj.position.setX(10);
    obj.position.setY(0);
    obj.position.setZ(7.5);
    obj.userData.type = 'pole';
    me.scene.add(obj);

    geometry = new THREE.CylinderGeometry(0.5, 0.5, 15, 20, 4);
    material = new THREE.MeshPhongMaterial({color: 0x00ff00});
    obj = new THREE.Mesh(geometry, material);
    obj.rotateOnAxis(new THREE.Vector3(1,0,0), Math.PI / 2);
    obj.position.setX(10);
    obj.position.setY(20);
    obj.position.setZ(7.5);
    obj.userData.type = 'pole';
    me.scene.add(obj);

    geometry = new THREE.CylinderGeometry(0.5, 0.5, 15, 20, 4);
    material = new THREE.MeshPhongMaterial({color: 0x00ff00});
    obj = new THREE.Mesh(geometry, material);
    obj.rotateOnAxis(new THREE.Vector3(1,0,0), Math.PI / 2);
    obj.position.setX(0);
    obj.position.setY(20);
    obj.position.setZ(7.5);
    obj.userData.type = 'pole';
    me.scene.add(obj);

    // ground plane
    geometry = new THREE.PlaneGeometry(100, 100);
    material = new THREE.MeshPhongMaterial({color: 0x880000});
    var plane = new THREE.Mesh(geometry, material);
    me.scene.add(plane);
    me.ground = plane;

    // line geometry
    material = new THREE.LineBasicMaterial({
        color: 0xffffff
    });
    geometry = new THREE.Geometry();
    geometry.vertices.push(
        new THREE.Vector3( 0, 0, 0 ),
        new THREE.Vector3( 50, 50, 50)
    );
    var line = new THREE.Line(geometry, material);
    me.scene.add(line);
};

Viewport3D.prototype.setupKeyboardBindings = function () {
    var self = this;
    Mousetrap.bind('b', function () { self.boundingBox.toggleVisibility(); });
    Mousetrap.bind('g', function () { self.generateWalkPath(); });

    // TODO modify the cursor depending on the mode
    Mousetrap.bind('alt', function () { self.modifiers[self.MODIFIERS.ALT] = true; }, 'keydown');
    Mousetrap.bind('alt', function () { self.modifiers[self.MODIFIERS.ALT] = false; }, 'keyup');
    Mousetrap.bind('ctrl', function () { self.modifiers[self.MODIFIERS.CTRL] = true; }, 'keydown');
    Mousetrap.bind('ctrl', function () { self.modifiers[self.MODIFIERS.CTRL] = false; }, 'keyup');
    Mousetrap.bind('shift', function () { self.modifiers[self.MODIFIERS.SHIFT] = true; }, 'keydown');
    Mousetrap.bind('shift', function () { self.modifiers[self.MODIFIERS.SHIFT] = false; }, 'keyup');

    Mousetrap.bind('ctrl+a', function () { self.selectAll(); });
    Mousetrap.bind('ctrl+n', function () { self.selectNone(); });

    Mousetrap.bind('q', function () { self.setMode(self.MODES.SELECT); });
    Mousetrap.bind('w', function () { self.setMode(self.MODES.ORBIT); });
    Mousetrap.bind('e', function () { self.setMode(self.MODES.WALK); });
    Mousetrap.bind('r', function () { self.setMode(self.MODES.VISIT); });

    Mousetrap.bind('5', function () { self.setView(self.VIEWS.TOP); });
    Mousetrap.bind('6', function () { self.setView(self.VIEWS.FRONT); });
    Mousetrap.bind('7', function () { self.setView(self.VIEWS.LEFT); });
    Mousetrap.bind('8', function () { self.setView(self.VIEWS.RIGHT); });
    Mousetrap.bind('9', function () { self.setView(self.VIEWS.BACK); });
    Mousetrap.bind('0', function () { self.setView(self.VIEWS.PERSPECTIVE); });
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

Viewport3D.prototype.setupNavigation = function () {
    this.setMode(this.mode);
};

Viewport3D.prototype.setupSelection = function () {
    var self = this;
    function onMouseUp(event) {
        if (self.mode == self.MODES.SELECT) {
            event.preventDefault();
            // calculate mouse position in normalized device coordinates (-1 to +1)
            self.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
            self.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
            // update the picking ray with the camera and mouse position
            self.raycaster.setFromCamera(self.mouse, self.camera);
            // calculate objects intersecting the picking ray
            // TODO filter self.scene.children to prevent selection of a non-geometric objects
            var intersects = self.raycaster.intersectObjects(self.scene.children) || [];
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
    window.addEventListener('mouseup', onMouseUp, false);
};

Viewport3D.prototype.setView = function (view) {
    // TODO fit all entities in the display
    var dist, height, offset = 0, self = this;
    // get the bounding box for the scene or selected entities
    var bbox = self.boundingBox;
    if (self.selection.getObjects().length < 1) {
        bbox = new BoundingBox('temporary');
        bbox.update(self.scene.children);
    }
    var center = bbox.getCenter();
    var cx = center.x;
    var cy = center.y;
    var cz = center.z;
    var tx = center.x;
    var ty = center.y;
    var tz = center.z;
    // reorient the camera relative to the bounding box
    if (view === self.VIEWS.TOP) {
        height = bbox.getYDimension();
        offset += (bbox.getZDimension() / 2);
        dist = height / 2 / Math.tan(Math.PI * self.camera.fov / 360);
        cz = center.z + dist + offset;
    }
    else if (view === self.VIEWS.LEFT) {
        height = bbox.getZDimension();
        offset += (bbox.getYDimension() / 2);
        dist = height / 2 / Math.tan(Math.PI * self.camera.fov / 360);
        cy = center.y - dist - offset;
        //this.tweenCameraToPosition(-100, 0, 0, 0, 0, 0);
    }
    else if (view === self.VIEWS.RIGHT) {
        height = bbox.getZDimension();
        offset += (bbox.getYDimension() / 2);
        dist = height / 2 / Math.tan(Math.PI * self.camera.fov / 360);
        cy = center.y + dist + offset;
        //this.tweenCameraToPosition(100, 0, 0, 0, 0, 0);
    }
    else if (view === self.VIEWS.FRONT) {
        height = bbox.getZDimension();
        offset += (bbox.getXDimension() / 2);
        dist = height / 2 / Math.tan(Math.PI * self.camera.fov / 360);
        cx = center.x + dist + offset;
        //this.tweenCameraToPosition(100, 0, 0, 0, 0, 0);
    }
    else if (view === self.VIEWS.BACK) {
        height = bbox.getZDimension();
        offset += (bbox.getXDimension() / 2);
        dist = height / 2 / Math.tan(Math.PI * self.camera.fov / 360);
        cx = center.x - dist - offset;
        //this.tweenCameraToPosition(0, -100, 0, 0, 0, 0);
    }
    else if (view === self.VIEWS.PERSPECTIVE) {
        cx = 100;
        cy = 50;
        cz = 50;
        tx = center.x;
        ty = center.y;
        tz = center.z;
    }
    this.tweenCameraToPosition(cx, cy, cz, tx, ty, tz);
};

Viewport3D.prototype.tweenCameraToPosition = function (x, y, z, tx, ty, tz) {
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
            self.camera.lookAt(new THREE.Vector3(tx, ty, tz));
            self.camera.position.setX(this.x);
            self.camera.position.setY(this.y);
            self.camera.position.setZ(this.z);
        });
        tween.start();
        self.render();
    });
};

Viewport3D.prototype.zoomFitAll = function () {
    console.log('zoom fit all');
};

Viewport3D.prototype.zoomFitObject = function () {
    console.log('zoom fit object');
};

Viewport3D.prototype.zoomFitSelection = function () {
    console.log('zoom fit selection');
};

Viewport3D.prototype.generateWalkPath = function () {
    var material, geometry, line, me = this, objs = [], paths = [];
    me.scene.traverse(function (child) {
        if (child.userData.type && child.userData.type === 'pole') {
            var obj = {
                uuid: child.uuid,
                x: child.position.x,
                y: child.position.y
            };
            objs.push(obj);
        }
    });
    paths.forEach(function (path) {
        // line geometry
        material = new THREE.LineBasicMaterial({color: 0x0000cc});
        geometry = new THREE.Geometry();
        geometry.vertices.push(
            new THREE.Vector3( 0, 0, 0 ),
            new THREE.Vector3( 50, 50, 50)
        );
        line = new THREE.Line(geometry, material);
        me.scene.add(line);
    });
};
