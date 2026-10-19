import { describe, expect, it } from "vitest";
import { ArabicEngine, stripBidiControls } from "../src/index.js";
import {
  REFERENCE_TEXT,
  displayWidth,
  executeCommand,
  formatRun,
  helpLines,
  parseInput,
  placeholder,
  renderTable
} from "../src/interactive.js";

/** Command output is compared without the invisible directional marks. */
function plain(result: { readonly lines: readonly string[] }): string {
  return stripBidiControls(result.lines.join("\n"));
}

const engine = new ArabicEngine();

describe("interactive · input parsing", () => {
  it("treats a bare line as text", () => {
    expect(parseInput("بسم الله")).toEqual({
      kind: "text",
      name: "",
      argument: "",
      value: "بسم الله"
    });
  });

  it("splits a command from its argument", () => {
    expect(parseInput("/abjad standard")).toEqual({
      kind: "command",
      name: "abjad",
      argument: "standard",
      value: "/abjad standard"
    });
  });

  it("handles a command without an argument and upper case", () => {
    expect(parseInput("/Mirror")).toMatchObject({ name: "mirror", argument: "" });
  });

  it("keeps Arabic arguments intact", () => {
    expect(parseInput("/set بسم الله")).toMatchObject({
      name: "set",
      argument: "بسم الله"
    });
  });

  it("handles empty input", () => {
    expect(parseInput("   ").kind).toBe("text");
    expect(parseInput("   ").value).toBe("");
  });
});

describe("interactive · session state", () => {
  it("stores typed text for later commands", () => {
    const result = executeCommand(engine, "بسم بسم", "");
    expect(result.ok).toBe(true);
    expect(result.text).toBe("بسم بسم");
  });

  it("keeps the current text when the command does not change it", () => {
    const result = executeCommand(engine, "/abjad", "بسم");
    expect(result.text).toBeUndefined();
    expect(plain(result)).toContain("102");
  });

  it("clears the text", () => {
    expect(executeCommand(engine, "/clear", "بسم").text).toBe("");
  });

  it("starts from the reference text", () => {
    expect(REFERENCE_TEXT).toBe("بسم الله الرحمن الرحيم");
    expect(plain(executeCommand(engine, "/abjad", REFERENCE_TEXT))).toContain("786");
  });
});

describe("interactive · abjad commands", () => {
  it("calculates a total with the default alphabet", () => {
    const output = plain(executeCommand(engine, "/abjad", REFERENCE_TEXT));
    expect(output).toContain("786");
  });

  it("calculates a total with a named alphabet", () => {
    expect(plain(executeCommand(engine, "/abjad custom", REFERENCE_TEXT))).toContain("1260");
  });

  it("reports an unknown alphabet instead of crashing", () => {
    const result = executeCommand(engine, "/abjad hebrew", REFERENCE_TEXT);
    expect(result.ok).toBe(false);
    expect(plain(result)).toContain('Unknown alphabet "hebrew"');
  });

  it("lists word values", () => {
    const output = plain(executeCommand(engine, "/words standard", REFERENCE_TEXT));
    expect(output).toContain("102");
    expect(output).toContain("329");
  });

  it("reports characters, mirrors and positions in the analysis", () => {
    const output = plain(executeCommand(engine, "/analyze standard", REFERENCE_TEXT));
    expect(output).toContain("786");
    expect(output).toContain("ع"); // mirror of ب
  });
});

describe("interactive · text and mirror commands", () => {
  it("mirrors the text", () => {
    expect(plain(executeCommand(engine, "/mirror standard", REFERENCE_TEXT))).toContain(
      "عاظ سضضق"
    );
  });

  it("removes duplicates and explains what was removed", () => {
    const output = plain(executeCommand(engine, "/dedup", REFERENCE_TEXT));
    expect(output).toContain("بسم الهرحني");
    expect(output).toContain("11");
    expect(output).toContain("×"); // the space now has a visible stand-in
  });

  it("lists unique characters with visible stand-ins", () => {
    const output = plain(executeCommand(engine, "/unique", "ب س ب"));
    expect(output).toContain("ب");
    expect(output).toContain("␣");
  });

  it("reverses by code point", () => {
    expect(plain(executeCommand(engine, "/reverse", "بسم"))).toContain("مسب");
  });

  it("shows a frequency table", () => {
    const output = plain(executeCommand(engine, "/freq", REFERENCE_TEXT));
    expect(output).toContain("4"); // ل appears four times
    expect(output).toContain("%");
  });

  it("shows visual order as a labelled diagnostic", () => {
    const output = plain(executeCommand(engine, "/visual", REFERENCE_TEXT));
    expect(output).toContain("بسم الله الرحمن الرحيم");
    expect(output).toContain("ميحرلا نمحرلا هللا مسب");
  });

  it("lists alphabets and their information", () => {
    expect(plain(executeCommand(engine, "/alphabets", ""))).toContain("standard");
    const info = plain(executeCommand(engine, "/info custom", ""));
    expect(info).toContain("28");
    expect(info).toContain("س");
  });

  it("runs the value transfer", () => {
    const output = plain(
      executeCommand(engine, "/transfer standard custom", "كعبه كهان هي")
    );
    expect(output).toContain("ك    ع    ب    ه    ا    ن    ي");
    expect(output).toContain("20   70   2    5    1    50   10");
    expect(output).toContain("ح    ن    و    ع    س    ف    ق");
    expect(output).toContain("ت    غ    ر    ب    ا    ج    ه");
    expect(output).toContain("ه    و    ن    ر    ص    ث    ط");
  });

  it("defaults the transfer to standard → custom", () => {
    const output = plain(executeCommand(engine, "/transfer", "كعبه كهان هي"));
    expect(output).toContain("ح    ن    و    ع    س    ف    ق");
  });

  it("reports an unknown alphabet in a transfer", () => {
    const result = executeCommand(engine, "/transfer standard latin", "بسم");
    expect(result.ok).toBe(false);
    expect(plain(result)).toContain('Unknown alphabet "latin"');
  });
});

describe("interactive · session control", () => {
  it("shows help", () => {
    expect(helpLines().length).toBeGreaterThan(3);
    expect(plain(executeCommand(engine, "/help", ""))).toContain("/abjad");
  });

  it("quits", () => {
    expect(executeCommand(engine, "/quit", "").quit).toBe(true);
    expect(executeCommand(engine, "/exit", "").quit).toBe(true);
  });

  it("rejects an unknown command", () => {
    const result = executeCommand(engine, "/nope", "");
    expect(result.ok).toBe(false);
    expect(plain(result)).toContain("/nope");
  });

  it("ignores empty input", () => {
    const result = executeCommand(engine, "   ", "بسم");
    expect(result.ok).toBe(true);
    expect(result.lines).toHaveLength(0);
  });

  it("sets text through /set", () => {
    const result = executeCommand(engine, "/set مرحبا", "");
    expect(result.text).toBe("مرحبا");
  });
});

describe("interactive · rendering helpers", () => {
  it("shows invisible characters as stand-ins", () => {
    expect(placeholder(" ")).toBe("␣");
    expect(placeholder("\t")).toBe("␉");
    expect(placeholder("\n")).toBe("␊");
    expect(placeholder("ب")).toBe("ب");
  });

  it("names directional marks so they are not invisible", () => {
    expect(placeholder("\u200F")).toBe("‹RLM›");
    expect(placeholder("\u200C")).toBe("‹ZWNJ›");
  });

  it("renders a character run right-to-left and isolated", () => {
    const run = formatRun(["ب", " ", "س"]);
    expect(stripBidiControls(run)).toBe("ب ␣ س");
    expect(run.startsWith("\u2067")).toBe(true);
    expect(run.endsWith("\u2069")).toBe(true);
  });

  it("returns an empty run for empty input", () => {
    expect(formatRun([])).toBe("");
  });

  it("measures width without counting directional marks", () => {
    expect(displayWidth("بسم")).toBe(3);
    expect(displayWidth("\u2067بسم\u2069")).toBe(3);
  });

  it("aligns table columns", () => {
    const lines = renderTable(["char", "value"], [
      ["ا", "1"],
      ["غ", "1000"]
    ]);
    expect(lines).toHaveLength(4); // header, rule, two rows
    expect(stripBidiControls(lines[0] ?? "")).toBe("char │ value");
    expect(stripBidiControls(lines[1] ?? "")).toBe("──── │ ─────");
    expect(stripBidiControls(lines[2] ?? "")).toBe(`${"ا".padEnd(4)} │ 1`);
    expect(stripBidiControls(lines[3] ?? "")).toBe(`${"غ".padEnd(4)} │ 1000`);
  });

  it("lays columns out right-to-left on request", () => {
    const lines = renderTable(["char", "value"], [["ا", "1"]], { rightToLeft: true });
    expect(stripBidiControls(lines[0] ?? "")).toBe("value │ char");
    expect(stripBidiControls(lines[1] ?? "")).toBe("───── │ ────");
    expect(stripBidiControls(lines[2] ?? "")).toBe(`1${" ".repeat(4)} │ ا`);
  });

  it("keeps the widest cell as the column width in both directions", () => {
    const ltr = renderTable(["a", "bb"], [["xxxxx", "y"]]);
    expect(stripBidiControls(ltr[0] ?? "")).toBe("a     │ bb");
    const rtl = renderTable(["a", "bb"], [["xxxxx", "y"]], { rightToLeft: true });
    expect(stripBidiControls(rtl[0] ?? "")).toBe("bb │ a");
  });
});