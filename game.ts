import { HexGridFreeCameraMouseInput } from "./hex_camera.js"
import { HexGrid, HexMapEditor, HexGUI } from "./hex.js"
import { Socket, Channel } from "./phoenix.js";
import { Commands } from "./commands.js"
import { EntityManager } from "./tesseract/entity_manager.js";

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
        private _state: Game.State;
        private _entityManager: EntityManager;
        private _gui: HexGUI;

        constructor(canvasElement : string) {
            // Create canvas and engine.
            this._canvas = document.getElementById(canvasElement) as HTMLCanvasElement;
            this._engine = new BABYLON.Engine(this._canvas, true);
        }

        createScene() : void {
            // Create a basic BJS Scene object.
            this._scene = new BABYLON.Scene(this._engine);
            this._entityManager = new EntityManager(this._scene);
            this._state = new Game.State();
            this._net = new Game.Net(this._state, this._entityManager);
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

            this._gui = new HexGUI(this._hexGrid, this._state, this._net);

            this._hexMapEditor = new HexMapEditor(this._hexGrid, this._gui, this._net);
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
        }
    }

    export class State {
        private _gameRef: string = null;
        private _playerRef: string = null;
        private _isGameJoined: boolean = false;
        private _isGameReady: boolean = false;
        private _isTurnActive: boolean = false;
        private _activePlayer: string;
        private _turnNumber: number = -1;
        private _observers = {};

        set game(gameRef: string) {
            if (this._gameRef !== null) {
                throw new Error("Cannot change state\'s gameRef as it is already set.")
            }

            this._gameRef = gameRef;
            this.notifyObservers();
        }

        set player(playerRef: string) {
            if (this._playerRef !== null) {
                throw new Error("Cannot change state\'s playerRef as it is already set.")
            }

            this._playerRef = playerRef;
            this.notifyObservers();
        }

        get isGameJoined(): boolean {
            return this._isGameJoined;
        }

        get isGameReady(): boolean {
            return this.isGameJoined && this._isGameReady;
        }

        public joined(): void {
            this._isGameJoined = true;
            this.notifyObservers();
        }

        public ready(): void {
            this._isGameReady = true;
            this.notifyObservers();
        }

        get turnNumber(): number {
            return this._turnNumber;
        }
        
        get turnActive(): boolean {
            return this._isTurnActive;
        }

        set activePlayer(playerRef: string) {
            this._activePlayer = playerRef;
            this._isTurnActive = playerRef === this._playerRef;
            this.notifyObservers();
        }

        get activePlayer(): string {
            return this._activePlayer;
        }

        set turn(turn: number) {
            this._turnNumber = turn;
            this.notifyObservers();
        }

        registerObserver(observer: string, callback: Function): void {
            this._observers[observer] = callback;
        }

        unregisterObserver(observer: string): void {
            delete this._observers[observer];
        }

        private notifyObservers(): void {
            Object.keys(this._observers).forEach(k => this._observers[k](this));
        }
    }

    export class Net {
        private _serverAddress = 'ws://localhost:4000/socket';

        private _gameId: string;
        private _playerId: string;
        private _gameState: Game.State;
        private _entityManager: EntityManager;
        private _socket: Socket;
        private _gameChannel: Channel;
        private _playerChannel: Channel;

        constructor(gameState: Game.State, entityManager: EntityManager) {
            this._gameState = gameState;
            this._entityManager = entityManager;
        }

        set serverAddress(serverAddr: string) {
            this._serverAddress = serverAddr;
        }

        connect(gameRef: string, playerRef: string): void {
            this._gameId = gameRef;
            this._playerId = playerRef;
            this._gameState.game = gameRef;
            this._gameState.player = playerRef;

            this._socket = new Socket('ws://localhost:4000/socket', {params: {player_id: this._playerId}});
            (<any>this._socket).connect(); // the first arg. is deprecated, but this shit still wants something, so we casted it to any ;)
        }

        join(grid: HexGrid, gameParams: any): void {
            const loadGrid = (joinMsg) => {
                grid.onLoaded(() => {
                    let initialGrid = joinMsg.grid;

                    Object.keys(initialGrid.cells).forEach(coordinates => {
                        let networkCell = initialGrid.cells[coordinates];


                        // Map property names.
                        let cell = {
                            coordinates: networkCell.coordinates,
                            elevation: networkCell.elevation,
                            entities: networkCell.entities,
                            farmLevel: networkCell.farm_level,
                            hasIncomingRiver: networkCell.has_incoming_river,
                            hasOutgoingRiver: networkCell.has_outgoing_river,
                            plantLevel: networkCell.plant_level,
                            roads: networkCell.roads,
                            specialIndex: networkCell.special_index,
                            terrainTypeIndex: networkCell.terrain_type_index,
                            walled: networkCell.walled,
                            waterLevel: networkCell.water_level
                        };

                        this._entityManager.addEntity(`hex_cell_${coordinates}`, cell);
                    });

                    initialGrid.cells = Object.keys(initialGrid.cells).map(coordinates => this._entityManager.evaluate(`hex_cell_${coordinates}`));

                    grid.loadFromObject(initialGrid);
                });
            };

            const joinGame = () => {
                this._gameChannel.push('join', {}, 5000)
                    .receive('ok', (msg) => {
                        console.log('Successfully joined.');
                        loadGrid(msg);
                        this._gameState.joined();
                    })
                    .receive('error', (reason) => console.log(reason))
                    .receive('timeout', () => console.log('timed out :('));
            };

            let joinedGameChn = false, joinedPlayerChn = false;
            const joinSuccess = (channel: string) => {
                if (channel === 'game') {
                    joinedGameChn = true;
                } else {
                    joinedPlayerChn = true;
                }

                console.log('joined ' + channel + ' channel');

                if (joinedGameChn && joinedPlayerChn) {
                    joinGame();
                }
            };

            this._gameChannel = this._socket.channel('game:' + this._gameId, gameParams);
            this._playerChannel = this._socket.channel('player:' + this._playerId, {game_ref: this._gameId});

            this._gameChannel
                .join()
                .receive('ok', () => { joinSuccess('game'); })
                .receive('error', ({reason}) => console.log('failed join', reason))
                .receive('timeout', () => console.log('Network failure, still waiting...'));

            this._playerChannel
                .join()
                .receive('ok', () => { joinSuccess('player'); })
                .receive('error', ({reason}) => console.log('failed join', reason))
                .receive('timeout', () => console.log('Network failure, still waiting...'));

            this._playerChannel.on('event', this.processEvent.bind(this));
        }

        pushCommand(cmd: Commands.Cmd, successCallback = null): void {
            if (!this._gameChannel) {
                console.info('Attempting to push a command while not connected to a game.');
                return;
            }

            successCallback = successCallback || console.log;

            this._gameChannel.push('command', cmd)
                .receive('ok', successCallback)
                .receive('error', (reason) => console.log(reason))
                .receive('timeout', () => console.log('Timed out :('));
        }

        processEvent(event: any): void {
            console.log('Received event message', event);

            switch (event.name) {
                case 'game.round_started':
                    this._gameState.turn = event.turn_number;
                    break;

                case 'game.player_turn_activated':
                    this._gameState.activePlayer = event.player_ref;
                    break;

                default:
                    console.log('Not handling event ' + event.name);
            }

        }
    }
}