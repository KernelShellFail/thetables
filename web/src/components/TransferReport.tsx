import { engine } from "../lib/engine";
import { Grid, Step } from "./Layout";

/**
 * The value-transfer report: the text, its distinct characters, their value in
 * the source system, the matching letters of the target system, and the mirrors
 * of the result in both supplied systems.
 *
 * Every grid is laid out right-to-left, so the first column of a table sits on
 * the right. All tables share one fixed column grid, which is what makes a
 * value line up under the letter it belongs to — across tables, not just
 * inside one of them.
 */
export function TransferReport({ text }: { readonly text: string }) {
  const result = engine.transferValues(text, "standard", "custom");
  const targetText = result.targets.join(" ");
  const pair = engine.mirrorPair(targetText);

  return (
    <div className="stack">
      <Step number={1} title="المدخل">
        <p className="arabic" dir="rtl">
          {result.input || "—"}
        </p>
      </Step>

      <Step number={2} title="الحروف الفريدة (بلا مسافات ولا تكرار)">
        <Grid
          className="grid--fixed"
          rows={[result.characters.map((character) => character)]}
        />
      </Step>

      <Step number={3} title={`القيم في نظام ${result.source}`}>
        <Grid
          className="grid--fixed"
          rows={[
            result.characters.map((character) => character),
            result.values.map((value) => (
              <span className="num">{value ?? "—"}</span>
            ))
          ]}
        />
      </Step>

      <Step number={4} title={`الحروف المقابلة في نظام ${result.target}`}>
        <Grid
          className="grid--fixed"
          rows={[
            result.characters.map((character) => character),
            result.values.map((value) => (
              <span className="num">{value ?? "—"}</span>
            )),
            result.targets.map((target) => (
              <span className="letter">{target ?? "—"}</span>
            ))
          ]}
        />
      </Step>

      <Step number={5} title="مرايا الناتج">
        <div className="stack">
          <div>
            <p className="sub tag-line">
              <span className="tag">{pair.first}</span>
            </p>
            <Grid
              className="grid--fixed"
              rows={[
                pair.firstLetters.map((mirror) => (
                  <span className="letter">{mirror}</span>
                ))
              ]}
            />
          </div>
          <div>
            <p className="sub tag-line">
              <span className="tag">{pair.second}</span>
            </p>
            <Grid
              className="grid--fixed"
              rows={[
                pair.secondLetters.map((mirror) => (
                  <span className="letter">{mirror}</span>
                ))
              ]}
            />
          </div>
        </div>
        <p className="note">
          المرآة ثنائية الاتجاه: تطبيقها مرتين يعيد النص الأصلي.
        </p>
      </Step>

      <Step number={6} title="الدمج (تتناوب بين المرآتين)">
        <Grid
          className="grid--fixed grid--compact"
          rows={[
            pair.merged.map((letter) => <span className="letter">{letter}</span>)
          ]}
        />
        <p className="note">
          حرف من مرآة {pair.first} ثم حرف من مرآة {pair.second}، بالترتيب.
        </p>
      </Step>
    </div>
  );
}
