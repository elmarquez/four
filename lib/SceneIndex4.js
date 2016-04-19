/**
 * goals:
 *      - search by type
 *      - find buckets in the camera view
 *      - find vertices near other vertices
 *      - compute view index in less than one second
 *      - execute indexing in a worker
 *
 * - hash function should take position and power of two for generating the hash key
 * - need a (sparse) hierarchical representation of the division of space
 * - need to maintain bounding boxes defining the limit of each bucket, including the
 *   entire model
 * - all index data should be stored in typed arrays
 *
 * marquee selection: can compute index at camera change or at selection time
 *
 */
FOUR.SceneIndex4 = (function () {

    //-------------------------------------------------------------------------
    // Worker functions

    function getObject3DScreenCoordinates(obj, camera, clientWidth, clientHeight) {
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
                    x: x + width,
                    y: y + height,
                    z: 0
                },
                min: {
                    x: x,
                    y: y,
                    z: 0
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

    function getVertexScreenCoordinates(vertex, camera, screenWidth, screenHeight) {
        var pos = new THREE.Vector3().copy(vertex);
        pos.project(camera);
        // get screen coordinates
        pos.x = Math.round((pos.x + 1) * screenWidth / 2);
        pos.y = Math.round((-pos.y + 1) * screenHeight / 2);
        pos.z = 0;
        return pos;
    }

    function setScreenCoordinates(obj, camera, screenWidth, screenHeight) {
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
    function SceneIndex4(config) {
        THREE.EventDispatcher.call(this);
        config = config || {};

        var self = this;
        self.SCRIPTS = {
            EVAL: '/vendor/parallel.js/lib/eval.js',
            THREE: '/vendor/three.js/three.js'
        };

        self.count = {
            scene: {edges: 0, faces: 0, objects: 0, vertices: 0},
            view: {edges: 0, faces: 0, objects: 0, vertices: 0}
        }; // TODO this should be in the index
        self.frustum = new THREE.Frustum();
        self.positions = [];
        self.sceneIndex = new THREE.Octree(config.sceneIndex || {});
        self.viewIndex = new Quadtree({
            x: 0,
            y: 0,
            height: config.viewport.domElement.clientHeight,
            width: config.viewport.domElement.clientWidth
        });
        //self.sceneIndex = new SpatialHash(config.sceneIndex || {});
        //self.viewIndex = new SpatialHash(config.viewIndex || {});
        self.viewport = config.viewport; // TODO temporary until quadtree is gone
    }

    SceneIndex4.prototype = Object.create(THREE.EventDispatcher.prototype);

    SceneIndex4.prototype.clear = function () {
        this.clearSceneIndex();
        this.clearViewIndex();
        this.dispatchEvent({type: FOUR.EVENT.UPDATE, description: 'cleared scene and view indices'});
    };

    SceneIndex4.prototype.clearSceneIndex = function () {
        this.count.scene = {edges: 0, faces: 0, objects: 0, vertices: 0};
        this.positions = [];
        //this.sceneIndex.clear();
        this.sceneIndex = new THREE.Octree(); // TODO warning! it loses the configuration
        this.dispatchEvent({type: FOUR.EVENT.UPDATE, description: 'cleared scene index'});
    };

    SceneIndex4.prototype.clearViewIndex = function () {
        this.count.view = {edges: 0, faces: 0, objects: 0, vertices: 0};
        // this.viewIndex.clear();
        this.viewIndex = new Quadtree({
            x: 0,
            y: 0,
            height: this.viewport.domElement.clientHeight,
            width: this.viewport.domElement.clientWidth
        });
        this.dispatchEvent({type: FOUR.EVENT.UPDATE, description: 'cleared view index'});
    };

    SceneIndex4.prototype.createSceneIndexingJob = function (objs) {
        var job = {
            meta: [],
            objs: objs,
            vertices: []
        };
        return Promise.resolve(job);
    };

    SceneIndex4.prototype.createViewIndexingJob = function (viewport) {
        var job = {
            meta: [],
            objs: [],
            rectangles: [],
            types: [],
            vertices: [],
            viewport: viewport
        };
        return Promise.resolve(job);
    };

    /**
     * Get all entities intersecting the rectangle defined by P1 and P2.
     * @param {THREE.Vector2} p1 Screen position
     * @param {THREE.Vector2} p2 Screen position
     */
    SceneIndex4.prototype.get = function (p1, p2) {
        // get the list of screen index buckets intersected by the rectangle
        throw new Error('not implemented');
    };

    SceneIndex4.prototype.getBufferedGeometryVertices = function (obj) {
        var i, positions = [], vertex, uuid = obj.uuid.slice();
        for (i = 0; i < obj.geometry.attributes.position.count; i += 3) {
            vertex = new THREE.Vector3(
                obj.geometry.attributes.position.array[i],
                obj.geometry.attributes.position.array[i + 1],
                obj.geometry.attributes.position.array[i + 2]);
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
    SceneIndex4.prototype.getEnvelopeCenter = function (env) {
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
    SceneIndex4.prototype.getEnvelopeSize = function (env) {
        var x = Math.abs(env.max.x - env.min.x);
        var y = Math.abs(env.max.y - env.min.y);
        var z = Math.abs(env.max.z - env.min.z);
        return [x, y, z];
    };

    SceneIndex4.prototype.getGeometryVertices = function (obj) {
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

    SceneIndex4.prototype.getObject3DVertices = function (obj) {
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
     * @param {Object} records Scene object records
     * @returns {Promise}
     */
    SceneIndex4.prototype.getPositions = function (records) {
        var self = this, vertices;
        //var start = new Date().getTime();
        return new Promise(function (resolve, reject) {
            records.meta.forEach(function (obj, i) {
                vertices = [];
                if (obj.type === 'THREE.Points') {
                    if (obj.geometry.attributes.position) {
                        self.getBufferedGeometryVertices(obj).forEach(function (p) {
                            vertices.push(p.x);
                            vertices.push(p.y);
                            vertices.push(p.z);
                        });
                    } else if (obj.geometry.vertices) {
                        self.getGeometryVertices(obj).forEach(function (p) {
                            vertices.push(p.x);
                            vertices.push(p.y);
                            vertices.push(p.z);
                        });
                    }
                } else if (obj.type === 'THREE.Object3D') {
                    self.getObject3DVertices(obj).forEach(function (p) {
                        vertices.push(p.x);
                        vertices.push(p.y);
                        vertices.push(p.z);
                    });
                }
                records.vertices[i] = vertices;
            });
            //console.info('get positions in %s ms', new Date().getTime() - start);
            resolve(records);
        });
    };

    /**
     * Get the minimal amount of scene object metadata required for spatial
     * indexing.
     * @param {Array} objs Scene objects
     * @returns {Promise}
     */
    SceneIndex4.prototype.getSceneObjectMetadata = function (job) {
        return new Promise(function (resolve, reject) {
            job.objs.forEach(function (obj) {
                if (obj.matrixWorldNeedsUpdate) {
                    obj.updateMatrixWorld();
                }
                if (obj.geometry) {
                    job.meta.push({
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
            //console.info('meta', job.meta.length);
            resolve(job);
        });
    };

    SceneIndex4.prototype.getSceneObjectScreenRectangles = function (job) {
        var i, j = 0, maxX, maxY, minX, minY, p = {x: 0, y: 0, z: 0}, rec;

        function add (minX, minY, maxX, maxY) {
            rec = {
                max: {x: p.x, y: p.y, z: p.z},
                min: {x: p.x, y: p.y, z: p.z},
                x: minX,
                y: minY,
                width: maxX - minX,
                height: maxY - minY
            };
            job.rectangles.push(rec);
        }

        return new Promise(function (resolve, reject) {
            for (i = 0; i < job.vertices.length; i++) {
                if (job.meta[i].type === 'THREE.Object3D') {
                    // bounding box is equal to the max, min vertex coordinates
                    maxX = -Infinity;
                    maxY = -Infinity;
                    minX = Infinity;
                    minY = Infinity;
                    for (j = 0; j < job.vertices[i].length; j += 3) {
                        p.x = job.vertices[i][j];
                        p.y = job.vertices[i][j + 1];
                        p.z = job.vertices[i][j + 2];
                        maxX = p.x > maxX ? p.x : maxX;
                        maxY = p.y > maxY ? p.y : maxY;
                        minX = p.x < minX ? p.x : minX;
                        minY = p.y < minY ? p.y : minY;
                    }
                    // the top corner is in the screen space
                    if (maxX >= 0 && maxY >= 0) {
                        // the rectangle is completely within the screen space
                        if (minX >= 0 && minY >= 0) {
                            rec = {
                                max: {x: maxX, y: maxY, z: 0},
                                min: {x: minX, y: minY, z: 0},
                                x: minX,
                                y: minY,
                                width: maxX - minX,
                                height: maxY - minY
                            };
                        } else {
                            // the rectangle is partially within the screen
                            // space
                            rec = {
                                max: {x: maxX, y: maxY, z: 0},
                                min: {
                                    x: minX >= 0 ? minX : 0,
                                    y: minY >= 0 ? minY : 0,
                                    z: 0
                                },
                                x: minX >= 0 ? minX : 0,
                                y: minY >= 0 ? minY : 0,
                                width: maxX,
                                height: maxY
                            };
                        }
                        job.rectangles.push(rec);
                    }
                } else if (job.meta[i].type === 'THREE.Points') {
                    // bounding box is equal to the screen position of each vertex
                    for (j = 0; j < job.vertices[i].length; j += 3) {
                        p.x = job.vertices[i][j];
                        p.y = job.vertices[i][j + 1];
                        p.z = job.vertices[i][j + 2];
                        rec = {
                            max: {x: p.x, y: p.y, z: p.z},
                            min: {x: p.x, y: p.y, z: p.z},
                            x: p.x,
                            y: p.y,
                            width: 0,
                            height: 0
                        };
                        if (p.x >= 0 && p.y >= 0) {
                            job.rectangles.push(rec);
                        }
                    }
                } else {
                    job.rectangles.push(null);
                }
            }
            resolve(job);
        });
    };

    /**
     * Get the list of scene objects in the camera view.
     * @param {Object} job Indexing job
     * @returns {Promise}
     */
    SceneIndex4.prototype.getSceneObjectsInView = function (job) {
        var camera, matrix, self = this;
        return new Promise(function (resolve, reject) {
            // build a frustum for the current camera view
            camera = job.viewport.getCamera();
            matrix = new THREE.Matrix4().multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
            self.frustum.setFromMatrix(matrix);
            // get scene objects intersecting the frustum
            job.viewport.scene.getModelObjects().forEach(function (obj) {
                if (obj.geometry) {
                    obj.geometry.computeBoundingBox();
                    if (self.frustum.intersectsBox(obj.geometry.boundingBox)) {
                        job.objs.push(obj);
                    }
                }
            });
            //console.info('objects', job.objs.length);
            resolve(job);
        });
    };

    SceneIndex4.prototype.getSceneObjectVertices = function (job) {
        var self = this;
        //var start = new Date().getTime(), vertices;
        return new Promise(function (resolve, reject) {
            job.objs.forEach(function (obj, i) {
                job.vertices[i] = [];
                function add(p) {
                    job.vertices[i] = job.vertices[i].concat([p.x, p.y, p.z]);
                }

                if (job.meta[i].type === 'THREE.Points') {
                    if (job.meta[i].geometry.attributes.position) {
                        self.getBufferedGeometryVertices(obj).forEach(add);
                    } else if (job.meta[i].geometry.vertices) {
                        self.getGeometryVertices(obj).forEach(add);
                    }
                } else if (job.meta[i].type === 'THREE.Object3D') {
                    self.getObject3DVertices(obj).forEach(add);
                }
            });
            //console.info('get %s vertices in %s ms', job.vertices.length, new Date().getTime() - start);
            resolve(job);
        });
    };

    /**
     * Get the vertex screen coordinates.
     * @param {Object} job Indexing job
     * @returns {Promise}
     */
    SceneIndex4.prototype.getVertexScreenCoordinates = function (job) {
        var i, j, v = {x: 0, y: 0, z: 0}, q;
        var camera = job.viewport.getCamera();
        var width = job.viewport.domElement.clientWidth;
        var height = job.viewport.domElement.clientHeight;
        //var start = new Date().getTime();
        return new Promise(function (resolve, reject) {
            for (i = 0; i < job.vertices.length; i++) {
                for (j = 0; j < job.vertices[i].length; j += 3) {
                    v.x = job.vertices[i][j];
                    v.y = job.vertices[i][j + 1];
                    v.z = job.vertices[i][j + 2];
                    q = getVertexScreenCoordinates(v, camera, width, height);
                    job.vertices[i][j] = q.x;
                    job.vertices[i][j + 1] = q.y;
                    job.vertices[i][j + 2] = q.z;
                }
            }
            //console.info('screen coordinates in %s ms', new Date().getTime() - start);
            resolve(job);
        });
    };

    /**
     * Get the list of vertices in front of the camera plane.
     * @param {Object} job Indexing job
     * @returns {Promise}
     */
    SceneIndex4.prototype.getVerticesInFrontOfCameraPlane = function (job) {
        var self = this;
        //var start = new Date().getTime(), vertices;
        return new Promise(function (resolve, reject) {
            // TODO filter the list of vertices in the view
            //console.info('%s vertices in view in %s ms', job.vertices.length, new Date().getTime() - start);
            resolve(job);
        });
    };

    /**
     * Index scene objects.
     * @param {Array} objs Scene objects
     * @returns {Promise}
     */
    SceneIndex4.prototype.indexScene = function (objs) {
        var self = this, start = new Date().getTime();
        self.clearSceneIndex();
        return self
            .createSceneIndexingJob(objs)
            .then(self.getSceneObjectMetadata.bind(self))
            .then(self.getSceneObjectVertices.bind(self))
            .then(self.updateSceneIndex.bind(self))
            .then(function () {
                console.info('Updated scene index in %s ms', new Date().getTime() - start);
                self.dispatchEvent({type: FOUR.EVENT.UPDATE, description: 'scene index updated'});
            });
    };

    /**
     * Index view.
     * @param {FOUR.Viewport3D} viewport Viewport
     * @returns {Promise}
     */
    SceneIndex4.prototype.indexView = function (viewport) {
        var self = this, start = new Date().getTime();
        self.clearViewIndex();
        return self
            .createViewIndexingJob(viewport)
            .then(self.getSceneObjectsInView.bind(self))
            .then(self.getSceneObjectMetadata) // TODO probably don't need this
            .then(self.getSceneObjectVertices.bind(self))
            .then(self.getVerticesInFrontOfCameraPlane.bind(self)) // TODO check for vertices in front of the camera plane
            .then(self.getVertexScreenCoordinates.bind(self))
            .then(self.getSceneObjectScreenRectangles.bind(self))
            .then(self.updateViewIndex.bind(self))
            .then(function (job) {
                console.info('Updated view index in %s ms', new Date().getTime() - start);
                console.info('objects %s vertices %s rectangles %s', job.objs.length, job.vertices.length, job.rectangles.length);
                self.dispatchEvent({type: FOUR.EVENT.UPDATE, description: 'view index updated'});
            });
    };

    /**
     * Add geometry to view index.
     * @param {Object} job Indexing job
     * @returns {Promise}
     */
    SceneIndex4.prototype.updateSceneIndex = function (job) {
        var self = this;
        return new Promise(function (resolve, reject) {
            job.objs.forEach(function (obj) {
                self.sceneIndex.add(obj, {useVertices: true});
            });
            self.sceneIndex.update();
            resolve(job);
        });
    };
    /**
     * Add geometry to view index.
     * @param {Object} job Indexing job
     * @returns {Promise}
     */
    SceneIndex4.prototype.updateViewIndex = function (job) {
        var self = this;
        return new Promise(function (resolve, reject) {
            job.objs.forEach(function (obj, i) {
                job.rectangles.forEach(function (rec, j) {
                    if (rec) {
                        self.viewIndex.push({
                            uuid: obj.uuid.slice(),
                            x: rec.x,
                            y: rec.y,
                            height: rec.height,
                            width: rec.width,
                            index: -1,
                            type: job.meta[i].type
                        });
                    }
                });
            });
            resolve(job);
        });
    };

    return SceneIndex4;

}());
