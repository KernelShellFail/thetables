import { describe, expect, it } from "vitest";
import {
  Alphabet,
  AlphabetError,
  ArabicEngine,
  customAlphabetConfig,
  standardAlphabetConfig
} from "../src/index.js";

/**
 * The expected tables below are written out literally from the original data.
 * They are deliberately NOT taken from `src/data/*`, so the tests verify the
 * engine against the source of truth rather than against itself.
 */

/** System 1 — Standard Abjad: letter, value, in original order. */
const STANDARD_EXPECTED: ReadonlyArray<readonly [string, number]> = [
  ["ا", 1], ["ب", 2], ["ج", 3], ["د", 4],
  ["ه", 5], ["و", 6], ["ز", 7], ["ح", 8],
  ["ط", 9], ["ي", 10], ["ك", 20], ["ل", 30],
  ["م", 40], ["ن", 50], ["س", 60], ["ع", 70],
  ["ف", 80], ["ص", 90], ["ق", 100], ["ر", 200],
  ["ش", 300], ["ت", 400], ["ث", 500], ["خ", 600],
  ["ذ", 700], ["ض", 800], ["ظ", 900], ["غ", 1000]
];

/** System 2 — Custom Abjad: letter, value, in original order. */
const CUSTOM_EXPECTED: ReadonlyArray<readonly [string, number]> = [
  ["س", 1], ["و", 2], ["ا", 3], ["ل", 4],
  ["ع", 5], ["ظ", 6], ["ى", 7], ["م", 8],
  ["خ", 9], ["ق", 10], ["ح", 20], ["ز", 30],
  ["ت", 40], ["ف", 50], ["ص", 60], ["ن", 70],
  ["ذ", 80], ["غ", 90], ["ر", 100], ["ب", 200],
  ["ش", 300], ["ك", 400], ["ض", 500], ["ط", 600],
  ["ه", 700], ["ج", 800], ["د", 900], ["ث", 1000]
];

const STANDARD_MIRROR_EXPECTED: ReadonlyArray<readonly [string, string]> = [
  ["ا", "س"], ["ب", "ع"], ["ج", "ف"],
  ["د", "ص"], ["ه", "ق"], ["و", "ر"],
  ["ز", "ش"], ["ح", "ت"], ["ط", "ث"],
  ["ي", "خ"], ["ك", "ذ"], ["ل", "ض"],
  ["م", "ظ"], ["ن", "غ"]
];

const CUSTOM_MIRROR_EXPECTED: ReadonlyArray<readonly [string, string]> = [
  ["س", "ص"], ["و", "ن"], ["ا", "ذ"],
  ["ل", "غ"], ["ع", "ر"], ["ظ", "ب"],
  ["ى", "ش"], ["م", "ك"], ["خ", "ض"],
  ["ق", "ط"], ["ح", "ه"], ["ز", "ج"],
  ["ت", "د"], ["ف", "ث"]
];

describe("Alphabet · standard values", () => {
  const alphabet = new Alphabet(standardAlphabetConfig);

  it("holds exactly 28 letters", () => {
    expect(STANDARD_EXPECTED).toHaveLength(28);
    expect(alphabet.size).toBe(28);
  });

  it.each(STANDARD_EXPECTED)("assigns %s = %i", (letter, value) => {
    expect(alphabet.getValue(letter)).toBe(value);
    expect(alphabet.contains(letter)).toBe(true);
  });

  it("preserves the original insertion order", () => {
    expect(alphabet.getLetters()).toEqual(STANDARD_EXPECTED.map(([letter]) => letter));
    expect(alphabet.getEntries()).toEqual([...STANDARD_EXPECTED]);
  });

  it("reports zero-based positions in the original order", () => {
    STANDARD_EXPECTED.forEach(([letter], index) => {
      expect(alphabet.getPosition(letter)).toBe(index);
    });
  });

  it("returns undefined for unknown characters", () => {
    expect(alphabet.getValue("1")).toBeUndefined();
    expect(alphabet.getValue("ى")).toBeUndefined();
    expect(alphabet.getPosition("ى")).toBeUndefined();
    expect(alphabet.contains("ى")).toBe(false);
  });
});

describe("Alphabet · custom values", () => {
  const alphabet = new Alphabet(customAlphabetConfig);

  it("holds exactly 28 letters", () => {
    expect(CUSTOM_EXPECTED).toHaveLength(28);
    expect(alphabet.size).toBe(28);
  });

  it.each(CUSTOM_EXPECTED)("assigns %s = %i", (letter, value) => {
    expect(alphabet.getValue(letter)).toBe(value);
    expect(alphabet.contains(letter)).toBe(true);
  });

  it("preserves the original insertion order", () => {
    expect(alphabet.getLetters()).toEqual(CUSTOM_EXPECTED.map(([letter]) => letter));
    expect(alphabet.getEntries()).toEqual([...CUSTOM_EXPECTED]);
  });

  it("returns undefined for characters that belong to the other system", () => {
    expect(alphabet.getValue("ي")).toBeUndefined();
    expect(alphabet.getPosition("ي")).toBeUndefined();
  });
});

describe("Alphabet · mirrors", () => {
  it("maps every standard pair in both directions", () => {
    const alphabet = new Alphabet(standardAlphabetConfig);
    for (const [letter, mirror] of STANDARD_MIRROR_EXPECTED) {
      expect(alphabet.getMirror(letter)).toBe(mirror);
      expect(alphabet.getMirror(mirror)).toBe(letter);
    }
  });

  it("maps every custom pair in both directions", () => {
    const alphabet = new Alphabet(customAlphabetConfig);
    for (const [letter, mirror] of CUSTOM_MIRROR_EXPECTED) {
      expect(alphabet.getMirror(letter)).toBe(mirror);
      expect(alphabet.getMirror(mirror)).toBe(letter);
    }
  });

  it("stores mirror pairs explicitly and in declaration order", () => {
    const alphabet = new Alphabet(standardAlphabetConfig);
    expect(alphabet.getMirrorPairs()).toEqual([...STANDARD_MIRROR_EXPECTED]);
    expect(alphabet.mirrorPairCount).toBe(14);
  });

  it("keeps the two systems independent", () => {
    const standard = new Alphabet(standardAlphabetConfig);
    const custom = new Alphabet(customAlphabetConfig);

    expect(standard.getMirror("ي")).toBe("خ");
    expect(custom.getMirror("ي")).toBeUndefined();
    expect(custom.getMirror("ى")).toBe("ش");
    expect(standard.getMirror("ى")).toBeUndefined();

    expect(standard.getValue("س")).toBe(60);
    expect(custom.getValue("س")).toBe(1);
  });

  it("reports mirrored and unmirrored letters", () => {
    const alphabet = new Alphabet(customAlphabetConfig);
    expect(alphabet.getMirroredLetters()).toHaveLength(28);
    expect(alphabet.getUnmirroredLetters()).toEqual([]);
    expect(alphabet.isMirrored("ق")).toBe(true);
    expect(alphabet.isMirrored("م")).toBe(true);
  });
});

describe("Alphabet · ى versus ي", () => {
  it("never rewrites the two characters into each other", () => {
    const standard = new Alphabet(standardAlphabetConfig);
    const custom = new Alphabet(customAlphabetConfig);

    expect(standard.getLetters()).toContain("ي");
    expect(standard.getLetters()).not.toContain("ى");
    expect(custom.getLetters()).toContain("ى");
    expect(custom.getLetters()).not.toContain("ي");

    expect(standard.getValue("ي")).toBe(10);
    expect(custom.getValue("ى")).toBe(7);
  });

  it("gives the two characters different values inside one engine", () => {
    const engine = new ArabicEngine();
    expect(engine.calculateCharacter("ي", "standard")).toBe(10);
    expect(engine.calculateCharacter("ى", "custom")).toBe(7);
    expect(engine.calculateCharacter("ى", "standard")).toBeUndefined();
    expect(engine.calculateCharacter("ي", "custom")).toBeUndefined();
  });
});

describe("Alphabet · validation", () => {
  const base = { name: "test", values: [["ا", 1], ["ب", 2]], mirrors: [] } as const;

  it("rejects an empty name", () => {
    expect(() => new Alphabet({ ...base, name: "  " })).toThrow(AlphabetError);
  });

  it("rejects an empty value table", () => {
    expect(() => new Alphabet({ ...base, values: [] })).toThrow(AlphabetError);
  });

  it("rejects duplicate value entries", () => {
    expect(
      () => new Alphabet({ ...base, values: [["ب", 2], ["ب", 5]] })
    ).toThrow(/duplicate value entry/u);
  });

  it("rejects non-numeric and non-finite values", () => {
    expect(
      () =>
        new Alphabet({
          ...base,
          values: [["ب", Number.NaN as unknown as number]]
        })
    ).toThrow(/finite number/u);
  });

  it("rejects letters that are not a single code point", () => {
    expect(() => new Alphabet({ ...base, values: [["اب", 2]] })).toThrow(
      /one Unicode code point/u
    );
  });

  it("rejects mirrors for letters without a value", () => {
    expect(
      () => new Alphabet({ ...base, mirrors: [["ج", "ب"]] })
    ).toThrow(/no value entry/u);
    expect(
      () => new Alphabet({ ...base, mirrors: [["ا", "ج"]] })
    ).toThrow(/no value entry/u);
  });

  it("rejects self-mirroring letters", () => {
    expect(
      () => new Alphabet({ ...base, mirrors: [["ا", "ا"]] })
    ).toThrow(/cannot mirror to itself/u);
  });

  it("rejects conflicting mirror declarations", () => {
    expect(
      () =>
        new Alphabet({
          name: "conflict",
          values: [["ا", 1], ["ب", 2], ["ج", 3]],
          mirrors: [["ا", "ب"], ["ا", "ج"]]
        })
    ).toThrow(/conflicting mirror for "ا" \("ب" vs "ج"\)/u);

    expect(
      () =>
        new Alphabet({
          name: "conflict",
          values: [["ا", 1], ["ب", 2], ["ج", 3]],
          mirrors: [["ا", "ب"], ["ج", "ب"]]
        })
    ).toThrow(/conflicting mirror for "ب"/u);
  });

  it("accepts a repeated but consistent mirror declaration", () => {
    const alphabet = new Alphabet({ ...base, mirrors: [["ا", "ب"], ["ب", "ا"]] });
    expect(alphabet.getMirror("ا")).toBe("ب");
    expect(alphabet.getMirror("ب")).toBe("ا");
  });
});

describe("Alphabet · immutability", () => {
  it("freezes the exported source tables", () => {
    expect(Object.isFrozen(standardAlphabetConfig.values)).toBe(true);
    expect(Object.isFrozen(standardAlphabetConfig.mirrors)).toBe(true);
    expect(Object.isFrozen(customAlphabetConfig.values)).toBe(true);
    expect(Object.isFrozen(customAlphabetConfig.mirrors)).toBe(true);
  });

  it("returns frozen lookup structures", () => {
    const alphabet = new Alphabet(standardAlphabetConfig);
    expect(Object.isFrozen(alphabet.getLetters())).toBe(true);
    expect(Object.isFrozen(alphabet.getEntries())).toBe(true);
    expect(Object.isFrozen(alphabet.getMirrorPairs())).toBe(true);

    expect(() => {
      (alphabet.getLetters() as string[])[0] = "x";
    }).toThrow(TypeError);
  });

  it("hands out a copy of the mirror map", () => {
    const alphabet = new Alphabet(standardAlphabetConfig);
    const copy = alphabet.getMirrorMap() as Map<string, string>;
    copy.set("ا", "X");
    expect(alphabet.getMirror("ا")).toBe("س");
  });

  it("keeps the original data intact after registration and use", () => {
    const engine = new ArabicEngine();
    engine.calculate("بسم الله الرحمن الرحيم", "standard");
    engine.mirror("بسم", "custom");

    const standard = new Alphabet(standardAlphabetConfig);
    expect(standard.getEntries()).toEqual([...STANDARD_EXPECTED]);
    expect(standard.getMirrorPairs()).toEqual([...STANDARD_MIRROR_EXPECTED]);

    const custom = new Alphabet(customAlphabetConfig);
    expect(custom.getEntries()).toEqual([...CUSTOM_EXPECTED]);
    expect(custom.getMirrorPairs()).toEqual([...CUSTOM_MIRROR_EXPECTED]);
  });
});

describe("ArabicEngine · registration", () => {
  it("registers both built-in alphabets by default", () => {
    const engine = new ArabicEngine();
    expect(engine.listAlphabetNames()).toEqual(["standard", "custom"]);
    expect(engine.hasAlphabet("standard")).toBe(true);
    expect(engine.hasAlphabet("missing")).toBe(false);
  });

  it("can start empty", () => {
    const engine = new ArabicEngine({ useBuiltInAlphabets: false });
    expect(engine.listAlphabetNames()).toEqual([]);
  });

  it("registers extra alphabets at construction time", () => {
    const engine = new ArabicEngine({
      alphabets: [{ name: "minimal", values: [["ا", 1]], mirrors: [] }]
    });
    expect(engine.listAlphabetNames()).toEqual(["standard", "custom", "minimal"]);
    expect(engine.calculate("اا", "minimal")).toBe(2);
  });

  it("rejects a duplicate registration", () => {
    const engine = new ArabicEngine();
    expect(() => engine.register(standardAlphabetConfig)).toThrow(AlphabetError);
    expect(() => engine.register({ ...standardAlphabetConfig, name: "custom" })).toThrow(
      /already registered/u
    );
  });

  it("accepts an Alphabet instance", () => {
    const engine = new ArabicEngine({ useBuiltInAlphabets: false });
    const alphabet = new Alphabet({
      name: "instance",
      values: [["ا", 1], ["ب", 2]],
      mirrors: [["ا", "ب"]]
    });
    expect(engine.register(alphabet)).toBe(alphabet);
    expect(engine.getAlphabet("instance")).toBe(alphabet);
    expect(engine.mirror("اب", "instance")).toBe("با");
  });

  it("throws a helpful error for an unknown alphabet", () => {
    const engine = new ArabicEngine();
    expect(() => engine.calculate("ب", "hebrew")).toThrow(/Unknown alphabet "hebrew"/u);
    expect(() => engine.calculate("ب", "hebrew")).toThrow(/standard, custom/u);
  });

  it("describes a registered alphabet", () => {
    const engine = new ArabicEngine();
    const info = engine.describeAlphabet("standard");
    expect(info.name).toBe("standard");
    expect(info.size).toBe(28);
    expect(info.letters).toHaveLength(28);
    expect(info.entries).toHaveLength(28);
    expect(info.mirrors.size).toBe(28);
    expect(info.mirroredLetters).toHaveLength(28);
    expect(info.unmirroredLetters).toEqual([]);
  });
});