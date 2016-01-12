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
            BEST: 5
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
     */
    Overlay.prototype.add = function (config) {
        // generate a random ID
        var id = 'overlay-' + Date.now();
        var element = document.createElement('div');
        element.className = element.className + ' ' + 'label';
        element.id = id;
        element.html = 'just a test';
        this.domElement.appendChild(element);
        this.elements[id] = element;
        this.update();
    };

    Overlay.prototype.disable = function () {
        var self = this;
        self.enabled = false;
        Object.keys(self.listeners).forEach(function (key) {
            var listener = self.listeners[key];
            listener.element.removeEventListener(listener.event, listener.fn);
        });
    };

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
        delete this.elements[id];
        this.update();
    };

    Overlay.prototype.update = function () {};

    return Overlay;

}());
