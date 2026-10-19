import type {
  AlphabetConfig,
  AlphabetInfo,
  ArabicEngineOptions,
  CharacterValue,
  CountRuleResult,
  DuplicateResult,
  FrequencyEntry,
  MirrorPairResult,
  RemovePunctuationOptions,
  TextAnalysis,
  ValueTransferResult,
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

  /** Letter of an alphabet that carries a given numerical value. */
  findCharacterByValue(
    value: number,
    alphabetName: string
  ): string | undefined {
    return this.getAlphabet(alphabetName).getCharacterByValue(value);
  }

  /**
   * Carries a text from one alphabet to another by numerical value.
   *
   * 1. whitespace is removed and repeated characters are dropped, keeping the
   *    first occurrence;
   * 2. every remaining character is valued in the source alphabet;
   * 3. the target alphabet is searched for the letter that carries the same
   *    value.
   *
   * ```typescript
   * engine.transferValues("كعبه كهان هي", "standard", "custom");
   * // characters: ك ع ب ه ا ن ي
   * // values:    20 70 2 5 1 50 10
   * // targets:   ح ن و ع س ف ق
   * ```
   */
  transferValues(
    text: string,
    sourceName: string,
    targetName: string
  ): ValueTransferResult {
    const source = this.getAlphabet(sourceName);
    const target = this.getAlphabet(targetName);

    const characters = this.#text.uniqueCharacters(
      this.#text.removeWhitespace(text)
    );
    const values = characters.map((character) => source.getValue(character));
    const targets = values.map((value) =>
      value === undefined ? undefined : target.getCharacterByValue(value)
    );

    return {
      input: text,
      source: source.name,
      target: target.name,
      characters,
      values,
      targets
    };
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

  /**
   * Merges two texts by taking one letter from the first, then one from the
   * second, and repeating. Whitespace is ignored.
   */
  interleave(first: string, second: string): string {
    return this.#text.interleave(first, second);
  }

  /**
   * The letters at every `step`-th position of a text, counting from the
   * right.
   */
  selectEveryNth(text: string, step: number): string[] {
    return this.#text.everyNthFromRight(text, step);
  }

  /**
   * Applies a counting rule: for every step, the letters at every `step`-th
   * position, counting from the right.
   *
   * The 4-7-9 rule on the merged row of the reference example:
   *
   * ```typescript
   * const rule = engine.countRule("تهغورنبراصجثهط");
   * rule.groups[0]?.letters; // ["و", "ر", "ث"]
   * rule.groups[1]?.letters; // ["ب", "ط"]
   * rule.groups[2]?.letters; // ["ا"]
   * rule.letters;           // ["و", "ر", "ث", "ب", "ط", "ا"]
   * ```
   */
  countRule(
    text: string,
    steps: readonly number[] = [4, 7, 9]
  ): CountRuleResult {
    const groups = steps.map((step) => ({
      step,
      letters: this.#text.everyNthFromRight(text, step)
    }));

    return {
      text,
      groups,
      letters: groups.flatMap((group) => group.letters)
    };
  }

  /**
   * The mirrors of a text in two systems, plus the two rows interleaved.
   *
   * ```typescript
   * const pair = engine.mirrorPair("ح ن و ع س ف ق");
   * pair.firstLetters;  // ["ت", "غ", "ر", "ب", "ا", "ج", "ه"]
   * pair.secondLetters; // ["ه", "و", "ن", "ر", "ص", "ث", "ط"]
   * pair.merged;        // ["ت", "ه", "غ", "و", "ر", "ن", "ب", "ر", "ا", "ص", "ج", "ث", "ه", "ط"]
   * ```
   */
  mirrorPair(
    text: string,
    firstName = "standard",
    secondName = "custom"
  ): MirrorPairResult {
    const first = this.getAlphabet(firstName);
    const second = this.getAlphabet(secondName);

    const firstLetters = this.#mirror.mirrorLetters(text, first);
    const secondLetters = this.#mirror.mirrorLetters(text, second);
    const merged = this.#text
      .interleave(firstLetters.join(" "), secondLetters.join(" "))
      .split("");

    return {
      text,
      first: first.name,
      second: second.name,
      firstLetters,
      secondLetters,
      merged
    };
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