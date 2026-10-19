/**
 * Basit Arabic Engine — public API.
 *
 * Everything a consumer needs is re-exported here; internal module paths are
 * not part of the public contract.
 */

export { Alphabet, AlphabetError } from "./core/Alphabet.js";
export { ArabicEngine } from "./core/ArabicEngine.js";

export { AbjadCalculator } from "./processors/AbjadCalculator.js";
export { MirrorProcessor } from "./processors/MirrorProcessor.js";
export { TextProcessor } from "./processors/TextProcessor.js";

export {
  customAlphabetConfig,
  customMirrors,
  customValues
} from "./data/custom.js";
export {
  standardAlphabetConfig,
  standardMirrors,
  standardValues
} from "./data/standard.js";

export {
  isArabicLetter,
  isDiacritic,
  isPunctuation,
  isSingleCodePoint,
  isWhitespace,
  toCharacters,
  toCodePoints
} from "./utils/unicode.js";

export {
  ALM,
  FSI,
  LRM,
  LRI,
  PDI,
  RLM,
  RLI,
  firstStrongDirection,
  hasBidiControls,
  isBidiControl,
  isRtlCharacter,
  isRtlText,
  isolate,
  isolateLtr,
  isolateRtl,
  stripBidiControls,
  toVisualOrder
} from "./utils/rtl.js";

export type { Direction } from "./utils/rtl.js";

export type {
  AlphabetConfig,
  AlphabetInfo,
  ArabicEngineOptions,
  CharacterAnalysis,
  CharacterValue,
  DuplicateResult,
  FrequencyEntry,
  LetterMirror,
  LetterValue,
  MirrorPairResult,
  RemovePunctuationOptions,
  TextAnalysis,
  ValueTransferResult,
  WordResult
} from "./types/index.js";