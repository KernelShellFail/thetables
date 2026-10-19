import type { Alphabet } from "../core/Alphabet.js";
import type { CharacterValue, WordResult } from "../types/index.js";
import { toCharacters } from "../utils/unicode.js";

/**
 * Numerical Abjad calculations.
 *
 * Unknown characters (letters absent from the alphabet), whitespace and
 * punctuation contribute nothing instead of raising an error, which keeps
 * calculations usable on mixed-language input. Unknown characters are still
 * reported in the per-character breakdown so nothing is silently hidden.
 */
export class AbjadCalculator {
  /** Total value of a text. */
  calculate(text: string, alphabet: Alphabet): number {
    let total = 0;
    for (const char of toCharacters(text)) {
      total += alphabet.getValue(char) ?? 0;
    }
    return total;
  }

  /**
   * Value of a single character, or `undefined` when it is unknown or when the
   * argument is not exactly one Unicode code point.
   */
  calculateCharacter(char: string, alphabet: Alphabet): number | undefined {
    const characters = toCharacters(char);
    if (characters.length !== 1) return undefined;
    const [only] = characters;
    return only === undefined ? undefined : alphabet.getValue(only);
  }

  /** Per-character values of a text, in text order. */
  breakdown(text: string, alphabet: Alphabet): CharacterValue[] {
    return toCharacters(text).map((character) => ({
      character,
      value: alphabet.getValue(character)
    }));
  }

  /**
   * Value of every whitespace-delimited word, with its own character breakdown.
   */
  calculateWords(text: string, alphabet: Alphabet): WordResult[] {
    return text
      .split(/\s+/u)
      .filter((word) => word.length > 0)
      .map((word, index) => ({
        word,
        index,
        value: this.calculate(word, alphabet),
        characters: this.breakdown(word, alphabet)
      }));
  }

  /**
   * Total of all word values, which equals {@link calculate} for the same text.
   * Useful to verify that word splitting never changes a total.
   */
  calculateWordTotals(text: string, alphabet: Alphabet): number {
    return this.calculateWords(text, alphabet).reduce(
      (sum, word) => sum + word.value,
      0
    );
  }
}