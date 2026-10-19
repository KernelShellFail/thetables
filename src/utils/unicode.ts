/**
 * Unicode helpers.
 *
 * JavaScript strings are UTF-16 sequences, so `text.split("")` is unsafe for
 * Unicode processing: it splits surrogate pairs and breaks emoji / astral
 * characters. Every text operation in this package iterates code points instead.
 *
 * Nothing here normalises, folds or rewrites Arabic characters. These helpers
 * only *observe* text, which keeps future normalisation or grapheme
 * segmentation support a pure addition rather than a rewrite.
 */

/** Pattern for Unicode whitespace. */
const WHITESPACE_PATTERN = /\s/u;

/** Pattern for Unicode punctuation (`\p{P}`). */
const PUNCTUATION_PATTERN = /\p{P}/u;

/** Pattern for characters belonging to the Arabic script. */
const ARABIC_PATTERN = /\p{Script=Arabic}/u;

/** Pattern for combining marks (diacritics: fatha, damma, sukun, shadda …). */
const MARK_PATTERN = /\p{M}/u;

/** Splits text into Unicode code points. Never use `text.split("")`. */
export function toCharacters(text: string): string[] {
  return Array.from(text);
}

/** Returns the code point of every character in `text`. */
export function toCodePoints(text: string): number[] {
  return Array.from(text, (character) => character.codePointAt(0) ?? 0);
}

/** True when the string consists of exactly one Unicode code point. */
export function isSingleCodePoint(text: string): boolean {
  return text.length > 0 && toCodePoints(text).length === 1;
}

/** True for a single whitespace character (space, tab, newline, NBSP, …). */
export function isWhitespace(character: string): boolean {
  return WHITESPACE_PATTERN.test(character);
}

/** True for a single Unicode punctuation character. */
export function isPunctuation(character: string): boolean {
  return PUNCTUATION_PATTERN.test(character);
}

/** True for a single Arabic-script character, excluding combining marks. */
export function isArabicLetter(character: string): boolean {
  return ARABIC_PATTERN.test(character) && !MARK_PATTERN.test(character);
}

/** True for a single combining mark (diacritic). Useful for future diacritics options. */
export function isDiacritic(character: string): boolean {
  return MARK_PATTERN.test(character);
}