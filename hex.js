///<reference path="babylon.d.ts" />
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var HexMetrics = /** @class */ (function () {
    function HexMetrics() {
    }
    HexMetrics.getFirstCorner = function (direction) {
        return HexMetrics.corners[direction];
    };
    HexMetrics.getSecondCorner = function (direction) {
        return HexMetrics.corners[direction + 1];
    };
    HexMetrics.getFirstSolidCorner = function (direction) {
        return HexMetrics.corners[direction].scale(HexMetrics.solidFactor);
    };
    HexMetrics.getSecondSolidCorner = function (direction) {
        return HexMetrics.corners[direction + 1].scale(HexMetrics.solidFactor);
    };
    HexMetrics.getBridge = function (direction) {
        return this.corners[direction].add(this.corners[direction + 1]).scale(HexMetrics.blendFactor);
    };
    HexMetrics.terraceLerp = function (a, b, step) {
        var h = step * HexMetrics.horizontalTerraceStepSize, v = ~~((step + 1) / 2.0) * HexMetrics.verticalTerraceStepSize, t = a.clone();
        t.x += (b.x - a.x) * h;
        t.z += (b.z - a.z) * h;
        t.y += (b.y - a.y) * v;
        return t;
    };
    HexMetrics.terraceColorLerp = function (a, b, step) {
        var h = step * HexMetrics.horizontalTerraceStepSize;
        return BABYLON.Color4.Lerp(a, b, h);
    };
    HexMetrics.getEdgeType = function (elevation1, elevation2) {
        if (elevation1 === elevation2) {
            return HexEdgeType.Flat;
        }
        var delta = elevation2 - elevation1;
        if (delta == 1 || delta == -1) {
            return HexEdgeType.Slope;
        }
        return HexEdgeType.Cliff;
    };
    HexMetrics.outerRadius = 10.0;
    HexMetrics.innerRadius = HexMetrics.outerRadius * 0.866025404;
    HexMetrics.solidFactor = 0.75;
    HexMetrics.blendFactor = 1.0 - HexMetrics.solidFactor;
    HexMetrics.elevationStep = 10.0;
    HexMetrics.terracesPerSlope = 2;
    HexMetrics.terraceSteps = HexMetrics.terracesPerSlope * 2 + 1;
    HexMetrics.horizontalTerraceStepSize = (1.0 / HexMetrics.terraceSteps);
    HexMetrics.verticalTerraceStepSize = (1.0 / (HexMetrics.terracesPerSlope + 1));
    HexMetrics.corners = [
        new BABYLON.Vector3(0.0, 0.0, HexMetrics.outerRadius),
        new BABYLON.Vector3(HexMetrics.innerRadius, 0.0, 0.5 * HexMetrics.outerRadius),
        new BABYLON.Vector3(HexMetrics.innerRadius, 0.0, -0.5 * HexMetrics.outerRadius),
        new BABYLON.Vector3(0.0, 0.0, -HexMetrics.outerRadius),
        new BABYLON.Vector3(-HexMetrics.innerRadius, 0.0, -0.5 * HexMetrics.outerRadius),
        new BABYLON.Vector3(-HexMetrics.innerRadius, 0.0, 0.5 * HexMetrics.outerRadius),
        new BABYLON.Vector3(0.0, 0.0, HexMetrics.outerRadius)
    ];
    return HexMetrics;
}());
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
    function next(direction) {
        return direction === HexDirection.NW ? HexDirection.NE : (direction + 1);
    }
    HexDirection.next = next;
})(HexDirection || (HexDirection = {}));
var HexEdgeType;
(function (HexEdgeType) {
    HexEdgeType[HexEdgeType["Flat"] = 0] = "Flat";
    HexEdgeType[HexEdgeType["Slope"] = 1] = "Slope";
    HexEdgeType[HexEdgeType["Cliff"] = 2] = "Cliff";
})(HexEdgeType || (HexEdgeType = {}));
var HexCooridnates = /** @class */ (function () {
    function HexCooridnates(x, z) {
        this.x = x;
        this.z = z;
    }
    Object.defineProperty(HexCooridnates.prototype, "y", {
        get: function () {
            return -this.x - this.z;
        },
        enumerable: true,
        configurable: true
    });
    HexCooridnates.fromOffsetCoordinates = function (x, z) {
        return new HexCooridnates(x - Math.floor(z / 2.0), z);
    };
    HexCooridnates.fromPosition = function (position) {
        var x = position.x / (HexMetrics.innerRadius * 2.0), y = -x, offset = position.z / (HexMetrics.outerRadius * 3.0);
        x -= offset;
        y -= offset;
        var ix = Math.round(x), iy = Math.round(y), iz = Math.round(-x - y);
        if (ix + iy + iz != 0) {
            var dx = Math.abs(x - ix), dy = Math.abs(y - iy), dz = Math.abs(-x - y - iz);
            if (dx > dy && dx > dz) {
                ix = -iy - iz;
            }
            else if (dz > dy) {
                iz = -ix - iy;
            }
        }
        return new HexCooridnates(ix, iz);
    };
    HexCooridnates.prototype.toString = function () {
        return "(" + this.x + ", " + this.y + ", " + this.z + ")";
    };
    return HexCooridnates;
}());
var HexCellColor = /** @class */ (function () {
    function HexCellColor() {
    }
    HexCellColor.default = function () {
        return HexCellColor.colors[0];
    };
    HexCellColor.random = function () {
        return HexCellColor.colors[Math.floor(Math.random() * HexCellColor.colors.length)];
    };
    HexCellColor.average = function (colors) {
        var avgColor = new BABYLON.Color4(0, 0, 0, 0);
        for (var i = 0; i < colors.length; i++) {
            avgColor.addInPlace(colors[i]);
        }
        avgColor.r = avgColor.r / colors.length;
        avgColor.g = avgColor.g / colors.length;
        avgColor.b = avgColor.b / colors.length;
        return avgColor;
    };
    HexCellColor.PASTEL_BLUE = BABYLON.Color4.FromHexString("#548af8ff");
    HexCellColor.PASTEL_YELLOW = BABYLON.Color4.FromHexString("#fffc1fff");
    HexCellColor.PASTEL_GREEN = BABYLON.Color4.FromHexString("#20e43fff");
    HexCellColor.colors = [
        BABYLON.Color4.FromColor3(BABYLON.Color3.White()),
        HexCellColor.PASTEL_YELLOW,
        BABYLON.Color4.FromColor3(BABYLON.Color3.White()),
        HexCellColor.PASTEL_BLUE,
        BABYLON.Color4.FromColor3(BABYLON.Color3.White()),
        HexCellColor.PASTEL_GREEN //hex green, with alpha
    ];
    return HexCellColor;
}());
/**
 * CAUTION: UNTIL HexCell extends BABYLON.Mesh, ALWAYS SET POSITION VIA cellPostion!!
 */
var HexCell = /** @class */ (function (_super) {
    __extends(HexCell, _super);
    function HexCell(name, scene) {
        var _this = _super.call(this, name, scene) || this;
        _this.neighbors = new Array(6);
        _this._elevation = 0;
        var options = {
            size: 10,
            width: 10,
            height: 10,
            updatable: true
        };
        var vertexData = BABYLON.VertexData.CreateGround(options);
        vertexData.applyToMesh(_this);
        return _this;
    }
    HexCell.prototype.getNeighbor = function (direction) {
        return this.neighbors[direction];
    };
    HexCell.prototype.setNeighbor = function (direction, cell) {
        this.neighbors[direction] = cell;
        cell.neighbors[HexDirection.opposite(direction)] = this;
    };
    Object.defineProperty(HexCell.prototype, "elevation", {
        get: function () {
            return this._elevation;
        },
        set: function (elevation) {
            this._elevation = elevation;
            this._cellPosition.y = elevation * HexMetrics.elevationStep;
            this.refreshPosition();
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(HexCell.prototype, "cellPosition", {
        get: function () {
            return this._cellPosition;
        },
        set: function (position) {
            this._cellPosition = position.clone();
            this.refreshPosition();
        },
        enumerable: true,
        configurable: true
    });
    // Sets mesh render position from cellPosition (renders it slightly above).
    HexCell.prototype.refreshPosition = function () {
        this.position = this._cellPosition.clone();
        this.position.y += HexCell.CELL_OVERLAY_ELEVATION;
    };
    HexCell.prototype.getEdgeType = function (direction) {
        return HexMetrics.getEdgeType(this.elevation, this.neighbors[direction].elevation);
    };
    HexCell.prototype.getEdgeTypeForCell = function (cell) {
        return HexMetrics.getEdgeType(this.elevation, cell.elevation);
    };
    HexCell.CELL_OVERLAY_ELEVATION = 0.1;
    return HexCell;
}(BABYLON.Mesh));
var HexMesh = /** @class */ (function (_super) {
    __extends(HexMesh, _super);
    function HexMesh(name, scene) {
        var _this = _super.call(this, name, scene) || this;
        _this._vertices = [];
        _this._triangles = [];
        _this._colors = [];
        var mat = new BABYLON.StandardMaterial("material", scene);
        mat.backFaceCulling = false;
        mat.emissiveColor = BABYLON.Color3.White();
        // mat.specularColor = BABYLON.Color3.Black();
        // mat.wireframe = true;
        _this.material = mat;
        _this._setReady(false);
        return _this;
    }
    HexMesh.prototype.triangulate = function (cells) {
        this._vertices = [];
        this._triangles = [];
        this._colors = [];
        for (var i = 0; i < cells.length; i++) {
            for (var direction = HexDirection.NE; direction <= HexDirection.NW; direction++) {
                this.triangulateCell(direction, cells[i]);
            }
        }
        var vertexData = new BABYLON.VertexData();
        var normals = [];
        BABYLON.VertexData.ComputeNormals(this._vertices, this._triangles, normals);
        vertexData.positions = this._vertices;
        vertexData.indices = this._triangles;
        vertexData.colors = this._colors;
        vertexData.normals = normals;
        vertexData.applyToMesh(this, true);
        this._setReady(true);
    };
    HexMesh.prototype.triangulateCell = function (direction, cell) {
        var center = cell.cellPosition.clone();
        var v1 = center.add(HexMetrics.getFirstSolidCorner(direction)), v2 = center.add(HexMetrics.getSecondSolidCorner(direction));
        this.addTriangle(center, v1, v2);
        this.addSingleTriangleColor(cell.color);
        if (direction <= HexDirection.SE) {
            this.triangulateCellConnection(direction, cell, v1, v2);
        }
    };
    HexMesh.prototype.triangulateCellConnection = function (direction, cell, v1, v2) {
        var neighbor = cell.getNeighbor(direction);
        if (neighbor == null) {
            return;
        }
        var bridge = HexMetrics.getBridge(direction), v3 = v1.add(bridge), v4 = v2.add(bridge);
        v3.y = v4.y = neighbor.elevation * HexMetrics.elevationStep;
        if (cell.getEdgeType(direction) === HexEdgeType.Slope) {
            this.triangulateCellEdgeTerraces(v1, v2, cell, v3, v4, neighbor);
        }
        else {
            this.addQuad(v1, v2, v3, v4);
            this.addQuadColor2(cell.color, neighbor.color);
        }
        var nextNeighborDirection = HexDirection.next(direction), nextNeighbor = cell.getNeighbor(nextNeighborDirection);
        if (direction <= HexDirection.E && nextNeighbor != null) {
            var v5 = v2.add(HexMetrics.getBridge(nextNeighborDirection));
            v5.y = nextNeighbor.elevation * HexMetrics.elevationStep;
            if (cell.elevation <= neighbor.elevation) {
                if (cell.elevation <= nextNeighbor.elevation) {
                    this.triangulateCellCorner(v2, cell, v4, neighbor, v5, nextNeighbor);
                }
                else {
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
    };
    HexMesh.prototype.triangulateCellCorner = function (bottom, bottomCell, left, leftCell, right, rightCell) {
        var leftEdgeType = bottomCell.getEdgeTypeForCell(leftCell), rightEdgeType = bottomCell.getEdgeTypeForCell(rightCell);
        if (leftEdgeType === HexEdgeType.Slope) {
            if (rightEdgeType === HexEdgeType.Slope) {
                this.triangulateCellCornerTerraces(bottom, bottomCell, left, leftCell, right, rightCell);
                return;
            }
            if (rightEdgeType === HexEdgeType.Flat) {
                this.triangulateCellCornerTerraces(left, leftCell, right, rightCell, bottom, bottomCell);
                return;
            }
        }
        if (rightEdgeType === HexEdgeType.Slope) {
            if (leftEdgeType === HexEdgeType.Flat) {
                this.triangulateCellCornerTerraces(right, rightCell, bottom, bottomCell, left, leftCell);
                return;
            }
        }
        this.addTriangle(bottom, left, right);
        this.addTriangleColor(bottomCell.color, leftCell.color, rightCell.color);
    };
    HexMesh.prototype.triangulateCellCornerTerraces = function (begin, beginCell, left, leftCell, right, rightCell) {
        var v3 = HexMetrics.terraceLerp(begin, left, 1), v4 = HexMetrics.terraceLerp(begin, right, 1), c3 = HexMetrics.terraceColorLerp(beginCell.color, leftCell.color, 1), c4 = HexMetrics.terraceColorLerp(beginCell.color, rightCell.color, 1);
        this.addTriangle(begin, v3, v4);
        this.addTriangleColor(beginCell.color, c3, c4);
        var i, v1, v2, c1, c2;
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
    };
    HexMesh.prototype.triangulateCellEdgeTerraces = function (beginLeft, beginRight, beginCell, endLeft, endRight, endCell) {
        var v3 = HexMetrics.terraceLerp(beginLeft, endLeft, 1), v4 = HexMetrics.terraceLerp(beginRight, endRight, 1), c2 = HexMetrics.terraceColorLerp(beginCell.color, endCell.color, 1);
        this.addQuad(beginLeft, beginRight, v3, v4);
        this.addQuadColor2(beginCell.color, c2);
        var v1, v2, c1;
        for (var i = 2; i < HexMetrics.terraceSteps; i++) {
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
    };
    HexMesh.prototype.addTriangle = function (v1, v2, v3) {
        var vertexIndex = this._vertices.length / 3;
        this.addVertex(v1);
        this.addVertex(v2);
        this.addVertex(v3);
        this._triangles.push(vertexIndex);
        this._triangles.push(vertexIndex + 1);
        this._triangles.push(vertexIndex + 2);
    };
    HexMesh.prototype.addSingleTriangleColor = function (color) {
        this.addColor(color);
        this.addColor(color);
        this.addColor(color);
    };
    HexMesh.prototype.addTriangleColor = function (color1, color2, color3) {
        this.addColor(color1);
        this.addColor(color2);
        this.addColor(color3);
    };
    HexMesh.prototype.addQuad = function (v1, v2, v3, v4) {
        var vertexIndex = this._vertices.length / 3;
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
    };
    HexMesh.prototype.addQuadColor = function (color1, color2, color3, color4) {
        this.addColor(color1);
        this.addColor(color2);
        this.addColor(color3);
        this.addColor(color4);
    };
    /** Adds only two colors to the quad. */
    HexMesh.prototype.addQuadColor2 = function (color1, color2) {
        this.addColor(color1);
        this.addColor(color1);
        this.addColor(color2);
        this.addColor(color2);
    };
    HexMesh.prototype.addVertex = function (vertex) {
        this._vertices.push(vertex.x);
        this._vertices.push(vertex.y);
        this._vertices.push(vertex.z);
    };
    HexMesh.prototype.addColor = function (color) {
        this._colors.push(color.r);
        this._colors.push(color.g);
        this._colors.push(color.b);
        this._colors.push(color.a);
    };
    return HexMesh;
}(BABYLON.Mesh));
var HexGrid = /** @class */ (function () {
    function HexGrid(scene) {
        this.width = 6;
        this.height = 6;
        this.defaultColor = BABYLON.Color4.FromColor3(BABYLON.Color3.White());
        this.touchedColor = BABYLON.Color4.FromColor3(BABYLON.Color3.Magenta());
        this._scene = scene;
    }
    HexGrid.prototype.generate = function () {
        this.cells = new Array(this.width * this.height);
        var i = 0;
        for (var z = 0; z < this.height; z++) {
            for (var x = 0; x < this.width; x++) {
                this.cells[i] = this.makeCell(x, z, i);
                i++;
            }
        }
        this._hexMesh = new HexMesh("hex_mesh", this._scene);
        this.refresh();
        this._hexMesh.isVisible = true;
    };
    HexGrid.prototype.refresh = function () {
        this._hexMesh.triangulate(this.cells);
    };
    HexGrid.prototype.touchCell = function (position) {
        this.colorCell(position, this.touchedColor);
    };
    HexGrid.prototype.getCell = function (position) {
        var coordinates = HexCooridnates.fromPosition(position), index = coordinates.x + coordinates.z * this.width + Math.floor(coordinates.z / 2.0);
        return this.cells[index];
    };
    HexGrid.prototype.colorCell = function (position, color) {
        var coordinates = HexCooridnates.fromPosition(position), index = coordinates.x + coordinates.z * this.width + Math.floor(coordinates.z / 2.0);
        this.cells[index].color = this.touchedColor;
    };
    HexGrid.prototype.makeCell = function (x, z, i) {
        var cell = new HexCell("hex_cell_" + x + "_" + z, this._scene), cellPosition = new BABYLON.Vector3((x + z * 0.5 - Math.floor(z / 2)) * (HexMetrics.innerRadius * 2.0), 0.0, z * (HexMetrics.outerRadius * 1.5));
        cell.coordinates = HexCooridnates.fromOffsetCoordinates(x, z);
        cell.isVisible = true;
        cell.isPickable = false;
        cell.cellPosition = cellPosition;
        var material = new BABYLON.StandardMaterial("" + x + z + "-material", this._scene), textTexture = this.makeCellText(cell.coordinates.toString());
        material.diffuseTexture = textTexture;
        material.opacityTexture = textTexture;
        material.specularColor = BABYLON.Color3.Black();
        cell.material = material;
        cell.color = HexCellColor.random();
        if (x > 0) {
            cell.setNeighbor(HexDirection.W, this.cells[i - 1]);
        }
        if (z > 0) {
            if ((z & 1) === 0) {
                cell.setNeighbor(HexDirection.SE, this.cells[i - this.width]);
                if (x > 0) {
                    cell.setNeighbor(HexDirection.SW, this.cells[i - this.width - 1]);
                }
            }
            else {
                cell.setNeighbor(HexDirection.SW, this.cells[i - this.width]);
                if (x < this.width - 1) {
                    cell.setNeighbor(HexDirection.SE, this.cells[i - this.width + 1]);
                }
            }
        }
        return cell;
    };
    HexGrid.prototype.makeCellText = function (txt) {
        var size = 64;
        var DTw = 10 * 60;
        var DTh = 10 * 60;
        var textTexture = new BABYLON.DynamicTexture("DT", { width: DTw, height: DTh }, this._scene, false);
        textTexture.hasAlpha = true;
        var textCtx = textTexture.getContext();
        textCtx.font = size + "px bold monospace";
        textCtx.fillStyle = "transparent";
        var textWidth = textCtx.measureText(txt).width;
        var ratio = textWidth / size;
        var fontSize = Math.floor(DTw / ratio);
        textTexture.drawText(txt, null, null, fontSize + "px bold monospace", "black", null);
        return textTexture;
    };
    return HexGrid;
}());
var HexMapEditor = /** @class */ (function () {
    function HexMapEditor(grid) {
        this.activeElevation = 0.0;
        this.grid = grid;
        this.activeColor = HexCellColor.default();
    }
    HexMapEditor.prototype.handleInput = function (position) {
        this.editCell(this.grid.getCell(position));
    };
    HexMapEditor.prototype.editCell = function (cell) {
        cell.color = this.activeColor;
        cell.elevation = this.activeElevation;
        this.grid.refresh();
    };
    HexMapEditor.prototype.setActiveColor = function (color) {
        this.activeColor = color;
    };
    HexMapEditor.prototype.setElevation = function (elevation) {
        this.activeElevation = elevation;
    };
    return HexMapEditor;
}());
