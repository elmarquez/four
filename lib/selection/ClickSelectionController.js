FOUR.ClickSelectionController = (function () {

    /**
     * Mouse based selection controller. The controller emits the following
     * selection events:
     *
     * add    - add one or more objects to the selection set
     * clear  - clear the selection set
     * remove - remove one or more objects from the selection set
     * select - select only the identified items
     * toggle - toggle the selection state for one or more objects
     *
     * The controller emits the following camera related events:
     *
     * lookat    - look at the specified point
     * settarget - move the camera target to the specified point
     *
     * @param {Object} config Configuration
     * @constructor
     */
    function ClickSelectionController(config) {
        THREE.EventDispatcher.call(this);
        config = config || {};
        var self = this;

        // single clicking can be interpreted in one of two ways: as indicating that
        // the clicked entity and only that entity should be selected, or as
        // indicating that we should toggle the selection state of the clicked object.
        self.SINGLE_CLICK_ACTION = {
            SELECT: 0,
            TOGGLE: 1
        };

        // the maximum number of pixels that the mouse can move before we interpret
        // the mouse event as not being a click action
        self.EPS = 2;
        self.MOUSE_STATE = {DOWN: 0, UP: 1};

        self.click = self.SINGLE_CLICK_ACTION.SELECT;
        self.domElement = config.viewport.domElement;
        self.filter = null;
        self.filters = {
            DEFAULT: function () {
                return true;
            }
        };
        self.intersects = [];
        self.listeners = {};
        self.modifiers = {};
        self.mouse = {
            end: new THREE.Vector2(),
            start: new THREE.Vector2(),
            state: self.MOUSE_STATE.UP
        };
        self.raycaster = new THREE.Raycaster();
        self.timeout = null;
        self.viewport = config.viewport;

        self.filter = self.filters.DEFAULT;
        self.modifiers[FOUR.KEY.ALT] = false;
        self.modifiers[FOUR.KEY.SHIFT] = false;
    }

    ClickSelectionController.prototype = Object.create(THREE.EventDispatcher.prototype);

    /**
     * Remove the current selection filter.
     */
    ClickSelectionController.prototype.clearFilter = function () {
        this.filter = function () {
            return true;
        };
    };

    ClickSelectionController.prototype.contextMenu = function (event) {
        event.preventDefault();
    };

    ClickSelectionController.prototype.disable = function () {
        var self = this;
        Object.keys(self.listeners).forEach(function (key) {
            var listener = self.listeners[key];
            listener.element.removeEventListener(listener.event, listener.fn);
            delete self.listeners[key];
        });
    };

    ClickSelectionController.prototype.enable = function () {
        var self = this;
        // clear all listeners to ensure that we can never add multiple listeners
        // for the same events
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

        addListener(self.viewport.domElement, 'contextmenu', self.onContextMenu);
        addListener(self.viewport.domElement, 'mousedown', self.onMouseDown);
        addListener(self.viewport.domElement, 'mousemove', self.onMouseMove);
        addListener(self.viewport.domElement, 'mouseup', self.onMouseUp);
        addListener(window, 'keydown', self.onKeyDown);
        addListener(window, 'keyup', self.onKeyUp);
    };

    /**
     * Get the selected scene object.
     * @returns {THREE.Object3D|null} Selected scene object
     */
    ClickSelectionController.prototype.getSelected = function () {
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

    ClickSelectionController.prototype.onContextMenu = function () {
    };

    ClickSelectionController.prototype.onDoubleClick = function () {
        var selected = this.getSelected();
        if (selected) {
            // CTRL double click rotates the camera toward the selected point
            if (this.modifiers[FOUR.KEY.CTRL]) {
                this.dispatchEvent({type: 'lookat', position: selected.point, object: selected.object});
            }
            // double click navigates the camera to the selected point
            else {
                this.dispatchEvent({type: 'settarget', position: selected.point, object: selected.object});
            }
        }
    };

    ClickSelectionController.prototype.onKeyDown = function (event) {
        if (event.keyCode === FOUR.KEY.ALT || event.keyCode === FOUR.KEY.CTRL || event.keyCode === FOUR.KEY.SHIFT) {
            this.modifiers[event.keyCode] = true;
        }
    };

    ClickSelectionController.prototype.onKeyUp = function (event) {
        if (event.keyCode === FOUR.KEY.ALT || event.keyCode === FOUR.KEY.CTRL || event.keyCode === FOUR.KEY.SHIFT) {
            this.modifiers[event.keyCode] = false;
        }
    };

    ClickSelectionController.prototype.onMouseDown = function (event) {
        event.preventDefault();
        if (event.button === THREE.MOUSE.LEFT) {
            this.mouse.state = this.MOUSE_STATE.DOWN;
            // TODO store both screen and ndc coordinates
            // calculate mouse position in normalized device coordinates (-1 to +1)
            this.mouse.start.x = (event.offsetX / this.domElement.clientWidth) * 2 - 1;
            this.mouse.start.y = -(event.offsetY / this.domElement.clientHeight) * 2 + 1;
            this.mouse.end.copy(this.mouse.start);
        }
    };

    ClickSelectionController.prototype.onMouseMove = function (event) {
        // calculate mouse position in normalized device coordinates (-1 to +1)
        this.mouse.end.x = (event.offsetX / this.domElement.clientWidth) * 2 - 1;
        this.mouse.end.y = -(event.offsetY / this.domElement.clientHeight) * 2 + 1;
    };

    ClickSelectionController.prototype.onMouseUp = function (event) {
        var self = this;
        if (event.button === THREE.MOUSE.LEFT && self.mouse.state === this.MOUSE_STATE.DOWN) {
            if (self.timeout !== null) {
                // handle double click event
                clearTimeout(self.timeout);
                self.timeout = null;
                self.onDoubleClick();
            } else {
                // handle single click event
                self.timeout = setTimeout(function () {
                    clearTimeout(self.timeout);
                    self.timeout = null;
                    self.onSingleClick();
                }, FOUR.SINGLE_CLICK_TIMEOUT);
            }
            self.mouse.state = self.MOUSE_STATE.UP;
            event.preventDefault();
        }
    };

    ClickSelectionController.prototype.onSingleClick = function () {
        var selection = this.getSelected();
        if (selection) {
            // TODO we need to check for exclusive SHIFT, ALT, etc. keydown
            if (this.modifiers[FOUR.KEY.SHIFT] === true) {
                this.dispatchEvent({type: 'add', selection: selection});
            } else if (this.modifiers[FOUR.KEY.ALT] === true) {
                this.dispatchEvent({type: 'remove', selection: selection});
            } else if (this.click === this.SINGLE_CLICK_ACTION.SELECT) {
                this.dispatchEvent({type: 'select', selection: selection});
            } else if (this.click === this.SINGLE_CLICK_ACTION.TOGGLE) {
                this.dispatchEvent({type: 'toggle', selection: selection});
            }
        } else {
            this.dispatchEvent({type: 'clear'});
        }
    };

    /**
     * Set the current filter.
     * @param {String} key Filter ID
     */
    ClickSelectionController.prototype.setFilter = function (key) {
        this.filter = this.filters[key];
    };

    ClickSelectionController.prototype.update = function () {
    }; // do nothing

    return ClickSelectionController;

}());
