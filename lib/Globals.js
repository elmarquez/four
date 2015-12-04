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
