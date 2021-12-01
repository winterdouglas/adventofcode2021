import { createReadStream } from "fs";
import { createInterface } from "readline";

async function readMeasurements() {
  const filename = "./measurements.txt";
  const result = [];

  const fileStream = createReadStream(filename, { encoding: "utf8" });
  const rl = createInterface({
    input: fileStream,
    crlfDelay: Infinity,
  });

  for await (const line of rl) {
    result.push(parseInt(line, 10));
  }

  return result;
}

function determineLargerMeasurementCount(measurements) {
  return measurements.reduce((accumulator, current, currentIndex, array) => {
    if (currentIndex === 0) return 0;
    const previous = array[currentIndex - 1];
    return current > previous ? ++accumulator : accumulator;
  }, 0);
}

async function main() {
  const measurements = await readMeasurements();
  console.log(determineLargerMeasurementCount(measurements));
}

main();
