export var Commands;
(function (Commands) {
    let HexCell;
    (function (HexCell) {
        class Change {
            constructor(hexCellCoordinates, changes) {
                this.name = "hex_cell.change";
                this.hexCellCoordinates = hexCellCoordinates;
                this.changes = changes;
            }
        }
        HexCell.Change = Change;
    })(HexCell = Commands.HexCell || (Commands.HexCell = {}));
    let Player;
    (function (Player) {
        class ReadyCmd {
            constructor() {
                this.name = "player.ready";
            }
        }
        Player.ReadyCmd = ReadyCmd;
        class FinishTurnCmd {
            constructor(turn_number) {
                this.name = "player.finish_turn";
                this.turn = turn_number;
            }
        }
        Player.FinishTurnCmd = FinishTurnCmd;
    })(Player = Commands.Player || (Commands.Player = {}));
})(Commands || (Commands = {}));
