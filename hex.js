///<reference path="babylon.d.ts" />
///<reference path="babylon.gui.d.ts" />
class HexMetrics {
    static getFirstCorner(direction) {
        return HexMetrics.corners[direction];
    }
    static getSecondCorner(direction) {
        return HexMetrics.corners[direction + 1];
    }
    static getFirstSolidCorner(direction) {
        return HexMetrics.corners[direction].scale(HexMetrics.solidFactor);
    }
    static getSecondSolidCorner(direction) {
        return HexMetrics.corners[direction + 1].scale(HexMetrics.solidFactor);
    }
    static getSolidEdgeMiddle(direction) {
        return (HexMetrics.corners[direction]
            .add(HexMetrics.corners[direction + 1])
            .scale(0.5 * HexMetrics.solidFactor));
    }
    static getBridge(direction) {
        return this.corners[direction].add(this.corners[direction + 1]).scale(HexMetrics.blendFactor);
    }
    static terraceLerp(a, b, step) {
        const h = step * HexMetrics.horizontalTerraceStepSize, v = ~~((step + 1) / 2.0) * HexMetrics.verticalTerraceStepSize, t = a.clone();
        t.x += (b.x - a.x) * h;
        t.z += (b.z - a.z) * h;
        t.y += (b.y - a.y) * v;
        return t;
    }
    static terraceColorLerp(a, b, step) {
        const h = step * HexMetrics.horizontalTerraceStepSize;
        return BABYLON.Color4.Lerp(a, b, h);
    }
    static getEdgeType(elevation1, elevation2) {
        if (elevation1 === elevation2) {
            return HexEdgeType.Flat;
        }
        const delta = elevation2 - elevation1;
        if (delta == 1 || delta == -1) {
            return HexEdgeType.Slope;
        }
        return HexEdgeType.Cliff;
    }
    static sampleNoise(position) {
        return Texture.sample(HexMetrics.noiseTexture, position);
    }
    static perturb(position) {
        let sample = HexMetrics.sampleNoise(position);
        return new BABYLON.Vector3(position.x + (sample.x * 2.0 - 1.0) * HexMetrics.cellPerturbStrength, position.y, position.z + (sample.z * 2.0 - 1.0) * HexMetrics.cellPerturbStrength);
    }
}
HexMetrics.outerToInner = 0.866025404;
HexMetrics.innerToOuter = 1.0 / HexMetrics.outerToInner;
HexMetrics.outerRadius = 10.0;
HexMetrics.innerRadius = HexMetrics.outerRadius * HexMetrics.outerToInner;
HexMetrics.solidFactor = 0.8;
HexMetrics.blendFactor = 1.0 - HexMetrics.solidFactor;
HexMetrics.elevationStep = 3.0;
HexMetrics.terracesPerSlope = 2;
HexMetrics.terraceSteps = HexMetrics.terracesPerSlope * 2 + 1;
HexMetrics.horizontalTerraceStepSize = (1.0 / HexMetrics.terraceSteps);
HexMetrics.verticalTerraceStepSize = (1.0 / (HexMetrics.terracesPerSlope + 1));
HexMetrics.noiseScale = 0.7;
HexMetrics.cellPerturbStrength = 4.0;
HexMetrics.elevationPerturbStrength = 1.5;
HexMetrics.chunkSizeX = 5;
HexMetrics.chunkSizeZ = 5;
HexMetrics.streamBedElevationOffset = -1.0;
HexMetrics.riverSurfaceElevationOffset = -0.5;
HexMetrics.corners = [
    new BABYLON.Vector3(0.0, 0.0, HexMetrics.outerRadius),
    new BABYLON.Vector3(HexMetrics.innerRadius, 0.0, 0.5 * HexMetrics.outerRadius),
    new BABYLON.Vector3(HexMetrics.innerRadius, 0.0, -0.5 * HexMetrics.outerRadius),
    new BABYLON.Vector3(0.0, 0.0, -HexMetrics.outerRadius),
    new BABYLON.Vector3(-HexMetrics.innerRadius, 0.0, -0.5 * HexMetrics.outerRadius),
    new BABYLON.Vector3(-HexMetrics.innerRadius, 0.0, 0.5 * HexMetrics.outerRadius),
    new BABYLON.Vector3(0.0, 0.0, HexMetrics.outerRadius)
];
class Texture {
    constructor(data, width, height) {
        this.data = data;
        this.width = width;
        this.height = height;
    }
    static sample(texture, position) {
        const x = Math.abs(Math.floor(position.x * HexMetrics.noiseScale)), z = Math.abs(Math.floor(position.z * HexMetrics.noiseScale)), startOffset = 4 * (z * texture.width + x);
        return new BABYLON.Vector4(texture.data[startOffset], texture.data[startOffset + 1], texture.data[startOffset + 2], texture.data[startOffset + 3]);
    }
    // http://strauss.pas.nu/js-bilinear-interpolation.html
    static ivect(ix, iy, w) {
        // byte array, r,g,b,a
        return ((ix + w * iy) * 4);
    }
    static bilinearFiltered(srcImg, destImg, scale) {
        // c.f.: wikipedia english article on bilinear interpolation
        // taking the unit square, the inner loop looks like this
        // note: there's a function call inside the double loop to this one
        // maybe a performance killer, optimize this whole code as you need
        function inner(f00, f10, f01, f11, x, y) {
            var un_x = 1.0 - x;
            var un_y = 1.0 - y;
            return (f00 * un_x * un_y + f10 * x * un_y + f01 * un_x * y + f11 * x * y);
        }
        var i, j;
        var iyv, iy0, iy1, ixv, ix0, ix1;
        var idxD, idxS00, idxS10, idxS01, idxS11;
        var dx, dy;
        var r, g, b, a;
        for (i = 0; i < destImg.height; ++i) {
            iyv = i / scale;
            iy0 = Math.floor(iyv);
            // Math.ceil can go over bounds
            iy1 = (Math.ceil(iyv) > (srcImg.height - 1) ? (srcImg.height - 1) : Math.ceil(iyv));
            for (j = 0; j < destImg.width; ++j) {
                ixv = j / scale;
                ix0 = Math.floor(ixv);
                // Math.ceil can go over bounds
                ix1 = (Math.ceil(ixv) > (srcImg.width - 1) ? (srcImg.width - 1) : Math.ceil(ixv));
                idxD = Texture.ivect(j, i, destImg.width);
                // matrix to vector indices
                idxS00 = Texture.ivect(ix0, iy0, srcImg.width);
                idxS10 = Texture.ivect(ix1, iy0, srcImg.width);
                idxS01 = Texture.ivect(ix0, iy1, srcImg.width);
                idxS11 = Texture.ivect(ix1, iy1, srcImg.width);
                // overall coordinates to unit square
                dx = ixv - ix0;
                dy = iyv - iy0;
                // I let the r, g, b, a on purpose for debugging
                r = inner(srcImg.data[idxS00], srcImg.data[idxS10], srcImg.data[idxS01], srcImg.data[idxS11], dx, dy);
                destImg.data[idxD] = r;
                g = inner(srcImg.data[idxS00 + 1], srcImg.data[idxS10 + 1], srcImg.data[idxS01 + 1], srcImg.data[idxS11 + 1], dx, dy);
                destImg.data[idxD + 1] = g;
                b = inner(srcImg.data[idxS00 + 2], srcImg.data[idxS10 + 2], srcImg.data[idxS01 + 2], srcImg.data[idxS11 + 2], dx, dy);
                destImg.data[idxD + 2] = b;
                a = inner(srcImg.data[idxS00 + 3], srcImg.data[idxS10 + 3], srcImg.data[idxS01 + 3], srcImg.data[idxS11 + 3], dx, dy);
                destImg.data[idxD + 3] = a;
            }
        }
    }
}
var HexDirection;
(function (HexDirection) {
    HexDirection[HexDirection["NE"] = 0] = "NE";
    HexDirection[HexDirection["E"] = 1] = "E";
    HexDirection[HexDirection["SE"] = 2] = "SE";
    HexDirection[HexDirection["SW"] = 3] = "SW";
    HexDirection[HexDirection["W"] = 4] = "W";
    HexDirection[HexDirection["NW"] = 5] = "NW";
})(HexDirection || (HexDirection = {}));
(function (HexDirection) {
    function opposite(direction) {
        return direction < 3 ? (direction + 3) : (direction - 3);
    }
    HexDirection.opposite = opposite;
    function previous(direction) {
        return direction === HexDirection.NE ? HexDirection.NW : (direction - 1);
    }
    HexDirection.previous = previous;
    function previous2(direction) {
        direction -= 2;
        return direction >= HexDirection.NE ? direction : (direction + 6);
    }
    HexDirection.previous2 = previous2;
    function next(direction) {
        return direction === HexDirection.NW ? HexDirection.NE : (direction + 1);
    }
    HexDirection.next = next;
    function next2(direction) {
        direction += 2;
        return direction <= HexDirection.NW ? direction : (direction - 6);
    }
    HexDirection.next2 = next2;
})(HexDirection || (HexDirection = {}));
var HexEdgeType;
(function (HexEdgeType) {
    HexEdgeType[HexEdgeType["Flat"] = 0] = "Flat";
    HexEdgeType[HexEdgeType["Slope"] = 1] = "Slope";
    HexEdgeType[HexEdgeType["Cliff"] = 2] = "Cliff";
})(HexEdgeType || (HexEdgeType = {}));
class HexCoordinates {
    constructor(x, z) {
        this.x = x;
        this.z = z;
    }
    get y() {
        return -this.x - this.z;
    }
    static fromOffsetCoordinates(x, z) {
        return new HexCoordinates(x - Math.floor(z / 2.0), z);
    }
    static fromPosition(position) {
        let x = position.x / (HexMetrics.innerRadius * 2.0), y = -x, offset = position.z / (HexMetrics.outerRadius * 3.0);
        x -= offset;
        y -= offset;
        let ix = Math.round(x), iy = Math.round(y), iz = Math.round(-x - y);
        if (ix + iy + iz != 0) {
            let dx = Math.abs(x - ix), dy = Math.abs(y - iy), dz = Math.abs(-x - y - iz);
            if (dx > dy && dx > dz) {
                ix = -iy - iz;
            }
            else if (dz > dy) {
                iz = -ix - iy;
            }
        }
        return new HexCoordinates(ix, iz);
    }
    toString() {
        return `(${this.x}, ${this.y}, ${this.z})`;
    }
}
class HexCellColor {
    static default() {
        return HexCellColor.PASTEL_BLUE;
    }
    static random() {
        return HexCellColor.colors[Math.floor(Math.random() * HexCellColor.colors.length)];
    }
    static average(colors) {
        let avgColor = new BABYLON.Color4(0, 0, 0, 0);
        for (let i = 0; i < colors.length; i++) {
            avgColor.addInPlace(colors[i]);
        }
        avgColor.r = avgColor.r / colors.length;
        avgColor.g = avgColor.g / colors.length;
        avgColor.b = avgColor.b / colors.length;
        return avgColor;
    }
}
HexCellColor.PASTEL_BLUE = BABYLON.Color4.FromHexString("#548af8ff");
HexCellColor.PASTEL_YELLOW = BABYLON.Color4.FromHexString("#fffc1fff");
HexCellColor.PASTEL_GREEN = BABYLON.Color4.FromHexString("#20e43fff");
HexCellColor.colors = [
    BABYLON.Color4.FromColor3(BABYLON.Color3.White()),
    HexCellColor.PASTEL_YELLOW,
    HexCellColor.PASTEL_BLUE,
    HexCellColor.PASTEL_GREEN
];
class Prefabs {
    static terrain(name, scene) {
        let terrain = new HexMesh(name, scene);
        terrain.isVisible = true;
        terrain.isPickable = true;
        terrain._useColors = true;
        terrain._useCollider = true;
        terrain._useUVCoordinates = false;
        return terrain;
    }
    static rivers(name, scene) {
        let rivers = new HexMesh(name, scene);
        rivers.isVisible = true;
        rivers.isPickable = false;
        rivers._useColors = false;
        rivers._useCollider = false;
        rivers._useUVCoordinates = true;
        return rivers;
    }
}
/**
 * CAUTION: UNTIL HexCell extends BABYLON.Mesh, ALWAYS SET POSITION VIA cellPostion!!
 */
class HexCell extends BABYLON.Mesh {
    constructor(name, scene) {
        super(name, scene);
        this.neighbors = new Array(6);
        this._elevation = Number.MIN_VALUE;
        let options = {
            size: 10,
            width: 10,
            height: 10,
            updatable: true
        };
        let vertexData = BABYLON.VertexData.CreateGround(options);
        vertexData.applyToMesh(this);
    }
    getNeighbor(direction) {
        return this.neighbors[direction];
    }
    setNeighbor(direction, cell) {
        this.neighbors[direction] = cell;
        cell.neighbors[HexDirection.opposite(direction)] = this;
    }
    get elevation() {
        return this._elevation;
    }
    set elevation(elevation) {
        if (this._elevation === elevation) {
            return;
        }
        this._elevation = elevation;
        this._cellPosition.y = elevation * HexMetrics.elevationStep;
        this._cellPosition.y +=
            (HexMetrics.sampleNoise(this._cellPosition).y * 2.0 - 1.0) * HexMetrics.elevationPerturbStrength;
        if (this._hasOutgoingRiver && elevation < this.getNeighbor(this._outgoingRiver).elevation) {
            this.removeOutgoigRiver();
        }
        if (this._hasIncomingRiver && elevation > this.getNeighbor(this._incomingRiver).elevation) {
            this.removeIncomingRiver();
        }
        this.refreshPosition();
        this.refresh();
    }
    get cellPosition() {
        return this._cellPosition;
    }
    set cellPosition(position) {
        this._cellPosition = position.clone();
        this.refreshPosition();
    }
    get color() {
        return this._color;
    }
    set color(color) {
        if (this._color === color) {
            return;
        }
        this._color = color;
        this.refresh();
    }
    get hasIncomingRiver() {
        return this._hasIncomingRiver;
    }
    get hasOutgoingRiver() {
        return this._hasOutgoingRiver;
    }
    get incomingRiver() {
        return this._incomingRiver;
    }
    get outgoingRiver() {
        return this._outgoingRiver;
    }
    get hasRiver() {
        return this._hasIncomingRiver || this._hasOutgoingRiver;
    }
    get hasRiverBeginingOrEnd() {
        return this._hasIncomingRiver != this._hasOutgoingRiver;
    }
    get riverSurfaceY() {
        return ((this.elevation + HexMetrics.riverSurfaceElevationOffset) * HexMetrics.elevationStep);
    }
    hasRiverThroughEdge(direction) {
        return (this._hasIncomingRiver && this._incomingRiver === direction ||
            this._hasOutgoingRiver && this._outgoingRiver === direction);
    }
    setOutgoingRiver(direction) {
        if (this._hasOutgoingRiver && this._outgoingRiver === direction) {
            return;
        }
        const neighbor = this.getNeighbor(direction);
        if (!neighbor || this.elevation < neighbor.elevation) {
            return;
        }
        this.removeOutgoigRiver();
        if (this._hasIncomingRiver && this._incomingRiver === direction) {
            this.removeIncomingRiver();
        }
        this._hasOutgoingRiver = true;
        this._outgoingRiver = direction;
        this.refreshSelfOnly();
        neighbor.removeIncomingRiver();
        neighbor._hasIncomingRiver = true;
        neighbor._incomingRiver = HexDirection.opposite(direction);
        neighbor.refreshSelfOnly();
    }
    removeOutgoigRiver() {
        if (!this._hasOutgoingRiver) {
            return;
        }
        this._hasOutgoingRiver = false;
        this.refreshSelfOnly();
        const neighbor = this.getNeighbor(this._outgoingRiver);
        neighbor._hasIncomingRiver = false;
        neighbor.refreshSelfOnly();
    }
    removeIncomingRiver() {
        if (!this._hasIncomingRiver) {
            return;
        }
        this._hasIncomingRiver = false;
        this.refreshSelfOnly();
        const neighbor = this.getNeighbor(this._incomingRiver);
        neighbor._hasOutgoingRiver = false;
        neighbor.refreshSelfOnly();
    }
    removeRiver() {
        this.removeOutgoigRiver();
        this.removeIncomingRiver();
    }
    get streamBedY() {
        return (this._elevation + HexMetrics.streamBedElevationOffset) * HexMetrics.elevationStep;
    }
    // Sets mesh render position from cellPosition (renders it slightly above).
    refreshPosition() {
        this.position = this._cellPosition.clone();
        this.position.y += HexCell.CELL_OVERLAY_ELEVATION;
    }
    getEdgeType(direction) {
        return HexMetrics.getEdgeType(this.elevation, this.neighbors[direction].elevation);
    }
    getEdgeTypeForCell(cell) {
        return HexMetrics.getEdgeType(this.elevation, cell.elevation);
    }
    refresh() {
        if (!this.chunk)
            return;
        this.chunk.refresh();
        // Refresh all neighbor cell chunks which are not the same chunk as we're in.
        let n;
        for (let i = 0; i < this.neighbors.length; i++) {
            n = this.neighbors[i];
            if (n && n.chunk != this.chunk) {
                n.chunk.refresh();
            }
        }
    }
    refreshSelfOnly() {
        this.chunk.refresh();
    }
}
HexCell.CELL_OVERLAY_ELEVATION = 0.1;
class EdgeVertices {
    static fromCorners(corner1, corner2, outerStep = 0.25) {
        let result = new EdgeVertices();
        result.v1 = corner1;
        result.v2 = BABYLON.Vector3.Lerp(corner1, corner2, outerStep);
        result.v3 = BABYLON.Vector3.Lerp(corner1, corner2, 0.5);
        result.v4 = BABYLON.Vector3.Lerp(corner1, corner2, 1.0 - outerStep);
        result.v5 = corner2;
        return result;
    }
    static terraceLerp(a, b, step) {
        let result = new EdgeVertices();
        result.v1 = HexMetrics.terraceLerp(a.v1, b.v1, step);
        result.v2 = HexMetrics.terraceLerp(a.v2, b.v2, step);
        result.v3 = HexMetrics.terraceLerp(a.v3, b.v3, step);
        result.v4 = HexMetrics.terraceLerp(a.v4, b.v4, step);
        result.v5 = HexMetrics.terraceLerp(a.v5, b.v5, step);
        return result;
    }
}
class HexMesh extends BABYLON.Mesh {
    constructor(name, scene) {
        super(name, scene);
        this._useColors = true;
        this._useUVCoordinates = false;
        this._useCollider = true;
        this.material = HexMesh.getDefaultMaterial(scene);
        this._setReady(false);
    }
    static getDefaultMaterial(scene) {
        if (HexMesh._material === null) {
            let mat = new BABYLON.StandardMaterial("material", scene);
            mat.backFaceCulling = false;
            mat.emissiveColor = BABYLON.Color3.Black();
            mat.diffuseColor = BABYLON.Color3.White();
            // mat.specularColor = BABYLON.Color3.Black();
            // mat.wireframe = true;
            HexMesh._material = mat;
        }
        return HexMesh._material;
    }
    apply() {
        let vertexData = new BABYLON.VertexData(), normals = [];
        BABYLON.VertexData.ComputeNormals(this._vertices, this._triangles, normals);
        vertexData.positions = this._vertices;
        vertexData.indices = this._triangles;
        vertexData.normals = normals;
        if (this._useColors) {
            vertexData.colors = this._colors;
        }
        if (this._useUVCoordinates) {
            vertexData.uvs = this._uvs;
        }
        vertexData.applyToMesh(this, true);
        this._setReady(true);
        this.isPickable = this._useCollider;
    }
    clear() {
        this._vertices = [];
        this._triangles = [];
        this._colors = [];
        this._uvs = [];
    }
    addTriangle(v1, v2, v3) {
        const vertexIndex = this._vertices.length / 3;
        this.addVertex(HexMetrics.perturb(v1));
        this.addVertex(HexMetrics.perturb(v2));
        this.addVertex(HexMetrics.perturb(v3));
        this._triangles.push(vertexIndex);
        this._triangles.push(vertexIndex + 1);
        this._triangles.push(vertexIndex + 2);
    }
    addTriangleUnperturbed(v1, v2, v3) {
        let vertexIndex = this._vertices.length / 3;
        this.addVertex(v1);
        this.addVertex(v2);
        this.addVertex(v3);
        this._triangles.push(vertexIndex);
        this._triangles.push(vertexIndex + 1);
        this._triangles.push(vertexIndex + 2);
    }
    addTriangleColor1(color) {
        this.addColor(color);
        this.addColor(color);
        this.addColor(color);
    }
    addTriangleColor(color1, color2, color3) {
        this.addColor(color1);
        this.addColor(color2);
        this.addColor(color3);
    }
    addQuad(v1, v2, v3, v4) {
        const vertexIndex = this._vertices.length / 3;
        this.addVertex(HexMetrics.perturb(v1));
        this.addVertex(HexMetrics.perturb(v2));
        this.addVertex(HexMetrics.perturb(v3));
        this.addVertex(HexMetrics.perturb(v4));
        this._triangles.push(vertexIndex);
        this._triangles.push(vertexIndex + 2);
        this._triangles.push(vertexIndex + 1);
        this._triangles.push(vertexIndex + 1);
        this._triangles.push(vertexIndex + 2);
        this._triangles.push(vertexIndex + 3);
    }
    addQuadColor(color1, color2, color3, color4) {
        this.addColor(color1);
        this.addColor(color2);
        this.addColor(color3);
        this.addColor(color4);
    }
    /** Adds only two colors to the quad. */
    addQuadColor2(color1, color2) {
        this.addColor(color1);
        this.addColor(color1);
        this.addColor(color2);
        this.addColor(color2);
    }
    /** Adds a single color to the quad. */
    addQuadColor1(color) {
        this.addColor(color);
        this.addColor(color);
        this.addColor(color);
        this.addColor(color);
    }
    addVertex(vertex) {
        this._vertices.push(vertex.x);
        this._vertices.push(vertex.y);
        this._vertices.push(vertex.z);
    }
    addColor(color) {
        this._colors.push(color.r);
        this._colors.push(color.g);
        this._colors.push(color.b);
        this._colors.push(color.a);
    }
    addTriangleUV(uv1, uv2, uv3) {
        this.addUV(uv1);
        this.addUV(uv2);
        this.addUV(uv3);
    }
    addQuadUV(uv1, uv2, uv3, uv4) {
        this.addUV(uv1);
        this.addUV(uv2);
        this.addUV(uv3);
        this.addUV(uv4);
    }
    addQuadUVMinMax(uMin, uMax, vMin, vMax) {
        this.addUV(new BABYLON.Vector2(uMin, vMin));
        this.addUV(new BABYLON.Vector2(uMax, vMin));
        this.addUV(new BABYLON.Vector2(uMin, vMax));
        this.addUV(new BABYLON.Vector2(uMax, vMax));
    }
    addUV(uv) {
        this._uvs.push(uv.x);
        this._uvs.push(uv.y);
    }
}
HexMesh._material = null;
class HexGridChunk {
    constructor(terrainMesh, riversMesh) {
        this.terrain = terrainMesh;
        this.rivers = riversMesh;
        this.cells = new Array(HexMetrics.chunkSizeX * HexMetrics.chunkSizeZ);
    }
    addCell(index, cell) {
        this.cells[index] = cell;
        cell.chunk = this;
    }
    triangulate() {
        this.terrain.clear();
        this.rivers.clear();
        for (let i = 0; i < this.cells.length; i++) {
            for (let direction = HexDirection.NE; direction <= HexDirection.NW; direction++) {
                this.triangulateCell(direction, this.cells[i]);
            }
        }
        this.terrain.apply();
        this.rivers.apply();
    }
    triangulateCell(direction, cell) {
        let center = cell.cellPosition.clone(), e = EdgeVertices.fromCorners(center.add(HexMetrics.getFirstSolidCorner(direction)), center.add(HexMetrics.getSecondSolidCorner(direction)));
        if (cell.hasRiver) {
            if (cell.hasRiverThroughEdge(direction)) {
                e.v3.y = cell.streamBedY;
                if (cell.hasRiverBeginingOrEnd) {
                    this.triangulateWithRiverBeginOrEnd(direction, cell, center, e);
                }
                else {
                    this.triangulateCellWithRiver(direction, cell, center, e);
                }
            }
            else {
                this.triangulateAdjecentToRiver(direction, cell, center, e);
            }
        }
        else {
            this.triangulateEdgeFan(center, e, cell.color);
        }
        if (direction <= HexDirection.SE) {
            this.triangulateCellConnection(direction, cell, e);
        }
    }
    triangulateCellWithRiver(direction, cell, center, e) {
        let prevDir = HexDirection.previous(direction), nextDir = HexDirection.next(direction), prev2Dir = HexDirection.previous2(direction), next2Dir = HexDirection.next2(direction), oppositeDir = HexDirection.opposite(direction), centerL, centerR, m;
        if (cell.hasRiverThroughEdge(oppositeDir)) {
            centerL = center.add(HexMetrics.getFirstSolidCorner(prevDir).scale(0.25));
            centerR = center.add(HexMetrics.getSecondSolidCorner(nextDir).scale(0.25));
        }
        else if (cell.hasRiverThroughEdge(nextDir)) {
            centerL = center;
            centerR = BABYLON.Vector3.Lerp(center, e.v5, 2 / 3);
        }
        else if (cell.hasRiverThroughEdge(prevDir)) {
            centerL = BABYLON.Vector3.Lerp(center, e.v1, 2 / 3);
            centerR = center;
        }
        else if (cell.hasRiverThroughEdge(next2Dir)) {
            centerL = center;
            centerR = center.add(HexMetrics.getSolidEdgeMiddle(nextDir).scale(0.5 * HexMetrics.innerToOuter));
        }
        else {
            centerL = center.add(HexMetrics.getSolidEdgeMiddle(prevDir).scale(0.5 * HexMetrics.innerToOuter));
            centerR = center;
        }
        center = BABYLON.Vector3.Lerp(centerL, centerR, 0.5);
        m = EdgeVertices.fromCorners(BABYLON.Vector3.Lerp(centerL, e.v1, 0.5), BABYLON.Vector3.Lerp(centerR, e.v5, 0.5), 1 / 6);
        m.v3.y = center.y = e.v3.y;
        this.triangulateEdgeStrip(m, cell.color, e, cell.color);
        this.terrain.addTriangle(centerL, m.v1, m.v2);
        this.terrain.addTriangleColor1(cell.color);
        this.terrain.addQuad(centerL, center, m.v2, m.v3);
        this.terrain.addQuadColor1(cell.color);
        this.terrain.addQuad(center, centerR, m.v3, m.v4);
        this.terrain.addQuadColor1(cell.color);
        this.terrain.addTriangle(centerR, m.v4, m.v5);
        this.terrain.addTriangleColor1(cell.color);
        this.triangulateRiverQuad(centerL, centerR, m.v2, m.v4, cell.riverSurfaceY);
        this.triangulateRiverQuad(m.v2, m.v4, e.v2, e.v4, cell.riverSurfaceY);
    }
    triangulateWithRiverBeginOrEnd(direction, cell, center, e) {
        let m = EdgeVertices.fromCorners(BABYLON.Vector3.Lerp(center, e.v1, 0.5), BABYLON.Vector3.Lerp(center, e.v5, 0.5));
        m.v3.y = e.v3.y;
        this.triangulateEdgeStrip(m, cell.color, e, cell.color);
        this.triangulateEdgeFan(center, m, cell.color);
    }
    triangulateAdjecentToRiver(direction, cell, center, e) {
        if (cell.hasRiverThroughEdge(HexDirection.next(direction))) {
            if (cell.hasRiverThroughEdge(HexDirection.previous(direction))) {
                center = center.add(HexMetrics.getSolidEdgeMiddle(direction).scale(0.5 * HexMetrics.innerToOuter));
            }
            else if (cell.hasRiverThroughEdge(HexDirection.previous2(direction))) {
                center = center.add(HexMetrics.getFirstSolidCorner(direction).scale(0.25));
            }
        }
        else if (cell.hasRiverThroughEdge(HexDirection.previous(direction)) &&
            cell.hasRiverThroughEdge(HexDirection.next2(direction))) {
            center = center.add(HexMetrics.getSecondSolidCorner(direction).scale(0.25));
        }
        let m = EdgeVertices.fromCorners(BABYLON.Vector3.Lerp(center, e.v1, 0.5), BABYLON.Vector3.Lerp(center, e.v5, 0.5));
        this.triangulateEdgeStrip(m, cell.color, e, cell.color);
        this.triangulateEdgeFan(center, m, cell.color);
    }
    triangulateEdgeFan(center, edge, color) {
        this.terrain.addTriangle(center, edge.v1, edge.v2);
        this.terrain.addTriangleColor1(color);
        this.terrain.addTriangle(center, edge.v2, edge.v3);
        this.terrain.addTriangleColor1(color);
        this.terrain.addTriangle(center, edge.v3, edge.v4);
        this.terrain.addTriangleColor1(color);
        this.terrain.addTriangle(center, edge.v4, edge.v5);
        this.terrain.addTriangleColor1(color);
    }
    triangulateEdgeStrip(e1, c1, e2, c2) {
        this.terrain.addQuad(e1.v1, e1.v2, e2.v1, e2.v2);
        this.terrain.addQuadColor2(c1, c2);
        this.terrain.addQuad(e1.v2, e1.v3, e2.v2, e2.v3);
        this.terrain.addQuadColor2(c1, c2);
        this.terrain.addQuad(e1.v3, e1.v4, e2.v3, e2.v4);
        this.terrain.addQuadColor2(c1, c2);
        this.terrain.addQuad(e1.v4, e1.v5, e2.v4, e2.v5);
        this.terrain.addQuadColor2(c1, c2);
    }
    triangulateCellConnection(direction, cell, e1) {
        let neighbor = cell.getNeighbor(direction);
        if (neighbor == null) {
            return;
        }
        let bridge = HexMetrics.getBridge(direction);
        bridge.y = neighbor.cellPosition.y - cell.cellPosition.y;
        let e2 = EdgeVertices.fromCorners(e1.v1.add(bridge), e1.v5.add(bridge));
        if (cell.hasRiverThroughEdge(direction)) {
            e2.v3.y = neighbor.streamBedY;
        }
        if (cell.getEdgeType(direction) === HexEdgeType.Slope) {
            this.triangulateCellEdgeTerraces(e1, cell, e2, neighbor);
        }
        else {
            this.triangulateEdgeStrip(e1, cell.color, e2, neighbor.color);
        }
        let nextNeighborDirection = HexDirection.next(direction), nextNeighbor = cell.getNeighbor(nextNeighborDirection);
        if (direction <= HexDirection.E && nextNeighbor != null) {
            let v5 = e1.v5.add(HexMetrics.getBridge(nextNeighborDirection));
            v5.y = nextNeighbor.cellPosition.y;
            if (cell.elevation <= neighbor.elevation) {
                if (cell.elevation <= nextNeighbor.elevation) {
                    this.triangulateCellCorner(e1.v5, cell, e2.v5, neighbor, v5, nextNeighbor);
                }
                else {
                    this.triangulateCellCorner(v5, nextNeighbor, e1.v5, cell, e2.v5, neighbor);
                }
            }
            else if (neighbor.elevation <= nextNeighbor.elevation) {
                this.triangulateCellCorner(e2.v5, neighbor, v5, nextNeighbor, e1.v5, cell);
            }
            else {
                this.triangulateCellCorner(v5, nextNeighbor, e1.v5, cell, e2.v5, neighbor);
            }
        }
    }
    triangulateCellCorner(bottom, bottomCell, left, leftCell, right, rightCell) {
        let leftEdgeType = bottomCell.getEdgeTypeForCell(leftCell), rightEdgeType = bottomCell.getEdgeTypeForCell(rightCell);
        if (leftEdgeType === HexEdgeType.Slope) {
            if (rightEdgeType === HexEdgeType.Slope) {
                this.triangulateCellCornerTerraces(bottom, bottomCell, left, leftCell, right, rightCell);
            }
            else if (rightEdgeType === HexEdgeType.Flat) {
                this.triangulateCellCornerTerraces(left, leftCell, right, rightCell, bottom, bottomCell);
            }
            else {
                this.triangulateCellCornerTerracesCliff(bottom, bottomCell, left, leftCell, right, rightCell);
            }
        }
        else if (rightEdgeType === HexEdgeType.Slope) {
            if (leftEdgeType === HexEdgeType.Flat) {
                this.triangulateCellCornerTerraces(right, rightCell, bottom, bottomCell, left, leftCell);
            }
            else {
                this.triangulateCellCornerCliffTerraces(bottom, bottomCell, left, leftCell, right, rightCell);
            }
        }
        else if (leftCell.getEdgeTypeForCell(rightCell) === HexEdgeType.Slope) {
            if (leftCell.elevation < rightCell.elevation) {
                this.triangulateCellCornerCliffTerraces(right, rightCell, bottom, bottomCell, left, leftCell);
            }
            else {
                this.triangulateCellCornerTerracesCliff(left, leftCell, right, rightCell, bottom, bottomCell);
            }
        }
        else {
            this.terrain.addTriangle(bottom, left, right);
            this.terrain.addTriangleColor(bottomCell.color, leftCell.color, rightCell.color);
        }
    }
    triangulateCellCornerTerraces(begin, beginCell, left, leftCell, right, rightCell) {
        let v3 = HexMetrics.terraceLerp(begin, left, 1), v4 = HexMetrics.terraceLerp(begin, right, 1), c3 = HexMetrics.terraceColorLerp(beginCell.color, leftCell.color, 1), c4 = HexMetrics.terraceColorLerp(beginCell.color, rightCell.color, 1);
        this.terrain.addTriangle(begin, v3, v4);
        this.terrain.addTriangleColor(beginCell.color, c3, c4);
        let i, v1, v2, c1, c2;
        for (i = 2; i < HexMetrics.terraceSteps; i++) {
            v1 = v3;
            v2 = v4;
            c1 = c3;
            c2 = c4;
            v3 = HexMetrics.terraceLerp(begin, left, i);
            v4 = HexMetrics.terraceLerp(begin, right, i);
            c3 = HexMetrics.terraceColorLerp(beginCell.color, leftCell.color, i);
            c4 = HexMetrics.terraceColorLerp(beginCell.color, rightCell.color, i);
            this.terrain.addQuad(v1, v2, v3, v4);
            this.terrain.addQuadColor(c1, c2, c3, c4);
        }
        this.terrain.addQuad(v3, v4, left, right);
        this.terrain.addQuadColor(c3, c4, leftCell.color, rightCell.color);
    }
    triangulateCellCornerTerracesCliff(begin, beginCell, left, leftCell, right, rightCell) {
        let b = Math.abs(1.0 / (rightCell.elevation - beginCell.elevation)), boundry = BABYLON.Vector3.Lerp(HexMetrics.perturb(begin), HexMetrics.perturb(right), b), boundryColor = BABYLON.Color4.Lerp(beginCell.color, rightCell.color, b);
        this.trinagulateCellBoundryTriangle(begin, beginCell, left, leftCell, boundry, boundryColor);
        if (leftCell.getEdgeTypeForCell(rightCell) === HexEdgeType.Slope) {
            this.trinagulateCellBoundryTriangle(left, leftCell, right, rightCell, boundry, boundryColor);
        }
        else {
            this.terrain.addTriangleUnperturbed(HexMetrics.perturb(left), HexMetrics.perturb(right), boundry);
            this.terrain.addTriangleColor(leftCell.color, rightCell.color, boundryColor);
        }
    }
    triangulateCellCornerCliffTerraces(begin, beginCell, left, leftCell, right, rightCell) {
        let b = Math.abs(1.0 / (leftCell.elevation - beginCell.elevation)), boundry = BABYLON.Vector3.Lerp(HexMetrics.perturb(begin), HexMetrics.perturb(left), b), boundryColor = BABYLON.Color4.Lerp(beginCell.color, leftCell.color, b);
        this.trinagulateCellBoundryTriangle(right, rightCell, begin, beginCell, boundry, boundryColor);
        if (leftCell.getEdgeTypeForCell(rightCell) === HexEdgeType.Slope) {
            this.trinagulateCellBoundryTriangle(left, leftCell, right, rightCell, boundry, boundryColor);
        }
        else {
            this.terrain.addTriangleUnperturbed(HexMetrics.perturb(left), HexMetrics.perturb(right), boundry);
            this.terrain.addTriangleColor(leftCell.color, rightCell.color, boundryColor);
        }
    }
    trinagulateCellBoundryTriangle(begin, beginCell, left, leftCell, boundry, boundryColor) {
        let v2 = HexMetrics.perturb(HexMetrics.terraceLerp(begin, left, 1)), c2 = HexMetrics.terraceColorLerp(beginCell.color, leftCell.color, 1);
        this.terrain.addTriangleUnperturbed(HexMetrics.perturb(begin), v2, boundry);
        this.terrain.addTriangleColor(beginCell.color, c2, boundryColor);
        let i, v1, c1;
        for (i = 2; i < HexMetrics.terraceSteps; i++) {
            v1 = v2;
            c1 = c2;
            v2 = HexMetrics.perturb(HexMetrics.terraceLerp(begin, left, i));
            c2 = HexMetrics.terraceColorLerp(beginCell.color, leftCell.color, i);
            this.terrain.addTriangleUnperturbed(v1, v2, boundry);
            this.terrain.addTriangleColor(c1, c2, boundryColor);
        }
        this.terrain.addTriangleUnperturbed(v2, HexMetrics.perturb(left), boundry);
        this.terrain.addTriangleColor(c2, leftCell.color, boundryColor);
    }
    triangulateCellEdgeTerraces(begin, beginCell, end, endCell) {
        let e2 = EdgeVertices.terraceLerp(begin, end, 1), c2 = HexMetrics.terraceColorLerp(beginCell.color, endCell.color, 1);
        this.triangulateEdgeStrip(begin, beginCell.color, e2, c2);
        let e1, c1;
        for (let i = 2; i < HexMetrics.terraceSteps; i++) {
            e1 = e2;
            c1 = c2;
            e2 = EdgeVertices.terraceLerp(begin, end, i);
            c2 = HexMetrics.terraceColorLerp(beginCell.color, endCell.color, i);
            this.triangulateEdgeStrip(e1, c1, e2, c2);
        }
        this.triangulateEdgeStrip(e2, c2, end, endCell.color);
    }
    triangulateRiverQuad(v1, v2, v3, v4, y) {
        v1.y = v2.y = v3.y = v4.y = y;
        this.rivers.addQuad(v1, v2, v3, v4);
    }
    refresh() {
        HexGrid.CHUNKS_TO_REFRESH.set(this.terrain.name, this);
    }
    doRefresh() {
        this.triangulate();
    }
}
class HexGrid {
    constructor(scene) {
        this.cellCountX = 6;
        this.cellCountZ = 6;
        this.chunkCountX = 3;
        this.chunkCountZ = 3;
        this.defaultColor = HexCellColor.PASTEL_BLUE;
        this._scene = scene;
        this.cellCountX = this.chunkCountX * HexMetrics.chunkSizeX;
        this.cellCountZ = this.chunkCountZ * HexMetrics.chunkSizeZ;
    }
    static refresh() {
        HexGrid.CHUNKS_TO_REFRESH.forEach((c, k, _) => {
            c.doRefresh();
        });
        HexGrid.CHUNKS_TO_REFRESH = new Map();
    }
    generate() {
        let texture = new BABYLON.Texture('./assets/gfx/material/noise.png', this._scene, false, false, BABYLON.Texture.BILINEAR_SAMPLINGMODE, null, null, null, null, BABYLON.Engine.TEXTUREFORMAT_RGBA);
        window.txtr = texture;
        let convert = (incomingData) => {
            var i, l = incomingData.length;
            var outputData = new Float32Array(incomingData.length);
            for (i = 0; i < l; i++) {
                outputData[i] = incomingData[i] / 256.0;
            }
            return outputData;
        };
        texture.onLoadObservable.addOnce((event, estate) => {
            let noiseTexture, bilinearTexture;
            noiseTexture = new Texture(convert(texture.readPixels()), texture.getSize().width, texture.getSize().height);
            bilinearTexture = new Texture(Float32Array.from(noiseTexture.data), noiseTexture.width, noiseTexture.height);
            Texture.bilinearFiltered(noiseTexture, bilinearTexture, 1.0);
            HexMetrics.noiseTexture = bilinearTexture;
            this.makeChunks();
            this.makeCells();
            this.chunks.forEach(c => c.refresh());
        });
    }
    makeCells() {
        this.cells = new Array(this.cellCountX * this.cellCountZ);
        let i = 0;
        for (let z = 0; z < this.cellCountZ; z++) {
            for (let x = 0; x < this.cellCountX; x++) {
                this.cells[i] = this.makeCell(x, z, i);
                i++;
            }
        }
    }
    makeChunks() {
        this.chunks = new Array(this.chunkCountX * this.chunkCountZ);
        let i = 0;
        for (let z = 0; z < this.chunkCountZ; z++) {
            for (let x = 0; x < this.chunkCountX; x++) {
                this.chunks[i] = new HexGridChunk(Prefabs.terrain(`hex_terrain_${x}_${z}`, this._scene), Prefabs.rivers(`hex_rivers_${x}_${z}`, this._scene));
                i++;
            }
        }
    }
    getCell(position) {
        let coordinates = HexCoordinates.fromPosition(position), index = coordinates.x + coordinates.z * this.cellCountX + Math.floor(coordinates.z / 2.0);
        return this.cells[index];
    }
    getCellByHexCoordinates(coordinates) {
        const z = coordinates.z, x = coordinates.x + ~~(z / 2);
        if (z < 0 || z >= this.cellCountZ || x < 0 || x >= this.cellCountX) {
            return null;
        }
        return this.cells[x + z * this.cellCountX];
    }
    makeCell(x, z, i) {
        let cell = new HexCell(`hex_cell_${x}_${z}`, this._scene), cellPosition = new BABYLON.Vector3((x + z * 0.5 - Math.floor(z / 2)) * (HexMetrics.innerRadius * 2.0), 0.0, z * (HexMetrics.outerRadius * 1.5));
        cell.coordinates = HexCoordinates.fromOffsetCoordinates(x, z);
        cell.isVisible = true;
        cell.isPickable = false;
        cell.cellPosition = cellPosition;
        let material = new BABYLON.StandardMaterial(`${x}${z}-material`, this._scene), textTexture = this.makeCellText(cell.coordinates.toString());
        material.diffuseTexture = textTexture;
        material.opacityTexture = textTexture;
        material.specularColor = BABYLON.Color3.Black();
        cell.material = material;
        if (cell.coordinates.toString() in HexGrid.defaultGridonfiguration) {
            let cfg = HexGrid.defaultGridonfiguration[cell.coordinates.toString()];
            cell.color = cfg.color;
            cell.elevation = cfg.elevation;
        }
        else {
            cell.color = HexCellColor.default();
            cell.elevation = 0;
        }
        if (x > 0) {
            cell.setNeighbor(HexDirection.W, this.cells[i - 1]);
        }
        if (z > 0) {
            if ((z & 1) === 0) {
                cell.setNeighbor(HexDirection.SE, this.cells[i - this.cellCountX]);
                if (x > 0) {
                    cell.setNeighbor(HexDirection.SW, this.cells[i - this.cellCountX - 1]);
                }
            }
            else {
                cell.setNeighbor(HexDirection.SW, this.cells[i - this.cellCountX]);
                if (x < this.cellCountX - 1) {
                    cell.setNeighbor(HexDirection.SE, this.cells[i - this.cellCountX + 1]);
                }
            }
        }
        this.addCellToChunk(x, z, cell);
        cell.isVisible = false;
        return cell;
    }
    makeCellText(txt) {
        let size = 64;
        let DTw = 10 * 60;
        let DTh = 10 * 60;
        let textTexture = new BABYLON.DynamicTexture("DT", { width: DTw, height: DTh }, this._scene, false);
        textTexture.hasAlpha = true;
        let textCtx = textTexture.getContext();
        textCtx.font = `${size}px bold monospace`;
        textCtx.fillStyle = "transparent";
        let textWidth = textCtx.measureText(txt).width;
        let ratio = textWidth / size;
        let fontSize = Math.floor(DTw / ratio);
        textTexture.drawText(txt, null, null, `${fontSize}px bold monospace`, "black", null);
        return textTexture;
    }
    addCellToChunk(x, z, cell) {
        let chunkX = ~~(x / HexMetrics.chunkSizeX), chunkZ = ~~(z / HexMetrics.chunkSizeZ), chunk = this.chunks[chunkX + chunkZ * this.chunkCountX], localX = x - chunkX * HexMetrics.chunkSizeX, localZ = z - chunkZ * HexMetrics.chunkSizeZ;
        chunk.addCell(localX + localZ * HexMetrics.chunkSizeX, cell);
    }
}
HexGrid.CHUNKS_TO_REFRESH = new Map();
// public static defaultGridonfiguration = {};
HexGrid.defaultGridonfiguration = {
    "(0, -1, 1)": { color: HexCellColor.PASTEL_YELLOW, elevation: 1 },
    "(2, -3, 1)": { color: HexCellColor.PASTEL_YELLOW, elevation: 1 },
    "(3, -4, 1)": { color: HexCellColor.PASTEL_YELLOW, elevation: 1 },
    "(-1, -1, 2)": { color: HexCellColor.PASTEL_YELLOW, elevation: 1 },
    "(3, -5, 2)": { color: HexCellColor.PASTEL_YELLOW, elevation: 1 },
    "(4, -6, 2)": { color: HexCellColor.PASTEL_YELLOW, elevation: 1 },
    "(-1, -2, 3)": { color: HexCellColor.PASTEL_YELLOW, elevation: 1 },
    "(0, -3, 3)": { color: HexCellColor.PASTEL_YELLOW, elevation: 1 },
    "(1, -4, 3)": { color: HexCellColor.PASTEL_YELLOW, elevation: 1 },
    "(2, -5, 3)": { color: HexCellColor.PASTEL_YELLOW, elevation: 1 },
    "(1, -2, 1)": { color: HexCellColor.PASTEL_GREEN, elevation: 2 },
    "(0, -2, 2)": { color: HexCellColor.PASTEL_GREEN, elevation: 2 },
    "(1, -3, 2)": { color: HexCellColor.PASTEL_GREEN, elevation: 2 },
    "(2, -4, 2)": { color: HexCellColor.PASTEL_GREEN, elevation: 2 }
};
var OptionalToggle;
(function (OptionalToggle) {
    OptionalToggle[OptionalToggle["Ignore"] = 0] = "Ignore";
    OptionalToggle[OptionalToggle["Yes"] = 1] = "Yes";
    OptionalToggle[OptionalToggle["No"] = 2] = "No";
})(OptionalToggle || (OptionalToggle = {}));
class HexMapEditor {
    constructor(grid) {
        this.activeColor = null;
        this.activeElevation = 0.0;
        this.isElevationSelected = true;
        this.brushSize = 0;
        this.isPointerDown = false;
        this.isDrag = false;
        this.grid = grid;
        this.activeColor = HexCellColor.default();
        this.makeSelectionPanel();
    }
    makeSelectionPanel() {
        this.advancedTexture = BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI("UI");
        // this.scrollViewer = new BABYLON.GUI.ScrollViewer();
        this.selectionPanel = new BABYLON.GUI.SelectionPanel("ui_editor");
        // this.advancedTexture.addControl(this.scrollViewer);
        this.selectionPanel.width = 0.15;
        this.selectionPanel.height = 0.6;
        this.selectionPanel.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
        this.selectionPanel.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP;
        this.selectionPanel.background = "#336699";
        this.selectionPanel.isPointerBlocker = true;
        this.selectionPanel.onPointerClickObservable.add((eventData, eventState) => {
            // NOTE: THIS STATIC VALUE IS RESET AT THE END OF RENDER LOOP (scene.registerAfterRender). FIX THIS.
            HexMapEditor.POINTER_BLOCKED_BY_GUI = true;
        });
        this.advancedTexture.addControl(this.selectionPanel);
        const colorGroup = new BABYLON.GUI.RadioGroup("Color"), elevationGroup = new BABYLON.GUI.CheckboxGroup("Elevation"), riverGroup = new BABYLON.GUI.RadioGroup("River"), slidersGroup = new BABYLON.GUI.SliderGroup("Values");
        // Colors.
        HexMapEditor.COLORS.forEach(colorOption => {
            colorGroup.addRadio(colorOption.label, this.setActiveColor.bind(this));
        });
        // Elevation check.
        elevationGroup.addCheckbox("Elevation", this.toggleElevation.bind(this), this.isElevationSelected);
        // River
        riverGroup.addRadio(OptionalToggle[OptionalToggle.Ignore], this.setRiverMode.bind(this), this.riverMode === OptionalToggle.Ignore);
        riverGroup.addRadio(OptionalToggle[OptionalToggle.Yes], this.setRiverMode.bind(this), this.riverMode === OptionalToggle.Yes);
        riverGroup.addRadio(OptionalToggle[OptionalToggle.No], this.setRiverMode.bind(this), this.riverMode === OptionalToggle.No);
        // Tool sliders.
        slidersGroup.addSlider("Elevation", this.setElevation.bind(this), "unit", 0, 7, this.activeElevation, (v) => Math.floor(v));
        slidersGroup.addSlider("Brush size", this.setBrushSize.bind(this), "cell", 0, 4, this.brushSize, (v) => ~~v);
        this.selectionPanel.addGroup(colorGroup);
        this.selectionPanel.addGroup(riverGroup);
        this.selectionPanel.addGroup(elevationGroup);
        this.selectionPanel.addGroup(slidersGroup);
    }
    attachCameraControl(camera) {
        this._scene = camera.getScene();
        this._scene.onPointerObservable.add(this.onPointerDown.bind(this), BABYLON.PointerEventTypes.POINTERDOWN);
        this._scene.onPointerObservable.add(this.onPointerUp.bind(this), BABYLON.PointerEventTypes.POINTERUP);
        this._scene.onPointerObservable.add(this.onPointerMove.bind(this), BABYLON.PointerEventTypes.POINTERMOVE);
    }
    handleInput() {
        if (HexMapEditor.POINTER_BLOCKED_BY_GUI) {
            this.previousCell = null;
            return false;
        }
        let pickResult = this._scene.pick(this._scene.pointerX, this._scene.pointerY);
        if (pickResult.hit && pickResult.pickedMesh instanceof HexMesh) {
            let currentCell = this.grid.getCell(pickResult.pickedPoint);
            if (this.previousCell && this.previousCell !== currentCell) {
                this.validateDrag(currentCell);
            }
            else {
                this.isDrag = false;
            }
            this.editCells(currentCell);
            this.previousCell = currentCell;
        }
        else {
            this.previousCell = null;
        }
        return true;
    }
    onPointerDown(eventData, eventState) {
        if (eventData.event.which !== 1) {
            this.previousCell = null;
            return;
        }
        if (this.handleInput()) {
            this.isPointerDown = true;
        }
    }
    onPointerUp(eventData, eventState) {
        this.isPointerDown = false;
    }
    onPointerMove(eventData, eventState) {
        if (!this.isPointerDown) {
            return;
        }
        this.handleInput();
    }
    validateDrag(currentCell) {
        for (let dragDirection = HexDirection.NE; dragDirection <= HexDirection.NW; dragDirection++) {
            if (this.previousCell.getNeighbor(dragDirection) == currentCell) {
                this.isDrag = true;
                this.dragDirection = dragDirection;
                return;
            }
        }
        this.isDrag = false;
    }
    editCell(cell) {
        if (!cell) {
            return;
        }
        if (this.activeColor !== null) {
            cell.color = this.activeColor;
        }
        if (this.isElevationSelected) {
            cell.elevation = this.activeElevation;
        }
        if (this.riverMode === OptionalToggle.No) {
            cell.removeRiver();
        }
        else if (this.isDrag && this.riverMode === OptionalToggle.Yes) {
            let otherCell = cell.getNeighbor(HexDirection.opposite(this.dragDirection));
            if (otherCell) {
                otherCell.setOutgoingRiver(this.dragDirection);
            }
        }
    }
    editCells(centerCell) {
        const centerX = centerCell.coordinates.x, centerZ = centerCell.coordinates.z;
        for (let r = 0, z = centerZ - this.brushSize; z <= centerZ; z++, r++) {
            for (let x = centerX - r; x <= centerX + this.brushSize; x++) {
                this.editCell(this.grid.getCellByHexCoordinates(new HexCoordinates(x, z)));
            }
        }
        for (let r = 0, z = centerZ + this.brushSize; z > centerZ; z--, r++) {
            for (let x = centerX - this.brushSize; x <= centerX + r; x++) {
                this.editCell(this.grid.getCellByHexCoordinates(new HexCoordinates(x, z)));
            }
        }
    }
    setActiveColor(color) {
        if (color === 0) {
            this.activeColor = null;
        }
        else {
            this.activeColor = HexMapEditor.COLORS[color].color;
        }
    }
    setElevation(elevation) {
        this.activeElevation = Math.floor(elevation);
    }
    toggleElevation(state) {
        this.isElevationSelected = state;
    }
    setBrushSize(size) {
        this.brushSize = ~~size;
    }
    setRiverMode(mode) {
        this.riverMode = mode;
    }
}
HexMapEditor.POINTER_BLOCKED_BY_GUI = false;
HexMapEditor.COLORS = [
    { label: "--", color: null },
    { label: "Blue", color: HexCellColor.PASTEL_BLUE },
    { label: "Yellow", color: HexCellColor.PASTEL_YELLOW },
    { label: "Green", color: HexCellColor.PASTEL_GREEN }
];
