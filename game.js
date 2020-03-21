import { HexGridFreeCameraMouseInput } from "./hex_camera.js";
import { HexGrid, HexMapEditor, HexGUI } from "./hex.js";
import { Socket } from "./phoenix.js";
export var Game;
(function (Game) {
    class Client {
        constructor(canvasElement) {
            // Create canvas and engine.
            this._canvas = document.getElementById(canvasElement);
            this._engine = new BABYLON.Engine(this._canvas, true);
        }
        createScene() {
            this._state = new Game.State();
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
            this._light = new BABYLON.HemisphericLight('light1', new BABYLON.Vector3(0, 1.0, 0), this._scene);
            // this._light = new BABYLON.DirectionalLight('directional_light', new BABYLON.Vector3(0, -1 ,0), this._scene);
            this._hexGrid = new HexGrid(this._scene);
            if (window.location.search) {
                const params = this.parseQueryString(window.location.search);
                if ('game_id' in params && 'player_id' in params) {
                    this.connect(params['game_id'], params['player_id']);
                }
            }
            this._gui = new HexGUI(this._state, this._net);
            this._hexMapEditor = new HexMapEditor(this._hexGrid, this._net);
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
            if (this._net) {
                this._net.join(this._hexGrid);
            }
        }
        connect(gameId, playerId) {
            this._net = new Game.Net(gameId, playerId, this._state);
            this._net.connect();
        }
        parseQueryString(query) {
            const reducer = (dict, [k, v]) => {
                dict[k] = v;
                return dict;
            };
            return (query
                .substr(1)
                .split("&")
                .map(kv => kv.split("="))
                .reduce(reducer, {}));
        }
    }
    Game.Client = Client;
    class State {
        constructor() {
            this._isGameJoined = false;
            this._isGameReady = false;
            this._isTurnActive = false;
            this._turnNumber = -1;
            this._observers = {};
        }
        get isGameJoined() {
            return this._isGameJoined;
        }
        get isGameReady() {
            return this.isGameJoined && this._isGameReady;
        }
        joined() {
            this._isGameJoined = true;
            this.notifyObservers();
        }
        ready() {
            this._isGameReady = true;
            this.notifyObservers();
        }
        get turnNumber() {
            return this._turnNumber;
        }
        get turnActive() {
            return this._isTurnActive;
        }
        set turn(turn) {
            this._turnNumber = turn;
            this.notifyObservers();
        }
        set turnActive(active) {
            this._isTurnActive = active;
            this.notifyObservers();
        }
        registerObserver(observer, callback) {
            this._observers[observer] = callback;
        }
        unregisterObserver(observer) {
            delete this._observers[observer];
        }
        notifyObservers() {
            Object.keys(this._observers).forEach(k => this._observers[k](this));
        }
    }
    Game.State = State;
    class Net {
        constructor(gameId, playerId, gameState) {
            this._gameId = gameId;
            this._playerId = playerId;
            this._gameState = gameState;
        }
        connect() {
            this._socket = new Socket('ws://localhost:4000/socket', { params: { player_id: this._playerId } });
            this._socket.connect(); // the first arg. is deprecated, but this shit still wants something, so we casted it to any ;)
        }
        join(grid) {
            const loadGrid = (joinMsg) => {
                grid.onLoaded(() => {
                    grid.loadFromObject(joinMsg.grid);
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
            const joinSuccess = (channel) => {
                if (channel === 'game') {
                    joinedGameChn = true;
                }
                else {
                    joinedPlayerChn = true;
                }
                console.log('joined ' + channel + ' channel');
                if (joinedGameChn && joinedPlayerChn) {
                    joinGame();
                }
            };
            this._gameChannel = this._socket.channel('game:' + this._gameId);
            this._playerChannel = this._socket.channel('player:' + this._playerId, { "game_ref": this._gameId });
            this._gameChannel
                .join()
                .receive('ok', () => { joinSuccess('game'); })
                .receive('error', ({ reason }) => console.log('failed join', reason))
                .receive('timeout', () => console.log('Network failure, still waiting...'));
            this._playerChannel
                .join()
                .receive('ok', () => { joinSuccess('player'); })
                .receive('error', ({ reason }) => console.log('failed join', reason))
                .receive('timeout', () => console.log('Network failure, still waiting...'));
            this._playerChannel.on('event', this.processEvent.bind(this));
        }
        pushCommand(cmd, successCallback = null) {
            successCallback = successCallback || console.log;
            this._gameChannel.push('command', cmd)
                .receive('ok', successCallback)
                .receive('error', (reason) => console.log(reason))
                .receive('timeout', () => console.log('Timed out :('));
        }
        processEvent(event) {
            console.log('Received event message', event);
            switch (event.name) {
                case 'game.round_started':
                    this._gameState.turn = event.turn_number;
                    break;
                case 'game.player_turn_activated':
                    this._gameState.turnActive = event.player_ref === this._playerId;
                    break;
                default:
                    console.log("Not handling event " + event.name);
            }
        }
    }
    Game.Net = Net;
})(Game || (Game = {}));
