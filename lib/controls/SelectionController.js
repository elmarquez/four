'use strict';

/**
 * Scene object selection control.
 * @param {Object} configuration
 * @constructor
 */
function SelectionControl (config) {
  config = config || {};
  var self = this;
  self.enabled = true;
  Object.keys(config).forEach(function (key) {
    self[key] = config[key];
  });
}

SelectionControl.prototype.disable = function () {
  var self = this;
  self.enabled = false;
  // TODO remove key and mouse bindings
};

SelectionControl.prototype.enable = function () {
  var self = this;
  self.enabled = true;
  // TODO restore key and mouse bindings
};
