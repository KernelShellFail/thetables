import { describe, expect, it } from "vitest";
import { ArabicEngine, MirrorProcessor } from "../src/index.js";

/** Expected pairs are written out literally from the original data. */
const STANDARD_MIRRORS: ReadonlyArray<readonly [string, string]> = [
  ["ا", "س"], ["ب", "ع"], ["ج", "ف"],
  ["د", "ص"], ["ه", "ق"], ["و", "ر"],
  ["ز", "ش"], ["ح", "ت"], ["ط", "ث"],
  ["ي", "خ"], ["ك", "ذ"], ["ل", "ض"],
  ["م", "ظ"], ["ن", "غ"]
];

const CUSTOM_MIRRORS: ReadonlyArray<readonly [string, string]> = [
  ["س", "ص"], ["و", "ن"], ["ا", "ذ"],
  ["ل", "غ"], ["ع", "ر"], ["ظ", "ب"],
  ["ى", "ش"], ["م", "ك"], ["خ", "ض"],
  ["ق", "ط"], ["ح", "ه"], ["ز", "ج"],
  ["ت", "د"], ["ف", "ث"]
];

const PHRASE = "بسم الله الرحمن الرحيم";

describe("MirrorProcessor · standard system", () => {
  const engine = new ArabicEngine();

  it.each(STANDARD_MIRRORS)("mirrors %s → %s and back", (letter, mirror) => {
    expect(engine.mirrorCharacter(letter, "standard")).toBe(mirror);
    expect(engine.mirrorCharacter(mirror, "standard")).toBe(letter);
    expect(engine.mirror(engine.mirror(letter, "standard"), "standard")).toBe(letter);
  });

  it("mirrors the reference phrase", () => {
    expect(engine.mirror(PHRASE, "standard")).toBe("عاظ سضضق سضوتظغ سضوتخظ");
  });

  it("restores the original text after mirroring twice", () => {
    expect(engine.mirror(engine.mirror(PHRASE, "standard"), "standard")).toBe(PHRASE);
  });

  it("mirrors each word", () => {
    expect(engine.mirrorWords(PHRASE, "standard")).toEqual([
      "عاظ",
      "سضضق",
      "سضوتظغ",
      "سضوتخظ"
    ]);
  });
});

describe("MirrorProcessor · custom system", () => {
  const engine = new ArabicEngine();

  it.each(CUSTOM_MIRRORS)("mirrors %s → %s and back", (letter, mirror) => {
    expect(engine.mirrorCharacter(letter, "custom")).toBe(mirror);
    expect(engine.mirrorCharacter(mirror, "custom")).toBe(letter);
    expect(engine.mirror(engine.mirror(letter, "custom"), "custom")).toBe(letter);
  });

  it("mirrors the reference phrase", () => {
    expect(engine.mirror(PHRASE, "custom")).toBe("ظصك ذغغح ذغعهكو ذغعهيك");
  });

  it("preserves ى while ى is unknown to the standard system", () => {
    expect(engine.mirror("يى", "custom")).toBe("يش");
    expect(engine.mirror("يى", "standard")).toBe("خى");
  });
});

describe("MirrorProcessor · unsupported characters", () => {
  const engine = new ArabicEngine();
  const processor = new MirrorProcessor();

  it("leaves unknown characters, digits and punctuation untouched", () => {
    const alphabet = engine.getAlphabet("standard");
    expect(processor.mirrorCharacter("1", alphabet)).toBe("1");
    expect(processor.mirrorCharacter("!", alphabet)).toBe("!");
    expect(processor.mirrorText("ب1،س!", alphabet)).toBe("ع1،ا!");
  });

  it("preserves whitespace and word boundaries", () => {
    expect(engine.mirror("ب س", "standard")).toBe("ع ا");
    expect(engine.mirror("  بسم  ", "standard")).toBe("  عاظ  ");
  });

  it("preserves diacritics instead of stripping them", () => {
    expect(engine.mirror("بَسْم", "standard")).toBe("عَاْظ");
    expect(engine.mirror("بَسْم", "standard")).not.toBe("عاظ");
  });

  it("returns empty text unchanged", () => {
    expect(engine.mirror("", "standard")).toBe("");
    expect(engine.mirror("", "custom")).toBe("");
    expect(engine.mirrorWords("", "standard")).toEqual([]);
  });

  it("keeps astral characters intact", () => {
    expect(engine.mirror("😀ب", "standard")).toBe("😀ع");
    expect(engine.mirror(engine.mirror("😀ب", "standard"), "standard")).toBe("😀ب");
  });
});

describe("MirrorProcessor · partial alphabets", () => {
  const engine = new ArabicEngine({
    useBuiltInAlphabets: false,
    alphabets: [
      { name: "partial", values: [["ا", 1], ["ب", 2], ["ج", 3]], mirrors: [["ا", "ب"]] }
    ]
  });

  it("mirrors only the declared pair and preserves the rest", () => {
    expect(engine.mirror("ابج", "partial")).toBe("باج");
    expect(engine.mirror("ج", "partial")).toBe("ج");
    expect(engine.getAlphabet("partial").getUnmirroredLetters()).toEqual(["ج"]);
  });
});