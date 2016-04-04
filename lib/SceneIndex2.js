/* globals getPosition */
FOUR.SceneIndex2 = (function () {

    /**
     * Camera view object and object element index. The index supports search
     * for object and object element selection. The indexer can accept a
     * function to enable indexing of arbitrary element properties.
     * TODO enable support for multiple viewports
     * @param {Object} config Configuration
     * @constructor
     */
    function SceneIndex2(config) {
        THREE.EventDispatcher.call(this);
        config = config || {};

        var self = this;
        self.count = {
            scene: {edges:0, faces:0, objects:0, vertices:0},
            view: {edges:0, faces:0, objects:0, vertices:0}
        };
        self.frustum = new THREE.Frustum();
        self.positions = [];
        self.sceneIndex = new SpatialHash();
        self.viewIndex = new SpatialHash();

        Object.keys(config).forEach(function (key) {
            self[key] = config[key];
        });
    }

    SceneIndex2.prototype = Object.create(THREE.EventDispatcher.prototype);

    SceneIndex2.prototype.clear = function () {
        this.count = {
            scene: {edges:0, faces:0, objects:0, vertices:0},
            view: {edges:0, faces:0, objects:0, vertices:0}
        };
        this.frustum = new THREE.Frustum();
        this.positions = [];
        this.sceneIndex.clear();
        this.viewIndex.clear();
        console.info('Cleared scene and view indices');
        this.dispatchEvent({type: FOUR.EVENT.UPDATE, description: 'cleared scene and view indices'});
    };

    /**
     * Get all entities intersecting the rectangle defined by P1 and P2.
     * @param {THREE.Vector2} p1 Screen position
     * @param {THREE.Vector2} p2 Screen position
     */
    SceneIndex2.prototype.get = function (p1, p2) {
        // get the list of screen index buckets intersected by the rectangle
        throw new Error('not implemented');
    };

    SceneIndex2.prototype.getBufferedGeometryPositions = function (obj) {
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
    SceneIndex2.prototype.getEnvelopeCenter = function (env) {
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
    SceneIndex2.prototype.getEnvelopeSize = function (env) {
        var x = Math.abs(env.max.x - env.min.x);
        var y = Math.abs(env.max.y - env.min.y);
        var z = Math.abs(env.max.z - env.min.z);
        return [x, y, z];
    };

    SceneIndex2.prototype.getGeometryVertices = function (obj) {
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
                type: 'THREE.Points',
                x: vertex.x,
                y: vertex.y,
                z: vertex.z
            });
        });
        return positions;
    };

    SceneIndex2.prototype.getObject3DScreenCoordinates = function (obj, camera, clientWidth, clientHeight) {
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

    SceneIndex2.prototype.getObject3DVertices = function (obj) {
        if (obj.geometry) {
            if (obj.geometry.vertices) {
                return this.getGeometryVertices(obj);
            } else {
                return [{
                    id: obj.uuid + ',-1',
                    uuid: obj.uuid.slice(),
                    aabb: obj.geometry.boundingBox,
                    index: -1,
                    type: 'THREE.Object3D',
                    x: obj.position.x,
                    y: obj.position.y,
                    z: obj.position.z
                }];
            }
        }
        return [];
    };

    SceneIndex2.prototype.getPointsScreenCoordinates = function (obj, camera, clientWidth, clientHeight) {
        var i, p, total = 0, uuid = obj.uuid.slice(), vertex;
        if (obj.geometry.vertices) {
            for (i = 0; i < obj.geometry.vertices.length; i++) {
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

    SceneIndex2.prototype.getPositions = function (records) {
        var p, self = this;
        self.positions = [];
        records.map(function (obj) {
            if (obj.type === 'THREE.Points') {
                if (obj.geometry.vertices) {
                    p = self.getGeometryVertices(obj);
                    self.positions = self.positions.concat(p);
                } else if (obj.geometry.attributes.position) {
                    p = self.getBufferedGeometryPositions(obj);
                    self.positions = self.positions.concat(p);
                }
            } else if (obj.type === 'THREE.Object3D') {
                p = self.getObject3DVertices(obj);
                self.positions = self.positions.concat(p);
            }
        });
        return self.positions;
    };

    SceneIndex2.prototype.getRecords = function (objs) {
        return objs.reduce(function (last, obj) {
            if (obj.matrixWorldNeedsUpdate) {
                obj.updateMatrixWorld();
            }
            if (obj.geometry) {
                obj.geometry.computeBoundingBox();
                last.push({
                    uuid: obj.uuid.slice(),
                    type: obj instanceof THREE.Points ? 'THREE.Points' : 'THREE.Object3D',
                    position: obj.position.clone(),
                    geometry: {
                        attributes: {
                            position: obj.geometry.attributes &&
                                obj.geometry.attributes.hasOwnProperty('position') ?
                                obj.geometry.attributes.position : null
                        },
                        vertices: obj.geometry.vertices ? obj.geometry.vertices : null
                    }
                });
            }
            return last;
        }, []);
    };

    SceneIndex2.prototype.getViewBuckets = function (frustum) {};

    SceneIndex2.prototype.getViewObjects = function (buckets) {};

    /**
     * Index scene objects.
     * @param {Array} objs Scene objects
     * @returns {Promise}
     */
    SceneIndex2.prototype.indexScene = function (objs) {
        var self = this, start = new Date().getTime();
        return self
            .sceneIndex
            .insertAll(objs)
            .then(function (data) {
                self.count.scene = data.count;
                this.dispatchEvent({type: FOUR.EVENT.UPDATE, description: 'scene index updated'});
                console.info('Added %s objects, %s vertices to the view index in %s ms',
                    self.count.objects,
                    self.count.vertices,
                    new Date().getTime() - start);
            });
    };

    SceneIndex2.prototype.indexView = function (scene, camera, width, height) {
        var index, obj, objects = 0, matrix, self = this,
            start = new Date().getTime(), vertices = 0, uuid;
        // clear the index
        self.viewIndex.clear();
        self.count.view = {edges:0, faces:0, objects:0, vertices:0};
        // build a frustum for the current camera view
        matrix = new THREE.Matrix4().multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
        self.frustum.setFromMatrix(matrix);
        // get a list of entities intersecting the frustum
        self.sceneIndex.getEntitiesIntersectingFrustum(self.frustum).forEach(function (uuid) {
            objects += 1;
            // TODO store this data in the scene index
            obj = scene.getObjectByProperty('uuid', uuid);
            // switch indexing strategy depending on the type of scene object
            if (obj instanceof THREE.Points) {
                vertices += self.indexPointsScreenCoordinates(obj, camera, width, height);
            } else if (obj instanceof THREE.Object3D) {
                vertices += self.indexObject3DScreenCoordinates(obj, camera, width, height);
            }
        });
        this.dispatchEvent({type: FOUR.EVENT.UPDATE, description: 'view index updated'});
        console.info('Added %s objects, %s vertices to the view index in %s ms', objects, vertices, new Date().getTime() - start);
    };

    SceneIndex2.prototype.insert = function (obj) {};

    SceneIndex2.prototype.insertIntoSceneIndex = function (record) {};

    SceneIndex2.prototype.insertIntoViewIndex = function (record) {};

    SceneIndex2.prototype.remove = function (obj) {};

    SceneIndex2.prototype.update = function (obj) {};

    return SceneIndex2;

}());
