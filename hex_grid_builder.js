///<reference path="babylon.d.ts" />
// via: http://www.demonixis.net/creer-une-grille-hexagonale-en-3d-avec-babylon-js/
var HexGridBuilder = /** @class */ (function () {
    function HexGridBuilder(width, depth, margin) {
        this._width = 10;
        this._depth = 10;
        this._margin = 1.0;
        this._hexWidth = 1.0;
        this._hexDepth = 1.0;
        this._initialPosition = BABYLON.Vector3.Zero();
        this._width = width;
        this._depth = depth;
        this._margin = margin;
    }
    HexGridBuilder.prototype.calculateInitialPosition = function () {
        var position = BABYLON.Vector3.Zero();
        position.x = -this._hexWidth * this._width / 2.0 + this._hexWidth / 2.0;
        position.z = this._depth / 2.0 * this._hexDepth / 2.0;
        return position;
    };
    HexGridBuilder.prototype.getWorldCoordinate = function (x, y, z) {
        var offset = 0.0;
        if (z % 2 === 0) {
            offset = this._hexWidth / 2.0;
        }
        var px = this._initialPosition.x + offset + x * this._hexWidth * this._margin;
        var pz = this._initialPosition.z - z * this._hexDepth * 0.75 * this._margin;
        return new BABYLON.Vector3(px, y, pz);
    };
    HexGridBuilder.prototype.generate = function (scene) {
        var prefab = BABYLON.Mesh.CreateCylinder("cylinder", 1, 3, 3, 6, 1, scene, false);
        prefab.scaling = new BABYLON.Vector3(3, 3, 3);
        prefab.rotation.y += Math.PI / 6;
        var boundingInfo = prefab.getBoundingInfo();
        this._hexWidth = (boundingInfo.maximum.z - boundingInfo.minimum.z) * prefab.scaling.x;
        this._hexDepth = (boundingInfo.maximum.x - boundingInfo.minimum.x) * prefab.scaling.z;
        this._initialPosition = this.calculateInitialPosition();
        var materials = [
            new BABYLON.StandardMaterial("BlueMaterial", scene),
            new BABYLON.StandardMaterial("GreenMaterial", scene),
            new BABYLON.StandardMaterial("BrownMaterial", scene)
        ];
        materials[0].diffuseTexture = new BABYLON.Texture("assets/gfx/material/blue.png", scene);
        materials[1].diffuseTexture = new BABYLON.Texture("assets/gfx/material/green.png", scene);
        materials[2].diffuseTexture = new BABYLON.Texture("assets/gfx/material/brown.png", scene);
        var grid = new BABYLON.Mesh("Grid", scene);
        grid.isVisible = false;
        var tile = null;
        var rnd = null;
        for (var z = 0; z < this._depth; z++) {
            for (var x = 0; x < this._width; x++) {
                tile = prefab.clone();
                tile.position = this.getWorldCoordinate(x, 0, z);
                tile.hexPosition = new BABYLON.Vector3(x, 0, z);
                rnd = Math.floor(Math.random() * 10);
                if (rnd % 2 === 0) {
                    tile.scaling.y += 1;
                    tile.material = materials[0];
                }
                else if (rnd % 3 === 0) {
                    tile.scaling.y += 6;
                    tile.material = materials[2];
                }
                else {
                    tile.material = materials[1];
                }
                tile.parent = grid;
            }
        }
        prefab.dispose();
    };
    return HexGridBuilder;
}());
