import { HexGridFreeCameraMouseInput } from "./hex_camera.js"
import { HexGrid, HexMapEditor } from "./hex.js"
import { Socket, Channel } from "./phoenix.js";

export namespace Game {
    export class Client {
        private _canvas: HTMLCanvasElement;
        private _engine: BABYLON.Engine;
        private _scene: BABYLON.Scene;
        private _utilLayer: BABYLON.UtilityLayerRenderer;
        private _camera: BABYLON.FreeCamera;
        private _light: BABYLON.Light;
        private _hexGrid: HexGrid;
        private _hexMapEditor: HexMapEditor;
        private _net: Game.Net;

        constructor(canvasElement : string) {
            // Create canvas and engine.
            this._canvas = document.getElementById(canvasElement) as HTMLCanvasElement;
            this._engine = new BABYLON.Engine(this._canvas, true);
        }

        createScene() : void {
            // Create a basic BJS Scene object.
            this._scene = new BABYLON.Scene(this._engine);
            // this._scene.clearColor = BABYLON.Color4.FromColor3(BABYLON.Color3.White());

            this._utilLayer = new BABYLON.UtilityLayerRenderer(this._scene);

            // Create a FreeCamera, and set its position to (x:0, y:5, z:-10).
            this._camera = new BABYLON.FreeCamera('camera1', new BABYLON.Vector3(11, 65,-27), this._scene);

            let mouseInput = new HexGridFreeCameraMouseInput(true);

            this._camera.inputs.remove(this._camera.inputs._mouseInput);
            this._camera.inputs._mouseInput = mouseInput;
            this._camera.inputs.add(mouseInput);

            // Target the camera to scene origin.
            this._camera.setTarget(BABYLON.Vector3.Zero());

            // Attach the camera to the canvas.
            this._camera.attachControl(this._canvas, false);

            // Create a basic light, aiming 0,1,0 - meaning, to the sky.
            this._light = new BABYLON.HemisphericLight('light1', new BABYLON.Vector3(0, 1.0 ,0), this._scene);
            // this._light = new BABYLON.DirectionalLight('directional_light', new BABYLON.Vector3(0, -1 ,0), this._scene);

            this._hexGrid = new HexGrid(this._scene);

            if (window.location.search) {
                const params = this.parseQueryString(window.location.search);
                if ('game_id' in params && 'player_id' in params) {
                    this.connect(params['game_id'], params['player_id']);
                }
            }

            this._hexMapEditor = new HexMapEditor(this._hexGrid, this._net);
            this._hexMapEditor.attachCameraControl(this._camera);

            (<any>window).editor = this._hexMapEditor;
            // this._scene.debugLayer.show();
        }

        doRender() : void {
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

            if (this._net) {
                this._net.join(this._hexGrid);
            }
        }

        connect(gameId: string, playerId: string): void {
            this._net = new Game.Net(gameId, playerId);
            this._net.connect();
        }

        parseQueryString(query: string): Object {
            const reducer = (dict: Object, [k, v]): Object => {
                dict[k] = v;
                return dict;
            };

            return (
                query
                .substr(1)
                .split("&")
                .map(kv => kv.split("="))
                .reduce(reducer, {})
            );
        }
    }

    export class Net {
        private _gameId: string;
        private _playerId: string;
        private _socket: Socket;
        private _gameChannel: Channel;

        constructor(gameId: string, playerId: string) {
            this._gameId = gameId;
            this._playerId = playerId;
        }

        connect(): void {
            this._socket = new Socket("ws://localhost:4000/socket", {params: {player_id: this._playerId}});
            (<any>this._socket).connect(); // the first arg. is deprecated, but this shit still wants something, so we casted it to any ;)
        }

        join(grid: HexGrid): void {
            const loadGrid = (joinMsg) => {
                grid.onLoaded(() => {
                    grid.loadFromObject(joinMsg.grid);
                });
            };

            const ready = () => {
                this._gameChannel.push("ready", {}, 5000)
                    .receive("ok", loadGrid)
                    .receive("error", (reason) => console.log(reason))
                    .receive("timeout", () => console.log("timed out :("));
            };

            this._gameChannel = this._socket.channel("game:" + this._gameId);

            // this._gameChannel.on("")

            this._gameChannel
                .join()
                .receive("ok", ({messages}) => {
                    console.log("catching up", messages);
                    ready();
                })
                .receive("error", ({reason}) => console.log("failed join", reason))
                .receive("timeout", () => console.log("Network failure, still waiting..."));
        }

        // pushCommands(commands: Cmd[]): void {

        // }

        // pushCommands(commands: any[]): void {
        //     this._gameChannel.push("commands", commands)
        //         .receive("ok", (msg) => console.log(msg))
        //         .receive("error", (reason) => console.log(reason))
        //         .receive("timeout", () => console.log("Timed out :("));
        // }

        pushCommand(cmd: any): void {
            this._gameChannel.push("command", cmd)
                .receive("ok", (msg) => console.log(msg))
                .receive("error", (reason) => console.log(reason))
                .receive("timeout", () => console.log("Timed out :("));
        }
    }

    export interface Cmd {
        name: string;
        prev_value: any;
        new_value: any;
    }

}