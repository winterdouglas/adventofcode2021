import { createReadStream } from "fs";
import { createInterface } from "readline";
import { Observable, combineLatest } from "rxjs";
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
  skipWhile,
} from "rxjs/operators";

type GameState = {
  boards: string[][][];
  drawnValue: string;
};

type WinnerState = {
  board: string[][];
  drawnValue: string;
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

const nonEmpty = (line: string) => line !== "";

const checkWinnerByLine = (boards: string[][][]) => {
  for (let bIdx = 0; bIdx < boards.length; bIdx++) {
    const currentBoard = boards[bIdx];

    for (let lIdx = 0; lIdx < currentBoard.length; lIdx++) {
      const currentLine = currentBoard[lIdx];

      if (currentLine.every((value) => value === MarkedValue)) {
        return currentBoard;
      }
    }
  }
};

const checkWinnerByColumn = (boards: string[][][]) => {
  for (let bIdx = 0; bIdx < boards.length; bIdx++) {
    const currentBoard = boards[bIdx];

    for (let cIdx = 0; cIdx < currentBoard.length; cIdx++) {
      let lIdx = 0;
      let column: string[] = [];

      while (currentBoard[lIdx]) {
        column.push(currentBoard[lIdx][cIdx]);
        ++lIdx;
      }

      if (column.every((value) => value === MarkedValue)) {
        return currentBoard;
      }
    }
  }
};

const determineWinnerBoard = ({
  boards,
  drawnValue,
}: GameState): WinnerState => {
  const winnerByLine = checkWinnerByLine(boards);
  if (winnerByLine) {
    return { board: winnerByLine, drawnValue };
  }

  const winnerByColumn = checkWinnerByColumn(boards);
  if (winnerByColumn) {
    return { board: winnerByColumn, drawnValue };
  }
};

const determineWinnerBoardPunctuation = ({
  board,
  drawnValue,
}: WinnerState) => {
  let line = 0;
  let sum = 0;

  while (board[line]) {
    sum += board[line].reduce((acc, current) => {
      if (current !== MarkedValue) {
        acc += parseInt(current, 10);
      }
      return acc;
    }, 0);

    ++line;
  }

  return sum * parseInt(drawnValue, 10);
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
          .pipe(tap((val) => console.log(`Drawn value: ${val}`)))
          .pipe(
            scan(
              (state, drawnValue) => {
                state.drawnValue = drawnValue;
                for (let bIdx = 0; bIdx < state.boards.length; bIdx++) {
                  for (let lIdx = 0; lIdx < state.boards[bIdx].length; lIdx++) {
                    for (
                      let cIdx = 0;
                      cIdx < state.boards[bIdx][lIdx].length;
                      cIdx++
                    ) {
                      const currentValue = state.boards[bIdx][lIdx][cIdx];

                      state.boards[bIdx][lIdx][cIdx] =
                        currentValue === drawnValue
                          ? MarkedValue
                          : currentValue;
                    }
                  }
                }
                return state;
              },
              { boards, drawnValue: "" }
            )
          )
          .pipe(
            map(determineWinnerBoard),
            skipWhile((winner) => !winner),
            take(1),
            tap((board) => console.log(board)),
            map(determineWinnerBoardPunctuation)
          );
      })
    )
    .subscribe(console.log);
}

main();
