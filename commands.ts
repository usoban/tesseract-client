import { HexCoordinates } from "./hex";

export namespace Commands {
  export interface Cmd {
    name: string;
  }

  export namespace HexCell {

    export class Change implements Cmd {
      name: string = "hex_cell.change";
      hexCellCoordinates: HexCoordinates;
      changes: any[];

      constructor(hexCellCoordinates: HexCoordinates, changes: any[]) {
        this.hexCellCoordinates = hexCellCoordinates;
        this.changes = changes;
      }
    }
  }

  export namespace Player {

    export class ReadyCmd implements Cmd {
      name: string = "player.ready";
    }

    export class FinishTurnCmd implements Cmd {
      name: string = "player.finish_turn";
      turn: number;

      constructor(turn_number: number) {
        this.turn = turn_number;
      }
    }
  }

}