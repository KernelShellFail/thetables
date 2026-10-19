import { describe, expect, it } from "vitest";
import { LinkTable, LinkTableError, ArabicEngine } from "../src/index.js";
import { linkRows } from "../src/index.js";

/**
 * The link table, written out literally from the specification:
 *
 *   1 -> ا ي ق غ
 *   2 -> ب ك ر
 *   3 -> ج ل ش
 *   4 -> د م ت
 *   5 -> ه ن ث
 *   6 -> و س خ
 *   7 -> ز ع ذ
 *   8 -> ح ف ض
 *   9 -> ط ص ظ
 */
const EXPECTED_ROWS: ReadonlyArray<readonly string[]> = [
  ["ا", "ي", "ق", "غ"],
  ["ب", "ك", "ر"],
  ["ج", "ل", "ش"],
  ["د", "م", "ت"],
  ["ه", "ن", "ث"],
  ["و", "س", "خ"],
  ["ز", "ع", "ذ"],
  ["ح", "ف", "ض"],
  ["ط", "ص", "ظ"]
];

const engine = new ArabicEngine();

describe("LinkTable · data", () => {
  it("holds exactly the specified rows", () => {
    expect(engine.links.rows).toEqual([...EXPECTED_ROWS]);
    expect(linkRows).toEqual([...EXPECTED_ROWS]);
  });

  it("covers the 28 letters of the standard alphabet, each once", () => {
    const letters = EXPECTED_ROWS.flat();
    expect(letters).toHaveLength(28);
    expect(new Set(letters).size).toBe(28);
    expect([...letters].sort()).toEqual(
      [...engine.getAlphabet("standard").getLetters()].sort()
    );
  });

  it("has one row with four letters and eight with three", () => {
    expect(engine.links.rowCount).toBe(9);
    expect(engine.links.rows.filter((row) => row.length === 4)).toHaveLength(1);
    expect(engine.links.rows.filter((row) => row.length === 3)).toHaveLength(8);
  });
});

describe("LinkTable · chains", () => {
  it("gives the rest of the row, in the order it is written", () => {
    expect(engine.links.getChain("و")).toEqual(["س", "خ"]);
    expect(engine.links.getChain("ب")).toEqual(["ك", "ر"]);
    expect(engine.links.getChain("ث")).toEqual(["ه", "ن"]);
    expect(engine.links.getChain("ط")).toEqual(["ص", "ظ"]);
    expect(engine.links.getChain("ا")).toEqual(["ي", "ق", "غ"]);
  });

  it("returns the row a letter belongs to", () => {
    expect(engine.links.getRow("و")).toEqual(["و", "س", "خ"]);
    expect(engine.links.getRow("ا")).toEqual(["ا", "ي", "ق", "غ"]);
    expect(engine.links.getRow("x")).toBeUndefined();
  });

  it("has no chain for a letter outside the table", () => {
    expect(engine.links.getChain("x")).toEqual([]);
  });

  it("rejects a letter that appears twice", () => {
    expect(
      () => new LinkTable({ name: "broken", rows: [["ا", "ب"], ["ب", "ج"]] })
    ).toThrow(/appears more than once/u);
  });

  it("rejects an empty row and an empty table", () => {
    expect(() => new LinkTable({ name: "broken", rows: [[]] })).toThrow(
      LinkTableError
    );
    expect(() => new LinkTable({ name: "broken", rows: [] })).toThrow(
      LinkTableError
    );
  });
});

describe("ArabicEngine · expandChain", () => {
  const heads = ["و", "ر", "ث", "ب", "ط", "ا"];
  const table = engine.expandChain(heads);

  it("builds the final table", () => {
    expect(table.rows[0]).toEqual(["و", "ر", "ث", "ب", "ط", "ا"]);
    expect(table.rows[1]).toEqual(["ر", "و", "ط", "ع", "ث", "س"]);
    expect(table.rows[2]).toEqual(["س", "ب", "ه", "ك", "ص", "ي"]);
    expect(table.rows[3]).toEqual(["خ", "ك", "ن", "ر", "ظ", "ق"]);
  });

  it("leaves the cells a chain does not reach empty", () => {
    expect(table.rows[4]).toEqual([
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      "غ"
    ]);
    expect(table.rows).toHaveLength(5);
  });

  it("never fills a gap with a placeholder character", () => {
    const gap = table.rows[4]?.filter((cell) => cell === undefined);
    expect(gap).toHaveLength(5);
    expect(table.rows.flat().every((cell) => cell !== "ء")).toBe(true);
  });

  it("keeps the chain of every column", () => {
    expect(table.chains[0]).toEqual(["س", "خ"]);
    expect(table.chains[1]).toEqual(["ب", "ك"]);
    expect(table.chains[2]).toEqual(["ه", "ن"]);
    expect(table.chains[3]).toEqual(["ك", "ر"]);
    expect(table.chains[4]).toEqual(["ص", "ظ"]);
    expect(table.chains[5]).toEqual(["ي", "ق", "غ"]);
  });

  it("mirrors with the given system", () => {
    // custom: و⇄ن، ر⇄ع، ث⇄ف، ب⇄ظ، ط⇄ق، ا⇄ذ
    const custom = engine.expandChain(heads, "custom");
    expect(custom.rows[1]).toEqual(["ن", "ع", "ف", "ظ", "ق", "ذ"]);
  });

  it("handles an empty row of heads", () => {
    const empty = engine.expandChain([]);
    expect(empty.rows).toHaveLength(2);
    expect(empty.rows[0]).toEqual([]);
  });
});
