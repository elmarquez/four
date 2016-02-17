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

FOUR.EVENT = {
  CAMERA_CHANGE: 'camera-change',
  CONTINUOUS_UPDATE_END: 'continuous-update-end',
  CONTINUOUS_UPDATE_START: 'continuous-update-start',
  KEY_DOWN: 'keydown',
  KEY_UP: 'keyup',
  MOUSE_DOWN: 'mousedown',
  MOUSE_MOVE: 'mousemove',
  MOUSE_UP: 'mouseup',
  RESIZE: 'resize',
  UPDATE: 'update'
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
 * Get the screen bounding box for the object 3D.
 * @param {THREE.Object3D} obj Scene object
 * @param {THREE.Camera} camera Camera
 * @param {Number} screenWidth Viewport width
 * @param {Number} screenHeight Viewport height
 * @param {String} strategy Strategy
 * @returns {Object} Screen coordinates, object metadata
 */
FOUR.utils.getObject3DScreenBoundingBox = function (obj, camera, screenWidth, screenHeight, strategy) {
  throw new Error('not implemented'); // FIXME implement function
};

/**
 * Transform object position to screen coordinates.
 * @see http://zachberry.com/blog/tracking-3d-objects-in-2d-with-three-js/
 * @param {THREE.Object3D} obj Object
 * @param {THREE.Camera} camera Camera
 * @param {Number} screenWidth Viewport width
 * @param {Number} screenHeight Viewport height
 * @returns {Object} Screen coordinates, object metadata
 */
FOUR.utils.getObjectScreenCoordinates = function (obj, camera, screenWidth, screenHeight) {
  var pos = new THREE.Vector3();
  //if (obj instanceof THREE.Sphere) {
  //  // bounding sphere
  //  pos.copy(obj.center);
  //} else
  if (obj instanceof THREE.Object3D) {
    obj.updateMatrixWorld();
    pos.setFromMatrixPosition(obj.matrixWorld);
  } else {
    pos.copy(obj);
  }
  pos.project(camera);
  // get screen coordinates
  pos.x = Math.round((pos.x + 1) * screenWidth / 2);
  pos.y = Math.round((-pos.y + 1) * screenHeight / 2);
  pos.z = 0;
  return pos;
};

/**
 * Transform vertex position to screen coordinates.
 * @param {THREE.Vector3} vertex Vertex
 * @param {THREE.Camera} camera Camera
 * @param {Number} screenWidth Viewport width
 * @param {Number} screenHeight Viewport height
 * @returns {Object} Screen coordinates, object metadata
 *
 * @todo should take an object and then return an array with screen coordinates
 */
FOUR.utils.getVertexScreenCoordinates = function (vertex, camera, screenWidth, screenHeight) {
  var pos = new THREE.Vector3().copy(vertex);
  pos.project(camera);
  // get screen coordinates
  pos.x = Math.round((pos.x + 1) * screenWidth / 2);
  pos.y = Math.round((-pos.y + 1) * screenHeight / 2);
  pos.z = 0;
  return pos;
};

/**
 * Determine if R1 intersects R2.
 * @param {Object} r1 Rectangle 1
 * @param {Object} r2 Rectangle 2
 */
FOUR.utils.intersects = function (r1, r2) {
  throw new Error('not implemented'); // FIXME implement function
};

/**
 * Determine if rectangle R1 is contained inside rectangle R2. Rectangles are
 * screen axes aligned.
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
