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
    //Mousetrap.bind('shift+space', function () { console.log('shift space'); });
    Mousetrap.bind('shift', function () { self.keydown(self.KEYS.SHIFT); }, 'keydown');
    Mousetrap.bind('shift', function () { self.keyup(self.KEYS.SHIFT); }, 'keyup');

    // selection
    Mousetrap.bind('ctrl+a', function () { self.keyup(self.KEYS.CTRL_A); });
    Mousetrap.bind('ctrl+n', function () { self.keyup(self.KEYS.CTRL_N); });

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

  KeyStateController.prototype = Object.create(THREE.EventDispatcher.prototype);

  KeyStateController.prototype.constructor = KeyStateController;

  KeyStateController.prototype.keydown = function (key, evt) {
    this.modifiers[key] = true;
    this.dispatchEvent({'type': 'keydown', key: key, keyCode: evt ? evt.keyCode : null});
  };

  KeyStateController.prototype.keyup = function (key, evt) {
    this.modifiers[key] = false;
    this.dispatchEvent({'type': 'keyup', key: key, keyCode: evt ? evt.keyCode : null});
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
