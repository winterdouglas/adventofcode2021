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
  skipWhile,
  defaultIfEmpty,
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

const asInt = (value: string) => parseInt(value, 10);

const nonEmpty = (line: string) => line !== "";

const checkWinnerByLine = (boards: string[][][]) => {
  for (let bIdx = 0; bIdx < boards.length; bIdx++) {
    const currentBoard = boards[bIdx];

    for (let lIdx = 0; lIdx < BoardSize; lIdx++) {
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

    for (let cIdx = 0; cIdx < BoardSize; cIdx++) {
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
                state.drawnValue = drawnValue;

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
                }
                return state;
              },
              { boards, drawnValue: "" } as GameState
            )
          )
          .pipe(
            map(determineWinnerBoard),
            skipWhile((winner) => !winner),
            take(1),
            tap((winner) => console.log("Winner:", winner)),
            map(determineWinnerBoardPunctuation)
          );
      })
    )
    .pipe(defaultIfEmpty("No winners!"))
    .subscribe((winnerPunctuation) =>
      console.log("Punctuation:", winnerPunctuation)
    );
}

main();
