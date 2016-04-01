FOUR.KeyCommandController = (function () {

    /**
     * Key command controller. The controller allows you to define key command
     * sets that can be activated and deactivated as required. A key command set
     * called the 'default' set is always active.
     * @constructor
     */
    function KeyCommandController(config) {
        config = config || {};

        var self = this;
        self.active = null; // the active command set
        self.enabled = config.enabled || false;
        self.listeners = {};
        self.pressed = {}; // map of keys that are currently in a down state
        self.sets = {
            'default': []
        };

        Object.keys(config).forEach(function (key) {
            self.config[key] = config[key];
        });
    }

    KeyCommandController.prototype = Object.create(THREE.EventDispatcher.prototype);

    KeyCommandController.prototype.constructor = KeyCommandController;

    /**
     * Define key command.
     * @param {String} group Group. Use 'default' for persistent commands.
     * @param {String} key Key
     * @param {String} event Key event
     * @param {Element} el DOM element that will listen for events. Defaults to window
     * @param {Function} fn Function
     */
    KeyCommandController.prototype.bind = function (group, key, event, el, fn) {
        el = el || window;
        var self = this;

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

        if (!this.sets.hasOwnProperty(group)) {
            this.sets[group] = [];
        }
        this.sets[group].push({
            key: key,
            event: event,
            fn: fn
        });
    };

    KeyCommandController.prototype.disable = function () {
        var self = this;
        self.enabled = false;
        Object.keys(self.listeners).forEach(function (key) {
            var listener = self.listeners[key];
            listener.element.removeEventListener(listener.event, listener.fn);
            delete self.listeners[key];
        });
    };

    KeyCommandController.prototype.enable = function () {
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

        addListener(window, 'keydown', self.onKeyDown);
        addListener(window, 'keypress', self.onKeyPress);
        addListener(window, 'keyup', self.onKeyUp);
        self.enabled = true;
    };

    /**
     * Execute active commands.
     * @param {Object} commands Commands
     * @param {Object} event Event name
     */
    KeyCommandController.prototype.execute = function (commands, event) {
        var self = this;
        commands = commands || [];
        commands.forEach(function (command) {
            if (self.isActive(command, event)) {
                command.fn.call();
            }
        });
    };

    /**
     * Determine if the command is active.
     * @param {String} command Command
     * @param {String} event Event
     * @returns {Boolean}
     */
    KeyCommandController.prototype.isActive = function (command, event) {
        var self = this;
        var keys = Array.isArray(command.key) ? command.key : [command.key];
        var match = keys
            .map(function (key) {
                return self.pressed.hasOwnProperty(key) && self.pressed[key] === true;
            })
            .reduce(function (last, current) {
                return last === false ? false : current;
            }, null);
        return match && command.event === event;
    };

    /**
     * Handle key down event.
     * @param {Object} evt Event
     */
    KeyCommandController.prototype.onKeyDown = function (evt) {
        this.pressed[evt.keyCode] = true;
        this.execute(this.sets.default, 'keydown');
        this.execute(this.sets[this.active], 'keydown');
    };

    /**
     * Handle key pressed event.
     * @param {Object} evt Event
     */
    KeyCommandController.prototype.onKeyPress = function (evt) {
        this.pressed[evt.keyCode] = true;
        this.execute(this.sets.default, 'keypress');
        this.execute(this.sets[this.active], 'keypress');
    };

    /**
     * Handle key up event.
     * @param {Object} evt Event
     */
    KeyCommandController.prototype.onKeyUp = function (evt) {
        this.execute(this.sets.default, 'keyup');
        this.execute(this.sets[this.active], 'keyup');
        this.pressed[evt.keyCode] = false;
    };

    /**
     * Register key event callback.
     * @param {String} command Key command
     * @param {Function} callback Callback
     * @param {String} commandSet Name of command set. Defaults to 'default'
     */
    KeyCommandController.prototype.register = function (command, callback, commandSet) {
        commandSet = commandSet || 'default';
        // create the set if it doesn't already exist
        if (!this.sets.hasOwnProperty(commandSet)) {
            this.sets[commandSet] = [];
        }
        // TODO transform English key descriptions into keycodes
        var keycodes = [];
        this.sets[commandSet].push({keys: keycodes, fn: callback});
        throw new Error('not implemented');
    };

    KeyCommandController.prototype.setActiveCommandGroup = function (key) {
        console.info('Set active command group', key);
        this.active = key;
    };

    KeyCommandController.prototype.update = function () {
    }; // noop

    return KeyCommandController;

}());
