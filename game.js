///<reference path="babylon.d.ts" />
///<reference path="hex.ts" />
///<reference path="hex_camera.ts" />
class Game {
    constructor(canvasElement) {
        // Create canvas and engine.
        this._canvas = document.getElementById(canvasElement);
        this._engine = new BABYLON.Engine(this._canvas, true);
    }
    createScene() {
        // Create a basic BJS Scene object.
        this._scene = new BABYLON.Scene(this._engine);
        // this._scene.clearColor = BABYLON.Color4.FromColor3(BABYLON.Color3.White());
        this._utilLayer = new BABYLON.UtilityLayerRenderer(this._scene);
        // Create a FreeCamera, and set its position to (x:0, y:5, z:-10).
        this._camera = new BABYLON.FreeCamera('camera1', new BABYLON.Vector3(11, 65, -27), this._scene);
        let mouseInput = new HexGridFreeCameraMouseInput(true);
        this._camera.inputs.remove(this._camera.inputs._mouseInput);
        this._camera.inputs._mouseInput = mouseInput;
        this._camera.inputs.add(mouseInput);
        // Target the camera to scene origin.
        this._camera.setTarget(BABYLON.Vector3.Zero());
        // Attach the camera to the canvas.
        this._camera.attachControl(this._canvas, false);
        // Create a basic light, aiming 0,1,0 - meaning, to the sky.
        this._light = new BABYLON.HemisphericLight('light1', new BABYLON.Vector3(0, -1.0, 0), this._scene);
        // this._light = new BABYLON.DirectionalLight('directional_light', new BABYLON.Vector3(0, -1 ,0), this._scene);
        this._hexGrid = new HexGrid(this._scene);
        this._hexGrid.generate();
        this._hexMapEditor = new HexMapEditor(this._hexGrid);
        this._hexMapEditor.attachCameraControl(this._camera);
        window.editor = this._hexMapEditor;
        // this._scene.debugLayer.show();
    }
    doRender() {
        // Run the render loop.
        this._engine.runRenderLoop(() => {
            this._scene.render();
        });
        // The canvas/window resize event handler.
        window.addEventListener('resize', () => {
            this._engine.resize();
        });
        this._scene.registerBeforeRender(() => {
            HexGrid.refresh();
        });
        this._scene.registerAfterRender(() => {
            HexMapEditor.POINTER_BLOCKED_BY_GUI = false;
        });
    }
}
