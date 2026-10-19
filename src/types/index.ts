/**
 * Shared public types for the Basit Arabic Engine.
 *
 * Everything here is a compile-time contract only; no runtime behaviour lives here.
 */

/** A single `[letter, value]` pair, stored exactly as supplied in alphabet data. */
export type LetterValue = readonly [letter: string, value: number];

/** A single `[letter, mirrorLetter]` pair. */
export type LetterMirror = readonly [letter: string, mirror: string];

/**
 * Raw definition of an alphabet system.
 *
 * Data integrity rules enforced by {@link Alphabet}:
 * letters are never normalised, mirrors are explicit (never inferred from positions),
 * and every mirror is treated bidirectionally.
 */
export interface AlphabetConfig {
  /** Registry key, e.g. `"standard"`. */
  readonly name: string;
  /** `[letter, value]` pairs, in the author's original insertion order. */
  readonly values: ReadonlyArray<LetterValue>;
  /** `[letter, mirrorLetter]` pairs, in the author's original insertion order. */
  readonly mirrors: ReadonlyArray<LetterMirror>;
}

/** Immutable description of a registered alphabet. */
export interface AlphabetInfo {
  readonly name: string;
  /** Number of letters that carry a numerical value. */
  readonly size: number;
  /** Letters in original insertion order. */
  readonly letters: readonly string[];
  /** `[letter, value]` pairs in original insertion order. */
  readonly entries: readonly LetterValue[];
  /** Bidirectional mirror lookup (`س` → `ص` and `ص` → `س`). */
  readonly mirrors: ReadonlyMap<string, string>;
  /** Letters that participate in a mirror pair, in declaration order. */
  readonly mirroredLetters: readonly string[];
  /** Letters without a mirror partner. */
  readonly unmirroredLetters: readonly string[];
}

/** Detailed outcome of a duplicate-removal run. */
export interface DuplicateResult {
  readonly original: string;
  readonly result: string;
  /** Total number of removed occurrences. */
  readonly removedCount: number;
  /** Character → number of occurrences that were removed. */
  readonly removedCharacters: ReadonlyMap<string, number>;
}

/** One code point of a text, resolved against an alphabet. */
export interface CharacterAnalysis {
  readonly character: string;
  /** Code-point index inside the analysed text. */
  readonly index: number;
  /** Position inside the alphabet, or `undefined` when the character is unknown. */
  readonly position: number | undefined;
  /** Numerical value, or `undefined` when the character is unknown. */
  readonly value: number | undefined;
  /** Mirrored character, or `undefined` when the character has no mirror. */
  readonly mirror: string | undefined;
  /** Occurrences of this character inside the analysed text. */
  readonly frequency: number;
  /** Whether this character contributed to the Abjad total. */
  readonly counted: boolean;
}

/** Numerical contribution of a single character. */
export interface CharacterValue {
  readonly character: string;
  /** `undefined` for characters that are unknown to the alphabet. */
  readonly value: number | undefined;
}

/** Numerical result of a single whitespace-delimited word. */
export interface WordResult {
  readonly word: string;
  /** Index of the word inside the source text (whitespace-delimited). */
  readonly index: number;
  readonly value: number;
  readonly characters: readonly CharacterValue[];
}

/** One entry of a frequency report. */
export interface FrequencyEntry {
  readonly character: string;
  readonly count: number;
  /** `count / totalCharacters`, rounded to 6 decimals. */
  readonly ratio: number;
}

/** Options for punctuation removal. */
export interface RemovePunctuationOptions {
  /**
   * Extra characters to strip in addition to Unicode `\p{P}`.
   * Useful for symbols such as `﴿ ﴾` or decorative marks.
   */
  readonly additionalCharacters?: readonly string[];
}

/** Combined report produced by `ArabicEngine.analyze`. */
export interface TextAnalysis {
  readonly text: string;
  /** Name of the alphabet the text was analysed against. */
  readonly alphabet: string;
  /** Number of code points. */
  readonly length: number;
  /** Number of distinct code points. */
  readonly uniqueCount: number;
  /** Total Abjad value; unknown characters contribute nothing. */
  readonly totalValue: number;
  /** Per-character detail, in text order. */
  readonly characters: readonly CharacterAnalysis[];
  /** Frequency report, sorted by descending count then first appearance. */
  readonly frequencies: readonly FrequencyEntry[];
  /** Duplicate-removal report for the same text. */
  readonly duplicates: DuplicateResult;
}

/** Options for constructing an {@link ArabicEngine}. */
export interface ArabicEngineOptions {
  /** Register the built-in `"standard"` and `"custom"` alphabets. Defaults to `true`. */
  readonly useBuiltInAlphabets?: boolean;
  /** Extra alphabets registered after the built-ins. */
  readonly alphabets?: ReadonlyArray<AlphabetConfig>;
}