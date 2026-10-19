import { engine } from "../lib/engine";
import { alignedText, sections } from "../lib/format";
import { Grid, Panel, Stat } from "./Layout";

/** Frequencies, distinct characters and duplicate removal. */
export function AnalysisPanel({
  text,
  alphabet
}: {
  readonly text: string;
  readonly alphabet: string;
}) {
  const frequencies = engine.frequencies(text);
  const unique = engine.uniqueCharacters(text);
  const duplicates = engine.removeDuplicatesDetailed(text);
  const removed = Array.from(
    duplicates.removedCharacters,
    ([character, count]) => `${character === " " ? "␣" : character}×${count}`
  ).join("  ");

  const copyText = sections(
    [
      `عدد الأحرف: ${engine.countCharacters(text)}`,
      `أحرف فريدة: ${unique.length}`,
      `المحذوف: ${duplicates.removedCount}`
    ],
    frequencies.length === 0
      ? []
      : [
          "تكرار الأحرف:",
          alignedText(
            frequencies.map((entry) => [
              entry.character === " " ? "␣" : entry.character,
              String(entry.count),
              `${(entry.ratio * 100).toFixed(1)}%`
            ])
          )
        ],
    [
      "إزالة التكرار:",
      `المدخل: ${text}`,
      `الناتج: ${duplicates.result}`,
      `المحذوف: ${removed || "لا يوجد"}`
    ]
  );

  return (
    <Panel
      title="التحليل"
      hint={`تكرار الأحرف وإزالة التكرار في نظام ${alphabet}.`}
      copyText={copyText}
    >
      <div className="stats">
        <Stat label="عدد الأحرف" value={<span className="num">{engine.countCharacters(text)}</span>} />
        <Stat label="أحرف فريدة" value={<span className="num">{unique.length}</span>} />
        <Stat label="المحذوف" value={<span className="num">{duplicates.removedCount}</span>} />
        <Stat label="نسبة التكرار" value={<span className="num">{percent(duplicates.removedCount, engine.countCharacters(text))}</span>} />
      </div>

      <h4 className="sub">تكرار الأحرف</h4>
      {frequencies.length === 0 ? (
        <p className="note">لا يوجد نص.</p>
      ) : (
        <Grid
          head={["الحرف", "العدد", "النسبة"]}
          rows={frequencies.map((entry) => [
            <span key="c" className="letter">
              {entry.character === " " ? "␣" : entry.character}
            </span>,
            <span key="n" className="num">
              {entry.count}
            </span>,
            <span key="r" className="num">
              {(entry.ratio * 100).toFixed(1)}%
            </span>
          ])}
        />
      )}

      <h4 className="sub">إزالة التكرار</h4>
      <div className="compare">
        <div className="compare__side">
          <span className="compare__label">المدخل</span>
          <p className="arabic" dir="rtl">
            {text || "—"}
          </p>
        </div>
        <div className="compare__side compare__side--result">
          <span className="compare__label">الناتج</span>
          <p className="arabic" dir="rtl">
            {duplicates.result || "—"}
          </p>
        </div>
      </div>
      <p className="note">المحذوف: {removed || "لا يوجد"}</p>
    </Panel>
  );
}

function percent(part: number, whole: number): string {
  if (whole === 0) return "0%";
  return `${((part / whole) * 100).toFixed(1)}%`;
}
