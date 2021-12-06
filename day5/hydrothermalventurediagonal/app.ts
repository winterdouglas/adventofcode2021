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

const range = (size: number, startAt: number = 0): number[] => {
  return [...Array(size + 1).keys()].map((i) => i + startAt);
};

const asLine = (points: number[][]) => {
  const x1 = points[0][0];
  const y1 = points[0][1];
  const x2 = points[1][0];
  const y2 = points[1][1];

  if (nonDiagonal(points)) {
    const minX = Math.min(x1, x2);
    const maxX = Math.max(x1, x2);

    const minY = Math.min(y1, y2);
    const maxY = Math.max(y1, y2);

    const rX = range(maxX - minX, minX);
    const rY = range(maxY - minY, minY);
    return rX.flatMap((x) => rY.map((y) => [x, y]));
  }

  const diagonal: number[][] = [];
  const xItems: number[] = [];
  const yItems: number[] = [];

  if (x1 > x2) {
    for (let x = x2; x <= x1; x++) {
      xItems.push(x);
    }
  } else {
    for (let x = x2; x >= x1; x--) {
      xItems.push(x);
    }
  }

  if (y1 > y2) {
    for (let y = y2; y <= y1; y++) {
      yItems.push(y);
    }
  } else {
    for (let y = y1; y >= y2; y--) {
      yItems.push(y);
    }
  }

  for (let index = 0; index < xItems.length; index++) {
    diagonal.push([xItems[index], yItems[index]]);
  }

  return { x1, y1, x2, y2, diagonal };
};

const pointKey = (point: number[]) => `${point[0]} - ${point[1]}`;

const byPointIntersection = (group: number[][]) => group.length > 1;

function main() {
  readInput
    .pipe(
      map(splitLine),
      map(asPoints),
      map(asLine)
      // mergeMap((line) => line), // Flattens line as point
      // groupBy(pointKey),
      // mergeMap((group) => group.pipe(toArray())),
      // filter(byPointIntersection),
      // count()
    )
    .subscribe(console.log);
}

main();
