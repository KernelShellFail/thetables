import { describe, expect, it } from "vitest";
import { ArabicEngine, Alphabet, TextProcessor, stripBidiControls } from "../src/index.js";
import { renderAlignedTable, transferLines } from "../src/interactive.js";

/**
 * The example from the specification:
 *
 *   input      كعبه كهان هي
 *   characters ك ع ب ه ا ن ي
 *   values     20 70 2 5 1 50 10      (standard)
 *   targets    ح ن و ع س ف ق          (custom, matched by value)
 *   mirrors    ت غ ر ب ا ج ه          (standard mirrors of the targets)
 *              ه و ن ر ص ث ط          (custom mirrors of the targets)
 */
const INPUT = "كعبه كهان هي";

const engine = new ArabicEngine();

describe("Alphabet · value lookup", () => {
  it("finds the letter carrying a value", () => {
    const standard = engine.getAlphabet("standard");
    expect(standard.getCharacterByValue(1)).toBe("ا");
    expect(standard.getCharacterByValue(10)).toBe("ي");
    expect(standard.getCharacterByValue(1000)).toBe("غ");

    const custom = engine.getAlphabet("custom");
    expect(custom.getCharacterByValue(1)).toBe("س");
    expect(custom.getCharacterByValue(7)).toBe("ى");
    expect(custom.getCharacterByValue(1000)).toBe("ث");
  });

  it("returns undefined for a value no letter carries", () => {
    expect(engine.getAlphabet("standard").getCharacterByValue(11)).toBeUndefined();
    expect(engine.getAlphabet("custom").getCharacterByValue(2.5)).toBeUndefined();
  });

  it("keeps the first letter when two letters share a value", () => {
    const alphabet = new Alphabet({
      name: "duplicate-values",
      values: [["ا", 1], ["ب", 1], ["ج", 2]],
      mirrors: []
    });
    expect(alphabet.getCharacterByValue(1)).toBe("ا");
    expect(alphabet.getCharacterByValue(2)).toBe("ج");
  });
});

describe("ArabicEngine · findCharacterByValue", () => {
  it("looks a value up in a named alphabet", () => {
    expect(engine.findCharacterByValue(20, "standard")).toBe("ك");
    expect(engine.findCharacterByValue(20, "custom")).toBe("ح");
    expect(engine.findCharacterByValue(99, "standard")).toBeUndefined();
  });
});

describe("ArabicEngine · transferValues", () => {
  const result = engine.transferValues(INPUT, "standard", "custom");

  it("keeps the distinct characters without whitespace, in first-appearance order", () => {
    expect(result.characters).toEqual(["ك", "ع", "ب", "ه", "ا", "ن", "ي"]);
  });

  it("values every character in the source alphabet", () => {
    expect(result.values).toEqual([20, 70, 2, 5, 1, 50, 10]);
  });

  it("matches every value with a letter of the target alphabet", () => {
    expect(result.targets).toEqual(["ح", "ن", "و", "ع", "س", "ف", "ق"]);
  });

  it("reports the alphabets it used", () => {
    expect(result.source).toBe("standard");
    expect(result.target).toBe("custom");
    expect(result.input).toBe(INPUT);
  });

  it("transfers in the other direction too", () => {
    const reverse = engine.transferValues(INPUT, "custom", "standard");
    // custom values: ك 400, ع 5, ب 200, ه 700, ا 3, ن 70, ي unknown
    expect(reverse.values).toEqual([400, 5, 200, 700, 3, 70, undefined]);
    // matched in the standard system: ت ه ر ذ ج ع —
    expect(reverse.targets).toEqual(["ت", "ه", "ر", "ذ", "ج", "ع", undefined]);
  });

  it("marks characters the source alphabet does not know", () => {
    const mixed = engine.transferValues("abc", "standard", "custom");
    expect(mixed.characters).toEqual(["a", "b", "c"]);
    expect(mixed.values).toEqual([undefined, undefined, undefined]);
    expect(mixed.targets).toEqual([undefined, undefined, undefined]);
  });
});

describe("TextProcessor · interleave", () => {
  const processor = new TextProcessor();

  it("takes one letter from the first, then one from the second", () => {
    expect(processor.interleave("abc", "123")).toBe("a1b2c3");
  });

  it("merges the two mirror rows of the example", () => {
    expect(processor.interleave("ت غ ر ب ا ج ه", "ه و ن ر ص ث ط")).toBe(
      "تهغورنبراصجثهط"
    );
  });

  it("ignores whitespace", () => {
    expect(processor.interleave("a b", "c d")).toBe("acbd");
    expect(processor.interleave("  ab  ", "  cd  ")).toBe("acbd");
  });

  it("appends the remainder of the longer text", () => {
    expect(processor.interleave("abcd", "xy")).toBe("axbycd");
    expect(processor.interleave("xy", "abcd")).toBe("xaybcd");
  });

  it("handles empty input", () => {
    expect(processor.interleave("", "")).toBe("");
    expect(processor.interleave("abc", "")).toBe("abc");
    expect(processor.interleave("", "abc")).toBe("abc");
  });
});

describe("TextProcessor · everyNthFromRight", () => {
  const processor = new TextProcessor();

  it("takes the 4th, 8th and 12th letter", () => {
    expect(processor.everyNthFromRight("تهغورنبراصجثهط", 4)).toEqual([
      "و",
      "ر",
      "ث"
    ]);
  });

  it("takes the 7th and 14th letter", () => {
    expect(processor.everyNthFromRight("تهغورنبراصجثهط", 7)).toEqual(["ب", "ط"]);
  });

  it("takes the 9th letter", () => {
    expect(processor.everyNthFromRight("تهغورنبراصجثهط", 9)).toEqual(["ا"]);
  });

  it("counts the letters, ignoring whitespace", () => {
    expect(processor.everyNthFromRight("ت ه غ و ر ن ب ر ا ص ج ث ه ط", 4)).toEqual([
      "و",
      "ر",
      "ث"
    ]);
  });

  it("returns nothing when the text is shorter than the step", () => {
    expect(processor.everyNthFromRight("abc", 4)).toEqual([]);
    expect(processor.everyNthFromRight("", 1)).toEqual([]);
  });

  it("rejects a step that is not a positive integer", () => {
    expect(() => processor.everyNthFromRight("abc", 0)).toThrow(RangeError);
    expect(() => processor.everyNthFromRight("abc", -2)).toThrow(RangeError);
    expect(() => processor.everyNthFromRight("abc", 1.5)).toThrow(RangeError);
  });
});

describe("ArabicEngine · countRule", () => {
  it("applies the 4-7-9 rule to the merged row", () => {
    const rule = engine.countRule("تهغورنبراصجثهط");

    expect(rule.groups).toEqual([
      { step: 4, letters: ["و", "ر", "ث"] },
      { step: 7, letters: ["ب", "ط"] },
      { step: 9, letters: ["ا"] }
    ]);
    expect(rule.letters).toEqual(["و", "ر", "ث", "ب", "ط", "ا"]);
    expect(rule.letters.join(" ")).toBe("و ر ث ب ط ا");
  });

  it("takes the standard mirror of what it found", () => {
    const rule = engine.countRule("تهغورنبراصجثهط");
    expect(engine.mirror(rule.letters.join(" "), "standard")).toBe("ر و ط ع ث س");
  });

  it("accepts other steps", () => {
    const rule = engine.countRule("تهغورنبراصجثهط", [1, 2]);
    expect(rule.groups[0]?.letters).toHaveLength(14);
    expect(rule.groups[1]?.letters).toHaveLength(7);
  });

  it("exposes the single step on the engine", () => {
    expect(engine.selectEveryNth("تهغورنبراصجثهط", 4)).toEqual(["و", "ر", "ث"]);
  });
});

describe("ArabicEngine · mirrorPair", () => {
  it("returns both mirror rows and their merge", () => {
    const pair = engine.mirrorPair("ح ن و ع س ف ق");

    expect(pair.first).toBe("standard");
    expect(pair.second).toBe("custom");
    expect(pair.firstLetters).toEqual(["ت", "غ", "ر", "ب", "ا", "ج", "ه"]);
    expect(pair.secondLetters).toEqual(["ه", "و", "ن", "ر", "ص", "ث", "ط"]);
    expect(pair.merged).toEqual([
      "ت", "ه", "غ", "و", "ر", "ن", "ب", "ر", "ا", "ص", "ج", "ث", "ه", "ط"
    ]);
  });

  it("merges exactly as the specification states", () => {
    const pair = engine.mirrorPair("ح ن و ع س ف ق");
    expect(pair.merged.join(" ")).toBe("ت ه غ و ر ن ب ر ا ص ج ث ه ط");
  });

  it("can merge in the other order", () => {
    const pair = engine.mirrorPair("ح ن و ع س ف ق", "custom", "standard");
    expect(pair.merged.join(" ")).toBe("ه ت و غ ن ر ر ب ص ا ث ج ط ه");
  });

  it("exposes the interleave on the engine", () => {
    expect(engine.interleave("abc", "123")).toBe("a1b2c3");
  });
});

describe("transferLines · step by step report", () => {
  const lines = transferLines(engine, INPUT, "standard", "custom");
  const plain = lines.map((line) => stripBidiControls(line));
  const trimmed = plain.map((line) => line.trimEnd());

  /** A data row: cells padded to four columns, then the reserved label slot. */
  const row = (cells: readonly string[], label = ""): string =>
    [...cells.map((cell) => cell.padEnd(4)), label.padEnd(8)].join(" ");

  it("shows the input", () => {
    expect(plain[1]).toBe(INPUT);
  });

  it("shows the distinct characters", () => {
    expect(plain).toContain(row(["ك", "ع", "ب", "ه", "ا", "ن", "ي"]));
  });

  it("shows the values", () => {
    expect(plain).toContain(row(["20", "70", "2", "5", "1", "50", "10"]));
  });

  it("shows the matched letters", () => {
    expect(plain).toContain(row(["ح", "ن", "و", "ع", "س", "ف", "ق"]));
  });

  it("shows the mirrors of the result in both systems", () => {
    expect(plain).toContain(row(["ت", "غ", "ر", "ب", "ا", "ج", "ه"], "standard"));
    expect(plain).toContain(row(["ه", "و", "ن", "ر", "ص", "ث", "ط"], "custom"));
  });

  it("shows the merged row of both mirrors", () => {
    // The merged row is twice as long, so it gets its own narrower table.
    const merged = [
      "ت", "ه", "غ", "و", "ر", "ن", "ب", "ر", "ا", "ص", "ج", "ث", "ه", "ط"
    ]
      .map((cell) => cell.padEnd(3))
      .join(" ") + " ";
    expect(plain).toContain(merged);
  });

  it("shows the counting rule and its result on one line", () => {
    // The step sits in the first column, the found letters follow it, and the
    // combined line keeps the same column as the letters of the groups.
    const ruleRow = (cells: readonly string[]): string =>
      Array.from({ length: 7 }, (_, index) =>
        (cells[index] ?? "").padEnd(4)
      )
        .join(" ")
        .trimEnd();

    expect(trimmed).toContain(ruleRow(["4", "و", "ر", "ث"]));
    expect(trimmed).toContain(ruleRow(["7", "ب", "ط"]));
    expect(trimmed).toContain(ruleRow(["9", "ا"]));
    expect(trimmed).toContain(ruleRow(["", "و", "ر", "ث", "ب", "ط", "ا"]));
  });

  it("shows the standard mirror of the found characters", () => {
    const mirrorRow = ["", "ر", "و", "ط", "ع", "ث", "س"]
      .map((cell) => cell.padEnd(4))
      .join(" ")
      .trimEnd();
    expect(trimmed).toContain(mirrorRow);
  });

  it("keeps every data row the same width so the columns stay aligned", () => {
    const dataRows = [
      row(["ك", "ع", "ب", "ه", "ا", "ن", "ي"]),
      row(["ك", "ع", "ب", "ه", "ا", "ن", "ي"]),
      row(["20", "70", "2", "5", "1", "50", "10"]),
      row(["ك", "ع", "ب", "ه", "ا", "ن", "ي"]),
      row(["20", "70", "2", "5", "1", "50", "10"]),
      row(["ح", "ن", "و", "ع", "س", "ف", "ق"]),
      row(["ت", "غ", "ر", "ب", "ا", "ج", "ه"], "standard"),
      row(["ه", "و", "ن", "ر", "ص", "ث", "ط"], "custom")
    ];
    expect(new Set(dataRows.map((row) => row.length)).size).toBe(1);
    for (const dataRow of dataRows) expect(plain).toContain(dataRow);
  });
});

describe("renderAlignedTable", () => {
  it("gives every row the same width", () => {
    const rows = renderAlignedTable([
      { cells: ["ك", "ع", "ب"] },
      { cells: ["20", "70", "2"] },
      { cells: ["ح", "ن", "و"], trailing: "custom" }
    ]);
    const plain = rows.map((row) => stripBidiControls(row));
    expect(new Set(plain.map((row) => row.length)).size).toBe(1);
  });

  it("reserves the label column in every row", () => {
    const rows = renderAlignedTable([
      { cells: ["ك"] },
      { cells: ["20"], trailing: "custom" }
    ]);
    const plain = rows.map((row) => stripBidiControls(row));
    // "ك" padded to the cell width, a separator, then the reserved label slot.
    expect(plain[0]).toBe("ك" + " ".repeat(10));
    expect(plain[1]).toBe("20" + " ".repeat(2) + " " + "custom");
  });

  it("lays the row out right-to-left", () => {
    const rows = renderAlignedTable([{ cells: ["ك", "ع"] }]);
    expect(rows[0]?.startsWith("\u2067")).toBe(true);
    expect(rows[0]?.endsWith("\u2069")).toBe(true);
  });
});
