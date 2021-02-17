import { BoxGeometry, BoxHelper, Box3, Mesh, Object3D, Vector3 } from 'three';

const BoundingBox = (function () {

    /**
     * Bounding box object.
     * @param {String} name Bounding box name
     * @constructor
     */
    function BoundingBox(name) {
        Object3D.call(this);
        this.depth = 0;
        this.envelope = null;
        this.height = 0;
        this.name = name;
        this.width = 0;
        this.visible = false;
        this.reset();
    }

    BoundingBox.prototype = Object.create(Object3D.prototype);

    BoundingBox.prototype.constructor = BoundingBox;

    BoundingBox.prototype.getCenter = function () {
        return this.position;
    };

    /**
     * Get the bounding box envelope.
     * @returns {THREE.Box3}
     */
    BoundingBox.prototype.getEnvelope = function () {
        return this.envelope;
    };

    /**
     * Get the bounding sphere radius.
     * @returns {Number} Radius
     */
    BoundingBox.prototype.getRadius = function () {
        return this.helper.geometry.boundingSphere.radius;
    };

    BoundingBox.prototype.getXDimension = function () {
        return this.width;
    };

    BoundingBox.prototype.getYDimension = function () {
        return this.depth;
    };

    BoundingBox.prototype.getZDimension = function () {
        return this.height;
    };

    BoundingBox.prototype.reset = function () {
        var self = this;
        self.position.set(0, 0, 0);
        self.envelope = new Box3(new Vector3(0, 0, 0), new Vector3(0, 0, 0));
        self.children.forEach(function (obj) {
            self.remove(obj);
        });
        var geom = new BoxGeometry(1, 1, 1);
        var mesh = new Mesh(geom);
        self.helper = new BoxHelper(mesh);
    };

    /**
     * Toggle visibility.
     */
    BoundingBox.prototype.toggleVisibility = function () {
        var self = this;
        self.visible = !self.visible;
    };

    /**
     * Update the bounding box geometry and position.
     * @param {Array} objects List of scene objects
     */
    BoundingBox.prototype.update = function (objects) {
        //console.log('bounding box update');
        var self = this;
        // reset values to base case
        self.reset();
        // update the bounding box geometry
        if (objects && objects.length > 0) {
            // set the starting envelope to be the first object
            self.envelope.setFromObject(objects[0]);
            // expand the envelope to accommodate the remaining objects
            objects.forEach(function (obj) {
                var objEnv = new Box3(new Vector3(0, 0, 0), new Vector3(0, 0, 0));
                objEnv.setFromObject(obj);
                self.envelope.union(objEnv);
            });
            // bounding box dimensions
            self.width = self.envelope.max.x - self.envelope.min.x;
            self.depth = self.envelope.max.y - self.envelope.min.y;
            self.height = self.envelope.max.z - self.envelope.min.z;
            // create a mesh to represent the bounding box volume
            var geom = new BoxGeometry(self.width, self.depth, self.height);
            var mesh = new Mesh(geom);
            self.helper = new BoxHelper(mesh);
            self.add(self.helper);
        } else {
            self.visible = false;
        }
        self.position.set(
            self.envelope.min.x + (self.width / 2),
            self.envelope.min.y + (self.depth / 2),
            self.envelope.min.z + (self.height / 2)
        );
        //console.dir(self);
    };

    return BoundingBox;

}());


export default BoundingBox;