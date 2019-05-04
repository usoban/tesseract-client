///<reference path="babylon.d.ts" />

class HexMetrics {
    public static outerRadius: number = 10.0;
    public static innerRadius: number = HexMetrics.outerRadius * 0.866025404;
    public static solidFactor: number = 0.75;
    public static blendFactor: number = 1.0 - HexMetrics.solidFactor;
    public static elevationStep: number = 5.0;
    public static terracesPerSlope: number = 2;
    public static terraceSteps = HexMetrics.terracesPerSlope * 2 + 1;
    public static horizontalTerraceStepSize = (1.0 / HexMetrics.terraceSteps);
    public static verticalTerraceStepSize = (1.0 / (HexMetrics.terracesPerSlope + 1));

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
    public color: BABYLON.Color4;
    public neighbors: HexCell[] = new Array<HexCell>(6);
    private _elevation: number = 0;
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
        this._elevation = elevation;
        this._cellPosition.y = elevation * HexMetrics.elevationStep;
        this.refreshPosition();
    }

    get cellPosition(): BABYLON.Vector3 {
        return this._cellPosition;
    }

    set cellPosition(position: BABYLON.Vector3) {
        this._cellPosition = position.clone();
        this.refreshPosition();
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
}

class HexMesh extends BABYLON.Mesh {
    private static _material: BABYLON.StandardMaterial = null;

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
            mat.emissiveColor = BABYLON.Color3.FromHexString("#E6E6E6");
            mat.diffuseColor = BABYLON.Color3.White();
            // mat.specularColor = BABYLON.Color3.Black();
            // mat.wireframe = true;
            HexMesh._material = mat;
        }

        return HexMesh._material;
    } 

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

    triangulateCell(direction: HexDirection, cell: HexCell): void {
        let
            center = cell.cellPosition.clone(),
            v1 = center.add(HexMetrics.getFirstSolidCorner(direction)),
            v2 = center.add(HexMetrics.getSecondSolidCorner(direction));

        this.addTriangle(center, v1, v2);
        this.addSingleTriangleColor(cell.color);

        if (direction <= HexDirection.SE) {
            this.triangulateCellConnection(direction, cell, v1, v2);
        }
    }

    triangulateCellConnection(direction: HexDirection, cell: HexCell, v1: BABYLON.Vector3, v2: BABYLON.Vector3) {
        let neighbor = cell.getNeighbor(direction);
            
        if (neighbor == null) {
            return;
        }

        let 
            bridge = HexMetrics.getBridge(direction),
            v3 = v1.add(bridge),
            v4 = v2.add(bridge);

        v3.y = v4.y = neighbor.elevation * HexMetrics.elevationStep;

        if (cell.getEdgeType(direction) === HexEdgeType.Slope) {
            this.triangulateCellEdgeTerraces(v1, v2, cell, v3, v4, neighbor);
        } else {
            this.addQuad(v1, v2, v3, v4);
            this.addQuadColor2(cell.color, neighbor.color);
        }

        let 
            nextNeighborDirection = HexDirection.next(direction),
            nextNeighbor = cell.getNeighbor(nextNeighborDirection);

        if (direction <= HexDirection.E && nextNeighbor != null) {
            let v5 = v2.add(HexMetrics.getBridge(nextNeighborDirection));
            v5.y = nextNeighbor.elevation * HexMetrics.elevationStep;

            if (cell.elevation <= neighbor.elevation) {
                if (cell.elevation <= nextNeighbor.elevation) {
                    this.triangulateCellCorner(v2, cell, v4, neighbor, v5, nextNeighbor);
                } else {
                    this.triangulateCellCorner(v5, nextNeighbor, v2, cell, v4, neighbor);
                }             
            }
            else if (neighbor.elevation <= nextNeighbor.elevation) {
                this.triangulateCellCorner(v4, neighbor, v5, nextNeighbor, v2, cell);
            }
            else {
                this.triangulateCellCorner(v5, nextNeighbor, v2, cell, v4, neighbor);
            }
        }
    }

    triangulateCellCorner(
        bottom: BABYLON.Vector3, bottomCell: HexCell,
        left: BABYLON.Vector3, leftCell: HexCell,
        right: BABYLON.Vector3, rightCell: HexCell
    ) {
        let
            leftEdgeType = bottomCell.getEdgeTypeForCell(leftCell),
            rightEdgeType = bottomCell.getEdgeTypeForCell(rightCell);

        if (leftEdgeType === HexEdgeType.Slope) {
            if (rightEdgeType === HexEdgeType.Slope) {
                this.triangulateCellCornerTerraces(bottom, bottomCell, left, leftCell, right, rightCell);
                return;
            }
            if (rightEdgeType === HexEdgeType.Flat) {
                this.triangulateCellCornerTerraces(left, leftCell, right, rightCell, bottom, bottomCell);
                return;
            }

            this.triangulateCellCornerTerracesCliff(bottom, bottomCell, left, leftCell, right, rightCell);
            return;
        }
        if (rightEdgeType === HexEdgeType.Slope) {
            if (leftEdgeType === HexEdgeType.Flat) {
                this.triangulateCellCornerTerraces(right, rightCell, bottom, bottomCell, left, leftCell);
                return;
            }
        }

        this.addTriangle(bottom, left, right);
        this.addTriangleColor(bottomCell.color, leftCell.color, rightCell.color);
    }

    triangulateCellCornerTerraces(
        begin: BABYLON.Vector3, beginCell: HexCell,
        left: BABYLON.Vector3, leftCell: HexCell,
        right: BABYLON.Vector3, rightCell: HexCell
    ) {
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
    ) {
        let
            b = 1.0 / (rightCell.elevation - beginCell.elevation),
            boundry = BABYLON.Vector3.Lerp(begin, right, b),
            boundryColor = BABYLON.Color4.Lerp(beginCell.color, rightCell.color, b);

        this.trinagulateCellBoundryTriangle(begin, beginCell, left, leftCell, boundry, boundryColor);

        if (leftCell.getEdgeTypeForCell(rightCell) === HexEdgeType.Slope) {
            this.trinagulateCellBoundryTriangle(left, leftCell, right, rightCell, boundry, boundryColor);
        } else {
            this.addTriangle(left, right, boundry);
            this.addTriangleColor(leftCell.color, rightCell.color, boundryColor);
        }
    }

    trinagulateCellBoundryTriangle(
        begin: BABYLON.Vector3, beginCell: HexCell,
        left: BABYLON.Vector3, leftCell: HexCell,
        boundry: BABYLON.Vector3, boundryColor: BABYLON.Color4
    ) {
        let
            v2 = HexMetrics.terraceLerp(begin, left, 1),
            c2 = HexMetrics.terraceColorLerp(beginCell.color, leftCell.color, 1);

        this.addTriangle(begin, v2, boundry);
        this.addTriangleColor(beginCell.color, c2, boundryColor);

        let 
            i: number,
            v1: BABYLON.Vector3,
            c1: BABYLON.Color4;

        for (i = 2; i < HexMetrics.terraceSteps; i++) {
            v1 = v2;
            c1 = c2;
            v2 = HexMetrics.terraceLerp(begin, left, i);
            c2 = HexMetrics.terraceColorLerp(beginCell.color, leftCell.color, i);

            this.addTriangle(v1, v2, boundry);
            this.addTriangleColor(c1, c2, boundryColor);
        }

        this.addTriangle(v2, left, boundry);
        this.addTriangleColor(c2, leftCell.color, boundryColor);
    }

    triangulateCellEdgeTerraces(
        beginLeft: BABYLON.Vector3, beginRight: BABYLON.Vector3, beginCell: HexCell,
        endLeft: BABYLON.Vector3, endRight: BABYLON.Vector3, endCell: HexCell
    ) {
        let
            v3 = HexMetrics.terraceLerp(beginLeft, endLeft, 1),
            v4 = HexMetrics.terraceLerp(beginRight, endRight, 1),
            c2 = HexMetrics.terraceColorLerp(beginCell.color, endCell.color, 1);

        this.addQuad(beginLeft, beginRight, v3, v4);
        this.addQuadColor2(beginCell.color, c2);

        let 
            v1: BABYLON.Vector3, 
            v2: BABYLON.Vector3, 
            c1: BABYLON.Color4;
            
        for (let i = 2; i < HexMetrics.terraceSteps; i++) {
            v1 = v3;
            v2 = v4;
            c1 = c2;

            v3 = HexMetrics.terraceLerp(beginLeft, endLeft, i);
            v4 = HexMetrics.terraceLerp(beginRight, endRight, i);
            c2 = HexMetrics.terraceColorLerp(beginCell.color, endCell.color, i);

            this.addQuad(v1, v2, v3, v4);
            this.addQuadColor2(c1, c2);
        }

        this.addQuad(v3, v4, endLeft, endRight);
        this.addQuadColor2(c2, endCell.color);
    }

    addTriangle(v1: BABYLON.Vector3, v2: BABYLON.Vector3, v3: BABYLON.Vector3) {
        const vertexIndex = this._vertices.length/3;
        this.addVertex(v1);
        this.addVertex(v2);
        this.addVertex(v3);
        this._triangles.push(vertexIndex);
        this._triangles.push(vertexIndex+1);
        this._triangles.push(vertexIndex+2);
    }

    addSingleTriangleColor(color: BABYLON.Color4) {
        this.addColor(color);
        this.addColor(color);
        this.addColor(color);
    }

    addTriangleColor(color1: BABYLON.Color4, color2: BABYLON.Color4, color3: BABYLON.Color4) {
        this.addColor(color1);
        this.addColor(color2);
        this.addColor(color3);
    }

    addQuad(v1: BABYLON.Vector3, v2: BABYLON.Vector3, v3: BABYLON.Vector3, v4: BABYLON.Vector3) {
        const vertexIndex = this._vertices.length/3;
        this.addVertex(v1);
        this.addVertex(v2);
        this.addVertex(v3);
        this.addVertex(v4);
        this._triangles.push(vertexIndex);
        this._triangles.push(vertexIndex + 2);
        this._triangles.push(vertexIndex + 1);
        this._triangles.push(vertexIndex + 1);
        this._triangles.push(vertexIndex + 2);
        this._triangles.push(vertexIndex + 3);
    }

    addQuadColor(color1: BABYLON.Color4, color2: BABYLON.Color4, color3: BABYLON.Color4, color4: BABYLON.Color4) {
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

    addVertex(vertex: BABYLON.Vector3) {
        this._vertices.push(vertex.x);
        this._vertices.push(vertex.y);
        this._vertices.push(vertex.z);        
    }

    addColor(color: BABYLON.Color4) {
        this._colors.push(color.r);
        this._colors.push(color.g);
        this._colors.push(color.b);
        this._colors.push(color.a);
    }
}

class HexGrid {
    public width: number = 6;
    public height: number = 6;
    public cells: HexCell[];
    private _scene: BABYLON.Scene;
    private _hexMesh: HexMesh;

    public defaultColor: BABYLON.Color4 = HexCellColor.PASTEL_BLUE;

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
    }

    generate(): void {
        this.cells = new Array<HexCell>(this.width*this.height);
        let i = 0;

        for (let z = 0; z < this.height; z++) {
            for (let x = 0; x < this.width; x++) {
                this.cells[i] = this.makeCell(x, z, i);
                i++;
            }
        }

        this._hexMesh = new HexMesh("hex_mesh", this._scene);
        this.refresh();
        this._hexMesh.isVisible = true;
    }

    refresh(): void {
        this._hexMesh.triangulate(this.cells);
    }

    getCell(position: BABYLON.Vector3) {
        let 
            coordinates = HexCooridnates.fromPosition(position),
            index = coordinates.x + coordinates.z * this.width + Math.floor(coordinates.z/2.0);

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
        }

        if (x > 0) {
            cell.setNeighbor(HexDirection.W, this.cells[i-1]);
        }
        if (z > 0) {
            if ((z & 1) === 0) {
                cell.setNeighbor(HexDirection.SE, this.cells[i - this.width]);
                if (x > 0) {
                    cell.setNeighbor(HexDirection.SW, this.cells[i - this.width - 1]);
                }
            } else {
                cell.setNeighbor(HexDirection.SW, this.cells[i - this.width]);
                if (x < this.width - 1) {
                    cell.setNeighbor(HexDirection.SE, this.cells[i - this.width + 1]);
                }
            }
        }

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

        this.grid.refresh();
    }

    setActiveColor(color: BABYLON.Color4): void {
        this.activeColor = color;
    }

    setElevation(elevation: number): void {
        this.activeElevation = elevation;
    }
}