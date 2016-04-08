FOUR.SceneIndex = (function () {

    /**
     * Camera view object and object element index. The index supports search
     * for object and object element selection. The indexer can accept a
     * function to enable indexing of arbitrary element properties.
     * TODO enable support for multiple viewports
     * @param {Object} config Configuration
     * @constructor
     */
    function SceneIndex(config) {
        THREE.EventDispatcher.call(this);
        config = config || {};

        var self = this;
        self.filter = null;
        self.filters = {
            all: self.selectAll,
            nearest: self.selectNearest,
            objects: self.selectObjects,
            points: self.selectPoints
        };
        self.frustum = new THREE.Frustum();

        self.count = {edges:0, faces:0, objects:0, vertices:0};
        self.counts = {
            scene:{},
            view:{}
        };
        self.positions = [];
        self.sceneIndex = new SpatialHash();
        //self.viewIndex = new SpatialHash();
        self.viewIndex = new Quadtree({
            x: 0,
            y: 0,
            height: config.viewport.domElement.clientHeight,
            width: config.viewport.domElement.clientWidth
        });
        self.viewport = null; // FIXME temporary until we remove quadtree

        Object.keys(config).forEach(function (key) {
            self[key] = config[key];
        });
    }

    SceneIndex.prototype = Object.create(THREE.EventDispatcher.prototype);

    /**
     * Clear the index.
     */
    SceneIndex.prototype.clear = function () {
        this.count = {edges:0, faces:0, objects:0, vertices:0};
        this.positions = [];
        this.sceneIndex.clear();
        this.viewIndex = new Quadtree({
            x: 0,
            y: 0,
            height: this.viewport.domElement.clientHeight,
            width: this.viewport.domElement.clientWidth
        });
        console.info('Cleared scene and view indices');
        this.dispatchEvent({type: FOUR.EVENT.UPDATE, description: 'scene and view indices cleared'});
    };

    SceneIndex.prototype.disable = function () {
        var self = this;
        self.enabled = false;
        self.hideMarquee();
        Object.keys(self.listeners).forEach(function (key) {
            var listener = self.listeners[key];
            listener.element.removeEventListener(listener.event, listener.fn);
        });
    };

    SceneIndex.prototype.enable = function () {
        var self = this;
        function addListener(element, event, fn) {
            self.listeners[event] = {
                element: element,
                event: event,
                fn: fn.bind(self)
            };
            element.addEventListener(event, self.listeners[event].fn, false);
        }
        addListener(window, 'resize', self.onWindowResize);
        self.buildIndex();
    };

    /**
     * Get all entities intersecting the rectangle defined by P1 and P2.
     * @param {THREE.Vector2} p1 Screen position
     * @param {THREE.Vector2} p2 Screen position
     */
    SceneIndex.prototype.get = function (p1, p2) {
        throw new Error('not implemented');
    };

    /**
     * Get cell envelope center position.
     * @param {Object} env Object representing cell envelope
     * @returns {Array} Coordinate array
     */
    SceneIndex.prototype.getEnvelopeCenter = function (env) {
        var x = (env.max.x + env.min.x) / 2;
        var y = (env.max.y + env.min.y) / 2;
        var z = (env.max.z + env.min.z) / 2;
        return [x, y, z];
    };

    /**
     * Get cell envelope center position.
     * @param {Object} env Object representing cell envelope
     * @returns {Array} Dimension array
     */
    SceneIndex.prototype.getEnvelopeSize = function (env) {
        var x = Math.abs(env.max.x - env.min.x);
        var y = Math.abs(env.max.y - env.min.y);
        var z = Math.abs(env.max.z - env.min.z);
        return [x, y, z];
    };

    /**
     * Get screen entities within a specified radius from the screen position.
     * @param {Object} pos Screen position
     * @param {Number} radius Radius from point
     * @returns {Array} List of scene objects.
     */
    SceneIndex.prototype.getNear = function (pos, radius) {
        throw new Error('not implemented');
    };

    /**
     * Get the entity nearest to the screen position.
     * @param {Object} pos Screen position
     * @returns {Object}
     */
    SceneIndex.prototype.getNearest = function (pos, radius) {
        throw new Error('not implemented');
    };

    /**
     * Index the position of each vertex in the buffered geometry.
     * @param {THREE.Object3D} obj Scene object
     * @returns {number} Count of the number of indexed vertices
     */
    SceneIndex.prototype.indexBufferedGeometryPosition = function (obj) {
        var aabb, i, id, metadata, total = 0, vertex;
        //console.info('point count', obj.geometry.attributes.position.count);
        for (i = 0; i < obj.geometry.attributes.position.count; i += 3) {
            vertex = new THREE.Vector3(
                obj.geometry.attributes.position.array[i],
                obj.geometry.attributes.position.array[i+1],
                obj.geometry.attributes.position.array[i+2]);
            vertex = vertex.add(obj.position);
            id = obj.uuid + ',' + i;
            aabb = {
                min: {x: vertex.x, y: vertex.y, z: vertex.z},
                max: {x: vertex.x, y: vertex.y, z: vertex.z}
            };
            metadata = {
                type: 'THREE.Points'
            };
            this.sceneIndex.insert(id, i, aabb, metadata);
            total += 1;
        }
        return total;
    };

    /**
     * Index the position of each vertex.
     * @param {THREE.Object3D|THREE.Points} obj Scene object
     * @returns {number} Count of the number of indexed vertices
     */
    SceneIndex.prototype.indexGeometryVertices = function (obj) {
        var aabb, i, id, metadata, total = 0, vertex;
        if (obj.geometry.vertices) {
            for (i = 0; i < obj.geometry.vertices.length; i++) {
                vertex = obj.geometry.vertices[i].clone().add(obj.position);
                id = obj.uuid + ',' + i;
                aabb = {
                    min: {x: vertex.x, y: vertex.y, z: vertex.z},
                    max: {x: vertex.x, y: vertex.y, z: vertex.z}
                };
                metadata = {
                    type: 'THREE.Points'
                };
                this.sceneIndex.insert(id, i, aabb, metadata);
                total += 1;
            }
        }
        return total;
    };

    /**
     * Index the THREE.Object3D by the screen coordinates of its vertices.
     * @param {THREE.Object3D} obj Scene object
     * @param {THREE.Camera} camera Camera
     * @param {Number} clientWidth Screen width
     * @param {Number} clientHeight Screen height
     * @returns {Number} Count of indexed vertices
     */
    SceneIndex.prototype.indexObject3DScreenCoordinates = function (obj, camera, clientWidth, clientHeight) {
        //var aabb, p, points = [], rec = new THREE.Box2(), self = this;
        //// project the object vertices into the screen space, then find the screen
        //// space bounding box for the scene object
        //obj.geometry.vertices.forEach(function (vertex) {
        //  p = vertex.clone().applyMatrix4(obj.matrixWorld); // absolute position of vertex
        //  p = FOUR.utils.getVertexScreenCoordinates(p, camera, clientWidth, clientHeight);
        //  points.push(p);
        //});
        //rec.setFromPoints(points);
        //// add the object screen bounding box to the index
        //aabb = new THREE.Box3(new THREE.Vector3(rec.min.x, rec.min.y, 0), new THREE.Vector3(rec.max.x, rec.max.y, 0));
        //self.viewIndex.insert(obj.uuid.slice(), ',-1', aabb, {});
        //return points.length;
        var height, maxX = 0, maxY = 0,
            minX = this.viewport.domElement.clientWidth,
            minY = this.viewport.domElement.clientHeight,
            p, width, x, y;
        if (obj.matrixWorldNeedsUpdate) {
            obj.updateMatrixWorld();
        }
        // project the object vertices into the screen space, then find the screen
        // space bounding box for the scene object
        obj.geometry.vertices.forEach(function (vertex) {
            p = vertex.clone();
            p.applyMatrix4(obj.matrixWorld); // absolute position of vertex
            p = FOUR.utils.getVertexScreenCoordinates(p, camera, clientWidth, clientHeight);
            maxX = p.x > maxX ? p.x : maxX;
            maxY = p.y > maxY ? p.y : maxY;
            minX = p.x < minX ? p.x : minX;
            minY = p.y < minY ? p.y : minY;
        });
        height = (maxY - minY) > 0 ? maxY - minY : 0;
        width = (maxX - minX) > 0 ? maxX - minX : 0;
        x = minX >= 0 ? minX : 0;
        y = minY >= 0 ? minY : 0;
        // add the object screen bounding box to the index
        this.viewIndex.push({
            uuid: obj.uuid.slice(),
            x: x,
            y: y,
            height: height,
            width: width,
            index: -1,
            type: 'THREE.Object3D'
        });
        //console.info({uuid:obj.uuid.slice(), x:x, y:y, h:height, w:width, type:'THREE.Object3D'});
        return 1;
    };

    /**
     * Insert the object into the scene index.
     * @param {THREE.Object3D} obj Scene object
     */
    SceneIndex.prototype.indexObject3DVertices = function (obj) {
        var total = 0;
        if (obj.geometry) {
            obj.geometry.computeBoundingBox();
            if (obj.geometry.vertices) {
                total += this.indexGeometryVertices(obj);
            } else {
                this.sceneIndex.insert(obj.uuid.slice() + ',-1', obj.geometry.boundingBox, {});
                total += 1;
            }
        }
        return total;
    };

    /**
     * Index THREE.Points object screen coordinates.
     * @param {THREE.Points} obj Scene object
     * @param {THREE.Camera} camera Camera
     * @param {Number} clientWidth Screen width
     * @param {Number} clientHeight Screen height
     * @returns {Number} Count of indexed vertices
     */
    SceneIndex.prototype.indexPointsScreenCoordinates = function (obj, camera, clientWidth, clientHeight) {
        var i, p, total = 0, uuid = obj.uuid.slice(), vertex;
        if (obj.geometry.vertices) {
            for (i = 0; i < obj.geometry.vertices.length; i++) {
                //vertex = obj.geometry.vertices[i];
                vertex = obj.geometry.vertices[i].clone().add(obj.position);
                p = FOUR.utils.getObjectScreenCoordinates(vertex, camera, clientWidth, clientHeight);
                if (p.x >= 0 && p.y >= 0) {
                    this.viewIndex.push({
                        uuid: uuid,
                        x: Number(p.x),
                        y: Number(p.y),
                        width: 0,
                        height: 0,
                        index: i,
                        type: 'THREE.Points'
                    });
                    total += 1;
                }
            }
        } else if (obj.geometry.attributes.position) {
            for (i = 0; i < obj.geometry.attributes.position.count; i += 3) {
                vertex = new THREE.Vector3(
                    obj.geometry.attributes.position.array[i],
                    obj.geometry.attributes.position.array[i+1],
                    obj.geometry.attributes.position.array[i+2]);
                vertex = vertex.add(obj.position);
                p = FOUR.utils.getObjectScreenCoordinates(vertex, camera, clientWidth, clientHeight);
                if (p.x >= 0 && p.y >= 0) {
                    this.viewIndex.push({
                        uuid: uuid,
                        x: Number(p.x),
                        y: Number(p.y),
                        width: 0,
                        height: 0,
                        index: i,
                        type: 'THREE.Points'
                    });
                    total += 1;
                }
            }
        }
        return total;
    };

    /**
     * Add objects to the scene index.
     * @param {Array} objs Scene objects to be indexed
     */
    SceneIndex.prototype.indexScene = function (objs) {
        // TODO perform indexing in a worker
        // reduce each scene entity to the properties that we want to index
        // for each element, record the uuid, index, aabb
        // prefix the array with any values required to build a camera frustum, etc.
        // in the worker:
        // build the 3D index
        // build the 2D index
        // take advantage of memoization

        objs = objs || [];
        var objects = 0, self = this, start = new Date().getTime(), verticies = 0;
        objs.forEach(function (obj) {
            objects += 1;
            if (obj.matrixWorldNeedsUpdate) {
                obj.updateMatrixWorld();
            }
            if (obj.geometry) {
                // switch indexing strategy depending on the type of scene object
                if (obj instanceof THREE.Points) {
                    if (obj.geometry.vertices) {
                        verticies += self.indexGeometryVertices(obj);
                    } else if (obj.geometry.attributes.hasOwnProperty('position')) {
                        verticies += self.indexBufferedGeometryPosition(obj);
                    }
                } else if (obj instanceof THREE.Object3D) {
                    verticies += self.indexObject3DVertices(obj);
                }
            }
        });
        var time = new Date().getTime() - start;
        console.info('Added %s objects, %s vertices to the scene index in %s ms', objects, verticies, time);
        this.dispatchEvent({type: FOUR.EVENT.UPDATE, description: 'scene index updated'});
    };

    /**
     * Add objects to the camera view index.
     * @param {THREE.Scene} scene Scene
     * @param {THREE.Camera} camera Camera
     * @param {number} width Viewport width
     * @param {number} height Viewport height
     */
    SceneIndex.prototype.indexView = function (scene, camera, width, height) {
        var index, obj, objects = 0, matrix, self = this,
            start = new Date().getTime(), vertices = 0, uuid;
        // clear the index
        self.viewIndex = new Quadtree({height: height, width: width});
        // build a frustum for the current camera view
        matrix = new THREE.Matrix4().multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
        self.frustum.setFromMatrix(matrix);
        // get a list of entities intersecting the frustum
        self.sceneIndex.getEntitiesIntersectingFrustum(self.frustum).then(function (items) {
            items.forEach(function (item) {
                objects += 1;
                // TODO store this data in the scene index
                obj = scene.getObjectByProperty('uuid', item.uuid);
                // switch indexing strategy depending on the type of scene object
                if (obj instanceof THREE.Points) {
                    vertices += self.indexPointsScreenCoordinates(obj, camera, width, height);
                } else if (obj instanceof THREE.Object3D) {
                    vertices += self.indexObject3DScreenCoordinates(obj, camera, width, height);
                }
            });
            var time = new Date().getTime() - start;
            console.info('Added %s objects, %s vertices to the view index in %s ms', objects, vertices, time);
            self.dispatchEvent({type: FOUR.EVENT.UPDATE, description: 'view index updated'});
        });
    };

    /**
     * Insert scene object into the index.
     * @param {THREE.Object3D|THREE.Points} obj Scene object
     */
    SceneIndex.prototype.insert = function (obj) {
        // TODO insert into scene index
        // TODO insert into view index
    };

    /**
     * Remove scene object from the index
     * @param {THREE.Object3D|THREE.Points} obj Scene object
     * @param {Number} index Element index
     */
    SceneIndex.prototype.remove = function (obj, index) {
        index = index || -1;
        this.sceneIndex.remove(obj);
    };

    SceneIndex.prototype.selectAll = function () {
        // TODO select only objects, don't select points
    };

    SceneIndex.prototype.selectNearest = function () {
    };

    SceneIndex.prototype.selectObjects = function () {
    };

    SceneIndex.prototype.selectPoints = function () {
    };

    return SceneIndex;

}());
