import { describe, expect, it } from "vitest";
import { AbjadCalculator, ArabicEngine } from "../src/index.js";

/**
 * Expected values are hand-computed from the original tables:
 *
 * بسم   → ب 2  + س 60 + م 40              = 102
 * الله  → ا 1  + ل 30 + ل 30 + ه 5        = 66
 * الرحمن → ا 1 + ل 30 + ر 200 + ح 8 + م 40 + ن 50 = 329
 * الرحيم → ا 1 + ل 30 + ر 200 + ح 8 + ي 10 + م 40 = 289
 *                                                  ────
 *                                                  786
 */
const PHRASE = "بسم الله الرحمن الرحيم";

describe("AbjadCalculator · standard totals", () => {
  const engine = new ArabicEngine();

  it("totals 786 for the reference phrase", () => {
    expect(engine.calculate(PHRASE, "standard")).toBe(786);
  });

  it("totals each word correctly", () => {
    const words = engine.calculateWords(PHRASE, "standard");
    expect(words.map((word) => word.word)).toEqual([
      "بسم",
      "الله",
      "الرحمن",
      "الرحيم"
    ]);
    expect(words.map((word) => word.value)).toEqual([102, 66, 329, 289]);
  });

  it("keeps word indices in text order", () => {
    engine.calculateWords(PHRASE, "standard").forEach((word, index) => {
      expect(word.index).toBe(index);
    });
  });

  it("exposes the per-character breakdown of every word", () => {
    const [first] = engine.calculateWords(PHRASE, "standard");
    expect(first?.characters).toEqual([
      { character: "ب", value: 2 },
      { character: "س", value: 60 },
      { character: "م", value: 40 }
    ]);
  });

  it("keeps the total identical to the sum of the words", () => {
    const words = engine.calculateWords(PHRASE, "standard");
    const sum = words.reduce((total, word) => total + word.value, 0);
    expect(sum).toBe(786);
    expect(engine.calculate(PHRASE, "standard")).toBe(sum);
  });
});

describe("AbjadCalculator · custom totals", () => {
  const engine = new ArabicEngine();

  it("totals 1260 for the reference phrase, ignoring the unknown ي", () => {
    // بسم 209 · الله 711 · الرحمن 205 · الرحيم 135 (ي is absent from this system)
    expect(engine.calculate(PHRASE, "custom")).toBe(1260);
    expect(engine.calculateWords(PHRASE, "custom").map((word) => word.value)).toEqual([
      209, 711, 205, 135
    ]);
  });

  it("marks the unknown character instead of failing", () => {
    const words = engine.calculateWords(PHRASE, "custom");
    const last = words[words.length - 1];
    expect(last?.word).toBe("الرحيم");
    expect(last?.characters[4]).toEqual({ character: "ي", value: undefined });
  });
});

describe("AbjadCalculator · characters", () => {
  const engine = new ArabicEngine();

  it("looks up single characters", () => {
    expect(engine.calculateCharacter("ب", "standard")).toBe(2);
    expect(engine.calculateCharacter("غ", "standard")).toBe(1000);
    expect(engine.calculateCharacter("س", "custom")).toBe(1);
  });

  it("returns undefined for unknown or multi-character input", () => {
    expect(engine.calculateCharacter("1", "standard")).toBeUndefined();
    expect(engine.calculateCharacter("ى", "standard")).toBeUndefined();
    expect(engine.calculateCharacter("ي", "custom")).toBeUndefined();
    expect(engine.calculateCharacter("", "standard")).toBeUndefined();
    expect(engine.calculateCharacter("بس", "standard")).toBeUndefined();
  });

  it("does not normalise diacritics away", () => {
    // بَ (b + fatha) is unknown, so only the bare ب counts.
    expect(engine.calculateCharacter("بَ", "standard")).toBeUndefined();
    expect(engine.calculate("بَسْم", "standard")).toBe(102);
    expect(engine.calculate("بَسْم", "standard")).toBe(
      engine.calculate("بسم", "standard")
    );
  });
});

describe("AbjadCalculator · edge cases", () => {
  const engine = new ArabicEngine();
  const calculator = new AbjadCalculator();

  it("returns 0 for empty text", () => {
    expect(engine.calculate("", "standard")).toBe(0);
    expect(engine.calculateWords("", "standard")).toEqual([]);
  });

  it("returns 0 for whitespace and punctuation only", () => {
    expect(engine.calculate("   ", "standard")).toBe(0);
    expect(engine.calculate("!@#$%", "standard")).toBe(0);
    expect(engine.calculate("بسم\nالله\t\t", "standard")).toBe(168);
  });

  it("ignores unknown characters instead of throwing", () => {
    expect(engine.calculate("ب1ب2", "standard")).toBe(4);
    expect(engine.calculate("hello", "standard")).toBe(0);
    expect(engine.calculate("hello", "custom")).toBe(0);
    // مرحبا 331 + بكم 608 in the custom system
    expect(engine.calculate("مرحبا بكم", "custom")).toBe(939);
  });

  it("counts every occurrence, not only distinct letters", () => {
    expect(engine.calculate("ببب", "standard")).toBe(6);
  });

  it("handles text without whitespace", () => {
    expect(engine.calculate("بسم", "standard")).toBe(102);
    expect(engine.calculateWords("بسم", "standard")).toHaveLength(1);
  });

  it("ignores leading and trailing whitespace when splitting words", () => {
    expect(engine.calculateWords("  بسم  الله  ", "standard").map((w) => w.value)).toEqual([
      102, 66
    ]);
  });

  it("agrees with the engine facade", () => {
    const alphabet = engine.getAlphabet("standard");
    expect(calculator.calculate(PHRASE, alphabet)).toBe(
      engine.calculate(PHRASE, "standard")
    );
    expect(calculator.calculateWordTotals(PHRASE, alphabet)).toBe(786);
    expect(calculator.breakdown(PHRASE, alphabet)).toHaveLength(22);
  });
});

describe("ArabicEngine · analysis report", () => {
  const engine = new ArabicEngine();

  it("reports values, positions, mirrors and frequencies in one pass", () => {
    const analysis = engine.analyze(PHRASE, "standard");

    expect(analysis.alphabet).toBe("standard");
    expect(analysis.length).toBe(22);
    expect(analysis.uniqueCount).toBe(11);
    expect(analysis.totalValue).toBe(786);
    expect(analysis.characters).toHaveLength(22);
    expect(analysis.frequencies[0]?.character).toBe("ل");
    expect(analysis.duplicates.removedCount).toBe(11);

    const bism = analysis.characters[0];
    expect(bism).toEqual({
      character: "ب",
      index: 0,
      position: 1,
      value: 2,
      mirror: "ع",
      frequency: 1,
      counted: true
    });

    const space = analysis.characters[3];
    expect(space).toMatchObject({ character: " ", value: undefined, counted: false });
  });

  it("produces an empty report for empty text", () => {
    const analysis = engine.analyze("", "custom");
    expect(analysis.length).toBe(0);
    expect(analysis.uniqueCount).toBe(0);
    expect(analysis.totalValue).toBe(0);
    expect(analysis.frequencies).toEqual([]);
  });
});