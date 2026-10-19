import type { Alphabet } from "../core/Alphabet.js";
import { toCharacters } from "../utils/unicode.js";

/**
 * Mirror transformations.
 *
 * Mirroring is a pure lookup: characters without a mirror (including spaces,
 * punctuation and diacritics) are preserved exactly as they are. Because every
 * mirror relationship is stored in both directions, mirroring any text twice
 * always restores the original text.
 */
export class MirrorProcessor {
  /** Mirrored character, or the original character when it has no mirror. */
  mirrorCharacter(char: string, alphabet: Alphabet): string {
    return alphabet.getMirror(char) ?? char;
  }

  /**
   * Mirrors every code point of a text.
   *
   * Word boundaries, whitespace and unmapped characters are preserved.
   */
  mirrorText(text: string, alphabet: Alphabet): string {
    return toCharacters(text)
      .map((char) => this.mirrorCharacter(char, alphabet))
      .join("");
  }

  /** Mirrors each whitespace-delimited word independently. */
  mirrorWords(text: string, alphabet: Alphabet): string[] {
    return text
      .split(/\s+/u)
      .filter((word) => word.length > 0)
      .map((word) => this.mirrorText(word, alphabet));
  }
}