///<reference path="babylon.d.ts" />

class HexMetrics {
    public static outerRadius: number = 10.0;
    public static innerRadius: number = HexMetrics.outerRadius * 0.866025404;
    public static solidFactor: number = 0.8;
    public static blendFactor: number = 1.0 - HexMetrics.solidFactor;
    public static elevationStep: number = 3.0;
    public static terracesPerSlope: number = 2;
    public static terraceSteps = HexMetrics.terracesPerSlope * 2 + 1;
    public static horizontalTerraceStepSize = (1.0 / HexMetrics.terraceSteps);
    public static verticalTerraceStepSize = (1.0 / (HexMetrics.terracesPerSlope + 1));
    public static noiseTexture: Texture;
    public static noiseScale = 0.7;
    public static cellPerturbStrength = 4.0;
    public static elevationPerturbStrength = 1.5;
    public static chunkSizeX = 5;
    public static chunkSizeZ = 5;

    private static corners: Array<BABYLON.Vector3> = [
        new BABYLON.Vector3(0.0, 0.0, HexMetrics.outerRadius),
        new BABYLON.Vector3(HexMetrics.innerRadius, 0.0, 0.5 * HexMetrics.outerRadius),
        new BABYLON.Vector3(HexMetrics.innerRadius, 0.0, -0.5 * HexMetrics.outerRadius),
        new BABYLON.Vector3(0.0, 0.0, -HexMetrics.outerRadius),
        new BABYLON.Vector3(-HexMetrics.innerRadius, 0.0, -0.5 * HexMetrics.outerRadius),
        new BABYLON.Vector3(-HexMetrics.innerRadius, 0.0, 0.5 * HexMetrics.outerRadius),
        new BABYLON.Vector3(0.0, 0.0, HexMetrics.outerRadius)
    ];

    public static getFirstCorner(direction: HexDirection): BABYLON.Vector3 {
        return HexMetrics.corners[direction];
    }

    public static getSecondCorner(direction: HexDirection): BABYLON.Vector3 {
        return HexMetrics.corners[direction + 1];
    }

    public static getFirstSolidCorner(direction: HexDirection): BABYLON.Vector3 {
        return HexMetrics.corners[direction].scale(HexMetrics.solidFactor);
    }

    public static getSecondSolidCorner(direction: HexDirection): BABYLON.Vector3 {
        return HexMetrics.corners[direction + 1].scale(HexMetrics.solidFactor);
    }

    public static getBridge(direction: HexDirection): BABYLON.Vector3 {
        return this.corners[direction].add(this.corners[direction + 1]).scale(HexMetrics.blendFactor);
    }

    public static terraceLerp(a: BABYLON.Vector3, b: BABYLON.Vector3, step: number) {
        const 
            h = step * HexMetrics.horizontalTerraceStepSize,
            v = ~~((step + 1)/2.0) * HexMetrics.verticalTerraceStepSize,
            t = a.clone();

        t.x += (b.x - a.x) * h;
        t.z += (b.z - a.z) * h;
        t.y += (b.y - a.y) * v;

        return t;
    }

    public static terraceColorLerp(a: BABYLON.Color4, b: BABYLON.Color4, step: number) {
        const h = step * HexMetrics.horizontalTerraceStepSize;

        return BABYLON.Color4.Lerp(a, b, h);
    }

    public static getEdgeType(elevation1: number, elevation2: number): HexEdgeType {
        if (elevation1 === elevation2) {
            return HexEdgeType.Flat;
        }

        const delta = elevation2 - elevation1;

        if (delta == 1 || delta == -1) {
            return HexEdgeType.Slope;
        }

        return HexEdgeType.Cliff;
    }

    public static sampleNoise(position: BABYLON.Vector3): BABYLON.Vector4 {
        return Texture.sample(HexMetrics.noiseTexture, position);
    }
}

class Texture {
    public data: Float32Array;
    public width: number;
    public height: number;

    constructor(data: Float32Array, width: number, height: number) {
        this.data = data;
        this.width = width;
        this.height = height;
    }

    public static sample(texture: Texture, position: BABYLON.Vector3): BABYLON.Vector4 {
        const
            x = Math.abs(Math.floor(position.x * HexMetrics.noiseScale)),
            z = Math.abs(Math.floor(position.z * HexMetrics.noiseScale)), 
            startOffset = 4 * (z * texture.width + x);

        return new BABYLON.Vector4(
            texture.data[startOffset],
            texture.data[startOffset+1],
            texture.data[startOffset+2],
            texture.data[startOffset+3]
        );
    }

    // http://strauss.pas.nu/js-bilinear-interpolation.html
    private static ivect(ix: number, iy: number, w: number) {
        // byte array, r,g,b,a
        return((ix + w * iy) * 4);
    }
    
    public static bilinearFiltered(srcImg: Texture, destImg: Texture, scale) {
        // c.f.: wikipedia english article on bilinear interpolation
        // taking the unit square, the inner loop looks like this
        // note: there's a function call inside the double loop to this one
        // maybe a performance killer, optimize this whole code as you need
        function inner(f00, f10, f01, f11, x, y) {
            var un_x = 1.0 - x; var un_y = 1.0 - y;
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
            iy1 = ( Math.ceil(iyv) > (srcImg.height-1) ? (srcImg.height-1) : Math.ceil(iyv) );
            for (j = 0; j < destImg.width; ++j) {
                ixv = j / scale;
                ix0 = Math.floor(ixv);
                // Math.ceil can go over bounds
                ix1 = ( Math.ceil(ixv) > (srcImg.width-1) ? (srcImg.width-1) : Math.ceil(ixv) );
                idxD = Texture.ivect(j, i, destImg.width);
                // matrix to vector indices
                idxS00 = Texture.ivect(ix0, iy0, srcImg.width);
                idxS10 = Texture.ivect(ix1, iy0, srcImg.width);
                idxS01 = Texture.ivect(ix0, iy1, srcImg.width);
                idxS11 = Texture.ivect(ix1, iy1, srcImg.width);
                // overall coordinates to unit square
                dx = ixv - ix0; dy = iyv - iy0;
                // I let the r, g, b, a on purpose for debugging
                r = inner(srcImg.data[idxS00], srcImg.data[idxS10],
                    srcImg.data[idxS01], srcImg.data[idxS11], dx, dy);
                destImg.data[idxD] = r;

                g = inner(srcImg.data[idxS00+1], srcImg.data[idxS10+1],
                    srcImg.data[idxS01+1], srcImg.data[idxS11+1], dx, dy);
                destImg.data[idxD+1] = g;

                b = inner(srcImg.data[idxS00+2], srcImg.data[idxS10+2],
                    srcImg.data[idxS01+2], srcImg.data[idxS11+2], dx, dy);
                destImg.data[idxD+2] = b;

                a = inner(srcImg.data[idxS00+3], srcImg.data[idxS10+3],
                    srcImg.data[idxS01+3], srcImg.data[idxS11+3], dx, dy);
                destImg.data[idxD+3] = a;
            }
        }
    }
}

enum HexDirection {
    NE, E, SE, SW, W, NW
}

namespace HexDirection {
    export function opposite(direction: HexDirection): HexDirection {
        return direction < 3 ? (direction + 3) : (direction - 3);
    }

    export function previous(direction: HexDirection): HexDirection {
        return direction === HexDirection.NE ? HexDirection.NW : (direction - 1);
    }

    export function next(direction: HexDirection): HexDirection {
        return direction === HexDirection.NW ? HexDirection.NE : (direction + 1);
    }
}

enum HexEdgeType {
    Flat, Slope, Cliff
}

class HexCooridnates {
    public x: number;
    public z: number;
    private _y: number;

    constructor(x: number, z: number) {
        this.x = x;
        this.z = z;
    }

    get y(): number {
        return -this.x - this.z;
    }

    public static fromOffsetCoordinates(x: number, z: number): HexCooridnates {
        return new HexCooridnates(x - Math.floor(z/2.0), z);
    }

    public static fromPosition(position: BABYLON.Vector3): HexCooridnates {
        let x = position.x / (HexMetrics.innerRadius * 2.0),
            y = -x,
            offset = position.z / (HexMetrics.outerRadius * 3.0);

        x -= offset;
        y -= offset;

        let ix = Math.round(x),
            iy = Math.round(y),
            iz = Math.round(-x - y);

        if (ix + iy + iz != 0) {
            let dx = Math.abs(x - ix),
                dy = Math.abs(y - iy),
                dz = Math.abs(-x - y - iz);

            if (dx > dy && dx > dz) {
                ix = -iy - iz;
            } else if (dz > dy) {
                iz = -ix - iy;
            }
        }

        return new HexCooridnates(ix, iz);
    }

    public toString() {
        return `(${this.x}, ${this.y}, ${this.z})`;
    }
}

class HexCellColor {

    public static PASTEL_BLUE = BABYLON.Color4.FromHexString("#548af8ff");
    public static PASTEL_YELLOW = BABYLON.Color4.FromHexString("#fffc1fff");
    public static PASTEL_GREEN = BABYLON.Color4.FromHexString("#20e43fff");

    private static colors: Array<BABYLON.Color4> = [
        BABYLON.Color4.FromColor3(BABYLON.Color3.White()),
        HexCellColor.PASTEL_YELLOW, // hex yellow, with alpha
        BABYLON.Color4.FromColor3(BABYLON.Color3.White()),
        HexCellColor.PASTEL_BLUE, // hex blue, with alpha
        BABYLON.Color4.FromColor3(BABYLON.Color3.White()),
        HexCellColor.PASTEL_GREEN //hex green, with alpha
    ];

    public static default() {
        return HexCellColor.PASTEL_BLUE;
    }

    public static random(): BABYLON.Color4 {
        return HexCellColor.colors[Math.floor(Math.random() * HexCellColor.colors.length)];
    }

    public static average(colors: Array<BABYLON.Color4>): BABYLON.Color4 {
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

/**
 * CAUTION: UNTIL HexCell extends BABYLON.Mesh, ALWAYS SET POSITION VIA cellPostion!! 
 */
class HexCell extends BABYLON.Mesh {
    private static CELL_OVERLAY_ELEVATION = 0.1; 

    public coordinates: HexCooridnates;
    public neighbors: HexCell[] = new Array<HexCell>(6);
    public chunk: HexGridChunk;
    private _elevation: number = Number.MIN_VALUE;
    public _color: BABYLON.Color4;
    private _cellPosition: BABYLON.Vector3;

    constructor(name: string, scene: BABYLON.Scene) {
        super(name, scene);
        
        let options = {
            size: 10,
            width: 10,
            height: 10,
            updatable: true
        };

        let vertexData = BABYLON.VertexData.CreateGround(options);
        vertexData.applyToMesh(this);
    }

    public getNeighbor(direction: HexDirection): HexCell {
        return this.neighbors[direction];
    }

    public setNeighbor(direction: HexDirection, cell: HexCell): void {
        this.neighbors[direction] = cell;
        cell.neighbors[HexDirection.opposite(direction)] = this;
    }

    get elevation(): number {
        return this._elevation;
    }

    set elevation(elevation: number) {
        if (this._elevation === elevation) {
            return;
        }

        this._elevation = elevation;
        this._cellPosition.y = elevation * HexMetrics.elevationStep;
        this._cellPosition.y += 
            (HexMetrics.sampleNoise(this._cellPosition).y * 2.0 - 1.0) * HexMetrics.elevationPerturbStrength;

        this.refreshPosition();
        this.refresh();
    }

    get cellPosition(): BABYLON.Vector3 {
        return this._cellPosition;
    }

    set cellPosition(position: BABYLON.Vector3) {
        this._cellPosition = position.clone();
        this.refreshPosition();
    }

    get color(): BABYLON.Color4 {
        return this._color;
    }

    set color(color: BABYLON.Color4) {
        if (this._color === color) {
            return;
        }

        this._color = color;
        this.refresh();
    }

    // Sets mesh render position from cellPosition (renders it slightly above).
    private refreshPosition(): void {
        this.position = this._cellPosition.clone();
        this.position.y += HexCell.CELL_OVERLAY_ELEVATION;
    }

    public getEdgeType(direction: HexDirection): HexEdgeType {
        return HexMetrics.getEdgeType(this.elevation, this.neighbors[direction].elevation);
    }

    public getEdgeTypeForCell(cell: HexCell): HexEdgeType {
        return HexMetrics.getEdgeType(this.elevation, cell.elevation);
    }

    private refresh(): void {
        if (!this.chunk) return;

        this.chunk.refresh();

        // Refresh all neighbor cell chunks which are not the same chunk as we're in.
        let n: HexCell;
        for (let i = 0; i < this.neighbors.length; i++) {
            n = this.neighbors[i];

            if (n && n.chunk != this.chunk) {
                n.chunk.refresh();
            }
        }
    }
}

class EdgeVertices {
    public v1: BABYLON.Vector3;
    public v2: BABYLON.Vector3;
    public v3: BABYLON.Vector3;
    public v4: BABYLON.Vector3;

    public static fromCorners(corner1: BABYLON.Vector3, corner2: BABYLON.Vector3) {
        let result = new EdgeVertices();

        result.v1 = corner1;
        result.v2 = BABYLON.Vector3.Lerp(corner1, corner2, 1.0/3.0);
        result.v3 = BABYLON.Vector3.Lerp(corner1, corner2, 2.0/3.0);
        result.v4 = corner2;

        return result;
    }

    public static terraceLerp(a: EdgeVertices, b: EdgeVertices, step: number) {
        let result = new EdgeVertices();

        result.v1 = HexMetrics.terraceLerp(a.v1, b.v1, step);
        result.v2 = HexMetrics.terraceLerp(a.v2, b.v2, step);
        result.v3 = HexMetrics.terraceLerp(a.v3, b.v3, step);
        result.v4 = HexMetrics.terraceLerp(a.v4, b.v4, step);

        return result;
    } 
}

class HexMesh extends BABYLON.Mesh {
    private static _material: BABYLON.StandardMaterial = null;
    // private static _vertices: Array<number> = [];
    // private static _triangles: Array<number> = [];
    // private static _colors: Array<number> = [];

    private _vertices: Array<number> = [];
    private _triangles: Array<number> = [];
    private _colors: Array<number> = [];

    constructor(name: string, scene: BABYLON.Scene) {
        super(name, scene);

        this.material = HexMesh.getDefaultMaterial(scene);

        this._setReady(false);
    }

    private static getDefaultMaterial(scene: BABYLON.Scene) {
        if (HexMesh._material === null) {
            let mat = new BABYLON.StandardMaterial("material", scene);
            mat.backFaceCulling = false;
            mat.emissiveColor = BABYLON.Color3.Black(); //BABYLON.Color3.FromHexString("#E6E6E6");
            mat.diffuseColor = BABYLON.Color3.White();
            // mat.specularColor = BABYLON.Color3.Black();
            // mat.wireframe = true;
            HexMesh._material = mat;
        }

        return HexMesh._material;
    }

    perturb(position: BABYLON.Vector3): BABYLON.Vector3 {
        let sample = HexMetrics.sampleNoise(position);

        return new BABYLON.Vector3(
            position.x + (sample.x * 2.0 - 1.0) * HexMetrics.cellPerturbStrength,
            position.y,
            position.z + (sample.z * 2.0 - 1.0) * HexMetrics.cellPerturbStrength
        );
    }

    // public static triangulate(mesh: HexMesh, cells: HexCell[]) {
    //     HexMesh._vertices = [];
    //     HexMesh._triangles = [];
    //     HexMesh._colors = [];

    //     mesh.triangulate(cells);
    // }

    triangulate(cells: HexCell[]) {
        this._vertices = [];
        this._triangles = [];
        this._colors = [];

        for (let i = 0; i < cells.length; i++) {
            for (let direction = HexDirection.NE; direction <= HexDirection.NW; direction++) {
                this.triangulateCell(direction, cells[i]);
            }
        }

        let 
            vertexData = new BABYLON.VertexData(),
            normals = [];

        BABYLON.VertexData.ComputeNormals(this._vertices, this._triangles, normals);
        
        vertexData.positions = this._vertices;
        vertexData.indices = this._triangles;
        vertexData.colors = this._colors;
        vertexData.normals = normals;

        vertexData.applyToMesh(this, true);

        this._setReady(true);
    }

    triangulateEdgeFan(center: BABYLON.Vector3, edge: EdgeVertices, color: BABYLON.Color4) {
        this.addTriangle(center, edge.v1, edge.v2);
        this.addSingleTriangleColor(color);
        this.addTriangle(center, edge.v2, edge.v3);
        this.addSingleTriangleColor(color);
        this.addTriangle(center, edge.v3, edge.v4);
        this.addSingleTriangleColor(color);
    }

    triangulateEdgeStrip(e1: EdgeVertices, c1: BABYLON.Color4, e2: EdgeVertices, c2: BABYLON.Color4) {
        this.addQuad(e1.v1, e1.v2, e2.v1, e2.v2);
        this.addQuadColor2(c1, c2);
        this.addQuad(e1.v2, e1.v3, e2.v2, e2.v3);
        this.addQuadColor2(c1, c2);
        this.addQuad(e1.v3, e1.v4, e2.v3, e2.v4);
        this.addQuadColor2(c1, c2);
    }

    triangulateCell(direction: HexDirection, cell: HexCell): void {
        let
            center = cell.cellPosition.clone(),
            e = EdgeVertices.fromCorners(
                center.add(HexMetrics.getFirstSolidCorner(direction)),
                center.add(HexMetrics.getSecondSolidCorner(direction))
            );

        this.triangulateEdgeFan(center, e, cell.color);

        if (direction <= HexDirection.SE) {
            this.triangulateCellConnection(direction, cell, e);
        }
    }

    triangulateCellConnection(direction: HexDirection, cell: HexCell, e1: EdgeVertices): void {
        let neighbor = cell.getNeighbor(direction);
            
        if (neighbor == null) {
            return;
        }

        let bridge = HexMetrics.getBridge(direction);
        bridge.y = neighbor.cellPosition.y - cell.cellPosition.y;

        let e2 = EdgeVertices.fromCorners(e1.v1.add(bridge), e1.v4.add(bridge));

        if (cell.getEdgeType(direction) === HexEdgeType.Slope) {
            this.triangulateCellEdgeTerraces(e1, cell, e2, neighbor);
        } else {
            this.triangulateEdgeStrip(e1, cell.color, e2, neighbor.color);
        }

        let 
            nextNeighborDirection = HexDirection.next(direction),
            nextNeighbor = cell.getNeighbor(nextNeighborDirection);

        if (direction <= HexDirection.E && nextNeighbor != null) {
            let v5 = e1.v4.add(HexMetrics.getBridge(nextNeighborDirection));
            v5.y = nextNeighbor.cellPosition.y;

            if (cell.elevation <= neighbor.elevation) {
                if (cell.elevation <= nextNeighbor.elevation) {
                    this.triangulateCellCorner(e1.v4, cell, e2.v4, neighbor, v5, nextNeighbor);
                } else {
                    this.triangulateCellCorner(v5, nextNeighbor, e1.v4, cell, e2.v4, neighbor);
                }             
            }
            else if (neighbor.elevation <= nextNeighbor.elevation) {
                this.triangulateCellCorner(e2.v4, neighbor, v5, nextNeighbor, e1.v4, cell);
            }
            else {
                this.triangulateCellCorner(v5, nextNeighbor, e1.v4, cell, e2.v4, neighbor);
            }
        }
    }

    triangulateCellCorner(
        bottom: BABYLON.Vector3, bottomCell: HexCell,
        left: BABYLON.Vector3, leftCell: HexCell,
        right: BABYLON.Vector3, rightCell: HexCell
    ): void {
        let
            leftEdgeType = bottomCell.getEdgeTypeForCell(leftCell),
            rightEdgeType = bottomCell.getEdgeTypeForCell(rightCell);

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
            this.addTriangle(bottom, left, right);
            this.addTriangleColor(bottomCell.color, leftCell.color, rightCell.color);
        }
    }

    triangulateCellCornerTerraces(
        begin: BABYLON.Vector3, beginCell: HexCell,
        left: BABYLON.Vector3, leftCell: HexCell,
        right: BABYLON.Vector3, rightCell: HexCell
    ): void {
        let
            v3 = HexMetrics.terraceLerp(begin, left, 1),
            v4 = HexMetrics.terraceLerp(begin, right, 1),
            c3 = HexMetrics.terraceColorLerp(beginCell.color, leftCell.color, 1),
            c4 = HexMetrics.terraceColorLerp(beginCell.color, rightCell.color, 1);

        this.addTriangle(begin, v3, v4);
        this.addTriangleColor(beginCell.color, c3, c4);

        let i: number,
            v1: BABYLON.Vector3,
            v2: BABYLON.Vector3,
            c1: BABYLON.Color4,
            c2: BABYLON.Color4;

        for (i = 2; i < HexMetrics.terraceSteps; i++) {
            v1 = v3;
            v2 = v4;
            c1 = c3;
            c2 = c4;
            v3 = HexMetrics.terraceLerp(begin, left, i);
            v4 = HexMetrics.terraceLerp(begin, right, i);
            c3 = HexMetrics.terraceColorLerp(beginCell.color, leftCell.color, i);
            c4 = HexMetrics.terraceColorLerp(beginCell.color, rightCell.color, i);

            this.addQuad(v1, v2, v3, v4);
            this.addQuadColor(c1, c2, c3, c4);
        }

        this.addQuad(v3, v4, left, right);
        this.addQuadColor(c3, c4, leftCell.color, rightCell.color);
    }

    triangulateCellCornerTerracesCliff(
        begin: BABYLON.Vector3, beginCell: HexCell,
        left: BABYLON.Vector3, leftCell: HexCell,
        right: BABYLON.Vector3, rightCell: HexCell
    ): void {
        let
            b = Math.abs(1.0 / (rightCell.elevation - beginCell.elevation)),
            boundry = BABYLON.Vector3.Lerp(this.perturb(begin), this.perturb(right), b),
            boundryColor = BABYLON.Color4.Lerp(beginCell.color, rightCell.color, b);

        this.trinagulateCellBoundryTriangle(begin, beginCell, left, leftCell, boundry, boundryColor);

        if (leftCell.getEdgeTypeForCell(rightCell) === HexEdgeType.Slope) {
            this.trinagulateCellBoundryTriangle(left, leftCell, right, rightCell, boundry, boundryColor);
        } else {
            this.addTriangleUnperturbed(this.perturb(left), this.perturb(right), boundry);
            this.addTriangleColor(leftCell.color, rightCell.color, boundryColor);
        }
    }

    triangulateCellCornerCliffTerraces(
        begin: BABYLON.Vector3, beginCell: HexCell,
        left: BABYLON.Vector3, leftCell: HexCell,
        right: BABYLON.Vector3, rightCell: HexCell
    ): void {
        let
            b = Math.abs(1.0 / (leftCell.elevation - beginCell.elevation)),
            boundry = BABYLON.Vector3.Lerp(this.perturb(begin), this.perturb(left), b),
            boundryColor = BABYLON.Color4.Lerp(beginCell.color, leftCell.color, b);

        this.trinagulateCellBoundryTriangle(right, rightCell, begin, beginCell, boundry, boundryColor);

        if (leftCell.getEdgeTypeForCell(rightCell) === HexEdgeType.Slope) {
            this.trinagulateCellBoundryTriangle(left, leftCell, right, rightCell, boundry, boundryColor);
        } else {
            this.addTriangleUnperturbed(this.perturb(left), this.perturb(right), boundry);
            this.addTriangleColor(leftCell.color, rightCell.color, boundryColor);
        }
    }

    trinagulateCellBoundryTriangle(
        begin: BABYLON.Vector3, beginCell: HexCell,
        left: BABYLON.Vector3, leftCell: HexCell,
        boundry: BABYLON.Vector3, boundryColor: BABYLON.Color4
    ): void {
        let
            v2 = this.perturb(HexMetrics.terraceLerp(begin, left, 1)),
            c2 = HexMetrics.terraceColorLerp(beginCell.color, leftCell.color, 1);

        this.addTriangleUnperturbed(this.perturb(begin), v2, boundry);
        this.addTriangleColor(beginCell.color, c2, boundryColor);

        let 
            i: number,
            v1: BABYLON.Vector3,
            c1: BABYLON.Color4;

        for (i = 2; i < HexMetrics.terraceSteps; i++) {
            v1 = v2;
            c1 = c2;
            v2 = this.perturb(HexMetrics.terraceLerp(begin, left, i));
            c2 = HexMetrics.terraceColorLerp(beginCell.color, leftCell.color, i);

            this.addTriangleUnperturbed(v1, v2, boundry);
            this.addTriangleColor(c1, c2, boundryColor);
        }

        this.addTriangleUnperturbed(v2, this.perturb(left), boundry);
        this.addTriangleColor(c2, leftCell.color, boundryColor);
    }

    triangulateCellEdgeTerraces(begin: EdgeVertices, beginCell: HexCell, end: EdgeVertices, endCell: HexCell): void {
        let
            e2 = EdgeVertices.terraceLerp(begin, end, 1),
            c2 = HexMetrics.terraceColorLerp(beginCell.color, endCell.color, 1);

        this.triangulateEdgeStrip(begin, beginCell.color, e2, c2);

        let e1: EdgeVertices, c1: BABYLON.Color4;
            
        for (let i = 2; i < HexMetrics.terraceSteps; i++) {
            e1 = e2;
            c1 = c2;
            e2 = EdgeVertices.terraceLerp(begin, end, i);
            c2 = HexMetrics.terraceColorLerp(beginCell.color, endCell.color, i);

            this.triangulateEdgeStrip(e1, c1, e2, c2);
        }

        this.triangulateEdgeStrip(e2, c2, end, endCell.color);
    }

    addTriangle(v1: BABYLON.Vector3, v2: BABYLON.Vector3, v3: BABYLON.Vector3): void {
        const vertexIndex = this._vertices.length/3;
        this.addVertex(this.perturb(v1));
        this.addVertex(this.perturb(v2));
        this.addVertex(this.perturb(v3));
        this._triangles.push(vertexIndex);
        this._triangles.push(vertexIndex + 1);
        this._triangles.push(vertexIndex + 2);
    }

    addTriangleUnperturbed(v1: BABYLON.Vector3, v2: BABYLON.Vector3, v3: BABYLON.Vector3): void {
        let vertexIndex = this._vertices.length/3;
        this.addVertex(v1);
        this.addVertex(v2);
        this.addVertex(v3);
        this._triangles.push(vertexIndex);
        this._triangles.push(vertexIndex + 1);
        this._triangles.push(vertexIndex + 2);
    }

    addSingleTriangleColor(color: BABYLON.Color4): void {
        this.addColor(color);
        this.addColor(color);
        this.addColor(color);
    }

    addTriangleColor(color1: BABYLON.Color4, color2: BABYLON.Color4, color3: BABYLON.Color4): void {
        this.addColor(color1);
        this.addColor(color2);
        this.addColor(color3);
    }

    addQuad(v1: BABYLON.Vector3, v2: BABYLON.Vector3, v3: BABYLON.Vector3, v4: BABYLON.Vector3): void {
        const vertexIndex = this._vertices.length/3;
        this.addVertex(this.perturb(v1));
        this.addVertex(this.perturb(v2));
        this.addVertex(this.perturb(v3));
        this.addVertex(this.perturb(v4));
        this._triangles.push(vertexIndex);
        this._triangles.push(vertexIndex + 2);
        this._triangles.push(vertexIndex + 1);
        this._triangles.push(vertexIndex + 1);
        this._triangles.push(vertexIndex + 2);
        this._triangles.push(vertexIndex + 3);
    }

    addQuadColor(color1: BABYLON.Color4, color2: BABYLON.Color4, color3: BABYLON.Color4, color4: BABYLON.Color4): void {
        this.addColor(color1);
        this.addColor(color2);
        this.addColor(color3);
        this.addColor(color4);
    }

    /** Adds only two colors to the quad. */
    addQuadColor2(color1: BABYLON.Color4, color2: BABYLON.Color4) {
        this.addColor(color1);
        this.addColor(color1);
        this.addColor(color2);
        this.addColor(color2);
    }

    addVertex(vertex: BABYLON.Vector3): void {
        this._vertices.push(vertex.x);
        this._vertices.push(vertex.y);
        this._vertices.push(vertex.z);        
    }

    addColor(color: BABYLON.Color4): void {
        this._colors.push(color.r);
        this._colors.push(color.g);
        this._colors.push(color.b);
        this._colors.push(color.a);
    }
}

class HexGridChunk {
    private cells: HexCell[];
    private hexMesh: HexMesh;

    constructor(hexMesh: HexMesh) {
        this.hexMesh = hexMesh;
        this.cells = new Array<HexCell>(HexMetrics.chunkSizeX * HexMetrics.chunkSizeZ);
    }

    addCell(index: number, cell: HexCell): void {
        this.cells[index] = cell;
        cell.chunk = this;
    }

    refresh(): void {
        HexGrid.CHUNKS_TO_REFRESH.set(this.hexMesh.name, this);  //[this.hexMesh.name] = this;
    }

    doRefresh(): void {
        this.hexMesh.triangulate(this.cells);
    }
}

class HexGrid {
    public static CHUNKS_TO_REFRESH: Map<string, HexGridChunk> = new Map<string, HexGridChunk>();

    private cellCountX: number = 6;
    private cellCountZ: number = 6;
    public chunkCountX: number = 3;
    public chunkCountZ: number = 3;
    public cells: HexCell[];
    public chunks: HexGridChunk[];
    private _scene: BABYLON.Scene;

    public defaultColor: BABYLON.Color4 = HexCellColor.PASTEL_BLUE;

    // public static defaultGridonfiguration = {};
    public static defaultGridonfiguration = {
        "(0, -1, 1)": {color: HexCellColor.PASTEL_YELLOW, elevation: 1},
        "(2, -3, 1)": {color: HexCellColor.PASTEL_YELLOW, elevation: 1},
        "(3, -4, 1)": {color: HexCellColor.PASTEL_YELLOW, elevation: 1},
        "(-1, -1, 2)": {color: HexCellColor.PASTEL_YELLOW, elevation: 1},
        "(3, -5, 2)": {color: HexCellColor.PASTEL_YELLOW, elevation: 1},
        "(4, -6, 2)": {color: HexCellColor.PASTEL_YELLOW, elevation: 1},
        "(-1, -2, 3)": {color: HexCellColor.PASTEL_YELLOW, elevation: 1},
        "(0, -3, 3)": {color: HexCellColor.PASTEL_YELLOW, elevation: 1},
        "(1, -4, 3)": {color: HexCellColor.PASTEL_YELLOW, elevation: 1},
        "(2, -5, 3)": {color: HexCellColor.PASTEL_YELLOW, elevation: 1},

        "(1, -2, 1)": {color: HexCellColor.PASTEL_GREEN, elevation: 2},
        "(0, -2, 2)": {color: HexCellColor.PASTEL_GREEN, elevation: 2},
        "(1, -3, 2)": {color: HexCellColor.PASTEL_GREEN, elevation: 2},
        "(2, -4, 2)": {color: HexCellColor.PASTEL_GREEN, elevation: 2}
    };

    constructor(scene: BABYLON.Scene) {
        this._scene = scene;
        this.cellCountX = this.chunkCountX * HexMetrics.chunkSizeX;
        this.cellCountZ = this.chunkCountZ * HexMetrics.chunkSizeZ;
    }

    public static refresh(): void {
        HexGrid.CHUNKS_TO_REFRESH.forEach((c: HexGridChunk, k, _) => {
            c.doRefresh();
        });

        HexGrid.CHUNKS_TO_REFRESH = new Map<string, HexGridChunk>();
    }

    generate(): void {
        let texture = new BABYLON.Texture(
            './assets/gfx/material/noise.png', 
            this._scene,
            false, 
            false, 
            BABYLON.Texture.BILINEAR_SAMPLINGMODE,
            null,
            null,
            null,
            null,
            BABYLON.Engine.TEXTUREFORMAT_RGBA
        );

        (<any>window).txtr = texture;
        
        let convert = (incomingData) => { // incoming data is a UInt8Array
            var i, l = incomingData.length;
            var outputData = new Float32Array(incomingData.length);
            for (i = 0; i < l; i++) {
                outputData[i] = incomingData[i]/256.0;
            }
            return outputData;
        };

        texture.onLoadObservable.addOnce((event, estate) => {            
            let noiseTexture: Texture,
                bilinearTexture: Texture;

            noiseTexture = new Texture(
                convert(texture.readPixels()),
                texture.getSize().width,
                texture.getSize().height
            );
            
            bilinearTexture = new Texture(
                Float32Array.from(noiseTexture.data), 
                noiseTexture.width, 
                noiseTexture.height
            );
            
            Texture.bilinearFiltered(noiseTexture, bilinearTexture, 1.0);
            HexMetrics.noiseTexture = bilinearTexture;

            this.makeChunks();
            this.makeCells();

            this.chunks.forEach(c => c.refresh());
        });
    }

    makeCells(): void {
        this.cells = new Array<HexCell>(this.cellCountX*this.cellCountZ);
        let i = 0;

        for (let z = 0; z < this.cellCountZ; z++) {
            for (let x = 0; x < this.cellCountX; x++) {
                this.cells[i] = this.makeCell(x, z, i);
                i++;
            }
        }
    }

    makeChunks(): void {
        this.chunks = new Array<HexGridChunk>(this.chunkCountX * this.chunkCountZ);
        let i = 0;

        for (let z = 0; z < this.chunkCountZ; z++) {
            for (let x = 0; x < this.chunkCountX; x++) {
                this.chunks[i] = new HexGridChunk(new HexMesh(`hex_mesh_${x}_${z}`, this._scene));
                i++;
            }
        }
    }

    getCell(position: BABYLON.Vector3): HexCell {
        let 
            coordinates = HexCooridnates.fromPosition(position),
            index = coordinates.x + coordinates.z * this.cellCountX + Math.floor(coordinates.z/2.0);

        return this.cells[index];
    }

    makeCell(x: number, z: number, i: number): HexCell {
        let 
            cell = new HexCell(`hex_cell_${x}_${z}`, this._scene),
            cellPosition = new BABYLON.Vector3(
                (x + z*0.5 - Math.floor(z/2)) * (HexMetrics.innerRadius * 2.0),
                0.0,
                z * (HexMetrics.outerRadius * 1.5)
            );

        cell.coordinates = HexCooridnates.fromOffsetCoordinates(x, z);
        cell.isVisible = true;
        cell.isPickable = false;
        cell.cellPosition = cellPosition;

        let material = new BABYLON.StandardMaterial(`${x}${z}-material`, this._scene),
            textTexture = this.makeCellText(cell.coordinates.toString());

        material.diffuseTexture = textTexture;
        material.opacityTexture = textTexture;
        material.specularColor = BABYLON.Color3.Black();

        cell.material = material;

        if (cell.coordinates.toString() in HexGrid.defaultGridonfiguration) {
            let cfg = HexGrid.defaultGridonfiguration[cell.coordinates.toString()];
            cell.color = cfg.color;
            cell.elevation = cfg.elevation;
        } else {
            cell.color = HexCellColor.default();
            cell.elevation = 0;
        }

        if (x > 0) {
            cell.setNeighbor(HexDirection.W, this.cells[i-1]);
        }
        if (z > 0) {
            if ((z & 1) === 0) {
                cell.setNeighbor(HexDirection.SE, this.cells[i - this.cellCountX]);
                if (x > 0) {
                    cell.setNeighbor(HexDirection.SW, this.cells[i - this.cellCountX - 1]);
                }
            } else {
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

    private makeCellText(txt: string): BABYLON.DynamicTexture {
        let size = 64;
        let DTw = 10*60;
        let DTh = 10*60;
        let textTexture = new BABYLON.DynamicTexture("DT", {width: DTw, height: DTh}, this._scene, false);
        textTexture.hasAlpha = true;
        let textCtx = textTexture.getContext();
        textCtx.font = `${size}px bold monospace`;
        textCtx.fillStyle = "transparent";
        let textWidth = textCtx.measureText(txt).width;
        let ratio = textWidth/size;
        let fontSize = Math.floor(DTw / ratio);
    
        textTexture.drawText(txt, null, null, `${fontSize}px bold monospace`, "black", null);

        return textTexture;
    }

    private addCellToChunk(x: number, z: number, cell: HexCell): void {
        let
            chunkX = ~~(x / HexMetrics.chunkSizeX),
            chunkZ = ~~(z / HexMetrics.chunkSizeZ),
            chunk = this.chunks[chunkX + chunkZ * this.chunkCountX],
            localX = x - chunkX * HexMetrics.chunkSizeX,
            localZ = z - chunkZ * HexMetrics.chunkSizeZ;

        chunk.addCell(localX + localZ * HexMetrics.chunkSizeX, cell);
    }
}

class HexMapEditor {
    private grid: HexGrid;
    private activeColor: BABYLON.Color4;
    private activeElevation: number = 0.0;

    constructor(grid: HexGrid) {
        this.grid = grid;
        this.activeColor = HexCellColor.default();
    }

    handleInput(position: BABYLON.Vector3) {
        this.editCell(this.grid.getCell(position));
    }

    editCell(cell: HexCell) {
        cell.color = this.activeColor;
        cell.elevation = this.activeElevation;
    }

    setActiveColor(color: BABYLON.Color4): void {
        this.activeColor = color;
    }

    setElevation(elevation: number): void {
        this.activeElevation = elevation;
    }
}