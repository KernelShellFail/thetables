import { engine } from "../lib/engine";
import { Panel, Stat } from "./Layout";

/** Mirroring in both supplied systems, plus the round-trip check. */
export function MirrorPanel({
  text,
  alphabet
}: {
  readonly text: string;
  readonly alphabet: string;
}) {
  const mirrored = engine.mirror(text, alphabet);
  const restored = engine.mirror(mirrored, alphabet) === text;
  const other = alphabet === "standard" ? "custom" : "standard";

  return (
    <Panel
      title="المرايا"
      hint="الحروف التي لا مرآة لها تبقى كما هي، والمسافات وعلامات التشكيل لا تتغير."
    >
      <div className="compare">
        <div className="compare__side">
          <span className="compare__label">المدخل</span>
          <p className="arabic" dir="rtl">
            {text || "—"}
          </p>
        </div>
        <div className="compare__side compare__side--result">
          <span className="compare__label">المخرَج ({alphabet})</span>
          <p className="arabic" dir="rtl">
            {mirrored || "—"}
          </p>
        </div>
      </div>

      <div className="stats">
        <Stat
          label={`مخرج ${other}`}
          value={<span className="arabic">{engine.mirror(text, other)}</span>}
        />
        <Stat
          label="المرآة تعيد الأصل"
          value={<span className="num">{restored ? "نعم" : "لا"}</span>}
        />
      </div>
    </Panel>
  );
}
