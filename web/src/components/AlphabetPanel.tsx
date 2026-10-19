import { engine } from "../lib/engine";
import { alignedText, sections } from "../lib/format";
import { Grid, Panel, Stat } from "./Layout";

/** The registered systems: their letters, values and mirrors. */
export function AlphabetPanel({
  alphabet
}: {
  readonly alphabet: string;
}) {
  const info = engine.describeAlphabet(alphabet);

  const copyText = sections(
    [
      `نظام ${info.name}`,
      `عدد الأحرف: ${info.size}`,
      `أزواج المرايا: ${info.mirroredLetters.length / 2}`
    ],
    [
      "الأحرف والقيم:",
      alignedText([
        info.entries.map(([letter]) => letter),
        info.entries.map(([, value]) => String(value))
      ])
    ],
    [
      "المرايا:",
      alignedText([
        info.mirroredLetters.map((letter) => letter),
        info.mirroredLetters.map((letter) => info.mirrors.get(letter) ?? "—")
      ])
    ]
  );

  return (
    <Panel
      title={`نظام ${info.name}`}
      hint="الأحرف والقيم كما وردت في البيانات الأصلية — دون أي تغيير."
      copyText={copyText}
    >
      <div className="stats">
        <Stat label="عدد الأحرف" value={<span className="num">{info.size}</span>} />
        <Stat
          label="أزواج المرايا"
          value={<span className="num">{info.mirroredLetters.length / 2}</span>}
        />
        <Stat
          label="بلا مرآة"
          value={<span className="num">{info.unmirroredLetters.length}</span>}
        />
      </div>

      <h4 className="sub">الأحرف والقيم</h4>
      <Grid
        head={["الحرف", "القيمة"]}
        rows={[
          info.entries.map(([letter]) => (
            <span key={`l${letter}`} className="letter">
              {letter}
            </span>
          )),
          info.entries.map(([letter, value]) => (
            <span key={`v${letter}`} className="num">
              {value}
            </span>
          ))
        ]}
      />

      <h4 className="sub">المرايا</h4>
      <Grid
        head={["الحرف", "مرآته", "الاتجاه"]}
        rows={[
          info.mirroredLetters.map((letter) => (
            <span key={`m${letter}`} className="letter">
              {letter}
            </span>
          )),
          info.mirroredLetters.map((letter) => (
            <span key={`t${letter}`} className="letter">
              {info.mirrors.get(letter) ?? "—"}
            </span>
          )),
          info.mirroredLetters.map((letter) => (
            <span key={`d${letter}`} className="arrow">
              ⟷
            </span>
          ))
        ]}
      />

    </Panel>
  );
}
