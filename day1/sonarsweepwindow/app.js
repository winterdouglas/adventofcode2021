import { createReadStream } from "fs";
import { createInterface } from "readline";
import { Observable, pipe } from "rxjs";
import {
  windowCount,
  mergeAll,
  reduce,
  bufferCount,
  map,
} from "rxjs/operators";

const readMeasurements = new Observable((subscriber) => {
  try {
    const filename = "./measurements.txt";

    const fileStream = createReadStream(filename, { encoding: "utf8" });
    const rl = createInterface({
      input: fileStream,
      crlfDelay: Infinity,
    });

    rl.on("line", (line) => {
      subscriber.next(parseInt(line, 10));
    });

    rl.on("close", () => {
      subscriber.complete();
    });
  } catch (err) {
    subscriber.error(err);
  }
});

const sum = reduce((acc, val) => acc + val, 0);

const sumWindows = pipe(windowCount(3, 1), map(sum), mergeAll());

const compareMeasurements = (acc, curr) => (curr[1] > curr[0] ? ++acc : acc);

const compareLargerWindows = pipe(
  bufferCount(2, 1),
  reduce(compareMeasurements, 0)
);

function main() {
  readMeasurements
    .pipe(sumWindows)
    .pipe(compareLargerWindows)
    .subscribe((largerSumCount) => console.log(largerSumCount));
}

main();
