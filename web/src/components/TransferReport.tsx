import { engine, RULE_STEPS } from "../lib/engine";
import { alignedText, rowText, sections } from "../lib/format";
import { CopyButton } from "./CopyButton";
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
  const rule = engine.countRule(pair.merged.join(" "), RULE_STEPS);
  const ruleMirror = engine.mirror(rule.letters.join(" "), "standard").split(" ");
  const chain = engine.expandChain(rule.letters);

  const mirrorRows = [
    [...pair.firstLetters, pair.first],
    [...pair.secondLetters, pair.second]
  ];
  const ruleRows = [
    ...rule.groups.map((group) => [String(group.step), ...group.letters]),
    ["", ...rule.letters]
  ];
  const chainRows = chain.rows.map((row) => row.map((cell) => cell ?? ""));

  const characters = [...result.characters];
  const values = result.values.map((value) =>
    value === undefined ? "—" : String(value)
  );
  const targets = result.targets.map((target) => target ?? "—");

  const reportText = sections(
    ["1 · المدخل", result.input],
    ["2 · الحروف الفريدة", rowText(characters)],
    [`3 · القيم في نظام ${result.source}`, alignedText([characters, values])],
    [
      `4 · الحروف المقابلة في نظام ${result.target}`,
      alignedText([characters, values, targets])
    ],
    ["5 · مرايا الناتج", alignedText(mirrorRows)],
    ["6 · الدمج", rowText(pair.merged)],
    ["7 · قاعدة ٤-٧-٩", alignedText(ruleRows)],
    ["8 · المرآة القياسية للمجموع", rowText(ruleMirror)],
    ["9 · الجدول النهائي", alignedText(chainRows)]
  );

  return (
    <div className="stack">
      <div className="report-bar">
        <span className="report-bar__label">التقرير الكامل</span>
        <CopyButton text={reportText} title="نسخ التقرير الكامل" />
      </div>

      <Step number={1} title="المدخل" copyText={result.input}>
        <p className="arabic" dir="rtl">
          {result.input || "—"}
        </p>
      </Step>

      <Step
        number={2}
        title="الحروف الفريدة (بلا مسافات ولا تكرار)"
        copyText={rowText(result.characters)}
      >
        <Grid
          className="grid--fixed"
          rows={[result.characters.map((character) => character)]}
        />
      </Step>

      <Step
        number={3}
        title={`القيم في نظام ${result.source}`}
        copyText={alignedText([
          result.characters,
          result.values.map((value) => (value === undefined ? "—" : String(value)))
        ])}
      >
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

      <Step
        number={4}
        title={`الحروف المقابلة في نظام ${result.target}`}
        copyText={alignedText([
          result.characters,
          result.values.map((value) => (value === undefined ? "—" : String(value))),
          result.targets.map((target) => target ?? "—")
        ])}
      >
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

      <Step number={5} title="مرايا الناتج" copyText={alignedText(mirrorRows)}>
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

      <Step
        number={6}
        title="الدمج (تتناوب بين المرآتين)"
        copyText={rowText(pair.merged)}
      >
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

      <Step
        number={7}
        title="قاعدة ٤-٧-٩ (العدّ من اليمين)"
        copyText={alignedText(ruleRows)}
      >
        <Grid
          className="grid--fixed"
          rows={[
            ...rule.groups.map((group) => [
              <span key="s" className="num strong">
                {group.step}
              </span>,
              ...group.letters.map((letter) => (
                <span key={letter} className="letter">
                  {letter}
                </span>
              ))
            ]),
            [
              <span key="gap" />,
              ...rule.letters.map((letter) => (
                <span key={letter} className="letter">
                  {letter}
                </span>
              ))
            ]
          ]}
        />
        <p className="note">
          العدّ من اليمين: الحرف الرابع والثامن والثاني عشر، ثم السابع والرابع
          عشر، ثم التاسع.
        </p>
      </Step>

      <Step
        number={8}
        title="المرآة القياسية للمجموع"
        copyText={rowText(ruleMirror)}
      >
        <Grid
          className="grid--fixed"
          rows={[
            [
              <span key="gap" />,
              ...ruleMirror.map((letter) => (
                <span key={letter} className="letter">
                  {letter}
                </span>
              ))
            ]
          ]}
        />
        <p className="note">مرآة نظام standard للمجموع: {rule.letters.join(" ")}</p>
      </Step>

      <Step
        number={9}
        title="الجدول النهائي (سلسلة الحروف)"
        copyText={alignedText(chainRows)}
      >
        <Grid
          className="grid--fixed"
          rows={chain.rows.map((row, rowIndex) => [
            <span key="gap" />,
            ...row.map((letter, columnIndex) => (
              <span
                key={`${rowIndex}-${columnIndex}`}
                className={letter === undefined ? "empty" : "letter"}
              >
                {letter ?? ""}
              </span>
            ))
          ])}
        />
        <p className="note">
          الصف الأول ناتج قاعدة ٤-٧-٩، والثاني مرآته، وما بعده سلسلة كل حرف في
          جدول الروابط. الخانات الفارغة تُترك فارغة.
        </p>
      </Step>
    </div>
  );
}
