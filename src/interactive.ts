import type { ArabicEngine } from "./core/ArabicEngine.js";
import { AlphabetError } from "./core/Alphabet.js";
import {
  ALM,
  FSI,
  LRM,
  LRI,
  PDI,
  RLM,
  RLI,
  isolate,
  isolateRtl,
  stripBidiControls,
  toVisualOrder
} from "./utils/rtl.js";

/**
 * Presentation layer for right-to-left Arabic text.
 *
 * Everything here is pure: it turns text and engine results into *strings a
 * terminal can render correctly*. No Node APIs, no I/O — the readline loop
 * lives in `main.ts`, so this module stays testable and reusable by a future
 * web or REST interface.
 */

/** Text an interactive session starts with. */
export const REFERENCE_TEXT = "بسم الله الرحمن الرحيم";

/** Characters that would otherwise be invisible, mapped to visible stand-ins. */
const VISIBLE_STAND_INS = new Map<string, string>([
  [" ", "␣"],
  ["\t", "␉"],
  ["\n", "␊"],
  ["\r", "␍"],
  ["\u00a0", "⍽"],
  [RLM, "‹RLM›"],
  [LRM, "‹LRM›"],
  [ALM, "‹ALM›"],
  [LRI, "‹LRI›"],
  [RLI, "‹RLI›"],
  [FSI, "‹FSI›"],
  [PDI, "‹PDI›"],
  ["\u202A", "‹LRE›"],
  ["\u202B", "‹RLE›"],
  ["\u202C", "‹PDF›"],
  ["\u200B", "‹ZWSP›"],
  ["\u200C", "‹ZWNJ›"],
  ["\u200D", "‹ZWJ›"]
]);

/** Replaces an invisible character with a visible stand-in. */
export function placeholder(character: string): string {
  return VISIBLE_STAND_INS.get(character) ?? character;
}

/** Renders characters space-separated, with stand-ins and directional isolation. */
export function formatRun(characters: Iterable<string>): string {
  const text = Array.from(characters).map(placeholder).join(" ");
  return text.length === 0 ? "" : isolate(text);
}

/** Terminal width of a string, ignoring invisible directional characters. */
export function displayWidth(text: string): number {
  return Array.from(stripBidiControls(text)).length;
}

export interface TableOptions {
  /** Lay the columns out right-to-left, so the first column reads first for an Arabic reader. */
  readonly rightToLeft?: boolean;
}

/**
 * Renders a table as lines of text.
 *
 * `rightToLeft` reverses the *columns* so the first logical column sits on the
 * right, where an Arabic reader starts. The reversal is done here rather than
 * by wrapping the line in an RTL isolate on purpose: doing both would cancel
 * out, and a manual layout also survives terminals and editors with weak or
 * absent bidirectional support (logs, `grep`, plain text files).
 *
 * Every cell is isolated individually so an Arabic cell can never reorder the
 * Latin or numeric cells next to it.
 */
export function renderTable(
  headers: readonly string[],
  rows: readonly (readonly string[])[],
  options: TableOptions = {}
): string[] {
  const { rightToLeft = false } = options;
  const all = [headers, ...rows];
  const widths = headers.map((_, column) =>
    Math.max(...all.map((row) => displayWidth(row[column] ?? "")))
  );

  const format = (cells: readonly string[]): string => {
    const ordered = rightToLeft ? [...cells].reverse() : cells;
    const orderedWidths = rightToLeft ? [...widths].reverse() : widths;
    return ordered
      .map((cell, index) => {
        const width = orderedWidths[index] ?? 0;
        return cell + " ".repeat(Math.max(0, width - displayWidth(cell)));
      })
      .join(" │ ")
      .trimEnd();
  };

  const cells = (row: readonly string[]): readonly string[] =>
    row.map((cell) => isolate(cell));

  return [
    format(cells(headers)),
    format(widths.map((width) => "─".repeat(width))),
    ...rows.map((row) => format(cells(row)))
  ];
}

export interface ParsedInput {
  readonly kind: "command" | "text";
  /** Command name without the leading slash; empty for plain text. */
  readonly name: string;
  /** Everything after the command name. */
  readonly argument: string;
  /** The text itself when `kind` is `"text"`. */
  readonly value: string;
}

/** Splits a REPL line into a command and its argument, or treats it as text. */
export function parseInput(line: string): ParsedInput {
  const trimmed = line.trim();
  if (!trimmed.startsWith("/")) {
    return { kind: "text", name: "", argument: "", value: trimmed };
  }
  const withoutSlash = trimmed.slice(1);
  const separator = withoutSlash.search(/\s/u);
  if (separator === -1) {
    return { kind: "command", name: withoutSlash.toLowerCase(), argument: "", value: trimmed };
  }
  return {
    kind: "command",
    name: withoutSlash.slice(0, separator).toLowerCase(),
    argument: withoutSlash.slice(separator).trim(),
    value: trimmed
  };
}

export interface CommandResult {
  readonly ok: boolean;
  readonly lines: readonly string[];
  readonly quit: boolean;
  /** Present only when the command changed the session text. */
  readonly text?: string;
}

function ok(lines: readonly string[]): CommandResult {
  return { ok: true, lines, quit: false };
}

function fail(message: string): CommandResult {
  return { ok: false, lines: [`✖ ${message}`], quit: false };
}

function heading(text: string): string {
  return isolateRtl(`── ${text} ──`);
}

function label(name: string, value: string): string {
  // The whole row is RTL-isolated, so the Arabic name sits on the right and the
  // value flows to its left. Values that carry their own isolation (character
  // runs, table cells) must not be wrapped twice — nested isolates only add noise.
  return isolateRtl(`${name}  ${value}`);
}

/** Help text, shown by `/help`. */
export function helpLines(): readonly string[] {
  return [
    "Available commands (type text on its own line to analyse it):",
    "  /abjad [name]    total value          /words [name]   value per word",
    "  /mirror [name]   mirrored text        /analyze [name] full report",
    "  /dedup           remove duplicates    /unique        distinct characters",
    "  /freq            frequency report     /reverse       reversed text",
    "  /alphabets       registered systems   /info <name>   letters, values, mirrors",
    "  /set <text>      set the text         /clear         clear the text",
    "  /visual          visual-order reading of the text (diagnostic)",
    "  /help            this list            /quit          leave",
    "Type the text you want to analyse and press Enter — no command needed."
  ];
}

/**
 * Runs one REPL line against the engine.
 *
 * `currentText` is the text accumulated so far; commands operate on it, and
 * commands that change it return a new `text`.
 */
export function executeCommand(
  engine: ArabicEngine,
  line: string,
  currentText: string
): CommandResult {
  const parsed = parseInput(line);

  if (parsed.kind === "text") {
    if (parsed.value.length === 0) return ok([]);
    return {
      ok: true,
      lines: [
        heading("النص"),
        isolateRtl(parsed.value),
        label("عدد الأحرف", String(engine.countCharacters(parsed.value)))
      ],
      quit: false,
      text: parsed.value
    };
  }

  const name = parsed.name;

  try {
    switch (name) {
      case "help":
        return ok(helpLines());

      case "quit":
      case "exit":
        return { ok: true, lines: ["مع السلامة"], quit: true };

      case "alphabets":
        return ok([
          label("الأنظمة", engine.listAlphabetNames().join("، ")),
          ...engine.listAlphabets().map((alphabet) =>
            label(alphabet.name, `${alphabet.size} حرف · ${alphabet.mirrorPairCount} مرآة`)
          )
        ]);

      case "info":
        return ok(infoLines(engine, parsed.argument || "standard"));

      case "set":
        return executeCommand(engine, parsed.argument, currentText);

      case "clear":
        return { ok: true, lines: ["تم مسح النص"], quit: false, text: "" };

      case "abjad": {
        const alphabet = resolve(engine, parsed.argument);
        const words = engine.calculateWords(currentText, alphabet.name);
        return ok([
          heading(`الحساب — ${alphabet.name}`),
          isolateRtl(currentText),
          label("المجموع", String(engine.calculate(currentText, alphabet.name))),
          label("عدد الكلمات", String(words.length))
        ]);
      }

      case "words": {
        const alphabet = resolve(engine, parsed.argument);
        return ok([
          heading(`قيم الكلمات — ${alphabet.name}`),
          ...engine.calculateWords(currentText, alphabet.name).map((word) =>
            isolateRtl(`${word.word}  ${word.value}`)
          )
        ]);
      }

      case "mirror": {
        const alphabet = resolve(engine, parsed.argument);
        return ok([
          heading(`المرآة — ${alphabet.name}`),
          label("المدخل", currentText),
          label("المخرَج", engine.mirror(currentText, alphabet.name)),
          label("ثنائي الاتجاه", "نعم — المرآة تعيد النص الأصلي")
        ]);
      }

      case "dedup": {
        const result = engine.removeDuplicatesDetailed(currentText);
        const removed = Array.from(
          result.removedCharacters,
          ([character, count]) => `${placeholder(character)}×${count}`
        ).join(" ");
        return ok([
          heading("إزالة التكرار"),
          label("الناتج", result.result),
          label("المحذوف", String(result.removedCount)),
          label("التفصيل", removed.length > 0 ? removed : "لا يوجد")
        ]);
      }

      case "unique":
        return ok([
          heading("الأحرف الفريدة"),
          formatRun(engine.uniqueCharacters(currentText))
        ]);

      case "freq": {
        const entries = engine.frequencies(currentText);
        return ok([
          heading("تكرار الأحرف"),
          ...renderTable(
            ["الحرف", "العدد", "النسبة"],
            entries.map((entry) => [
              placeholder(entry.character),
              String(entry.count),
              `${(entry.ratio * 100).toFixed(1)}%`
            ]),
            { rightToLeft: true }
          )
        ]);
      }

      case "reverse":
        return ok([heading("عكس النص"), isolateRtl(engine.reverse(currentText))]);

      case "analyze": {
        const alphabet = resolve(engine, parsed.argument);
        const analysis = engine.analyze(currentText, alphabet.name);
        return ok([
          heading(`تحليل — ${alphabet.name}`),
          label("المجموع", String(analysis.totalValue)),
          label("عدد الأحرف", String(analysis.length)),
          label("الأحرف الفريدة", String(analysis.uniqueCount)),
          label("بدون تكرار", analysis.duplicates.result),
          ...renderTable(
            ["الحرف", "القيمة", "المرآة", "الموضع"],
            analysis.characters.map((character) => [
              placeholder(character.character),
              character.value === undefined ? "—" : String(character.value),
              character.mirror ?? "—",
              character.position === undefined ? "—" : String(character.position)
            ]),
            { rightToLeft: true }
          )
        ]);
      }

      case "visual":
        return ok([
          heading("الترتيب المنطقي"),
          isolateRtl(currentText),
          heading("الترتيب البصري"),
          isolateRtl(toVisualOrder(currentText)),
          label("تنبيه", "الترتيب البصري للعرض فقط — لا يُطبَّق على نصوص منطقية")
        ]);

      case "":
        return ok([]);

      default:
        return fail(`أمر غير معروف: /${name} — اكتب /help لعرض الأوامر`);
    }
  } catch (error) {
    if (error instanceof AlphabetError) return fail(error.message);
    throw error;
  }
}

function resolve(engine: ArabicEngine, name: string) {
  return engine.getAlphabet(name.length === 0 ? "standard" : name);
}

function infoLines(engine: ArabicEngine, name: string): readonly string[] {
  const info = engine.describeAlphabet(name);
  return [
    heading(`نظام ${info.name}`),
    label("عدد الأحرف", String(info.size)),
    label("الأحرف", formatRun(info.letters)),
    ...renderTable(
      ["الحرف", "القيمة"],
      info.entries.map(([letter, value]) => [letter, String(value)]),
      { rightToLeft: true }
    ),
    heading("المرايا (ثنائية الاتجاه)"),
    ...renderTable(
      ["الحرف", "مرآته"],
      info.mirroredLetters.map((letter) => [letter, info.mirrors.get(letter) ?? "—"]),
      { rightToLeft: true }
    ),
    ...(info.unmirroredLetters.length > 0
      ? [label("بلا مرآة", formatRun(info.unmirroredLetters))]
      : [])
  ];
}