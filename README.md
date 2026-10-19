# Basit Arabic Engine

A small, dependable TypeScript library for Arabic text processing, Abjad calculation and
mirror transformation.

- Strict TypeScript, ES modules, zero runtime dependencies
- Two original alphabet systems shipped verbatim (`standard`, `custom`)
- Immutable, validated alphabet data — your data is never rewritten
- Unicode-correct: iterates code points, never normalises or strips diacritics
- Runs anywhere JavaScript runs (Node, browsers, workers) — the library uses no Node APIs

---

## Requirements

Node.js 18 or newer.

```bash
npm install
npm run dev      # run the console demonstration (watch mode)
npm run build    # compile to dist/ with declarations and source maps
npm test         # run the test suite with Vitest
npm run transfer # the value-transfer report (step by step)
```

Other scripts: `npm start` (run the built demo), `npm run typecheck`, `npm run test:watch`.

```bash
npm start -- -i                  # interactive Arabic session
npm start -- -h                  # command overview
npm run transfer -- "كعبه كهان هي"
npm run transfer -- "نص" custom standard   # swap the direction of the transfer
```

> On Windows, run in a UTF-8 console (Windows Terminal, or `chcp 65001` first),
> otherwise Arabic appears garbled. Both apps print a reminder when they detect
> a non-Windows-Terminal console.

---

## Quick start

```typescript
import { ArabicEngine } from "basit-arabic-engine";

const engine = new ArabicEngine(); // "standard" and "custom" are already registered

const input = "بسم الله الرحمن الرحيم";

engine.removeDuplicates(input);      // "بسم الهرحني"
engine.calculate(input, "standard"); // 786
engine.calculate(input, "custom");   // 1260
engine.mirror(input, "standard");    // "عاظ سضضق سضوتظغ سضوتخظ"
engine.mirror(input, "custom");      // "ظصك ذغغح ذغعهكو ذغعهيك"
engine.frequencies(input);           // [{ character: "ل", count: 4, ratio: 0.181818 }, …]
```

`ArabicEngine` is the only object you need: it owns the alphabet registry and composes the
three processors internally.

---

## Project structure

```text
basit-arabic-engine/
├── package.json
├── tsconfig.json
├── README.md
├── src/
│   ├── core/
│   │   ├── Alphabet.ts        # one alphabet system: values + mirrors
│   │   ├── LinkTable.ts       # the table of letter chains
│   │   └── ArabicEngine.ts    # facade / registry / public API
│   ├── processors/
│   │   ├── TextProcessor.ts   # duplicates, counts, frequencies, whitespace
│   │   ├── AbjadCalculator.ts # totals, words, characters
│   │   └── MirrorProcessor.ts # character / word / sentence mirroring
│   ├── data/
│   │   ├── standard.ts        # System 1 — original data
│   │   ├── custom.ts          # System 2 — original data
│   │   └── links.ts           # the link table — letter chains
│   ├── types/
│   │   └── index.ts           # all shared interfaces and type aliases
│   ├── utils/
│   │   ├── unicode.ts         # code-point helpers
│   │   └── rtl.ts             # bidirectional (right-to-left) helpers
│   ├── interactive.ts         # Arabic presentation + REPL commands (pure)
│   ├── transfer.ts            # value-transfer console report
│   ├── index.ts               # every public export
│   └── main.ts                # console demo + interactive session
│
├── tests/
│   ├── alphabet.test.ts
│   ├── text.test.ts
│   ├── abjad.test.ts
│   ├── mirror.test.ts
│   ├── rtl.test.ts
│   ├── interactive.test.ts
│   ├── transfer.test.ts
│   └── links.test.ts
│
└── web/                       # the React interface
    ├── index.html
    ├── vite.config.ts
    └── src/
```

The library (`src/index.ts`) is completely separate from the console demo (`src/main.ts`)
and from the web interface (`web/`).

---

## Data integrity

The two original systems are stored exactly as supplied and are protected at runtime:

| Rule | How it is enforced |
| --- | --- |
| Characters, positions and values are never changed | Tables are `Object.freeze`d on load and copied into private maps inside `Alphabet` |
| `ى` is never replaced with `ي` | No normalisation exists anywhere in the pipeline; `ى` (U+0649) and `ي` (U+064A) stay distinct letters of distinct systems |
| No automatic normalisation | Every text operation iterates code points and returns them unchanged |
| The two systems stay independent | Each `Alphabet` owns its own maps; nothing is shared or derived between them |
| Mirrors work in both directions | Pairs are stored explicitly and applied as `a→b` **and** `b→a`, so mirroring twice always restores the original |
| Insertion order is preserved | `getLetters()` and `getEntries()` return the original order |
| Mirror mappings are stored explicitly | They are never inferred from positions in the value table |
| Duplicate / inconsistent data is rejected | The constructor throws `AlphabetError` on duplicate letters, unknown mirrored letters, self-mirroring letters and conflicting pairs |
| Registered data cannot be mutated | Lookup structures are private; getters return frozen arrays and copies |

### System 1 — `standard`

| ا | ب | ج | د | ه | و | ز | ح | ط | ي | ك | ل | م |
| --: | --: | --: | --: | --: | --: | --: | --: | --: | --: | --: | --: | --: |
| 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 20 | 30 | 40 |

| ن | س | ع | ف | ص | ق | ر | ش | ت | ث | خ | ذ | ض | ظ | غ |
| --: | --: | --: | --: | --: | --: | --: | --: | --: | --: | --: | --: | --: | --: | --: |
| 50 | 60 | 70 | 80 | 90 | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900 | 1000 |

Mirrors: `ا⇄س`, `ب⇄ع`, `ج⇄ف`, `د⇄ص`, `ه⇄ق`, `و⇄ر`, `ز⇄ش`, `ح⇄ت`, `ط⇄ث`, `ي⇄خ`, `ك⇄ذ`, `ل⇄ض`, `م⇄ظ`, `ن⇄غ`

### System 2 — `custom`

| س | و | ا | ل | ع | ظ | ى | م | خ | ق | ح | ز | ت | ف |
| --: | --: | --: | --: | --: | --: | --: | --: | --: | --: | --: | --: | --: | --: |
| 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 20 | 30 | 40 | 50 |

| ص | ن | ذ | غ | ر | ب | ش | ك | ض | ط | ه | ج | د | ث |
| --: | --: | --: | --: | --: | --: | --: | --: | --: | --: | --: | --: | --: | --: |
| 60 | 70 | 80 | 90 | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900 | 1000 |

Mirrors: `س⇄ص`, `و⇄ن`, `ا⇄ذ`, `ل⇄غ`, `ع⇄ر`, `ظ⇄ب`, `ى⇄ش`, `م⇄ك`, `خ⇄ض`, `ق⇄ط`, `ح⇄ه`, `ز⇄ج`, `ت⇄د`, `ف⇄ث`

---

## API

### `ArabicEngine`

```typescript
new ArabicEngine();                                  // built-ins only
new ArabicEngine({ useBuiltInAlphabets: false });    // empty registry
new ArabicEngine({ alphabets: [myConfig] });         // built-ins + extras
```

| Method | Purpose |
| --- | --- |
| `register(config \| Alphabet): Alphabet` | Register an alphabet; throws on a duplicate name |
| `hasAlphabet(name): boolean` | Registry check |
| `getAlphabet(name): Alphabet` | Throws `AlphabetError` with the known names when missing |
| `listAlphabetNames(): readonly string[]` | Registered names, in registration order |
| `listAlphabets(): readonly Alphabet[]` | Registered alphabets |
| `describeAlphabet(name): AlphabetInfo` | Immutable snapshot for UIs and exports |
| `removeDuplicates(text): string` | Global duplicate removal, first occurrence wins |
| `removeDuplicatesDetailed(text): DuplicateResult` | Same, plus removed characters |
| `uniqueCharacters(text): string[]` | Distinct characters, first-appearance order |
| `countCharacters(text): number` | Number of code points |
| `frequencies(text): FrequencyEntry[]` | Counts and ratios, sorted by count |
| `frequencyMap(text): ReadonlyMap<string, number>` | Counts in first-appearance order |
| `reverse(text): string` | Reversal by code point |
| `removeWhitespace(text): string` | Drops all whitespace |
| `removePunctuation(text, options?): string` | Drops `\p{P}`, plus `options.additionalCharacters` |
| `removeSpacesAndPunctuation(text): string` | Both of the above in one pass |
| `calculate(text, name): number` | Total Abjad value |
| `calculateCharacter(char, name): number \| undefined` | Value of one character |
| `calculateWords(text, name): WordResult[]` | Per-word value and character breakdown |
| `breakdown(text, name): CharacterValue[]` | Per-character values of the whole text |
| `findCharacterByValue(value, name): string \| undefined` | The letter carrying a given value |
| `transferValues(text, source, target): ValueTransferResult` | Carries a text from one alphabet to another by value |
| `mirrorPair(text, first?, second?): MirrorPairResult` | The mirrors in two systems, and the two rows interleaved |
| `interleave(first, second): string` | Merges two texts, one letter from each in turn |
| `countRule(text, steps?): CountRuleResult` | The letters at every N-th position, counting from the right |
| `selectEveryNth(text, step): string[]` | One step of that rule on its own |
| `expandChain(heads, name?): ChainExpansion` | The final table: letters, mirrors, and their chains |
| `links: LinkTable` | The table of letter chains |
| `mirror(text, name): string` | Mirrors every character |
| `mirrorCharacter(char, name): string` | Mirrors one character |
| `mirrorWords(text, name): string[]` | Mirrors each word |
| `analyze(text, name): TextAnalysis` | Values, mirrors, frequencies and duplicates in one pass |

### `Alphabet`

```typescript
const alphabet = new Alphabet({
  name: "my-system",
  values: [["ا", 1], ["ب", 2]],
  mirrors: [["ا", "ب"]]
});

alphabet.getValue("ب");       // 2
alphabet.getMirror("ا");      // "ب"  (and getMirror("ب") === "ا")
alphabet.getPosition("ب");    // 1
alphabet.contains("ج");       // false
alphabet.getLetters();        // frozen, original order
alphabet.getEntries();        // frozen [letter, value] pairs
alphabet.getMirrorPairs();    // frozen pairs, declaration order
alphabet.getUnmirroredLetters();
alphabet.info();              // AlphabetInfo snapshot
```

### Processors

`TextProcessor`, `AbjadCalculator` and `MirrorProcessor` are public and usable on their own
if you need them without the registry — each takes an `Alphabet` directly:

```typescript
import { TextProcessor } from "basit-arabic-engine";

new TextProcessor().removeDuplicates("abbccdefffa"); // "abcdef"
```

---

## Behaviour notes

**Duplicate removal is global and keeps the first occurrence.** `abbccdefffa` → `abcdef`.
Because the rule is strictly "first occurrence wins", `"life is a lie"` → `"life sa"`: the
whole word `life` survives, the repeated `i` is dropped from `is`, and the repeated spaces
collapse into the first one. (The `lfe is a` variant quoted in the original brief keeps a
*later* `i` and later spaces, which contradicts first-occurrence removal — this library
follows the stated rule.)

**Unknown characters are ignored, never fatal.** Letters missing from the chosen alphabet,
digits, punctuation and whitespace contribute `0` to a total, so mixed-language input works.
They are still visible in `breakdown()`, `calculateWords()` and `analyze()` as
`{ character: "ي", value: undefined }`, so nothing is silently hidden.

**Nothing is normalised and no diacritic is ever removed.** `بَسْم` keeps its marks; the bare
letters are what the alphabets can value. Every calculation iterates Unicode code points
(`Array.from(text)`, `for…of`), so astral characters such as emoji are treated as one
character, never as two UTF-16 code units.

**Mirroring preserves everything it does not know.** Spaces, punctuation, diacritics and
unknown letters pass through unchanged, and because mirrors are stored in both directions,
`mirror(mirror(text)) === text`.

---

## Right-to-left (RTL) text

Arabic is written right to left, but **a JavaScript string is always stored in logical
order** — the order the characters are typed and read. That is the only order in which values,
mirrors and duplicate detection are correct, so the engine never reverses text for
calculation. Typing or pasting Arabic needs no conversion: the keyboard layout or IME handles
the direction, and the text arrives in logical order.

What does need handling is **display**. When Arabic sits next to Latin text, digits or
brackets in one line, the Unicode bidirectional algorithm has to guess how they interleave —
and it guesses wrong often enough to be noticed (a closing `)` jumps to the far end of the
line). `utils/rtl.ts` and `interactive.ts` handle this:

| Concern | Solution |
| --- | --- |
| A fragment reorders its neighbours | Wrap it in an isolate: `isolate()`, `isolateRtl()`, `isolateLtr()` (`RLI…PDI`, `LRI…PDI`, `FSI…PDI`) |
| A whole row should read right to left | The Arabic name goes on the right and the value flows left, via `isolateRtl()` |
| Which direction is this text? | `firstStrongDirection()`, `isRtlText()`, `isRtlCharacter()` |
| Spaces and directional marks are invisible | `␣`, `‹RLM›`, `‹ZWNJ›` stand-ins in `placeholder()` / `formatRun()` |
| Column order for an Arabic reader | `renderTable(..., { rightToLeft: true })` puts the first column on the right |
| Text captured in *visual* order | `toVisualOrder()` converts glyph order back to logical order |

```typescript
import { isolateRtl, isolate, toVisualOrder } from "basit-arabic-engine";

isolateRtl("عاظ سضضق");        // renders as one right-to-left run
isolate("ب:2 س:60");          // each fragment keeps its own direction
toVisualOrder("هللا مسب");    // "بسم الله" — only for visually-stored input
```

Two deliberate choices worth knowing:

- **Tables are reversed manually, not with an RTL wrapper.** Doing both cancels out, and a
  manual layout keeps working in terminals and editors with weak bidirectional support — so
  a table pasted into a log file or a plain editor still reads correctly.
- **`toVisualOrder()` is never automatic.** Applying it to text that is already logical would
  scramble it, so it is an explicit conversion, used only for input captured in visual order.

Cells are never mutated: bidi marks are meaningful for rendering, which is why
`stripBidiControls()` exists as an explicit opt-in rather than something the engine applies
behind your back.

---

## Interactive session

```bash
npm start -- -i
```

Type Arabic on its own line to set the text, then use commands. Everything is computed in
logical order; output is laid out right to left.

```text
❯ بسم الله الرحمن الرحيم
❯ /abjad
── الحساب — standard ──
بسم الله الرحمن الرحيم
المجموع  786

❯ /mirror custom
── المرآة — custom ──
المدخل  بسم الله الرحمن الرحيم
المخرَج  ظصك ذغغح ذغعهكو ذغعهيك
```

| Command | Result |
| --- | --- |
| `/abjad [name]`, `/words [name]`, `/analyze [name]` | Total, per-word values, full report (default `standard`) |
| `/mirror [name]` | Mirrored text, showing input and output |
| `/dedup`, `/unique`, `/freq`, `/reverse` | Duplicate removal with details, distinct characters, frequency table, reversal |
| `/alphabets`, `/info <name>` | Registry listing; letters, values and mirrors as right-to-left tables |
| `/set <text>`, `/clear` | Replace or empty the session text |
| `/visual` | Visual-order reading of the text, labelled as a diagnostic |
| `/help`, `/quit` | Command list; leave (`Ctrl+C` or `Ctrl+D` also work) |

The same pieces are importable, so a web, REST or desktop interface can reuse them without
touching the engine:

```typescript
import { ArabicEngine, formatRun, renderTable } from "basit-arabic-engine";
import { executeCommand } from "basit-arabic-engine/dist/interactive.js"; // or your own UI layer
```

---

## Value transfer between alphabets

The engine can carry a text from one alphabet to another **by numerical value**: read the
value of every character in the source system, then look up the letter of the target system
that carries the same value.

```bash
npm run transfer -- "كعبه كهان هي"
```

| Step | Result |
| --- | --- |
| 1 · the input | `كعبه كهان هي` |
| 2 · distinct characters, no whitespace, no repeats | `ك ع ب ه ا ن ي` |
| 3 · their value in `standard` | `20 70 2 5 1 50 10` |
| 4 · the `custom` letter with the same value | `ح ن و ع س ف ق` |
| 5 · the mirrors of that result | `ت غ ر ب ا ج ه` (standard) · `ه و ن ر ص ث ط` (custom) |
| 6 · the two mirror rows interleaved | `ت ه غ و ر ن ب ر ا ص ج ث ه ط` |
| 7 · the 4-7-9 rule, counting from the right | `4 → و ر ث` · `7 → ب ط` · `9 → ا` |
| 8 · the standard mirror of what was found | `ر و ط ع ث س` |
| 9 · the final chain table | see below |

Step 6 takes one letter from the first mirror row, one from the second, and repeats — so
the merged row alternates between the two systems.

Step 7 applies the **4-7-9 rule** to the merged row: counting from the right, the 4th,
8th and 12th letters, then the 7th and 14th, then the 9th. Step 8 mirrors the six found
letters in the standard system — and the table lines the two up, so every mirror sits
directly under the letter it mirrors.

### The link table

Step 9 builds the final table. Every letter of the standard alphabet appears once in the
link table, arranged in nine rows — a letter's row is the chain it continues with:

```text
1 → ا ي ق غ      5 → ه ن ث      9 → ط ص ظ
2 → ب ك ر        6 → و س خ
3 → ج ل ش        7 → ز ع ذ
4 → د م ت        8 → ح ف ض
```

The chain of a letter is its row without the letter itself, in the order the row is
written. So `و` continues with `س` then `خ`, while `ر` — the last letter of its row —
continues with `ب` then `ك`. Row 1 is the only one with four letters, so only `ا` has a
chain of three.

```text
و  ر  ث  ب  ط  ا     ← the 4-7-9 rule
ر  و  ط  ع  ث  س     ← its standard mirror
س  ب  ه  ك  ص  ي     ← the first letter of each chain
خ  ك  ن  ر  ظ  ق     ← the second
               غ     ← the third, reached only by ا
```

A cell a chain does not reach is left **empty** — never filled with a placeholder.

Every row is laid out right-to-left with the columns aligned, so the value under a letter
really is that letter's value:

```text
── 3 · القيم في نظام standard ──
ك    ع    ب    ه    ا    ن    ي
20   70   2    5    1    50   10

── 4 · الحروف المقابلة في نظام custom ──
ك    ع    ب    ه    ا    ن    ي
20   70   2    5    1    50   10
ح    ن    و    ع    س    ف    ق
```

The same pipeline is available as an API, in both directions and for any registered system:

```typescript
const result = engine.transferValues("كعبه كهان هي", "standard", "custom");

result.characters; // ["ك", "ع", "ب", "ه", "ا", "ن", "ي"]
result.values;     // [20, 70, 2, 5, 1, 50, 10]
result.targets;    // ["ح", "ن", "و", "ع", "س", "ف", "ق"]

engine.findCharacterByValue(20, "standard"); // "ك"
engine.findCharacterByValue(20, "custom");  // "ح"
```

The mirrors of a result, in both systems, plus the interleaved row:

```typescript
const pair = engine.mirrorPair("ح ن و ع س ف ق");

pair.firstLetters;  // ["ت", "غ", "ر", "ب", "ا", "ج", "ه"]
pair.secondLetters; // ["ه", "و", "ن", "ر", "ص", "ث", "ط"]
pair.merged;        // ["ت", "ه", "غ", "و", "ر", "ن", "ب", "ر", "ا", "ص", "ج", "ث", "ه", "ط"]

engine.interleave("abc", "123"); // "a1b2c3" — whitespace is ignored
```

The counting rule — every N-th letter, counting from the right:

```typescript
const rule = engine.countRule("تهغورنبراصجثهط"); // the 4-7-9 rule

rule.groups[0]?.letters; // ["و", "ر", "ث"]  — 4th, 8th, 12th from the right
rule.groups[1]?.letters; // ["ب", "ط"]       — 7th, 14th
rule.groups[2]?.letters; // ["ا"]            — 9th
rule.letters;           // ["و", "ر", "ث", "ب", "ط", "ا"]

engine.selectEveryNth("تهغورنبراصجثهط", 4); // ["و", "ر", "ث"]
```

The final chain table:

```typescript
const table = engine.expandChain(["و", "ر", "ث", "ب", "ط", "ا"]);

table.rows[0]; // ["و", "ر", "ث", "ب", "ط", "ا"]
table.rows[1]; // ["ر", "و", "ط", "ع", "ث", "س"]   — the standard mirrors
table.rows[2]; // ["س", "ب", "ه", "ك", "ص", "ي"]   — the first chain letter
table.rows[3]; // ["خ", "ك", "ن", "ر", "ظ", "ق"]
table.rows[4]; // [undefined, undefined, undefined, undefined, undefined, "غ"]

engine.links.getChain("و"); // ["س", "خ"] — the rest of و's row
engine.links.getRow("ا");   // ["ا", "ي", "ق", "غ"]
```

A cell a chain does not reach is `undefined` — an empty cell, never a placeholder.

In the interactive session the same report is available as `/transfer [source] [target]`.

---

## Web interface

A React interface for the whole engine lives in `web/`.

```bash
npm run web:install   # once — installs the app's own dependencies
npm run web:dev       # http://localhost:5173
npm run web:build     # production bundle in web/dist
```

The app imports the library **source** through a Vite alias, so changes to the engine show
up in the browser immediately — no rebuild in between. That works because the library uses
no Node APIs; the same code runs in the terminal, in the browser and in a future REST layer.

```text
web/
├── index.html
├── vite.config.ts      # alias → ../src/index.ts
└── src/
    ├── main.tsx
    ├── App.tsx         # shell: input, alphabet picker, tabs
    ├── lib/engine.ts   # the shared engine instance
    ├── components/     # one panel per feature
    └── styles.css
```

Five sections, all driven by the same engine:

| Section | What it shows |
| --- | --- |
| نقل القيم | the value-transfer report, step by step |
| الحساب | total, per-word values, per-character values, mirrors and positions |
| المرايا | the mirrored text in both systems, and the round-trip check |
| التحليل | frequencies, distinct characters, duplicate removal |
| الأنظمة | the letters, values and mirrors of a registered system |

The tables are laid out right-to-left with a fixed column grid, so a value lines up under
the letter it belongs to **across** tables — the same alignment the console report has.

---

## Extending

**Register another system** — no existing class needs to change:

```typescript
engine.register({
  name: "abgata",
  values: [["ا", 1], ["ب", 3], ["ج", 3], ["د", 3]],
  mirrors: [["ب", "ج"]]
});

engine.calculate("ابج", "abgata"); // 7
engine.mirror("ابج", "abgata");   // "اجب"
```

Invalid data fails fast and loudly:

```typescript
engine.register({ name: "broken", values: [["ا", 1], ["ا", 2]], mirrors: [] });
// AlphabetError: Alphabet "broken": duplicate value entry for "ا".
```

**Add capabilities without touching the core.** The processors are independent and stateless,
so a new concern (diacritics handling, numerical roots, JSON/CSV export, pipelines) is a new
class that consumes `TextProcessor` / `AbjadCalculator` / `MirrorProcessor` — for example a
`withDiacritics` pipeline or a `toCsv(analysis: TextAnalysis)` exporter. Normalisation and
grapheme segmentation are deliberately *not* implemented, but `utils/unicode.ts` already
exposes `toCharacters`, `isArabicLetter` and `isDiacritic` so such an option can be added as
an input parameter rather than a rewrite. UI layers (web, REST, desktop) should depend on the
package and never re-implement the tables.

---

## Testing

```bash
npm test
```

The suite (281 tests) verifies the **original data**, not the implementation: the expected
value and mirror tables are written out literally inside the test files, so a wrong mapping
in `src/data/*` fails the tests. Covered:

1. all 28 standard values, in order, with positions
2. all 28 custom values, in order, with positions
3. every mirror pair in both directions, in both systems
4. double-mirroring restoration
5. English and Arabic duplicate removal, including `abbccdefffa` → `abcdef`
6. empty strings, whitespace and punctuation
7. unknown characters and non-Arabic input
8. alphabet registration, duplicate registration and invalid definitions
9. conflicting, self-referencing and unknown mirror declarations
10. immutability of the source tables and of every lookup structure
11. correct, non-substituted handling of `ى` versus `ي`
12. the reference input `"بسم الله الرحمن الرحيم"` = **786** in the standard system
    (102 + 66 + 329 + 289) and 1260 in the custom system
13. bidirectional helpers: direction detection, isolation, bidi-mark stripping
14. visual-order conversion, including round-trips and mixed Latin/Arabic runs
15. every interactive command, its output, and the table renderer in both directions
16. the value transfer: characters, values, matched letters, mirrors in both systems,
    the interleaved mirror row, and the column alignment of the report
17. the 4-7-9 counting rule, and the standard mirror of what it finds
18. the link table, its chains, and the final table with its empty cells

---

## License

MIT