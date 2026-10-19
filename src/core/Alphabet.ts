import type {
  AlphabetConfig,
  AlphabetInfo,
  LetterMirror,
  LetterValue
} from "../types/index.js";
import { toCodePoints } from "../utils/unicode.js";

/** Thrown when an alphabet definition is invalid, duplicated or cannot be resolved. */
export class AlphabetError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AlphabetError";
  }
}

function requireName(config: AlphabetConfig): string {
  if (typeof config.name !== "string" || config.name.trim().length === 0) {
    throw new AlphabetError("Alphabet name must be a non-empty string.");
  }
  return config.name;
}

/** Validates that `candidate` is a single, unmodified Unicode code point. */
function requireLetter(candidate: unknown, context: string): string {
  if (typeof candidate !== "string" || candidate.length === 0) {
    throw new AlphabetError(`${context}: a letter must be a non-empty string.`);
  }
  if (toCodePoints(candidate).length !== 1) {
    throw new AlphabetError(
      `${context}: "${candidate}" must be exactly one Unicode code point.`
    );
  }
  return candidate;
}

/**
 * An immutable Arabic alphabet system: characters, numerical values and mirror
 * relationships.
 *
 * The constructor copies the supplied data into private, frozen structures and
 * validates it eagerly, so an `Alphabet` instance is always consistent and can
 * never be mutated afterwards.
 *
 * Data integrity guarantees:
 * - letters are stored verbatim, with no normalisation (`ى` is never rewritten to `ي`);
 * - insertion order of both tables is preserved;
 * - mirror pairs are stored explicitly, never inferred from positions;
 * - every mirror works in both directions;
 * - duplicate letters, unknown letters and conflicting mirrors are rejected.
 */
export class Alphabet {
  readonly #name: string;
  readonly #letters: readonly string[];
  readonly #entries: readonly LetterValue[];
  readonly #mirrorPairs: readonly LetterMirror[];
  readonly #values: ReadonlyMap<string, number>;
  readonly #positions: ReadonlyMap<string, number>;
  readonly #mirrors: ReadonlyMap<string, string>;
  readonly #mirroredLetters: readonly string[];

  constructor(config: AlphabetConfig) {
    const name = requireName(config);

    if (!Array.isArray(config.values) || config.values.length === 0) {
      throw new AlphabetError(`Alphabet "${name}" must declare at least one value.`);
    }
    if (!Array.isArray(config.mirrors)) {
      throw new AlphabetError(
        `Alphabet "${name}" must declare a mirrors array (use [] when there are none).`
      );
    }

    const values = new Map<string, number>();
    const positions = new Map<string, number>();
    const letters: string[] = [];
    const entries: LetterValue[] = [];

    config.values.forEach((entry, index) => {
      const context = `Alphabet "${name}": value entry ${index}`;
      if (!Array.isArray(entry) || entry.length !== 2) {
        throw new AlphabetError(`${context} must be a [letter, value] pair.`);
      }
      const letter = requireLetter(entry[0], context);
      const value = entry[1];
      if (typeof value !== "number" || !Number.isFinite(value)) {
        throw new AlphabetError(`${context} ("${letter}") must be a finite number.`);
      }
      if (values.has(letter)) {
        throw new AlphabetError(
          `Alphabet "${name}": duplicate value entry for "${letter}".`
        );
      }
      values.set(letter, value);
      positions.set(letter, letters.length);
      letters.push(letter);
      entries.push(Object.freeze([letter, value]));
    });

    const mirrors = new Map<string, string>();
    const mirroredLetters: string[] = [];
    const mirrorPairs: LetterMirror[] = [];

    config.mirrors.forEach((entry, index) => {
      const context = `Alphabet "${name}": mirror entry ${index}`;
      if (!Array.isArray(entry) || entry.length !== 2) {
        throw new AlphabetError(`${context} must be a [letter, mirrorLetter] pair.`);
      }
      const letter = requireLetter(entry[0], context);
      const mirror = requireLetter(entry[1], context);

      if (!values.has(letter)) {
        throw new AlphabetError(
          `Alphabet "${name}": mirrored letter "${letter}" has no value entry.`
        );
      }
      if (!values.has(mirror)) {
        throw new AlphabetError(
          `Alphabet "${name}": mirror target "${mirror}" has no value entry.`
        );
      }
      if (letter === mirror) {
        throw new AlphabetError(
          `Alphabet "${name}": "${letter}" cannot mirror to itself.`
        );
      }

      // Apply both directions; identical repetitions are harmless, contradictions are not.
      for (const [from, to] of [
        [letter, mirror],
        [mirror, letter]
      ] as const) {
        const existing = mirrors.get(from);
        if (existing !== undefined && existing !== to) {
          throw new AlphabetError(
            `Alphabet "${name}": conflicting mirror for "${from}" ("${existing}" vs "${to}").`
          );
        }
        if (existing === undefined) {
          mirrors.set(from, to);
          mirroredLetters.push(from);
        }
      }

      mirrorPairs.push(Object.freeze([letter, mirror]));
    });

    this.#name = name;
    this.#letters = Object.freeze(letters);
    this.#entries = Object.freeze(entries);
    this.#mirrorPairs = Object.freeze(mirrorPairs);
    this.#mirroredLetters = Object.freeze(mirroredLetters);
    this.#values = values;
    this.#positions = positions;
    this.#mirrors = mirrors;
  }

  /** Registry name of this alphabet. */
  get name(): string {
    return this.#name;
  }

  /** Number of letters carrying a numerical value. */
  get size(): number {
    return this.#letters.length;
  }

  /** Number of declared mirror pairs (each pair covers two letters). */
  get mirrorPairCount(): number {
    return this.#mirrorPairs.length;
  }

  /** Numerical value of a character, or `undefined` when unknown. */
  getValue(char: string): number | undefined {
    return this.#values.get(char);
  }

  /** Mirrored character, or `undefined` when the character has no mirror. */
  getMirror(char: string): string | undefined {
    return this.#mirrors.get(char);
  }

  /** Zero-based position of a character in the original value table. */
  getPosition(char: string): number | undefined {
    return this.#positions.get(char);
  }

  /** Whether the alphabet assigns a value to `char`. */
  contains(char: string): boolean {
    return this.#values.has(char);
  }

  /** Whether the alphabet mirrors `char`. */
  isMirrored(char: string): boolean {
    return this.#mirrors.has(char);
  }

  /** Letters in original insertion order. */
  getLetters(): readonly string[] {
    return this.#letters;
  }

  /** `[letter, value]` pairs in original insertion order. */
  getEntries(): readonly LetterValue[] {
    return this.#entries;
  }

  /** `[letter, mirrorLetter]` pairs in declaration order (one entry per declared pair). */
  getMirrorPairs(): readonly LetterMirror[] {
    return this.#mirrorPairs;
  }

  /** Letters that participate in a mirror pair, in declaration order. */
  getMirroredLetters(): readonly string[] {
    return this.#mirroredLetters;
  }

  /** Letters without a mirror partner, in original insertion order. */
  getUnmirroredLetters(): readonly string[] {
    return this.#letters.filter((letter) => !this.#mirrors.has(letter));
  }

  /** Snapshot of the mirror lookup; the caller receives its own copy. */
  getMirrorMap(): ReadonlyMap<string, string> {
    return new Map(this.#mirrors);
  }

  /** Copy of this alphabet under a different registry name. */
  withName(name: string): Alphabet {
    return new Alphabet({ name, values: this.#entries, mirrors: this.#mirrorPairs });
  }

  /** Immutable description of this alphabet. */
  info(): AlphabetInfo {
    return Object.freeze({
      name: this.#name,
      size: this.size,
      letters: this.#letters,
      entries: this.#entries,
      mirrors: this.getMirrorMap(),
      mirroredLetters: this.#mirroredLetters,
      unmirroredLetters: this.getUnmirroredLetters()
    });
  }
}