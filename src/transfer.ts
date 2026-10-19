/**
 * Value transfer between alphabets — a step-by-step console report.
 *
 *   npm run transfer                       → uses the built-in example
 *   npm run transfer -- "كعبه كهان هي"      → uses the given text
 *   npm run transfer -- "نص" custom standard → swaps the direction of the transfer
 *
 * The pipeline:
 *   1. the input text
 *   2. its distinct characters, without whitespace and without repeats
 *   3. the value of every character in the source alphabet
 *   4. the letter of the target alphabet that carries the same value
 *   5. the mirrors of that result in both supplied systems
 *
 * Every row is laid out right-to-left, so the columns line up: the first
 * character of the text is on the right of every row, and the value, the
 * matched letter and the mirrors all sit in the same column.
 */

import { ArabicEngine } from "./index.js";
import { transferLines } from "./interactive.js";

/** The example from the specification. */
export const EXAMPLE_INPUT = "كعبه كهان هي";

function main(): void {
  const args = process.argv.slice(2);
  const input = args[0] ?? EXAMPLE_INPUT;

  const engine = new ArabicEngine();
  const source = args[1] ?? "standard";
  const target = args[2] ?? "custom";

  console.log("╔══════════════════════════════════════════════╗");
  console.log("║     Basit Arabic Engine — value transfer      ║");
  console.log("╚══════════════════════════════════════════════╝");
  console.log(`  source: ${source}   target: ${target}`);
  console.log();

  for (const line of transferLines(engine, input, source, target)) {
    console.log(line);
  }
}

main();
