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

const splitLine = (line: string) => line.split(" -> ");

const asInt = (value: string) => parseInt(value, 10);

const asPoints = (values: string[]) => values.map(v => v.split(",").map(asInt));

const nonDiagonal = (points: number[][]) => points[0][0] === points[1][0] || points[0][1] === points[1][1];

function main() {
  readInput
    .pipe(
      map(splitLine),
      map(asPoints),
      filter(nonDiagonal)
    )
    .subscribe(console.log);
}

main();
