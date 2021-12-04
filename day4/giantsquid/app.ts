import { createReadStream } from "fs";
import { createInterface } from "readline";
import { Observable, combineLatest } from "rxjs";
import {
  map,
  share,
  skip,
  first,
  filter,
  bufferCount,
  shareReplay,
  tap,
  toArray,
  scan,
  mergeMap,
} from "rxjs/operators";

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

function main() {
  const readings = readInput.pipe(share());

  const drawnNumbers = readings
    .pipe(first())
    .pipe(mergeMap(splitLine))
    .pipe(shareReplay());

  const boards = readings
    .pipe(skip(1))
    .pipe(filter(nonEmpty))
    .pipe(map(asArray))
    .pipe(bufferCount(5))
    .pipe(toArray())
    .pipe(shareReplay());

  combineLatest([drawnNumbers, boards], (drawnNmbr, allBoards) => ({
    drawnNmbr,
    allBoards,
  })).subscribe((x) => console.log(x));
}

main();
