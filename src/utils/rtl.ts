/**
 * Bidirectional (right-to-left) text helpers.
 *
 * Arabic is written right-to-left, but JavaScript strings are always stored in
 * *logical* order — the order the characters are actually typed and read. That
 * order is the only correct basis for values, mirrors and duplicate detection,
 * so nothing in this package reverses text for calculation.
 *
 * What this module provides is everything needed to *display* results
 * correctly:
 *
 * 1. **Isolates** — when Arabic sits next to Latin text, digits or brackets in
 *    one line, the Unicode bidirectional algorithm has to guess how they
 *    interleave, and it usually guesses wrong (a trailing `)` jumps to the far
 *    end of the line). Wrapping each fragment in an isolate (`RLI…PDI`,
 *    `LRI…PDI`, `FSI…PDI`) pins it down, so `ب:2 س:60` renders as three
 *    right-to-left cells instead of a jumbled line.
 * 2. **Visible placeholders** — spaces and directional marks are invisible, which
 *    makes "frequency of what?" unanswerable in an empty-looking column.
 * 3. **`toVisualOrder`** — for text that was *captured* in visual order (copied
 *    from a source that stores glyph order) and therefore needs to be converted
 *    back to logical order before analysis. It is never applied automatically:
 *    text that is already logical would be corrupted by it.
 */

/** Right-to-Left Mark (U+200F). */
export const RLM = "\u200F";
/** Left-to-Right Mark (U+200E). */
export const LRM = "\u200E";
/** Arabic Letter Mark (U+061C). */
export const ALM = "\u061C";

/** Left-to-Right Isolate (U+2066). */
export const LRI = "\u2066";
/** Right-to-Left Isolate (U+2067). */
export const RLI = "\u2067";
/** First Strong Isolate (U+2068). */
export const FSI = "\u2068";
/** Pop Directional Isolate (U+2069). */
export const PDI = "\u2069";

export type Direction = "ltr" | "rtl";

/** Hebrew, Arabic, Syriac, Thaana, N'Ko, Arabic Presentation Forms, plus RLM. */
const RTL_CHARACTER =
  /[\u0590-\u08FF\uFB1D-\uFDFF\uFE70-\uFEFF\u200F]/u;

/** A run of right-to-left characters, or a run of everything else. */
const RTL_RUN =
  /[\u0590-\u08FF\uFB1D-\uFDFF\uFE70-\uFEFF\u200F]+|[^\u0590-\u08FF\uFB1D-\uFDFF\uFE70-\uFEFF\u200F]+/gu;

/** A strong left-to-right character. */
const LTR_CHARACTER = /[A-Za-z\u00C0-\u02AF\u0370-\u058F]/u;

/** Directional formatting characters that carry no glyph of their own. */
const BIDI_CONTROL = /[\u061C\u200E\u200F\u202A-\u202E\u2066-\u2069]/u;

/** True for a single right-to-left character. */
export function isRtlCharacter(character: string): boolean {
  return RTL_CHARACTER.test(character);
}

/** True when the text contains any right-to-left character. */
export function isRtlText(text: string): boolean {
  return RTL_CHARACTER.test(text);
}

/** True for a directional formatting character (RLM, LRI, RLE, …). */
export function isBidiControl(character: string): boolean {
  return BIDI_CONTROL.test(character);
}

/** True when the text contains directional formatting characters. */
export function hasBidiControls(text: string): boolean {
  return BIDI_CONTROL.test(text);
}

/**
 * Direction of the first strong character, or `null` when the text has none
 * (for example `"123 !!"`).
 */
export function firstStrongDirection(text: string): Direction | null {
  for (const character of Array.from(text)) {
    if (isBidiControl(character)) continue;
    if (isRtlCharacter(character)) return "rtl";
    if (LTR_CHARACTER.test(character)) return "ltr";
  }
  return null;
}

/**
 * Removes directional formatting characters.
 *
 * Explicit, never automatic: bidi marks are semantically meaningful for
 * rendering, so stripping them behind the caller's back would change how text
 * displays. Useful when comparing strings or storing them for processing.
 */
export function stripBidiControls(text: string): string {
  return Array.from(text)
    .filter((character) => !isBidiControl(character))
    .join("");
}

/**
 * Wraps text in a directional isolate so surrounding text cannot reorder it.
 *
 * Without an explicit `direction`, the first strong character decides, which is
 * exactly what a reader expects from a table cell or a console field.
 */
export function isolate(text: string, direction?: Direction): string {
  if (text.length === 0) return text;
  const resolved = direction ?? firstStrongDirection(text) ?? "ltr";
  const opener = resolved === "rtl" ? RLI : LRI;
  return `${opener}${text}${PDI}`;
}

/** Forces right-to-left rendering of `text`. */
export function isolateRtl(text: string): string {
  return isolate(text, "rtl");
}

/** Forces left-to-right rendering of `text`. */
export function isolateLtr(text: string): string {
  return isolate(text, "ltr");
}

/**
 * Converts text from visual order (glyph order) to logical order.
 *
 * Only needed for text that was captured in visual order — for example pasted
 * out of a source that stores Arabic glyphs left-to-right. Text that is already
 * logical must never be passed through this function: it would be scrambled.
 * Each RTL run is reversed and the runs themselves are reordered, which is
 * correct for Arabic prose and for Arabic mixed with Latin words or digits, and
 * approximate for exotic embeddings such as nested brackets.
 */
export function toVisualOrder(text: string): string {
  return text
    .split("\n")
    .map((line) =>
      Array.from(line.match(RTL_RUN) ?? [])
        .reverse()
        .map((run) => (isRtlCharacter(run[0] ?? "") ? Array.from(run).reverse().join("") : run))
        .join("")
    )
    .join("\n");
}