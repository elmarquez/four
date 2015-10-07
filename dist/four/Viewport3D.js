'use strict';

var FOUR = FOUR || {};

/**
 * Renders the view from a scene camera to a canvas element in the DOM.
 */
FOUR.Viewport3D = (function () {

    /**
     * Viewport3D constructor.
     * @param {Element} domElement DOM element
     * @param {THREE.Scene|FOUR.Scene} scene Scene
     * @param {THREE.Camera} camera Camera
     * @constructor
     */
    function Viewport3D(domElement, scene, camera) {
        THREE.EventDispatcher.call(this);
        this.backgroundColor = new THREE.Color(0x000, 1.0);
        this.camera = camera;
        this.clock = new THREE.Clock();
        this.controller = null; // the active controller
        this.controllers = {};
        this.domElement = domElement;
        this.renderer = null;
        this.scene = scene || new THREE.Scene();
    }

    Viewport3D.prototype = Object.create(THREE.EventDispatcher.prototype);

    Viewport3D.prototype.constructor = Viewport3D;

    /**
     * Add controller to viewport.
     * @param {FOUR.Controller} controller Controller
     * @param {String} name Name
     */
    Viewport3D.prototype.addController = function (controller, name) {
        this.controllers[name] = controller;
    };

    /**
     * Get the viewport camera.
     * @returns {THREE.Camera}
     */
    Viewport3D.prototype.getCamera = function () {
        return this.camera;
    };

    /**
     * Get the viewport scene.
     * @returns {THREE.Scene|FOUR.Scene}
     */
    Viewport3D.prototype.getScene = function () {
        return this.scene;
    };

    /**
     * Handle window resize event.
     */
    Viewport3D.prototype.handleResize = function () {
        var self = this;
        var height = self.domElement.clientHeight;
        var width = self.domElement.clientWidth;
        self.camera.aspect = width / height;
        self.camera.updateProjectionMatrix();
        self.renderer.setSize(width, height);
        self.render();
    };

    /**
     * Initialize the viewport.
     */
    Viewport3D.prototype.init = function () {
        var self = this;
        // renderer
        self.renderer = new THREE.WebGLRenderer({antialias: true});
        self.renderer.setClearColor(self.backgroundColor);
        self.renderer.setSize(self.domElement.clientWidth, self.domElement.clientHeight);
        self.renderer.shadowMap.enabled = true;
        self.domElement.appendChild(self.renderer.domElement);
        // listen for events
        window.addEventListener('resize', self.handleResize.bind(self), false);
        self.scene.addEventListener('update', self.render.bind(self), false);
        // draw the first frame
        self.render();
        // start updating controllers
        self.update();
    };

    /**
     * Render the viewport once.
     */
    Viewport3D.prototype.render = function () {
        var self = this;
        self.renderer.render(self.scene, self.camera);
    };

    /**
     * Set viewport background color.
     * @param {THREE.Color} color Color
     */
    Viewport3D.prototype.setBackgroundColor = function (color) {
        var self = this;
        self.background = color;
        self.renderer.setClearColor(self.backgroundColor);
        self.render();
    };

    /**
     * Set the viewport camera.
     * @param {String} name Camera name
     */
    Viewport3D.prototype.setCamera = function (name) {
        var found = false, i, obj, self = this;
        if (typeof self.scene === FOUR.Scene3D) {
            self.camera = self.scene.getCamera(name);
        } else {
            for (i = 0;i < self.scene.children && !found; i++) {
                obj = self.scene.children[i];
                if (typeof obj === THREE.Camera) {
                    if (obj.name === name) {
                        self.camera = obj;
                        found = true;
                    }
                }
            }
            if (!found) {
                console.error('Camera "' + name + '" not found');
            }
        }
        self.render();
    };

    /**
     * Set the active viewport controller.
     * @param {String} mode Controller key
     */
    Viewport3D.prototype.setMode = function (mode) {
        var self = this;
        self.controller[self.mode].disable();
        self.mode = mode;
        self.controller[self.mode].enable();
    };

    /**
     * Update the controller and global tween state.
     */
    Viewport3D.prototype.update = function () {
        var self = this;
        // enqueue next update
        requestAnimationFrame(self.update.bind(self));
        // update tween state
        TWEEN.update();
        // update the current controller if it has an update() function
        if (self.controller) {
            var delta = self.clock.getDelta();
            self.controller[self.mode].update(delta);
        }
    };

    return Viewport3D;

}());
