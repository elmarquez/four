FOUR.KeyCommandController = (function () {

  function Matcher (config) {
    this.keys = config.command.split('+');
  }

  /**
   * Determine if the current key state matches the specified key command.
   * @param {Object} pressed Map of keys currently in the down state.
   */
  Matcher.prototype.match = function (pressed) {
    return this.keys.reduce(function (match, key) {
      return key[pressed] && match !== false ? true : false;
    }, -1);
  };

  /**
   * Key command controller. The controller allows you to define key command
   * sets that can be activated and deactivated as required. A key command set
   * called the 'default' set is always active.
   * @constructor
   */
  function KeyCommandController (config) {
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

  /**
   * Define key command.
   * @param {String} group Group. Use 'default' for persistent commands.
   * @param {String} command Key command
   * @param {Function} fn Function
   * @param {Element} el DOM element that will listen for events. Defaults to window
   */
  KeyCommandController.prototype.bind = function (group, command, fn, el) {
    el = el || window;
    if (!this.sets.hasOwnProperty(group)) {
      this.sets[group] = [];
    }
    this.sets[group].push({
      command: command,
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
    addListener(window, 'keyup', self.onKeyUp);
    self.enabled = true;
  };

  /**
   * Determine if a command is active.
   * @param command
   */
  KeyCommandController.prototype.isActive = function (command) {

  };

  /**
   * @see http://api.jquery.com/event.which/
   * @param evt
   */
  KeyCommandController.prototype.keydown = function (evt) {
    var me = this;
    // record the key down state
    me.pressed[evt.keyCode] = true;
    // check the default command set for commands that should be activated
    Object.keys(me.sets.default).forEach(function (command) {
      if (self.isActive(command)) {

        console.info('command active');
      }
    });
    // check the current command set
    if (me.active) {
      Object.keys(me.sets[me.active]).forEach(function (command) {
        if (self.isActive(command)) {
          console.info('command active');
        }
      });
    }
  };

  KeyCommandController.prototype.keyup = function (evt) {
    if (this.pressed.hasOwnProperty(evt.keyCode)) {
      delete this.pressed[evt.keyCode];
    }
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

  return KeyCommandController;

}());
