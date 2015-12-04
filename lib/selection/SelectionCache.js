FOUR.SelectionCache = (function () {

  function SelectionCache (context) {
    this._cachedVertices = [];
    this._cachedCentroidPoints = [];
    // dirty flag for when the camera or scene changes.
    this._cameraProjectionDirty = true;
    this._dirtyVerts = true;
    // perhaps you'd like to use the centroids instead?!
    this._dirtyCentroids = true;

    // this is here so the user can turn the cache on/off via the browser
    this.active = false;
    this.context = context;
    this.projScreenMatrix = new THREE.Matrix4();
  }

  SelectionCache.prototype.getCentroids = function () {
    if (this._dirtyCentroids || this._cachedCentroidPoints.length === 0) {
      this._cachedCentroidPoints = [];
      this.setCentroidPoints();
      this._dirtyCentroids = false;
    }
    return this._cachedCentroidPoints;
  };

  SelectionCache.prototype.getUnitVertCoordinates = function () {
    if (this._dirtyVerts || this._cachedVertices.length === 0 || !this.active) {
      this._cachedVertices = [];
      this.setVerticeCache();
      this._dirtyVerts = false;
    }
    return this._cachedVertices;
  };

  SelectionCache.prototype.setCentroidPoints = function () {
    var units = [], verts = [], child, prevChild, unit, vector, pos, temp, i;
    for (i = 0; i < this.context.collisions.length; i++) {
      // child = this._threeJsContext._scene.children[i];
      child.updateMatrixWorld();
      unit = {};
      vector = child.position.clone();

      pos = this.toScreenXY(vector);
      unit.pos = pos;

      this._cachedCentroidPoints.push(unit);
      prevChild = child.name;
    }
  };

  SelectionCache.prototype.setDirty = function () {
    this._dirtyVerts = true;
    this._dirtyCentroids = true;
    this._cameraProjectionDirty = true;

    this._cachedVertices = [];
    this._cachedCentroidPoints = [];
  };

  SelectionCache.prototype.setVerticeCache = function () {
    var verts = [], child, unit, vector, pos, i, q;
    for (i = 0; i < this.context.collisions.length; i++) {
      child = this.context.collisions[i];
      child.updateMatrixWorld();

      // this is a silly way to list the potential vertices
      // but this makes it easy to deselect some verts.
      // this setup is only for cubes of course.  you could just reference the vertices in the geometry.
      verts = [
        child.geometry.vertices[0],
        child.geometry.vertices[1],
        child.geometry.vertices[2],
        child.geometry.vertices[3],
        child.geometry.vertices[4],
        child.geometry.vertices[5],
        child.geometry.vertices[6],
        child.geometry.vertices[7]
      ];

      for (q = 0; q < verts.length; q++) {
        unit = {};
        vector = verts[q].clone();
        vector.applyMatrix4(child.matrixWorld);

        pos = this.toScreenXY(vector);

        unit.id = child.id;
        unit.pos = pos;
        unit.mesh = child;

        this._cachedVertices.push(unit);
      }
    }
  };

  /**
   * Unprojects a position.
   * @param pos
   * @returns {{x: *, y: *}}
   */
  SelectionCache.prototype.toScreenXY = function (pos) {
    if (this._cameraProjectionDirty || !this.active) {
      this.projScreenMatrix.multiplyMatrices(this.context.cameras.liveCam.projectionMatrix, this.context.cameras.liveCam.matrixWorldInverse);
      this._cameraProjectionDirty = false;
    }
    pos.applyProjection(this.projScreenMatrix);
    return {
      x: ( pos.x + 1 ) * this.context.jqContainer.width() / 2 + this.context.jqContainer.offset().left,
      y: ( -pos.y + 1) * this.context.jqContainer.height() / 2 + this.context.jqContainer.offset().top
    };
  };

  return SelectionCache;

}());
