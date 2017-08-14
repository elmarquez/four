/**
 * Cursor styles.
 * @type {{DEFAULT: string, PAN: string, ROTATE: string, ZOOM: string}}
 */
FOUR.CURSOR = {
    DEFAULT: 'default',
    LOOK: 'crosshair',
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

/**
 * Common event identifiers.
 * @type {String}
 */
FOUR.EVENT = {
    BACKGROUND_CHANGE: 'background-change',
    CAMERA_CHANGE: 'camera-change',
    CONTEXT_MENU: 'contextmenu',
    CONTINUOUS_UPDATE_END: 'continuous-update-end',
    CONTINUOUS_UPDATE_START: 'continuous-update-start',
    CONTROLLER_CHANGE: 'controller-change',
    INDEX: 'index',
    KEY_DOWN: 'keydown',
    KEY_UP: 'keyup',
    MOUSE_DOWN: 'mousedown',
    MOUSE_MOVE: 'mousemove',
    MOUSE_UP: 'mouseup',
    RENDER: 'render',
    RESIZE: 'resize',
    UPDATE: 'update'
};

/**
 * Key input codes
 * @type {Number} Key code
 */
FOUR.KEY = {
    TAB: 9,
    ENTER: 13,
    SHIFT: 16,
    CTRL: 17,
    ALT: 18,
    CAPS_LOCK: 20,
    ESC: 27,
    SPACE: 32,
    ARROW_LEFT: 37,
    ARROW_UP: 38,
    ARROW_RIGHT: 39,
    ARROW_DOWN: 40,
    ZERO: 48,
    ONE: 49,
    TWO: 50,
    THREE: 51,
    FOUR: 52,
    FIVE: 53,
    SIX: 54,
    SEVEN: 55,
    EIGHT: 56,
    NINE: 57,
    A: 65,
    B: 66,
    C: 67,
    D: 68,
    E: 69,
    F: 70,
    G: 71,
    H: 72,
    I: 73,
    J: 74,
    K: 75,
    L: 76,
    M: 77,
    N: 78,
    O: 79,
    P: 80,
    Q: 81,
    R: 82,
    S: 83,
    T: 84,
    U: 85,
    V: 86,
    W: 87,
    X: 88,
    Y: 89,
    Z: 90,
    META_LEFT: 91,
    META_RIGHT: 92,
    F1: 112,
    F2: 113,
    F3: 114,
    F4: 115,
    F5: 116,
    F6: 117,
    F7: 118,
    F8: 119,
    F9: 120,
    F10: 121,
    F11: 122,
    F12: 123,
    SEMICOLON: 186,
    EQUALS: 187,
    COMMA: 188,
    DASH: 189,
    PERIOD: 190,
    FORWARD_SLASH: 191,
    GRAVE_ACCENT: 192,
    OPEN_BRACKET: 219,
    CLOSE_BRACKET: 221,
    SINGLE_QUOTE: 222
};

/**
 * Mouse button state.
 * @type {number}
 */
FOUR.MOUSE_STATE = {
    DOWN: 0,
    MOVE: 1,
    UP: 2
};

/**
 * Mouse button code (left, middle, right).
 * @type {number}
 */
FOUR.MOUSE_BUTTON = {
    LEFT: 0,
    MIDDLE: 1,
    MIDDLE_EXT: 4,
    RIGHT: 2
};

/**
 * Pointer state.
 * @type {Number}
 */
FOUR.POINTER_STATE = {};

/**
 * Label positioning hint.
 */
FOUR.POSITION = {
    CENTER: 0,
    TOP: 1,
    BOTTOM: 2,
    LEFT: 3,
    RIGHT: 4,
    FIXED: 6
};

/**
 * @type {number}
 */
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

/**
 * Determine if mouse middle button is pressed.
 * @param {Object} event Mouse event
 */
FOUR.utils.isMouseMiddlePressed = function (event) {
    return (
      event.button === FOUR.MOUSE_BUTTON.MIDDLE ||
      event.button === FOUR.MOUSE_BUTTON.MIDDLE_EXT ||
      event.buttons === FOUR.MOUSE_BUTTON.MIDDLE ||
      event.buttons === FOUR.MOUSE_BUTTON.MIDDLE_EXT
    );
};

/**
 * Determine if mouse left button is pressed.
 * @param {Object} event Mouse event
 */
FOUR.utils.isMouseLeftPressed = function (event) {
    return (
      event.button === FOUR.MOUSE_BUTTON.LEFT ||
      event.buttons === FOUR.MOUSE_BUTTON.LEFT
    );
};

/**
 * Determine if mouse right button is pressed.
 * @param {Object} event Mouse event
 */
FOUR.utils.isMouseRightPressed = function (event) {
    return (
      event.button === FOUR.MOUSE_BUTTON.RIGHT ||
      event.buttons === FOUR.MOUSE_BUTTON.RIGHT
    );
};
