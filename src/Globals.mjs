/**
 * Cursor styles.
 * @type {{DEFAULT: string, PAN: string, ROTATE: string, ZOOM: string}}
 */
const CURSOR = {
    DEFAULT: 'default',
    LOOK: 'crosshair',
    PAN: 'all-scroll',
    ROTATE: 'crosshair',
    ZOOM: 'ns-resize'
};

/**
 * 
 */
const DEFAULT = {
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
const EVENT = {
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
const KEY = {
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
const MOUSE_STATE = {
    DOWN: 0,
    MOVE: 1,
    UP: 2
};

/**
 * Pointer state.
 * @type {Number}
 */
const POINTER_STATE = {};

/**
 * Label positioning hint.
 */
const POSITION = {
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
const SINGLE_CLICK_TIMEOUT = 400;

/**
 * Orthographic views
 * @type {Object|String}
 */
const VIEW = {
    TOP: 'top',
    FRONT: 'front',
    RIGHT: 'right',
    BACK: 'back',
    LEFT: 'left',
    BOTTOM: 'bottom'
};


export default DEFAULT;

export {
    CURSOR,
    DEFAULT,
    EVENT,
    KEY,
    MOUSE_STATE,
    POINTER_STATE,
    POSITION,
    SINGLE_CLICK_TIMEOUT,
    VIEW,
};
    