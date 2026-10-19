import type {
  AlphabetConfig,
  AlphabetInfo,
  ArabicEngineOptions,
  CharacterValue,
  DuplicateResult,
  FrequencyEntry,
  RemovePunctuationOptions,
  TextAnalysis,
  WordResult
} from "../types/index.js";
import { Alphabet, AlphabetError } from "./Alphabet.js";
import { customAlphabetConfig } from "../data/custom.js";
import { standardAlphabetConfig } from "../data/standard.js";
import { AbjadCalculator } from "../processors/AbjadCalculator.js";
import { MirrorProcessor } from "../processors/MirrorProcessor.js";
import { TextProcessor } from "../processors/TextProcessor.js";
import { toCharacters } from "../utils/unicode.js";

/** Alphabets every engine registers unless explicitly disabled. */
const BUILT_IN_ALPHABETS: readonly AlphabetConfig[] = Object.freeze([
  standardAlphabetConfig,
  customAlphabetConfig
]);

/**
 * Main entry point of the library.
 *
 * `ArabicEngine` composes the processors — consumers never instantiate them
 * themselves — and owns the alphabet registry. It is the single object needed
 * to perform any core operation:
 *
 * ```ts
 * const engine = new ArabicEngine();
 * engine.calculate("بسم الله الرحمن الرحيم", "standard"); // 786
 * ```
 *
 * Stateless apart from the registry, so it is safe to keep one instance around
 * and safe to create many (including in a browser).
 */
export class ArabicEngine {
  readonly #alphabets = new Map<string, Alphabet>();
  readonly #text = new TextProcessor();
  readonly #abjad = new AbjadCalculator();
  readonly #mirror = new MirrorProcessor();

  constructor(options: ArabicEngineOptions = {}) {
    const { useBuiltInAlphabets = true, alphabets = [] } = options;

    if (useBuiltInAlphabets) {
      for (const config of BUILT_IN_ALPHABETS) this.register(config);
    }
    for (const config of alphabets) this.register(config);
  }

  /* ---------------------------------------------------------------- registry */

  /**
   * Registers an alphabet from a config object or an existing instance.
   * Returns the registered alphabet. Throws on a duplicate name.
   */
  register(definition: Alphabet | AlphabetConfig): Alphabet {
    const alphabet =
      definition instanceof Alphabet ? definition : new Alphabet(definition);

    if (this.#alphabets.has(alphabet.name)) {
      throw new AlphabetError(`Alphabet "${alphabet.name}" is already registered.`);
    }

    this.#alphabets.set(alphabet.name, alphabet);
    return alphabet;
  }

  /** Whether an alphabet is registered under this name. */
  hasAlphabet(name: string): boolean {
    return this.#alphabets.has(name);
  }

  /** Registered alphabet; throws when the name is unknown. */
  getAlphabet(name: string): Alphabet {
    const alphabet = this.#alphabets.get(name);
    if (alphabet === undefined) {
      const known = this.listAlphabetNames();
      throw new AlphabetError(
        `Unknown alphabet "${name}". Registered alphabets: ${
          known.length > 0 ? known.join(", ") : "(none)"
        }.`
      );
    }
    return alphabet;
  }

  /** Registered names, in registration order. */
  listAlphabetNames(): readonly string[] {
    return Array.from(this.#alphabets.keys());
  }

  /** Registered alphabets, in registration order. */
  listAlphabets(): readonly Alphabet[] {
    return Array.from(this.#alphabets.values());
  }

  /** Immutable description of a registered alphabet. */
  describeAlphabet(name: string): AlphabetInfo {
    return this.getAlphabet(name).info();
  }

  /* ------------------------------------------------------------------- text */

  /** Global duplicate removal, keeping the first occurrence. */
  removeDuplicates(text: string): string {
    return this.#text.removeDuplicates(text);
  }

  /** Global duplicate removal with a report of the removed characters. */
  removeDuplicatesDetailed(text: string): DuplicateResult {
    return this.#text.removeDuplicatesDetailed(text);
  }

  /** Distinct characters, in first-appearance order. */
  uniqueCharacters(text: string): string[] {
    return this.#text.uniqueCharacters(text);
  }

  /** Number of Unicode code points. */
  countCharacters(text: string): number {
    return this.#text.countCharacters(text);
  }

  /** Character → occurrence count, in first-appearance order. */
  frequencyMap(text: string): ReadonlyMap<string, number> {
    return this.#text.frequencies(text);
  }

  /** Frequency report sorted by descending count. */
  frequencies(text: string): FrequencyEntry[] {
    return this.#text.frequencyList(text);
  }

  /** Reverses the text by code points. */
  reverse(text: string): string {
    return this.#text.reverse(text);
  }

  /** Removes whitespace. */
  removeWhitespace(text: string): string {
    return this.#text.removeWhitespace(text);
  }

  /** Removes Unicode punctuation plus optional extra characters. */
  removePunctuation(text: string, options?: RemovePunctuationOptions): string {
    return options === undefined
      ? this.#text.removePunctuation(text)
      : this.#text.removePunctuation(text, options);
  }

  /** Removes whitespace and punctuation. */
  removeSpacesAndPunctuation(text: string): string {
    return this.#text.removeSpacesAndPunctuation(text);
  }

  /* ------------------------------------------------------------------ abjad */

  /** Total Abjad value of a text. */
  calculate(text: string, alphabetName: string): number {
    return this.#abjad.calculate(text, this.getAlphabet(alphabetName));
  }

  /** Value of a single character. */
  calculateCharacter(char: string, alphabetName: string): number | undefined {
    return this.#abjad.calculateCharacter(char, this.getAlphabet(alphabetName));
  }

  /** Value of every whitespace-delimited word. */
  calculateWords(text: string, alphabetName: string): WordResult[] {
    return this.#abjad.calculateWords(text, this.getAlphabet(alphabetName));
  }

  /** Per-character values of a text. */
  breakdown(text: string, alphabetName: string): CharacterValue[] {
    return this.#abjad.breakdown(text, this.getAlphabet(alphabetName));
  }

  /* ----------------------------------------------------------------- mirror */

  /** Mirrors every character of a text. */
  mirror(text: string, alphabetName: string): string {
    return this.#mirror.mirrorText(text, this.getAlphabet(alphabetName));
  }

  /** Mirrors a single character. */
  mirrorCharacter(char: string, alphabetName: string): string {
    return this.#mirror.mirrorCharacter(char, this.getAlphabet(alphabetName));
  }

  /** Mirrors each whitespace-delimited word independently. */
  mirrorWords(text: string, alphabetName: string): string[] {
    return this.#mirror.mirrorWords(text, this.getAlphabet(alphabetName));
  }

  /* ---------------------------------------------------------------- analysis */

  /** Combined report: values, mirrors, frequencies and duplicates in one pass. */
  analyze(text: string, alphabetName: string): TextAnalysis {
    const alphabet = this.getAlphabet(alphabetName);
    const counts = this.#text.frequencies(text);

    const characters = toCharacters(text).map((character, index) => {
      const value = alphabet.getValue(character);
      return {
        character,
        index,
        position: alphabet.getPosition(character),
        value,
        mirror: alphabet.getMirror(character),
        frequency: counts.get(character) ?? 0,
        counted: value !== undefined
      };
    });

    return {
      text,
      alphabet: alphabet.name,
      length: characters.length,
      uniqueCount: counts.size,
      totalValue: this.#abjad.calculate(text, alphabet),
      characters,
      frequencies: this.#text.frequencyList(text),
      duplicates: this.#text.removeDuplicatesDetailed(text)
    };
  }
}