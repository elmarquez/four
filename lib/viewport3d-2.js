function Viewport3D (elementId) {

    var me = this;
    me.MODES = {
        SELECTION: 0,
        TURNTABLE: 1,
        TRACKBALL: 2,
        TWEEN: 3,
        WALK: 4
    };
    me.backgroundColor = new THREE.Color(0x000, 1.0);
    me.camera = null;
    me.clock = new THREE.Clock();
    me.container = null;
    me.elementId = elementId;
    me.mode = me.MODES.SELECTION;
    me.projector = new THREE.Projector();
    me.scene = new THREE.Scene();
    me.selection = [];
    me.webGLRenderer = null;

    this.animate = function () {
        var me = this;
        requestAnimationFrame(function () { return me.animate; });
        me.update();
        me.render();
    };

    this.createMouseDownHandler = function (inst) {
        var me = inst;
        return function () {
            var event = arguments[0];
            //event.preventDefault();
            //var vector = new THREE.Vector3(
            //    (event.clientX / window.innerWidth ) * 2 - 1,
            //    -( event.clientY / window.innerHeight ) * 2 + 1,
            //    0.5);
            //projector.vector.unproject(vector, camera);
            //var raycaster = new THREE.Raycaster(camera.position, vector.sub(camera.position).normalize());
            //var intersects = raycaster.intersectObjects([]);
            //if (intersects.length > 0) {
            //    intersects[ 0 ].object.material.transparent = true;
            //    intersects[ 0 ].object.material.opacity = 0.1;
            //}
        };
    };

    this.getBoundingBox = function () {
        console.log('get bounding box');
    };

    this.init = function () {
        var me = this;
        // renderer
        me.webGLRenderer = new THREE.WebGLRenderer({antialias: true});
        webGLRenderer.setClearColor(backgroundColor);
        webGLRenderer.setSize(window.innerWidth, window.innerHeight);
        webGLRenderer.shadowMapEnabled = true;

        // add the output of the renderer to the html element
        container = document.getElementById(elementId);
        container.appendChild(webGLRenderer.domElement);

        this.setupCamera();
        this.setupGeometry();
        this.setupKeyboardBindings();
        this.setupLights();
        this.setupMouseEvents();
        this.setupNavigation();
    };

    this.onMouseDown = function (evt) {
        // place holder handler that should be replaced
    };

    this.render = function () {
        webGLRenderer.render(scene, camera);
    };

    this.setNavigationStrategy = function (strategy) {
        function turntable () {
            var timer = Date.now() * 0.0001;
            camera.lookAt(scene.position);
            camera.position.x = Math.cos( timer ) * 200;
            camera.position.y = Math.sin( timer ) * 200;
            render();
        }
    };

    this.setupCamera = function () {
        var me = this;
        // position and point the camera to the center of the scene
        me.camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
        me.camera.position.x = 100;
        me.camera.position.y = 50;
        me.camera.position.z = 50;
        me.camera.up = new THREE.Vector3(0, 0, 1);
        me.camera.lookAt(new THREE.Vector3(0, 0, 0));

//        var cameraHelper = cameraHelper = new THREE.CameraHelper(camera);
//        scene.add(cameraHelper);
    };

    this.setupGeometry = function () {
        // make some random geometry
        var count = 20, cube, geometry, material;
        for (var i=0; i<count;i++) {
            var height = Math.random() * 10;
            geometry = new THREE.BoxGeometry(5, 5, height);
            material = new THREE.MeshPhongMaterial({color: 0x00ff00});
            cube = new THREE.Mesh(geometry, material);
            cube.position.setX(i * Math.random() * 5);
            cube.position.setY(i * Math.random() * 5);
            cube.position.setZ(height / 2);
            scene.add(cube);
        }

        // ground plane
        geometry = new THREE.PlaneGeometry(100, 100);
        material = new THREE.MeshPhongMaterial({color: 0x880000});
        var plane = new THREE.Mesh(geometry, material);
        // plane.rotateOnAxis(new THREE.Vector3(0,0,0), Math.PI / 2);
        scene.add(plane);

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
        scene.add(line);
    };

    this.setupKeyboardBindings = function () {
        var me = this;
        Mousetrap.bind('5', function () { me.setViewToTop(me); });
        Mousetrap.bind('6', function () { console.log('front view'); });
        Mousetrap.bind('7', function () { console.log('left view'); });
        Mousetrap.bind('8', function () { console.log('right view'); });
        Mousetrap.bind('9', function () { console.log('back view'); });
    };

    this.setupLights = function () {
        var ambientLight = new THREE.AmbientLight(0x383838);
        scene.add(ambientLight);

        // add spotlight for the shadows
        var spotLight = new THREE.SpotLight(0xffffff);
        spotLight.position.set(100, 140, 130);
        spotLight.intensity = 2;
        scene.add(spotLight);
    };

    this.setupMouseEvents = function () {
        this.onMouseDown = this.createMouseDownHandler();
        container.addEventListener('mousedown', this.onMouseDown);
    };

    this.setupNavigation = function () {
        mode = MODES.SELECTION;
    };

    this.setViewToTop = function (scope) {
        var me = scope || this;
        console.log('set top view');
//            var dx = camera.position.x + (Math.random() * 5);
//            var dy = camera.position.y + (Math.random() * 5);
//            var dz = camera.position.z + (Math.random() * 5);
//            camera.position.set(dx, dy, dz);
        me.camera.rotation.x = - Math.PI / 2;
        me.camera.rotation.y = 0;
        me.camera.rotation.z = 0;
        me.camera.rotationAutoUpdate = false;
        me.animate();
    };

    this.update = function () {
        console.log('update scene');
    };

    this.zoomFitAll = function () {
        console.log('zoom fit all');
    };

    this.zoomFitObject = function () {
        console.log('zoom fit object');
    };

    this.zoomFitSelection = function () {
        console.log('zoom fit selection');
    };

};
