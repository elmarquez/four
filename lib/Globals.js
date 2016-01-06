/**
 * Cursor styles.
 * @type {{DEFAULT: string, PAN: string, ROTATE: string, ZOOM: string}}
 */
FOUR.CURSOR = {
  DEFAULT: 'default',
  PAN: 'all-scroll',
  ROTATE: 'crosshair',
  ZOOM: 'ns-resize'
};

FOUR.DEFAULT = {
  CAMERA: {
    far: 1000,
    fov: 45,
    height: 1,
    name: 'camera',
    near: 0.1,
    width: 1
  }
};

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

/**
 * Utility functions namespace.
 * @type {*}
 */
FOUR.utils = {};

/**
 * Determine if R1 intersects R2.
 * @param {Object} r1 Rectangle 1
 * @param {Object} r2 Rectangle 2
 */
FOUR.utils.intersects = function (r1, r2) {
  throw new Error('not implemented'); // FIXME implement function
};

/**
 * Determine if R1 is contained inside R2.
 * @param {Object} r1 Rectangle 1
 * @param {Object} r2 Rectangle 2
 */
FOUR.utils.isContained = function (r1, r2) {
  // compare X dimension
  if (r1.p1.x >= r2.p1.x && r1.p1.x <= r2.p2.x) {
    if (r1.p2.x >= r2.p1.x && r1.p2.x <= r2.p2.x) {
      // compare y dimension
      if (r1.p1.y >= r2.p1.y && r1.p1.y <= r2.p2.y) {
        if (r1.p2.y >= r2.p1.y && r1.p2.y <= r2.p2.y) {
          return true;
        }
      }
    }
  }
  return false;
};
