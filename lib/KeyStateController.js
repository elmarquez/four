'use strict';

var FOUR = FOUR || {};

FOUR.KeyStateController = (function () {

  /**
   * Key state controller. Maintains the state of some key combinations and
   * otherwise dispatches key events to listeners.
   * @constructor
   */
  function KeyStateController (config) {
    THREE.EventDispatcher.call(this);
    config = config || {};
    var self = this;
    self.KEYS = {
      ALT: 'alt',
      CTRL: 'ctrl',
      CTRL_A: 'ctrl+a',
      CTRL_N: 'ctrl+n',
      DOWN: 'down',
      LEFT: 'left',
      META: 'meta',
      RIGHT: 'right',
      SHIFT: 'shift',
      UP: 'up'
    };
    self.enabled = config.enabled || false;
    self.modifiers = {}; // map of currently pressed keys

    Object.keys(self.KEYS).forEach(function (key) {
      self.modifiers[self.KEYS[key]] = false;
    });

    // modifier keys
    Mousetrap.bind('alt', function () { self.keydown(self.KEYS.ALT); }, 'keydown');
    Mousetrap.bind('alt', function () { self.keyup(self.KEYS.ALT); }, 'keyup');
    Mousetrap.bind('ctrl', function () { self.keydown(self.KEYS.CTRL); }, 'keydown');
    Mousetrap.bind('ctrl', function () { self.keyup(self.KEYS.CTRL); }, 'keyup');
    Mousetrap.bind('shift+space', function () { console.log('shift space'); });
    Mousetrap.bind('shift', function () { self.keydown(self.KEYS.SHIFT); }, 'keydown');
    Mousetrap.bind('shift', function () { self.keyup(self.KEYS.SHIFT); }, 'keyup');

    // selection
    Mousetrap.bind('ctrl+a', function () { self.keyup(self.KEYS.CTRL_A); });
    Mousetrap.bind('ctrl+n', function () { self.keyup(self.KEYS.CTRL_N); });

    // arrow keys
    Mousetrap.bind('up', function () { self.keydown(self.KEYS.UP); }, 'keydown');
    Mousetrap.bind('up', function () { self.keyup(self.KEYS.UP); }, 'keyup');
    Mousetrap.bind('down', function () { self.keydown(self.KEYS.DOWN); }, 'keydown');
    Mousetrap.bind('down', function () { self.keyup(self.KEYS.DOWN); }, 'keyup');
    Mousetrap.bind('left', function () { self.keydown(self.KEYS.LEFT); }, 'keydown');
    Mousetrap.bind('left', function () { self.keyup(self.KEYS.LEFT); }, 'keyup');
    Mousetrap.bind('right', function () { self.keydown(self.KEYS.RIGHT); }, 'keydown');
    Mousetrap.bind('right', function () { self.keyup(self.KEYS.RIGHT); }, 'keyup');
  }

  KeyStateController.prototype = Object.create(THREE.EventDispatcher.prototype);

  KeyStateController.prototype.constructor = KeyStateController;

  KeyStateController.prototype.keydown = function (key) {
    this.modifiers[key] = true;
    this.dispatchEvent({'type': 'keydown', value: key});
  };

  KeyStateController.prototype.keyup = function (key) {
    this.modifiers[key] = false;
    this.dispatchEvent({'type': 'keyup', value: key});
  };

  /**
   * Register key event callback.
   * @param {String} command Key command
   * @param {Function} callback Callback
   */
  KeyStateController.prototype.register = function (command, callback) {
    throw new Error('not implemented');
  };

  return KeyStateController;

}());
