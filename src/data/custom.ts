import type { AlphabetConfig, LetterMirror, LetterValue } from "../types/index.js";

/**
 * System 2 — Custom Abjad.
 *
 * Original data, preserved exactly: same characters, same order, same values.
 *
 * Note the deliberate use of `ى` (alif maqsura, U+0649) as its own letter.
 * It is never rewritten to `ي` (ya, U+064A); the two systems stay independent.
 */
export const customValues: ReadonlyArray<LetterValue> = Object.freeze([
  ["س", 1], ["و", 2], ["ا", 3], ["ل", 4],
  ["ع", 5], ["ظ", 6], ["ى", 7], ["م", 8],
  ["خ", 9], ["ق", 10], ["ح", 20], ["ز", 30],
  ["ت", 40], ["ف", 50], ["ص", 60], ["ن", 70],
  ["ذ", 80], ["غ", 90], ["ر", 100], ["ب", 200],
  ["ش", 300], ["ك", 400], ["ض", 500], ["ط", 600],
  ["ه", 700], ["ج", 800], ["د", 900], ["ث", 1000]
]);

/**
 * Custom mirror relationships, exactly as supplied.
 *
 * `ى` mirrors to `ش` here, and is a completely separate mapping from the
 * standard system's `ي` → `خ`.
 */
export const customMirrors: ReadonlyArray<LetterMirror> = Object.freeze([
  ["س", "ص"], ["و", "ن"], ["ا", "ذ"],
  ["ل", "غ"], ["ع", "ر"], ["ظ", "ب"],
  ["ى", "ش"], ["م", "ك"], ["خ", "ض"],
  ["ق", "ط"], ["ح", "ه"], ["ز", "ج"],
  ["ت", "د"], ["ف", "ث"]
]);

/** Ready-to-register configuration for the custom Abjad. */
export const customAlphabetConfig: AlphabetConfig = Object.freeze({
  name: "custom",
  values: customValues,
  mirrors: customMirrors
});