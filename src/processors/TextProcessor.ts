import type {
  DuplicateResult,
  FrequencyEntry,
  RemovePunctuationOptions
} from "../types/index.js";
import {
  isPunctuation,
  isWhitespace,
  toCharacters
} from "../utils/unicode.js";

const RATIO_PRECISION = 6;

function round(value: number): number {
  const factor = 10 ** RATIO_PRECISION;
  return Math.round(value * factor) / factor;
}

/**
 * Alphabet-independent text operations.
 *
 * Every method works on Unicode code points, keeps the first occurrence of a
 * character, and never normalises or rewrites the input text.
 */
export class TextProcessor {
  /**
   * Removes duplicate characters globally, keeping the first occurrence.
   *
   * `"abbccdefffa"` → `"abcdef"`, `"life is a lie"` → `"lfe s a"`.
   */
  removeDuplicates(text: string): string {
    return this.removeDuplicatesDetailed(text).result;
  }

  /** Same as {@link removeDuplicates}, plus a report of what was removed. */
  removeDuplicatesDetailed(text: string): DuplicateResult {
    const seen = new Set<string>();
    const removed = new Map<string, number>();
    const kept: string[] = [];
    let removedCount = 0;

    for (const char of toCharacters(text)) {
      if (seen.has(char)) {
        removed.set(char, (removed.get(char) ?? 0) + 1);
        removedCount += 1;
        continue;
      }
      seen.add(char);
      kept.push(char);
    }

    return {
      original: text,
      result: kept.join(""),
      removedCount,
      removedCharacters: removed
    };
  }

  /** Distinct characters of the text, in first-appearance order. */
  uniqueCharacters(text: string): string[] {
    return Array.from(new Set(toCharacters(text)));
  }

  /** Number of Unicode code points. */
  countCharacters(text: string): number {
    return toCharacters(text).length;
  }

  /** Character → occurrence count, in first-appearance order. */
  frequencies(text: string): ReadonlyMap<string, number> {
    const counts = new Map<string, number>();
    for (const char of toCharacters(text)) {
      counts.set(char, (counts.get(char) ?? 0) + 1);
    }
    return counts;
  }

  /**
   * Frequency report sorted by descending count, ties broken by first appearance.
   */
  frequencyList(text: string): FrequencyEntry[] {
    const counts = this.frequencies(text);
    const total = counts.size === 0 ? 0 : this.countCharacters(text);
    const order = new Map(Array.from(counts.keys(), (char, index) => [char, index]));

    return Array.from(counts, ([character, count]) => {
      return { character, count, ratio: round(count / total) };
    }).sort((a, b) => {
      if (a.count !== b.count) return b.count - a.count;
      return (order.get(a.character) ?? 0) - (order.get(b.character) ?? 0);
    });
  }

  /** Reverses the text by code points (UTF-16 surrogate pairs stay intact). */
  reverse(text: string): string {
    return toCharacters(text).reverse().join("");
  }

  /** Removes all whitespace, keeping every other character untouched. */
  removeWhitespace(text: string): string {
    return toCharacters(text)
      .filter((char) => !isWhitespace(char))
      .join("");
  }

  /** Removes Unicode punctuation plus any additionally requested characters. */
  removePunctuation(
    text: string,
    options: RemovePunctuationOptions = {}
  ): string {
    const extra = new Set(options.additionalCharacters ?? []);
    return toCharacters(text)
      .filter((char) => !isPunctuation(char) && !extra.has(char))
      .join("");
  }

  /** Removes whitespace and punctuation in one pass. */
  removeSpacesAndPunctuation(text: string): string {
    return toCharacters(text)
      .filter((char) => !isWhitespace(char) && !isPunctuation(char))
      .join("");
  }
}