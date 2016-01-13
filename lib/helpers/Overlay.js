FOUR.Overlay = (function () {

    /**
     * Scene overlay manager. Handles creation and positioning of scene overlay
     * labels.
     */
    function Overlay (config) {
        THREE.EventDispatcher.call(this);

        var self = this;

        // overlay positioning strategy
        self.POSITION = {
            CENTER: 0,
            TOP: 1,
            BOTTOM: 2,
            LEFT: 3,
            RIGHT: 4,
            FIXED: 6
        };

        self.domElement = config.domElement || config.viewport.domElement;
        self.elements = {};
        self.enabled = false;
        self.listeners = {};
        self.viewport = config.viewport;

        Object.keys(config).forEach(function (key) {
            self[key] = config[key];
        });
    }

    Overlay.prototype = Object.create(THREE.EventDispatcher.prototype);

    /**
     * Add overlay element.
     * @param {Object} config Configuration
     *
     * {
     *   position: self.POSITION.CENTER,
     *   innerHTML: '<h1>Title</h1><p>Content</p>',
     *   target: [scene entity UUID],
     *   index: [scene entity index if tracking a point]
     * }
     *
     */
    Overlay.prototype.add = function (config) {
        // generate a random ID
        config.id = 'overlay-' + Date.now();
        config.element = document.createElement('div');
        config.element.className = config.className || 'label';
        config.element.id = config.id;
        config.element.innerHTML = config.innerHTML;

        this.domElement.appendChild(config.element);
        this.elements[config.id] = config;
        this.update();
        return config;
    };

    /**
     * Remove all overlay elements.
     */
    Overlay.prototype.clear = function () {
        var self = this;
        Object.keys(this.elements).forEach(function (id) {
            self.remove(id);
        });
    };

    /**
     * Disable the controller.
     */
    Overlay.prototype.disable = function () {
        var self = this;
        self.enabled = false;
        Object.keys(self.listeners).forEach(function (key) {
            var listener = self.listeners[key];
            listener.element.removeEventListener(listener.event, listener.fn);
        });
    };

    /**
     * Enable the controller.
     */
    Overlay.prototype.enable = function () {
        var self = this;
        self.enabled = true;
    };

    Overlay.prototype.onMouseMove = function (event) {};

    Overlay.prototype.onMouseOver = function (event) {};

    Overlay.prototype.onMouseUp = function (event) {};

    /**
     * Remove overlay element.
     * @param {String} id Identifier
     */
    Overlay.prototype.remove = function (id) {
        var el = document.getElementById(id);
        this.domElement.removeChild(el);
        delete this.elements[id];
    };

    /**
     * Update the position of overlay elements.
     */
    Overlay.prototype.update = function () {
        var el, obj, pos, screen, self = this;
        var camera = this.viewport.getCamera();
        var scene = this.viewport.getScene();
        var width = this.viewport.domElement.clientWidth;
        var height = this.viewport.domElement.clientHeight;

        Object.keys(this.elements).forEach(function (key) {
            el = self.elements[key];
            if (el.position !== self.POSITION.FIXED) {
                obj = scene.getObjectByProperty('uuid', el.target);
                if (el.index) {} // point elements
                pos = new THREE.Vector3().copy(obj.position);
                screen = FOUR.utils.getObjectScreenCoordinates(obj, camera, width, height);
                el.element.style.left = screen.x + 'px';
                el.element.style.top = screen.y + 'px';
            } else {
                el.element.style.left = el.left + 'px';
                el.element.style.top = el.top + 'px';
            }
        });
    };

    return Overlay;

}());
