import { createReadStream } from "fs";
import { createInterface } from "readline";
import { Observable } from "rxjs";
import { reduce, map } from "rxjs/operators";

const Forward = "forward";
const Up = "up";
const Down = "down";

const readCommands = new Observable((subscriber) => {
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

const parseCommand = (value) => {
  const [command, amount] = value.split(" ");
  return {
    command,
    amount: parseInt(amount, 10),
  };
};

const determineFinalCoordinates = reduce(
  ({ horizontalPosition, depth }, { command, amount }) => {
    switch (command) {
      case Forward:
        return {
          depth,
          horizontalPosition: horizontalPosition + amount,
        };
      case Up:
        return {
          depth: depth - amount,
          horizontalPosition,
        };
      case Down:
        return {
          depth: depth + amount,
          horizontalPosition,
        };
      default:
        return {
          depth,
          horizontalPosition,
        };
    }
  },
  { horizontalPosition: 0, depth: 0 }
);

const multiply = ({ horizontalPosition, depth }) => horizontalPosition * depth;

function main() {
  readCommands
    .pipe(map(parseCommand), determineFinalCoordinates, map(multiply))
    .subscribe((x) => console.log(x));
}

main();
