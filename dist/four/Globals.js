'use strict';

var FOUR = FOUR || {};

FOUR.KEY = {};

FOUR.MOUSE_STATE = {
  DOWN: 0,
  MOVE: 1,
  UP: 2
};

FOUR.SINGLE_CLICK_TIMEOUT = 400;

/**
 * Orthographic views
 * @type {Object|String}
 */
FOUR.VIEW = {
  TOP: 'top',
  FRONT: 'front',
  RIGHT: 'right',
  BACK: 'back',
  LEFT: 'left',
  BOTTOM: 'bottom'
};