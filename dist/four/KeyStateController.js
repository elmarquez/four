/* global Mousetrap, THREE */
/* jshint unused:false */
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

    self.KEYS = {};
    self.MODIFIERS = {
      ALT: 'alt',
      CTRL: 'ctrl',
      META: 'meta',
      SHIFT: 'shift'
    };
    self.enabled = config.enabled || false;
    self.modifiers = {};

    Object.keys(self.MODIFIERS).forEach(function (key) {
      self.modifiers[self.MODIFIERS[key]] = false;
    });

    // listen for events
    Mousetrap.bind('alt', function () { self.keydown(self.MODIFIERS.ALT); }, 'keydown');
    Mousetrap.bind('alt', function () { self.keyup(self.MODIFIERS.ALT); }, 'keyup');
    Mousetrap.bind('ctrl', function () { self.keydown(self.MODIFIERS.CTRL); }, 'keydown');
    Mousetrap.bind('ctrl', function () { self.keyup(self.MODIFIERS.CTRL); }, 'keyup');
    Mousetrap.bind('shift', function () { self.keydown(self.MODIFIERS.SHIFT); }, 'keydown');
    Mousetrap.bind('shift', function () { self.keyup(self.MODIFIERS.SHIFT); }, 'keyup');
    //Mousetrap.bind('shift shift', function () { self.keyDoublePress(self.MODIFIERS.SHIFT); });

    // selection
    Mousetrap.bind('ctrl+a', function () { self.controller.selection.selectAll(); });
    Mousetrap.bind('ctrl+n', function () { self.controller.selection.selectNone(); });
  }

  KeyStateController.prototype = Object.create(THREE.EventDispatcher.prototype);

  KeyStateController.prototype.constructor = KeyStateController;

  KeyStateController.prototype.keyDoublePress = function (key) {
    this.modifiers[key] = false;
    this.dispatchEvent({'type': 'key-double-press', value: key});
  };

  KeyStateController.prototype.keydown = function (key) {
    this.modifiers[key] = true;
    this.dispatchEvent({'type': 'keydown', value: key});
  };

  KeyStateController.prototype.keyup = function (key) {
    this.modifiers[key] = true;
    this.dispatchEvent({'type': 'keyup', value: key});
  };

  KeyStateController.prototype.register = function (command, callback) {
    throw new Error('not implemented');
  };

  return KeyStateController;

}());
