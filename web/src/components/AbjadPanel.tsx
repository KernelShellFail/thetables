import { engine } from "../lib/engine";
import { alignedText, sections } from "../lib/format";
import { Grid, Panel, Stat } from "./Layout";

/** Abjad totals: the whole text, every word, and every character. */
export function AbjadPanel({
  text,
  alphabet
}: {
  readonly text: string;
  readonly alphabet: string;
}) {
  const total = engine.calculate(text, alphabet);
  const words = engine.calculateWords(text, alphabet);
  const characters = engine.breakdown(text, alphabet);
  const known = characters.filter((entry) => entry.value !== undefined).length;
  const system = engine.getAlphabet(alphabet);

  const copyText = sections(
    [`المجموع: ${total}`, `عدد الكلمات: ${words.length}`, `أحرف معروفة: ${known}`],
    words.length === 0
      ? []
      : [
          "قيم الكلمات:",
          alignedText(
            words.map((word) => [word.word, String(word.value)])
          )
        ],
    characters.length === 0
      ? []
      : [
          "قيم الأحرف:",
          alignedText([
            characters.map((entry) =>
              entry.character === " " ? "␣" : entry.character
            ),
            characters.map((entry) => String(entry.value ?? "—")),
            characters.map((entry) => system.getMirror(entry.character) ?? "—"),
            characters.map((entry) => String(system.getPosition(entry.character) ?? "—"))
          ])
        ]
  );

  return (
    <Panel
      title="الحساب"
      hint={`النظام: ${alphabet} — القيم المعروفة تُحتسب، وما عداها يُترك بلا أثر.`}
      copyText={copyText}
    >
      <div className="stats">
        <Stat label="المجموع" value={<span className="num big">{total}</span>} />
        <Stat label="عدد الكلمات" value={<span className="num">{words.length}</span>} />
        <Stat
          label="أحرف معروفة"
          value={<span className="num">{known}</span>}
        />
        <Stat
          label="كل الأحرف"
          value={<span className="num">{characters.length}</span>}
        />
      </div>

      <h4 className="sub">قيم الكلمات</h4>
      {words.length === 0 ? (
        <p className="note">لا يوجد نص.</p>
      ) : (
        <Grid
          head={["الكلمة", "القيمة", "الأحرف"]}
          rows={words.map((word) => [
            <span key="w" className="letter">
              {word.word}
            </span>,
            <span key="v" className="num">
              {word.value}
            </span>,
            <span key="c" className="breakdown">
              {word.characters
                .map((entry) => `${entry.character}:${entry.value ?? "–"}`)
                .join("  ")}
            </span>
          ])}
        />
      )}

      <h4 className="sub">قيم الأحرف</h4>
      <Grid
        head={["الحرف", "القيمة", "المرآة", "الموضع"]}
        rows={[
          characters.map((entry) => (
            <span key="c" className="letter">
              {entry.character === " " ? "␣" : entry.character}
            </span>
          )),
          characters.map((entry) => (
            <span key="v" className="num">
              {entry.value ?? "—"}
            </span>
          )),
          characters.map((entry) => (
            <span key="m" className="letter">
              {entry.character === " " ? "␣" : (system.getMirror(entry.character) ?? "—")}
            </span>
          )),
          characters.map((entry) => (
            <span key="p" className="num">
              {system.getPosition(entry.character) ?? "—"}
            </span>
          ))
        ]}
      />
    </Panel>
  );
}
