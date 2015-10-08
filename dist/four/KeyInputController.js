'use strict';

var FOUR = FOUR || {};

FOUR.KeyInputController = (function () {

  /**
   * Key input controller. Maintains the state of some key combinations and
   * otherwise dispatches key events to listeners.
   * @constructor
   */
  function KeyInputController (config) {
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
    Mousetrap.bind('alt', function (evt) { self.keydown(self.KEYS.ALT, evt); }, 'keydown');
    Mousetrap.bind('alt', function (evt) { self.keyup(self.KEYS.ALT, evt); }, 'keyup');
    Mousetrap.bind('ctrl', function (evt) { self.keydown(self.KEYS.CTRL, evt); }, 'keydown');
    Mousetrap.bind('ctrl', function (evt) { self.keyup(self.KEYS.CTRL, evt); }, 'keyup');
    Mousetrap.bind('shift', function (evt) { self.keydown(self.KEYS.SHIFT, evt); }, 'keydown');
    Mousetrap.bind('shift', function (evt) { self.keyup(self.KEYS.SHIFT, evt); }, 'keyup');

    // selection
    Mousetrap.bind('ctrl+a', function (evt) { self.keyup(self.KEYS.CTRL_A, evt); });
    Mousetrap.bind('ctrl+n', function (evt) { self.keyup(self.KEYS.CTRL_N, evt); });

    // arrow keys
    Mousetrap.bind('i', function (evt) { self.keydown(self.KEYS.UP, evt); }, 'keydown');
    Mousetrap.bind('i', function (evt) { self.keyup(self.KEYS.UP, evt); }, 'keyup');
    Mousetrap.bind('k', function (evt) { self.keydown(self.KEYS.DOWN, evt); }, 'keydown');
    Mousetrap.bind('k', function (evt) { self.keyup(self.KEYS.DOWN, evt); }, 'keyup');
    Mousetrap.bind('j', function (evt) { self.keydown(self.KEYS.LEFT, evt); }, 'keydown');
    Mousetrap.bind('j', function (evt) { self.keyup(self.KEYS.LEFT, evt); }, 'keyup');
    Mousetrap.bind('l', function (evt) { self.keydown(self.KEYS.RIGHT, evt); }, 'keydown');
    Mousetrap.bind('l', function (evt) { self.keyup(self.KEYS.RIGHT, evt); }, 'keyup');
    Mousetrap.bind('u', function (evt) { self.keydown(self.KEYS.RIGHT, evt); }, 'keydown');
    Mousetrap.bind('u', function (evt) { self.keyup(self.KEYS.RIGHT, evt); }, 'keyup');
    Mousetrap.bind('o', function (evt) { self.keydown(self.KEYS.RIGHT, evt); }, 'keydown');
    Mousetrap.bind('o', function (evt) { self.keyup(self.KEYS.RIGHT, evt); }, 'keyup');
  }

  KeyInputController.prototype = Object.create(THREE.EventDispatcher.prototype);

  KeyInputController.prototype.constructor = KeyInputController;

  KeyInputController.prototype.keydown = function (key, evt) {
    this.modifiers[key] = true;
    this.dispatchEvent({'type': 'keydown', key: key, keyCode: evt ? evt.keyCode : null});
  };

  KeyInputController.prototype.keyup = function (key, evt) {
    this.modifiers[key] = false;
    this.dispatchEvent({'type': 'keyup', key: key, keyCode: evt ? evt.keyCode : null});
  };

  /**
   * Register key event callback.
   * @param {String} command Key command
   * @param {Function} callback Callback
   */
  KeyInputController.prototype.register = function (command, callback) {
    throw new Error('not implemented');
  };

  return KeyInputController;

}());
