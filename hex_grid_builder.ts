///<reference path="babylon.d.ts" />
// via: http://www.demonixis.net/creer-une-grille-hexagonale-en-3d-avec-babylon-js/

class HexGridBuilder {
    private _width: number = 10;
    private _depth: number = 10;
    private _margin: number = 1.0;
    private _hexWidth: number = 1.0;
    private _hexDepth: number = 1.0;
    private _initialPosition: BABYLON.Vector3 = BABYLON.Vector3.Zero();

    constructor(width: number, depth: number, margin: number) {
        this._width = width;
        this._depth = depth;
        this._margin = margin;
    }

    calculateInitialPosition(): BABYLON.Vector3 {
        const position = BABYLON.Vector3.Zero();
    
        position.x = -this._hexWidth * this._width / 2.0 + this._hexWidth / 2.0;
        position.z = this._depth / 2.0 * this._hexDepth / 2.0;

        return position;
    }

    getWorldCoordinate(x: number, y: number, z: number): BABYLON.Vector3 {
        let offset = 0.0;

        if (z % 2 === 0) {
            offset = this._hexWidth / 2.0;
        }

        let px = this._initialPosition.x + offset + x * this._hexWidth * this._margin;
        let pz = this._initialPosition.z - z * this._hexDepth * 0.75 * this._margin;

        return new BABYLON.Vector3(px, y, pz);
    }

    generate(scene: BABYLON.Scene): void {
        let prefab = BABYLON.Mesh.CreateCylinder("cylinder", 1, 3, 3, 6, 1, scene, false);
        prefab.scaling = new BABYLON.Vector3(3, 3, 3);
        prefab.rotation.y += Math.PI / 6;

        let boundingInfo = prefab.getBoundingInfo();
        this._hexWidth = (boundingInfo.maximum.z - boundingInfo.minimum.z) * prefab.scaling.x;
        this._hexDepth = (boundingInfo.maximum.x - boundingInfo.minimum.x) * prefab.scaling.z;
        this._initialPosition = this.calculateInitialPosition();
        
        const materials = [
            new BABYLON.StandardMaterial("BlueMaterial", scene),
            new BABYLON.StandardMaterial("GreenMaterial", scene),
            new BABYLON.StandardMaterial("BrownMaterial", scene)
        ];

        materials[0].diffuseTexture = new BABYLON.Texture("assets/gfx/material/blue.png", scene);
        materials[1].diffuseTexture = new BABYLON.Texture("assets/gfx/material/green.png", scene);
        materials[2].diffuseTexture = new BABYLON.Texture("assets/gfx/material/brown.png", scene);

        let grid = new BABYLON.Mesh("Grid", scene);
        grid.isVisible = false;

        let tile = null;
        let rnd = null;

        for (let z = 0; z < this._depth; z++) {
            for (let x = 0; x < this._width; x++) {
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
    }
}