/**
 * Get the screen bounding box for the object 3D.
 * @param {THREE.Object3D} obj Scene object
 * @param {THREE.Camera} camera Camera
 * @param {Number} screenWidth Viewport width
 * @param {Number} screenHeight Viewport height
 * @param {String} strategy Strategy
 * @returns {Object} Screen coordinates, object metadata
 */
const getObject3DScreenBoundingBox = function (obj, camera, screenWidth, screenHeight, strategy) {
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
const getObjectScreenCoordinates = function (obj, camera, screenWidth, screenHeight) {
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
const getVertexScreenCoordinates = function (vertex, camera, screenWidth, screenHeight) {
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
const intersects = function (r1, r2) {
    throw new Error('not implemented'); // FIXME implement function
};

/**
 * Determine if rectangle R1 is contained inside rectangle R2. Rectangles are
 * screen axes aligned.
 * @param {Object} r1 Rectangle 1
 * @param {Object} r2 Rectangle 2
 */
const isContained = function (r1, r2) {
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

export default {
    getObject3DScreenBoundingBox,
    getObjectScreenCoordinates,
    getVertexScreenCoordinates,
    intersects,
    isContained
};