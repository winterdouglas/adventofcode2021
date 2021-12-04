import { createReadStream } from "fs";
import { createInterface } from "readline";
import { Observable } from "rxjs";
import { map, share, buffer, last } from "rxjs/operators";

const readDiagnosticsReport = new Observable((subscriber) => {
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

const bitCriteria = {
  mostCommon: 'most',
  leastCommon: 'least'
}

const toArray = (value) => {
  return Array.from(value).map((item) => parseInt(item, 2));
};

const searchBitByCriteria = (items, columnIdx, criteria) => {
  let bit0Count = 0;
  let bit1Count = 0;

  for (let lineIdx = 0; lineIdx < items.length; lineIdx++) {
    const currentBit = items[lineIdx][columnIdx];
    currentBit === 0 ? ++bit0Count : ++bit1Count;
  }

  switch (criteria) {
    case bitCriteria.mostCommon:
      const mostCommon = bit1Count >= bit0Count ? 1 : 0;
      return items.filter(columns => columns[columnIdx] === mostCommon);
    case bitCriteria.leastCommon:
      const leastCommon = bit0Count <= bit1Count ? 0 : 1;
      return items.filter(columns => columns[columnIdx] === leastCommon);
    default:
      throw new Error('The criteria is invalid');
  }

}

const determineBinaryRate = (items, criteria) => {
  const colCount = items[0].length;
  let foundItems = items;

  for (let colIndex = 0; colIndex < colCount; colIndex++) {
    foundItems = searchBitByCriteria(foundItems, colIndex, criteria);
    if (foundItems.length === 1) {
      return foundItems[0].join("");
    }
  }
}

const determineBinaryRates = (items) => ({
  oxigenRate: determineBinaryRate(items, 'most'),
  co2ScrubberRate: determineBinaryRate(items, 'least'),
})

const multiplyRates = ({ oxigenRate, co2ScrubberRate }) => parseInt(oxigenRate, 2) * parseInt(co2ScrubberRate, 2);

function main() {
  const readings = readDiagnosticsReport.pipe(share());

  readings
    .pipe(map(toArray))
    .pipe(buffer(readings.pipe(last())))
    .pipe(map(determineBinaryRates))
    .pipe(map(multiplyRates))
    .subscribe((x) => console.log(x));
}

main();
