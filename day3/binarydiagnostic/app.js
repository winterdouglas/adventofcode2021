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

const toArray = (value) => {
  return Array.from(value).map((item) => parseInt(item, 2));
};

const determineMostCommonBit = (total) => (amountOf1Bit) =>
  amountOf1Bit > total / 2 ? 1 : 0;

const determineBinaryRatesAsArray = (items) => {
  let bit1Accumulator = [];
  for (var i = 0; i < items.length; i++) {
    for (var j = 0; j < items[i].length; j++) {
      bit1Accumulator[j] = (bit1Accumulator[j] || 0) + items[i][j];
    }
  }
  const gammaRate = bit1Accumulator.map(determineMostCommonBit(items.length));
  const epsilonRate = gammaRate.map((bit) => +!bit);
  return {
    gammaRate,
    epsilonRate,
  };
};

const toDec = (items) => parseInt(items.join(""), 2);

const mapBinaryRatesToDec = (rates) => ({
  gammaRate: toDec(rates.gammaRate),
  epsilonRate: toDec(rates.epsilonRate),
});

const determinePowerConsumption = ({ gammaRate, epsilonRate }) =>
  gammaRate * epsilonRate;

function main() {
  const readings = readDiagnosticsReport.pipe(share());

  readings
    .pipe(map(toArray))
    .pipe(buffer(readings.pipe(last())))
    .pipe(map(determineBinaryRatesAsArray))
    .pipe(map(mapBinaryRatesToDec))
    .pipe(map(determinePowerConsumption))
    .subscribe((x) => console.log(x));
}

main();
