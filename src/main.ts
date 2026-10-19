/**
 * Console demonstration and interactive session.
 *
 * Run with:
 *   npm run dev / npm start              → demonstration of every operation
 *   npm start -- -i                      → interactive Arabic session
 *
 * The library never touches Node APIs; only this entry point does.
 */

import { createInterface } from "node:readline/promises";
import { ArabicEngine } from "./index.js";
import {
  REFERENCE_TEXT,
  executeCommand,
  formatRun,
  helpLines,
  placeholder,
  renderTable,
  transferLines
} from "./interactive.js";
import { isRtlText, isolateRtl, toVisualOrder } from "./utils/rtl.js";

const LABEL_WIDTH = 26;

/** Prints a label/value pair, oriented right-to-left when the value is Arabic. */
function line(label: string, value: string): void {
  const text = `${label.padEnd(LABEL_WIDTH)}${value}`;
  console.log(isRtlText(value) ? isolateRtl(text) : text);
}

function section(title: string): void {
  console.log(isolateRtl(`\n── ${title} ──`));
}

function windowsEncodingHint(): void {
  if (process.platform === "win32" && !process.env.WT_SESSION) {
    console.log(
      "ملاحظة: إذا ظهر النص العربي غير واضح، شغّل الأمر في نافذة تستخدم UTF-8 (chcp 65001 أو Windows Terminal)."
    );
  }
}

/* ------------------------------------------------------------- demonstration */

function runDemo(): void {
  const engine = new ArabicEngine();

  console.log("╔══════════════════════════════════════════════╗");
  console.log("║        Basit Arabic Engine — demonstration    ║");
  console.log("╚══════════════════════════════════════════════╝");
  windowsEncodingHint();
  line("Input", REFERENCE_TEXT);
  line("Code points", String(engine.countCharacters(REFERENCE_TEXT)));

  section("1. Alphabet registry");
  line("Registered alphabets", engine.listAlphabetNames().join(", "));
  for (const alphabet of engine.listAlphabets()) {
    line(alphabet.name, `${alphabet.size} letters · ${alphabet.mirrorPairCount} mirror pairs`);
  }

  section("2. Text operations");
  line("removeDuplicates", engine.removeDuplicates("abbccdefffa"));
  line("removeDuplicates (Arabic)", engine.removeDuplicates("بس م ب"));
  line("uniqueCharacters", formatRun(engine.uniqueCharacters(REFERENCE_TEXT)));
  line("reverse", engine.reverse("الرحمن"));
  line("removeWhitespace", engine.removeWhitespace(REFERENCE_TEXT));
  line("removePunctuation", engine.removePunctuation("مرحباً، بالعالم!"));

  const duplicates = engine.removeDuplicatesDetailed(REFERENCE_TEXT);
  line("dedupe → result", duplicates.result);
  line("dedupe → removedCount", String(duplicates.removedCount));
  line(
    "dedupe → removed",
    Array.from(duplicates.removedCharacters, ([char, count]) => `${placeholder(char)}×${count}`).join(" ")
  );

  section("3. Frequency report (right-to-left columns)");
  for (const row of renderTable(
    ["char", "count", "share"],
    engine.frequencies(REFERENCE_TEXT).map((entry) => [
      placeholder(entry.character),
      String(entry.count),
      `${(entry.ratio * 100).toFixed(1)}%`
    ]),
    { rightToLeft: true }
  )) {
    console.log(row);
  }

  section("4. Abjad totals");
  line("standard", String(engine.calculate(REFERENCE_TEXT, "standard")));
  line("custom", String(engine.calculate(REFERENCE_TEXT, "custom")));
  line("unknown chars ignored", String(engine.calculate("ب1ب!", "standard")));

  section("5. Word values (standard)");
  for (const word of engine.calculateWords(REFERENCE_TEXT, "standard")) {
    line(
      `#${word.index} ${word.word}`,
      `${word.value}  (${word.characters.map((char) => `${char.character}:${char.value ?? "–"}`).join(" ")})`
    );
  }

  section("6. Mirrors");
  line("standard", engine.mirror(REFERENCE_TEXT, "standard"));
  line("custom", engine.mirror(REFERENCE_TEXT, "custom"));
  line("double mirror restores", String(engine.mirror(engine.mirror(REFERENCE_TEXT, "standard"), "standard") === REFERENCE_TEXT));
  line("visual order (display only)", toVisualOrder(REFERENCE_TEXT));

  section("7. Alphabet tables (right-to-left)");
  const info = engine.describeAlphabet("custom");
  line("system", info.name);
  for (const row of renderTable(
    ["char", "value"],
    info.entries.map(([letter, value]) => [letter, String(value)]),
    { rightToLeft: true }
  )) {
    console.log(row);
  }
  for (const row of renderTable(
    ["char", "mirror"],
    info.mirroredLetters.map((letter) => [letter, info.mirrors.get(letter) ?? "—"]),
    { rightToLeft: true }
  )) {
    console.log(row);
  }

  section("8. Registering your own alphabet");
  engine.register({ name: "demo", values: [["ا", 1], ["ب", 2], ["ت", 3]], mirrors: [["ا", "ت"]] });
  line("registered", engine.listAlphabetNames().join(", "));
  line("mirror ابت", engine.mirror("ابت", "demo"));
  line("value ابت", String(engine.calculate("ابت", "demo")));

  section("9. Value transfer (standard → custom)");
  for (const row of transferLines(engine, "كعبه كهان هي", "standard", "custom")) {
    console.log(row);
  }

  console.log(isolateRtl("\nانتهى العرض — جرّب الجلسة التفاعلية: npm start -- -i\n"));
}

/* ------------------------------------------------------- interactive session */

async function runInteractive(): Promise<void> {
  const engine = new ArabicEngine();
  let text = REFERENCE_TEXT;

  console.log("╔══════════════════════════════════════════════╗");
  console.log("║      Basit Arabic Engine — interactive        ║");
  console.log("╚══════════════════════════════════════════════╝");
  windowsEncodingHint();
  console.log(isolateRtl("اكتب النص الذي تريد تحليله ثم اضغط Enter، أو اكتب /help."));
  console.log(isolateRtl(`النص الحالي: ${text}`));
  console.log();

  const rl = createInterface({ input: process.stdin, output: process.stdout });
  // No forced direction on the prompt: the paragraph direction follows what
  // the reader types, so Latin commands and Arabic text both sit correctly.
  rl.setPrompt("❯ ");

  try {
    rl.prompt();
    for await (const line of rl) {
      const result = executeCommand(engine, line, text);
      for (const output of result.lines) console.log(output);
      if (result.text !== undefined) text = result.text;
      if (result.quit) break;
      rl.prompt();
    }
  } finally {
    rl.close();
  }

  console.log(isolateRtl("\nإلى اللقاء."));
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);

  if (args.includes("-i") || args.includes("--interactive")) {
    await runInteractive();
    return;
  }
  if (args.includes("-h") || args.includes("--help")) {
    console.log("Usage: npm start [-- -i | --interactive | -h | --help]");
    console.log("  (default)  run the operation demonstration");
    console.log("  -i         start the interactive Arabic session");
    console.log();
    console.log("Interactive commands:");
    for (const commandLine of helpLines()) console.log(commandLine);
    return;
  }
  runDemo();
}

await main();