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
  ({ horizontalPosition, depth, aim }, { command, amount }) => {
    switch (command) {
      case Forward:
        return {
          depth: depth + aim * amount,
          horizontalPosition: horizontalPosition + amount,
          aim,
        };
      case Up:
        return {
          depth,
          horizontalPosition,
          aim: aim - amount,
        };
      case Down:
        return {
          depth,
          horizontalPosition,
          aim: aim + amount,
        };
      default:
        return {
          depth,
          horizontalPosition,
          aim,
        };
    }
  },
  { horizontalPosition: 0, depth: 0, aim: 0 }
);

const multiply = ({ horizontalPosition, depth }) => horizontalPosition * depth;

function main() {
  readCommands
    .pipe(map(parseCommand), determineFinalCoordinates, map(multiply))
    .subscribe((x) => console.log(x));
}

main();
