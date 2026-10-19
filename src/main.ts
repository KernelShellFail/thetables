/**
 * Console demonstration of every core operation.
 *
 * Run with `npm run dev` (watch mode) or `npm run build && npm start`.
 * The library itself never touches Node APIs; only this demo does.
 */

import { ArabicEngine } from "./index.js";

const INPUT = "بسم الله الرحمن الرحيم";

function title(text: string): void {
  console.log(`\n=== ${text} ===`);
}

function line(label: string, value: unknown): void {
  console.log(`${label.padEnd(34)} ${String(value)}`);
}

function formatCharacters(characters: readonly string[]): string {
  return characters.map((char) => (char === " " ? "␣" : char)).join(" ");
}

const engine = new ArabicEngine();

console.log("╔══════════════════════════════════════════════╗");
console.log("║        Basit Arabic Engine — demonstration    ║");
console.log("╚══════════════════════════════════════════════╝");
line("Input", INPUT);
line("Code points", engine.countCharacters(INPUT));

/* ------------------------------------------------------------------ registry */

title("1. Alphabet registry");
line("Registered alphabets", engine.listAlphabetNames().join(", "));
line("Standard size", engine.getAlphabet("standard").size);
line("Custom size", engine.getAlphabet("custom").size);

/* ---------------------------------------------------------------- text ops */

title("2. Text operations");
line("removeDuplicates(abbccdefffa)", engine.removeDuplicates("abbccdefffa"));
line("removeDuplicates(life is a lie)", engine.removeDuplicates("life is a lie"));
line("removeDuplicates(Arabic)", engine.removeDuplicates("بس م ب"));
line("uniqueCharacters", formatCharacters(engine.uniqueCharacters(INPUT)));
line("countCharacters", engine.countCharacters(INPUT));
line("reverse", engine.reverse("الرحمن"));
line("removeWhitespace", engine.removeWhitespace(INPUT));
line("removePunctuation", engine.removePunctuation("مرحباً، بالعالم!"));

const duplicates = engine.removeDuplicatesDetailed(INPUT);
line("detailed → result", duplicates.result);
line("detailed → removedCount", duplicates.removedCount);
line(
  "detailed → removed chars",
  Array.from(duplicates.removedCharacters, ([char, count]) => `${char}×${count}`).join(" ")
);

title("3. Frequencies (top 5)");
for (const entry of engine.frequencies(INPUT).slice(0, 5)) {
  line(
    `${formatCharacters([entry.character])}  (${(entry.ratio * 100).toFixed(1)}%)`,
    `${entry.count}×`
  );
}

/* -------------------------------------------------------------------- abjad */

title("4. Abjad totals");
line("standard", engine.calculate(INPUT, "standard"));
line("custom", engine.calculate(INPUT, "custom"));
line("unknown characters ignored", engine.calculate("ب1ب!", "standard"));

title("5. Word values (standard)");
for (const word of engine.calculateWords(INPUT, "standard")) {
  line(
    `#${word.index} ${word.word}`,
    `${word.value}  (${word.characters
      .map((char) => `${char.character}:${char.value ?? "–"}`)
      .join(" ")})`
  );
}

title("6. Character values (custom)");
for (const char of engine.breakdown("سلم", "custom")) {
  line(char.character, char.value ?? "unknown");
}

/* ------------------------------------------------------------------- mirror */

title("7. Mirrors");
line("standard", engine.mirror(INPUT, "standard"));
line("custom", engine.mirror(INPUT, "custom"));
line("character ن → standard", engine.mirrorCharacter("ن", "standard"));
line("character ى → custom", engine.mirrorCharacter("ى", "custom"));
line(
  "double mirror restores",
  engine.mirror(engine.mirror(INPUT, "standard"), "standard") === INPUT
);

/* ------------------------------------------------------------ alphabet info */

title("8. Alphabet information");
const info = engine.describeAlphabet("custom");
line("name", info.name);
line("letters", formatCharacters(info.letters));
line("mirror pairs", info.mirroredLetters.length / 2);
line("unmirrored letters", formatCharacters(info.unmirroredLetters));
line("first entry", `${info.entries[0]?.[0]} = ${info.entries[0]?.[1]}`);

/* ----------------------------------------------------- custom registration */

title("9. Registering your own alphabet");
engine.register({
  name: "demo",
  values: [["ا", 1], ["ب", 2], ["ت", 3]],
  mirrors: [["ا", "ت"]]
});
line("registered", engine.listAlphabetNames().join(", "));
line("اب", engine.mirror("اب", "demo"));
line("اب (value)", engine.calculate("اب", "demo"));

title("Done");