FOUR.SceneIndex3 = (function () {

    //-------------------------------------------------------------------------
    // Worker functions

    function getObject3DScreenCoordinates (obj, camera, clientWidth, clientHeight) {
        var height, maxX = 0, maxY = 0,
            minX = clientWidth,
            minY = clientHeight,
            p, width, x, y;
        // project the object vertices into the screen space, then find the screen
        // space bounding box for the scene object
        obj.geometry.vertices.forEach(function (vertex) {
            p = vertex.clone();
            p.applyMatrix4(obj.matrixWorld); // absolute position of vertex
            p = getVertexScreenCoordinates(p, camera, clientWidth, clientHeight);
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
        return {
            id: obj.uuid + ',-1',
            aabb: {
                max: {
                    x:x + width,
                    y:y + height,
                    z:0
                },
                min: {
                    x:x,
                    y:y,
                    z:0
                }
            },
            uuid: obj.uuid.slice(),
            position: {
                x: x,
                y: y,
                z: 0
            },
            x: x,
            y: y,
            z: 0,
            height: height,
            width: width,
            index: -1,
            type: 'THREE.Object3D'
        };
    }

    function getVertexScreenCoordinates (vertex, camera, screenWidth, screenHeight) {
        var pos = new THREE.Vector3().copy(vertex);
        pos.project(camera);
        // get screen coordinates
        pos.x = Math.round((pos.x + 1) * screenWidth / 2);
        pos.y = Math.round((-pos.y + 1) * screenHeight / 2);
        pos.z = 0;
        return pos;
    }

    function setScreenCoordinates (obj, camera, screenWidth, screenHeight) {
        var pos = new THREE.Vector3(obj.x, obj.y, obj.z);
        pos.project(camera);
        obj.x = Math.round((pos.x + 1) * screenWidth / 2);
        obj.y = Math.round((-pos.y + 1) * screenHeight / 2);
        obj.z = 0;
        return obj;
    }

    //-------------------------------------------------------------------------

    /**
     * Camera view object and object element index. The index supports search
     * for object and object element selection. The indexer can accept a
     * function to enable indexing of arbitrary element properties.
     * TODO enable support for multiple viewports
     * @param {Object} config Configuration
     * @constructor
     */
    function SceneIndex3(config) {
        THREE.EventDispatcher.call(this);
        config = config || {};

        var self = this;
        self.SCRIPTS = {
            EVAL: '/vendor/parallel.js/lib/eval.js',
            THREE: '/vendor/three.js/three.js'
        };

        self.count = {
            scene: {edges:0, faces:0, objects:0, vertices:0},
            view: {edges:0, faces:0, objects:0, vertices:0}
        };
        self.frustum = new THREE.Frustum();
        self.positions = [];
        self.sceneIndex = new SpatialHash(config.sceneIndex || {});
        //self.viewIndex = new SpatialHash(config.viewIndex || {});
        self.viewIndex = new Quadtree({
            x: 0,
            y: 0,
            height: config.viewport.domElement.clientHeight,
            width: config.viewport.domElement.clientWidth
        });
        self.viewport = config.viewport;
    }

    SceneIndex3.prototype = Object.create(THREE.EventDispatcher.prototype);

    SceneIndex3.prototype.clear = function () {
        this.count = {
            scene: {edges:0, faces:0, objects:0, vertices:0},
            view: {edges:0, faces:0, objects:0, vertices:0}
        };
        this.frustum = new THREE.Frustum();
        this.positions = [];
        this.sceneIndex.clear();
        // this.viewIndex.clear();
        this.viewIndex = new Quadtree({
            x: 0,
            y: 0,
            height: this.viewport.domElement.clientHeight,
            width: this.viewport.domElement.clientWidth
        });
        console.info('Cleared scene and view indices');
        this.dispatchEvent({type: FOUR.EVENT.UPDATE, description: 'cleared scene and view indices'});
    };

    SceneIndex3.prototype.clearViewIndex = function () {
        this.count.view = {edges:0, faces:0, objects:0, vertices:0};
        this.viewIndex = new Quadtree({
            x: 0,
            y: 0,
            height: this.viewport.domElement.clientHeight,
            width: this.viewport.domElement.clientWidth
        });
        console.info('Cleared view index');
        this.dispatchEvent({type: FOUR.EVENT.UPDATE, description: 'cleared view index'});
    };
    /**
     * Get all entities intersecting the rectangle defined by P1 and P2.
     * @param {THREE.Vector2} p1 Screen position
     * @param {THREE.Vector2} p2 Screen position
     */
    SceneIndex3.prototype.get = function (p1, p2) {
        // get the list of screen index buckets intersected by the rectangle
        throw new Error('not implemented');
    };

    SceneIndex3.prototype.getBufferedGeometryPositions = function (obj) {
        var i, positions = [], vertex, uuid = obj.uuid.slice();
        for (i = 0; i < obj.geometry.attributes.position.count; i += 3) {
            vertex = new THREE.Vector3(
                obj.geometry.attributes.position.array[i],
                obj.geometry.attributes.position.array[i+1],
                obj.geometry.attributes.position.array[i+2]);
            vertex = vertex.add(obj.position);
            positions.push({
                id: uuid + ',' + i,
                uuid: uuid,
                index: i,
                aabb: {
                    min: {x: vertex.x, y: vertex.y, z: vertex.z},
                    max: {x: vertex.x, y: vertex.y, z: vertex.z}
                },
                position: {
                    x: vertex.x,
                    y: vertex.y,
                    z: vertex.z
                },
                type: 'THREE.Points',
                x: vertex.x,
                y: vertex.y,
                z: vertex.z
            });
        }
        return positions;
    };

    /**
     * Get cell envelope center position.
     * @param {Object} env Object representing cell envelope
     * @returns {Array} Coordinate array
     */
    SceneIndex3.prototype.getEnvelopeCenter = function (env) {
        var x = (env.max.x + env.min.x) / 2;
        var y = (env.max.y + env.min.y) / 2;
        var z = (env.max.z + env.min.z) / 2;
        return [x, y, z];
    };

    /**
     * Get cell envelope size.
     * @param {Object} env Object representing cell envelope
     * @returns {Array} Size array
     */
    SceneIndex3.prototype.getEnvelopeSize = function (env) {
        var x = Math.abs(env.max.x - env.min.x);
        var y = Math.abs(env.max.y - env.min.y);
        var z = Math.abs(env.max.z - env.min.z);
        return [x, y, z];
    };

    SceneIndex3.prototype.getGeometryVertices = function (obj) {
        var positions = [], vertex, uuid = obj.uuid.slice();
        obj.geometry.vertices.forEach(function (v, i) {
            vertex = v.clone().add(obj.position);
            positions.push({
                id: uuid + ',' + i,
                uuid: uuid,
                index: i,
                aabb: {
                    min: {x: vertex.x, y: vertex.y, z: vertex.z},
                    max: {x: vertex.x, y: vertex.y, z: vertex.z}
                },
                position: {
                    x: vertex.x,
                    y: vertex.y,
                    z: vertex.z
                },
                type: 'THREE.Points',
                x: vertex.x,
                y: vertex.y,
                z: vertex.z
            });
        });
        return positions;
    };

    SceneIndex3.prototype.getObject3DVertices = function (obj) {
        if (obj.geometry) {
            if (obj.geometry.vertices) {
                return this.getGeometryVertices(obj);
            } else {
                return [{
                    id: obj.uuid + ',-1',
                    uuid: obj.uuid.slice(),
                    aabb: obj.geometry.boundingBox,
                    index: -1,
                    position: {
                        x: obj.position.x,
                        y: obj.position.y,
                        z: obj.position.z
                    },
                    type: 'THREE.Object3D',
                    x: obj.position.x,
                    y: obj.position.y,
                    z: obj.position.z
                }];
            }
        }
        return [];
    };

    /**
     * Get vertex positions for each object.
     * @param {Array} records Scene object records
     * @returns {Object} Map of object element positions
     */
    SceneIndex3.prototype.getPositions = function (records) {
        var positions = {}, self = this;
        records.map(function (obj) {
            if (obj.type === 'THREE.Points') {
                if (obj.geometry.attributes.position) {
                    self.getBufferedGeometryPositions(obj).forEach(function (p) {
                        positions[p.id] = p;
                    });
                } else if (obj.geometry.vertices) {
                    self.getGeometryVertices(obj).forEach(function (p) {
                       positions[p.id] = p;
                    });
                }
            } else if (obj.type === 'THREE.Object3D') {
                self.getObject3DVertices(obj).forEach(function (p) {
                    positions[p.id] = p;
                });
            }
        });
        return positions;
    };

    /**
     * Get the minimal amount of scene object metadata required for spatial
     * indexing.
     * @param {Array} objs Scene objects
     * @returns {Promise}
     */
    SceneIndex3.prototype.getSceneObjectMetadata = function (objs) {
        return new Promise(function (resolve, reject) {
            var records = [];
            objs.forEach(function (obj) {
                if (obj.matrixWorldNeedsUpdate) {
                    obj.updateMatrixWorld();
                }
                if (obj.geometry) {
                    records.push({
                        uuid: obj.uuid.slice(),
                        type: obj instanceof THREE.Points ? 'THREE.Points' : 'THREE.Object3D',
                        position: {
                            x: obj.position.x,
                            y: obj.position.y,
                            z: obj.position.z
                        },
                        geometry: {
                            attributes: {
                                position: obj.geometry.attributes &&
                                obj.geometry.attributes.hasOwnProperty('position') ?
                                    obj.geometry.attributes.position : null
                            },
                            vertices: obj.geometry.vertices ? obj.geometry.vertices : null
                        },
                        matrixWorld: obj.matrixWorld
                    });
                }
            });
            resolve(records);
        });
    };

    SceneIndex3.prototype.getSceneObjectsInView = function (viewport) {
        var camera, intersects = [], matrix, self = this;
        return new Promise(function (resolve, reject) {
            // build a frustum for the current camera view
            camera = viewport.getCamera();
            matrix = new THREE.Matrix4().multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
            self.frustum.setFromMatrix(matrix);
            // get scene objects intersecting the frustum
            viewport.scene.getModelObjects().forEach(function (obj) {
                if (obj.geometry) {
                    obj.geometry.computeBoundingBox();
                    if (self.frustum.intersectsBox(obj.geometry.boundingBox)) {
                        intersects.push(obj);
                    }
                }
            });
            resolve(intersects);
        });
    };

    /**
     * Get scene object screen coordinates.
     * @param {Array} objs Scene object metadata records
     * @param {THREE.Camera} camera Camera
     * @param {Number} width Width
     * @param {Number} height Height
     * @returns {Promise}
     */
    SceneIndex3.prototype.getScreenCoordinates = function (objs, camera, width, height) {
        var records = [], self = this, start = new Date().getTime();
        return new Promise(function (resolve, reject) {
            objs.forEach(function (obj) {
                if (obj.type === 'THREE.Points') {
                    // get the list of vertex coordinates
                    if (obj.geometry.attributes.position) {
                        //self.getBufferedGeometryPositions(obj).forEach(function (p) {
                        //    records.push(p);
                        //});
                    } else if (obj.geometry.vertices) {
                        //self.getGeometryVertices(obj).forEach(function (p) {
                        //    records.push(p);
                        //});
                    }
                } else if (obj.type === 'THREE.Object3D') {
                    records.push(getObject3DScreenCoordinates(obj, camera, width, height));
                }
            });
            console.info('Get screen coordinates %s ms', new Date().getTime() - start);
            resolve(records);
        });
    };

    /**
     * Index scene objects.
     * @param {Array} objs Scene objects
     * @returns {Promise}
     */
    SceneIndex3.prototype.indexScene = function (objs) {
        var self = this, start = new Date().getTime();
        // clear the index
        self.sceneIndex.clear();
        self.count.scene = {edges:0, faces:0, objects:0, vertices:0};
        // get scene objects data
        var records = self.getSceneObjectMetadata(objs);
        console.info('get records %s ms', new Date().getTime() - start);
        start = new Date().getTime();
        self.positions = self.getPositions(records);
        console.info('get positions %s ms', new Date().getTime() - start);
        // build scene index
        return self
            .sceneIndex
            .insertAll(self.positions)
            .then(function () {
                self.dispatchEvent({type: FOUR.EVENT.UPDATE, description: 'scene index updated'});
                console.info('Updated scene index in %s ms', new Date().getTime() - start);
            });
    };

    /**
     * Index view.
     * @param {FOUR.Viewport3D} viewport Viewport
     * @returns {Promise}
     */
    SceneIndex3.prototype.indexView = function (viewport) {
        var self = this, start = new Date().getTime();
        var camera = viewport.getCamera();
        var width = viewport.domElement.clientWidth;
        var height = viewport.domElement.clientHeight;
        self.clearViewIndex();
        self.getSceneObjectsInView(viewport)
            .then(self.getSceneObjectMetadata)
            .then(function (objs) {
                return self.getScreenCoordinates(objs, camera, width, height);
            })
            .then(function (objs) {
                //return self.viewIndex.insertAll(objs);
                objs.forEach(function (obj) {
                    self.viewIndex.push(obj);
                });
                return Promise.resolve();
            })
            .then(function () {
                self.dispatchEvent({type: FOUR.EVENT.UPDATE, description: 'view index updated'});
                console.info('Updated view index in %s ms', new Date().getTime() - start);
            });
    };

    return SceneIndex3;

}());
