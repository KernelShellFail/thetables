import { describe, expect, it } from "vitest";
import {
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
} from "../src/index.js";

describe("RTL · character classification", () => {
  it("detects right-to-left characters", () => {
    expect(isRtlCharacter("ب")).toBe(true);
    expect(isRtlCharacter("ى")).toBe(true);
    expect(isRtlCharacter("א")).toBe(true); // Hebrew
  });

  it("does not treat Latin, digits or punctuation as right-to-left", () => {
    expect(isRtlCharacter("a")).toBe(false);
    expect(isRtlCharacter("5")).toBe(false);
    expect(isRtlCharacter(" ")).toBe(false);
    expect(isRtlCharacter("!")).toBe(false);
  });

  it("detects right-to-left text", () => {
    expect(isRtlText("بسم")).toBe(true);
    expect(isRtlText("abc 123")).toBe(false);
    expect(isRtlText("بسم 123")).toBe(true);
    expect(isRtlText("")).toBe(false);
  });

  it("finds the first strong direction", () => {
    expect(firstStrongDirection("بسم")).toBe("rtl");
    expect(firstStrongDirection("abc")).toBe("ltr");
    expect(firstStrongDirection("123 مرحبا")).toBe("rtl");
    expect(firstStrongDirection("!@# 123")).toBeNull();
    expect(firstStrongDirection("")).toBeNull();
  });

  it("ignores directional marks when reading the first strong character", () => {
    expect(firstStrongDirection(`${RLM}123 ب`)).toBe("rtl");
    expect(firstStrongDirection(`${ALM}abc`)).toBe("ltr");
  });
});

describe("RTL · isolation", () => {
  it("wraps text in a directional isolate", () => {
    expect(isolateRtl("بسم")).toBe(`${RLI}بسم${PDI}`);
    expect(isolateLtr("abc")).toBe(`${LRI}abc${PDI}`);
  });

  it("picks the direction from the first strong character", () => {
    expect(isolate("بسم")).toBe(`${RLI}بسم${PDI}`);
    expect(isolate("786")).toBe(`${LRI}786${PDI}`);
    expect(isolate("786", "rtl")).toBe(`${RLI}786${PDI}`);
  });

  it("leaves empty text untouched", () => {
    expect(isolate("")).toBe("");
    expect(isolateRtl("")).toBe("");
  });

  it("never changes the characters it wraps", () => {
    const text = "ب:2 س:60 م:40";
    expect(stripBidiControls(isolateRtl(text))).toBe(text);
  });
});

describe("RTL · bidi control characters", () => {
  it("recognises directional formatting characters", () => {
    expect(isBidiControl(RLM)).toBe(true);
    expect(isBidiControl(LRM)).toBe(true);
    expect(isBidiControl(ALM)).toBe(true);
    expect(isBidiControl(FSI)).toBe(true);
    expect(isBidiControl("ب")).toBe(false);
    expect(isBidiControl(" ")).toBe(false);
  });

  it("reports whether text carries bidi marks", () => {
    expect(hasBidiControls(`ب${RLM}سم`)).toBe(true);
    expect(hasBidiControls("بسم")).toBe(false);
  });

  it("strips bidi marks without touching any other character", () => {
    expect(stripBidiControls(`${RLM}بسم${PDI}`)).toBe("بسم");
    expect(stripBidiControls(`${LRM}ab${ALM}cd`)).toBe("abcd");
    expect(stripBidiControls("بَسْم")).toBe("بَسْم"); // diacritics are not bidi marks
    expect(stripBidiControls("")).toBe("");
  });
});

describe("RTL · visual order", () => {
  it("converts Arabic from visual order back to logical order", () => {
    // "الله" displayed right-to-left reads "هللا" left-to-right.
    expect(toVisualOrder("هللا")).toBe("الله");
    expect(toVisualOrder("هللا مسب")).toBe("بسم الله");
    expect(toVisualOrder("ميحرلا نمحرلا هللا مسب")).toBe(
      "بسم الله الرحمن الرحيم"
    );
  });

  it("round-trips a phrase", () => {
    const logical = "بسم الله الرحمن الرحيم";
    expect(toVisualOrder(toVisualOrder(logical))).toBe(logical);
  });

  it("leaves left-to-right text alone", () => {
    expect(toVisualOrder("abc")).toBe("abc");
    expect(toVisualOrder("123")).toBe("123");
    expect(toVisualOrder("")).toBe("");
  });

  it("reorders runs around Latin text and digits", () => {
    // Logical "abc مرحبا" lays out as the Latin run on the right and the
    // reversed Arabic run on its left.
    expect(toVisualOrder("abc مرحبا")).toBe("ابحرمabc ");
  });

  it("preserves line order", () => {
    expect(toVisualOrder("هللا\nمسب")).toBe("الله\nبسم");
  });

  it("is not applied by the engine: logical text is never reversed", () => {
    // Calculation and mirroring always work on logical order.
    expect(toVisualOrder("بسم")).not.toBe("بسم");
  });
});