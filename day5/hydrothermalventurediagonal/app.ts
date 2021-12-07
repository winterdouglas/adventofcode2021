import { createReadStream } from "fs";
import { createInterface } from "readline";
import { Observable } from "rxjs";
import { map, filter, mergeMap, groupBy, toArray, count } from "rxjs/operators";

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

const asPoints = (values: string[]) =>
  values.map((v) => v.split(",").map(asInt));

const nonDiagonal = (points: number[][]) =>
  points[0][0] === points[1][0] || points[0][1] === points[1][1];

const range = (from: number, to: number): number[] => {
  const size = Math.max(from, to) - Math.min(from, to) + 1;
  const increment = from < to;
  return [...Array(size).keys()].map((i) => {
    return increment ? i + from : from - i;
  });
};

const createLineRange = (x1: number, y1: number, x2: number, y2: number) => {
  const rX = range(x1, x2);
  const rY = range(y1, y2);
  return rX.flatMap((x) => rY.map((y) => [x, y]));
};

const createDiagonalRange = (
  x1: number,
  y1: number,
  x2: number,
  y2: number
) => {
  const rX = range(x1, x2);
  const rY = range(y1, y2);
  return rX.map((x, idx) => [x, rY[idx]]);
};

const asLine = (points: number[][]) => {
  const x1 = points[0][0];
  const y1 = points[0][1];
  const x2 = points[1][0];
  const y2 = points[1][1];

  if (nonDiagonal(points)) {
    return createLineRange(x1, y1, x2, y2);
  }

  return createDiagonalRange(x1, y1, x2, y2);
};

const pointKey = (point: number[]) => `${point[0]} - ${point[1]}`;

const byPointIntersection = (group: number[][]) => group.length > 1;

function main() {
  readInput
    .pipe(
      map(splitLine),
      map(asPoints),
      map(asLine),
      mergeMap((line) => line), // Flattens line as individual points
      groupBy(pointKey),
      mergeMap((group) => group.pipe(toArray())),
      filter(byPointIntersection),
      count()
    )
    .subscribe(console.log);
}

main();
