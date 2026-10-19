import type { AlphabetConfig, LetterMirror, LetterValue } from "../types/index.js";

/**
 * System 1 — Standard Abjad.
 *
 * Original data, preserved exactly: same characters, same order, same values.
 * `Object.freeze` is applied so the source tables can never be mutated at runtime.
 */
export const standardValues: ReadonlyArray<LetterValue> = Object.freeze([
  ["ا", 1], ["ب", 2], ["ج", 3], ["د", 4],
  ["ه", 5], ["و", 6], ["ز", 7], ["ح", 8],
  ["ط", 9], ["ي", 10], ["ك", 20], ["ل", 30],
  ["م", 40], ["ن", 50], ["س", 60], ["ع", 70],
  ["ف", 80], ["ص", 90], ["ق", 100], ["ر", 200],
  ["ش", 300], ["ت", 400], ["ث", 500], ["خ", 600],
  ["ذ", 700], ["ض", 800], ["ظ", 900], ["غ", 1000]
]);

/**
 * Standard mirror relationships, exactly as supplied.
 *
 * Pairs are stored explicitly — never inferred from positions in the value table —
 * and are applied in both directions by `Alphabet`.
 */
export const standardMirrors: ReadonlyArray<LetterMirror> = Object.freeze([
  ["ا", "س"], ["ب", "ع"], ["ج", "ف"],
  ["د", "ص"], ["ه", "ق"], ["و", "ر"],
  ["ز", "ش"], ["ح", "ت"], ["ط", "ث"],
  ["ي", "خ"], ["ك", "ذ"], ["ل", "ض"],
  ["م", "ظ"], ["ن", "غ"]
]);

/** Ready-to-register configuration for the standard Abjad. */
export const standardAlphabetConfig: AlphabetConfig = Object.freeze({
  name: "standard",
  values: standardValues,
  mirrors: standardMirrors
});