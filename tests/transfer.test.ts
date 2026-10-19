import { describe, expect, it } from "vitest";
import { ArabicEngine, Alphabet, stripBidiControls } from "../src/index.js";
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

describe("transferLines · step by step report", () => {
  const lines = transferLines(engine, INPUT, "standard", "custom");
  const plain = lines.map((line) => stripBidiControls(line));

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
