FOUR.HoverSelectionController = (function () {

    /**
     * Hover based selection controller. The controller emits the following
     * selection events:
     *
     * hover - mouse over an object
     *
     * @param {Object} config Configuration
     * @constructor
     */
    function HoverSelectionController(config) {
        THREE.EventDispatcher.call(this);
        config = config || {};
        var self = this;

        // the maximum number of pixels that the mouse can move before we interpret
        // the mouse event as not being a click action
        self.EPS = 2;
        self.HOVER_TIMEOUT = 1000;
        self.MOUSE_STATE = {DOWN: 0, UP: 1};

        self.domElement = config.viewport.domElement;
        self.filter = null;
        self.filters = {
            DEFAULT: function () {
                return true;
            }
        };
        self.intersects = [];
        self.listeners = {};
        self.mouse = {
            end: new THREE.Vector2(),
            start: new THREE.Vector2(),
            state: self.MOUSE_STATE.UP
        };
        self.raycaster = new THREE.Raycaster();
        self.timeout = null;
        self.viewport = config.viewport;

        self.filter = self.filters.DEFAULT;
    }

    HoverSelectionController.prototype = Object.create(THREE.EventDispatcher.prototype);

    /**
     * Remove the current selection filter.
     */
    HoverSelectionController.prototype.clearFilter = function () {
        this.filter = function () {
            return true;
        };
    };

    /**
     * Disable controller.
     */
    HoverSelectionController.prototype.disable = function () {
        var self = this;
        Object.keys(self.listeners).forEach(function (key) {
            var listener = self.listeners[key];
            listener.element.removeEventListener(listener.event, listener.fn);
            delete self.listeners[key];
        });
    };

    /**
     * Enable controller.
     */
    HoverSelectionController.prototype.enable = function () {
        var self = this;
        self.disable();
        function addListener(element, event, fn) {
            if (!self.listeners[event]) {
                self.listeners[event] = {
                    element: element,
                    event: event,
                    fn: fn.bind(self)
                };
                element.addEventListener(event, self.listeners[event].fn, false);
            }
        }

        addListener(self.viewport.domElement, 'mousemove', self.onMouseMove);
    };

    /**
     * Get the selected scene object.
     * @returns {THREE.Object3D|null} Selected scene object
     */
    HoverSelectionController.prototype.getSelected = function () {
        // update the picking ray with the camera and mouse position
        this.raycaster.setFromCamera(this.mouse.end, this.viewport.camera);
        // calculate objects intersecting the picking ray
        this.intersects = this.raycaster.intersectObjects(this.viewport.scene.model.children, true); // TODO this is FOUR specific use of children
        if (this.intersects && this.intersects.length > 0) {
            // filter the intersect list
            this.intersects = this.intersects.filter(this.filter);
            return this.intersects.length > 0 ? this.intersects[0] : null;
        } else {
            return null;
        }
    };

    /**
     * Handle hover event.
     */
    HoverSelectionController.prototype.onHover = function () {
        this.dispatchEvent({type: 'hover', selection: this.getSelected()});
    };

    /**
     * Handle mouse move event.
     * @param {Object} event Event
     */
    HoverSelectionController.prototype.onMouseMove = function (event) {
        // calculate mouse position in normalized device coordinates (-1 to +1)
        this.mouse.end.x = (event.offsetX / this.domElement.clientWidth) * 2 - 1;
        this.mouse.end.y = -(event.offsetY / this.domElement.clientHeight) * 2 + 1;
        // handle hover event
        if (this.timeout !== null) {
            clearTimeout(this.timeout);
            this.timeout = null;
        }
        this.timeout = setTimeout(this.onHover.bind(this), this.HOVER_TIMEOUT);
    };

    /**
     * Set the current filter.
     * @param {String} key Filter ID
     */
    HoverSelectionController.prototype.setFilter = function (key) {
        // TODO implement filtering
        this.filter = this.filters[key];
    };

    HoverSelectionController.prototype.update = function () {
    }; // do nothing

    return HoverSelectionController;

}());
