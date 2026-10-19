import { describe, expect, it } from "vitest";
import { ArabicEngine, TextProcessor, toCharacters } from "../src/index.js";

const PHRASE = "بسم الله الرحمن الرحيم";

describe("TextProcessor · duplicate removal", () => {
  const processor = new TextProcessor();

  it("removes duplicates globally, keeping the first occurrence", () => {
    expect(processor.removeDuplicates("abbccdefffa")).toBe("abcdef");
  });

  it("removes duplicates across words, not only next to each other", () => {
    expect(processor.removeDuplicates("abca")).toBe("abc");
    expect(processor.removeDuplicates("abcabcabc")).toBe("abc");
    expect(processor.removeDuplicates("xyzzyx")).toBe("xyz");
  });

  it("handles English text including spaces", () => {
    // First-occurrence rule: the whole word "life" survives, the second "i"
    // and the repeated spaces and letters are dropped.
    expect(processor.removeDuplicates("life is a lie")).toBe("life sa");
  });

  it("handles Arabic text", () => {
    expect(processor.removeDuplicates("بس م ب")).toBe("بس م");
    expect(processor.removeDuplicates("بسم بسم")).toBe("بسم "); // trailing space kept
    expect(processor.removeDuplicates("العربية")).toBe("العربية");
    expect(processor.removeDuplicates("مررر")).toBe("مر");
  });

  it("keeps ى and ي as separate characters", () => {
    expect(processor.removeDuplicates("يىيى")).toBe("يى");
  });

  it("returns an empty string for empty input", () => {
    expect(processor.removeDuplicates("")).toBe("");
    expect(processor.removeDuplicatesDetailed("")).toEqual({
      original: "",
      result: "",
      removedCount: 0,
      removedCharacters: new Map()
    });
  });

  it("returns the input unchanged when there are no duplicates", () => {
    expect(processor.removeDuplicates("abcd")).toBe("abcd");
    expect(processor.removeDuplicates("ab cd")).toBe("ab cd");
  });
});

describe("TextProcessor · detailed duplicate report", () => {
  const processor = new TextProcessor();

  it("reports every removed character", () => {
    const result = processor.removeDuplicatesDetailed(PHRASE);

    expect(result.original).toBe(PHRASE);
    expect(result.result).toBe("بسم الهرحني");
    expect(result.removedCount).toBe(11);
    expect(Object.fromEntries(result.removedCharacters)).toEqual({
      ل: 3,
      " ": 2,
      ا: 2,
      م: 2,
      ر: 1,
      ح: 1
    });
  });

  it("reports nothing when nothing was removed", () => {
    const result = processor.removeDuplicatesDetailed("سلم");
    expect(result.removedCount).toBe(0);
    expect(result.removedCharacters.size).toBe(0);
  });

  it("counts every removed occurrence", () => {
    const result = processor.removeDuplicatesDetailed("aaaaa");
    expect(result.result).toBe("a");
    expect(result.removedCount).toBe(4);
    expect(result.removedCharacters.get("a")).toBe(4);
  });
});

describe("TextProcessor · whitespace and punctuation", () => {
  const processor = new TextProcessor();

  it("removes whitespace of every kind", () => {
    expect(processor.removeWhitespace("  ب س \t م\n")).toBe("بسم");
    expect(processor.removeWhitespace("a b\tc\nd")).toBe("abcd");
  });

  it("removes punctuation but keeps letters and digits", () => {
    // Whitespace is not punctuation, so the space between the words stays.
    expect(processor.removePunctuation("مرحباً، بالعالم!")).toBe("مرحباً بالعالم");
    expect(processor.removePunctuation("a,b.c;d")).toBe("abcd");
    expect(processor.removePunctuation("س1م2")).toBe("س1م2");
  });

  it("removes additional characters on request", () => {
    // ★ is a symbol, not punctuation, so it survives unless listed explicitly.
    expect(processor.removePunctuation("★بسم★")).toBe("★بسم★");
    expect(
      processor.removePunctuation("★بسم★", { additionalCharacters: ["★"] })
    ).toBe("بسم");
  });

  it("removes whitespace and punctuation together", () => {
    expect(processor.removeSpacesAndPunctuation(" ب,س! م? ")).toBe("بسم");
    expect(processor.removeSpacesAndPunctuation("بَ — س")).toBe("بَس");
  });

  it("never changes surviving characters", () => {
    const decorated = "بَسْمِ اللهِ";
    expect(processor.removePunctuation(decorated)).toBe(decorated);
    expect(processor.removeWhitespace(decorated)).toBe("بَسْمِاللهِ");
    // Only the second ل is dropped; every diacritic survives untouched.
    expect(processor.removeDuplicates(decorated)).toBe("بَسْمِ اله");
  });
});

describe("TextProcessor · inspection", () => {
  const processor = new TextProcessor();

  it("counts code points", () => {
    expect(processor.countCharacters("")).toBe(0);
    expect(processor.countCharacters("بسم")).toBe(3);
    expect(processor.countCharacters("ab cd")).toBe(5);
  });

  it("counts astral characters as one character, not two code units", () => {
    const emoji = "😀";
    expect(emoji.length).toBe(2);
    expect(processor.countCharacters(emoji)).toBe(1);
    expect(processor.removeDuplicates(emoji + emoji)).toBe(emoji);
    expect(processor.reverse(emoji + "ب")).toBe("ب" + emoji);
    expect(toCharacters(emoji + "ب")).toHaveLength(2);
  });

  it("lists unique characters in first-appearance order", () => {
    expect(processor.uniqueCharacters("بسم")).toEqual(["ب", "س", "م"]);
    expect(processor.uniqueCharacters("abca")).toEqual(["a", "b", "c"]);
    expect(processor.uniqueCharacters("")).toEqual([]);
  });

  it("builds a frequency map in first-appearance order", () => {
    const counts = processor.frequencies("بسم بسم");
    expect(Array.from(counts.keys())).toEqual(["ب", "س", "م", " "]);
    expect(counts.get("ب")).toBe(2);
    expect(counts.get(" ")).toBe(1);
    expect(processor.frequencies("").size).toBe(0);
  });

  it("sorts the frequency list by count then first appearance", () => {
    const list = processor.frequencyList("abba");
    expect(list.map((entry) => [entry.character, entry.count])).toEqual([
      ["a", 2],
      ["b", 2]
    ]);
    expect(list[0]?.ratio).toBe(0.5);

    const mixed = processor.frequencyList("aab");
    expect(mixed[0]).toEqual({ character: "a", count: 2, ratio: 0.666667 });
  });

  it("reverses by code point", () => {
    expect(processor.reverse(PHRASE)).toBe("ميحرلا نمحرلا هللا مسب");
    expect(processor.reverse("")).toBe("");
    expect(processor.reverse("ب")).toBe("ب");
  });
});

describe("ArabicEngine · text operations", () => {
  const engine = new ArabicEngine();

  it("exposes duplicate removal", () => {
    expect(engine.removeDuplicates("abbccdefffa")).toBe("abcdef");
    expect(engine.removeDuplicatesDetailed("aab").removedCount).toBe(1);
  });

  it("exposes inspection operations", () => {
    expect(engine.countCharacters(PHRASE)).toBe(22);
    expect(engine.uniqueCharacters(PHRASE)).toEqual([
      "ب", "س", "م", " ", "ا", "ل", "ه", "ر", "ح", "ن", "ي"
    ]);
    expect(engine.frequencyMap(PHRASE).get("ل")).toBe(4);
    expect(engine.frequencies(PHRASE)[0]).toEqual({
      character: "ل",
      count: 4,
      ratio: 0.181818
    });
    expect(engine.reverse("بسم")).toBe("مسب");
    expect(engine.removeWhitespace("ب س م")).toBe("بسم");
    expect(engine.removePunctuation("ب،س")).toBe("بس");
    expect(engine.removeSpacesAndPunctuation("ب، س")).toBe("بس");
  });
});