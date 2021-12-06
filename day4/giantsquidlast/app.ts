import { createReadStream } from "fs";
import { createInterface } from "readline";
import { Observable } from "rxjs";
import {
  map,
  share,
  skip,
  filter,
  bufferCount,
  tap,
  toArray,
  scan,
  mergeMap,
  take,
  defaultIfEmpty,
  takeLast,
} from "rxjs/operators";

type WinnersState = {
  index: number;
  winner: string[][];
  drawnValue: string;
};

type GameState = {
  boards: string[][][];
  winners: WinnersState[];
};

const MarkedValue = "x";
const BoardSize = 5;

const readInput = new Observable<string>((subscriber) => {
  try {
    const filename = "./input.txt";
    const fileStream = createReadStream(filename, { encoding: "utf8" });
    const rl = createInterface({
      input: fileStream,
      crlfDelay: Infinity,
    });

    rl.on("line", (line) => {
      subscriber.next(line);
    });

    rl.on("close", () => {
      subscriber.complete();
    });
  } catch (err) {
    subscriber.error(err);
  }
});

const splitLine = (line: string) => line.split(",");

const asArray = (line: string): string[] => line.match(/[^ ]+/g);

const asInt = (value: string) => parseInt(value, 10);

const nonEmpty = (line: string) => line !== "";

const copyMatrix = (array: string[][]) => array.map((arr) => arr.slice());

const boardWinsByLine = (board: string[][]) => {
  let winnerLines = 0;

  for (let lIdx = 0; lIdx < BoardSize; lIdx++) {
    const currentLine = board[lIdx];

    if (currentLine.every((value) => value === MarkedValue)) {
      ++winnerLines;
    }
  }

  return winnerLines === 1;
};

const boardWinsByColumn = (board: string[][]) => {
  let winnerColumns = 0;

  for (let cIdx = 0; cIdx < BoardSize; cIdx++) {
    let lIdx = 0;
    let column: string[] = [];

    while (board[lIdx]) {
      column.push(board[lIdx][cIdx]);
      ++lIdx;
    }

    if (column.every((value) => value === MarkedValue)) {
      ++winnerColumns;
    }
  }

  return winnerColumns === 1;
};

const determineWinnerBoardPunctuation = ({
  winner,
  drawnValue,
}: WinnersState) => {
  let line = 0;
  let sum = 0;

  while (winner[line]) {
    sum += winner[line].reduce((acc, current) => {
      if (current !== MarkedValue) {
        acc += asInt(current);
      }
      return acc;
    }, 0);

    ++line;
  }

  return sum * asInt(drawnValue);
};

function main() {
  const readings = readInput.pipe(share());

  const drawnValues = readings.pipe(take(1), mergeMap(splitLine));

  const boards = readings.pipe(
    skip(1),
    filter(nonEmpty),
    map(asArray),
    bufferCount(BoardSize),
    toArray()
  );

  boards
    .pipe(
      mergeMap((boards) => {
        return drawnValues
          .pipe(tap((val) => console.log("Drawn value:", val)))
          .pipe(
            scan(
              (state, drawnValue) => {
                for (let bIdx = 0; bIdx < state.boards.length; bIdx++) {
                  const currentBoard = state.boards[bIdx];

                  for (let lIdx = 0; lIdx < BoardSize; lIdx++) {
                    for (let cIdx = 0; cIdx < BoardSize; cIdx++) {
                      const currentValue = currentBoard[lIdx][cIdx];

                      currentBoard[lIdx][cIdx] =
                        currentValue === drawnValue
                          ? MarkedValue
                          : currentValue;
                    }
                  }

                  if (
                    boardWinsByLine(currentBoard) ||
                    boardWinsByColumn(currentBoard)
                  ) {
                    const alreadyWinner = state.winners.find(
                      (w) => w.index === bIdx
                    );
                    if (!alreadyWinner) {
                      state.winners.push({
                        winner: copyMatrix(currentBoard),
                        drawnValue,
                        index: bIdx,
                      });
                    }
                  }
                }

                return state;
              },
              { boards, winners: [] } as GameState
            )
          );
      })
    )
    .pipe(
      takeLast(1),
      filter((state) => state.winners.length > 0),
      map((state) => state.winners[state.winners.length - 1]),
      tap((winner) => console.log("Winner:", winner)),
      map(determineWinnerBoardPunctuation),
      defaultIfEmpty("No winners!")
    )
    .subscribe((winnerPunctuation) =>
      console.log("Result:", winnerPunctuation)
    );
}

main();
