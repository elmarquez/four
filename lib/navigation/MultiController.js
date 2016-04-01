FOUR.MultiController = (function () {

    /**
     * Multiple interaction controller.
     * @param {Object} config Configuration
     * @constructor
     */
    function MultiController(config) {
        THREE.EventDispatcher.call(this);
        config = config || {};

        var self = this;
        self.controllers = {};
        self.domElement = config.domElement || config.viewport.domElement;
        self.listeners = {};
        self.viewport = config.viewport;
    }

    MultiController.prototype = Object.create(THREE.EventDispatcher.prototype);

    MultiController.prototype.constructor = MultiController;

    MultiController.prototype.addController = function (controller, name) {
        var self = this;

        function addListener(name, ctrl, event, fn) {
            if (!self.listeners[name]) {
                self.listeners[name] = {
                    ctrl: ctrl,
                    event: event,
                    fn: fn.bind(self)
                };
                ctrl.addEventListener(event, self.listeners[name].fn, false);
            }
        }

        this.controllers[name] = controller;
        var events = [
            FOUR.EVENT.CONTINUOUS_UPDATE_END,
            FOUR.EVENT.CONTINUOUS_UPDATE_START,
            FOUR.EVENT.RENDER,
            FOUR.EVENT.UPDATE
        ];
        events.forEach(function (event) {
            addListener(name + '-' + event, controller, event, function () {
                self.dispatchEvent({type: event});
            });
        });
    };

    MultiController.prototype.disable = function () {
        var self = this;
        Object.keys(self.controllers).forEach(function (key) {
            self.controllers[key].disable();
        });
    };

    MultiController.prototype.enable = function () {
        var self = this;
        Object.keys(self.controllers).forEach(function (key) {
            self.controllers[key].enable();
        });
    };

    MultiController.prototype.removeController = function (name) {
        delete this.controllers[name];
    };

    MultiController.prototype.update = function (delta) {
        var self = this;
        Object.keys(self.controllers).forEach(function (key) {
            self.controllers[key].update(delta);
        });
    };

    return MultiController;

}());
