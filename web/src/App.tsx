import { useMemo, useState } from "react";
import { ALPHABET_NAMES, EXAMPLE_TEXT, REFERENCE_TEXT } from "./lib/engine";
import { AbjadPanel } from "./components/AbjadPanel";
import { AlphabetPanel } from "./components/AlphabetPanel";
import { AnalysisPanel } from "./components/AnalysisPanel";
import { MirrorPanel } from "./components/MirrorPanel";
import { TransferReport } from "./components/TransferReport";

type TabId = "transfer" | "abjad" | "mirror" | "analysis" | "alphabets";

const TABS: ReadonlyArray<{ readonly id: TabId; readonly label: string }> = [
  { id: "transfer", label: "نقل القيم" },
  { id: "abjad", label: "الحساب" },
  { id: "mirror", label: "المرايا" },
  { id: "analysis", label: "التحليل" },
  { id: "alphabets", label: "الأنظمة" }
];

export default function App() {
  const [text, setText] = useState(EXAMPLE_TEXT);
  const [alphabet, setAlphabet] = useState<string>(ALPHABET_NAMES[0] ?? "standard");
  const [tab, setTab] = useState<TabId>("transfer");

  const trimmed = useMemo(() => text, [text]);

  return (
    <div className="app">
      <header className="masthead">
        <div>
          <h1 className="masthead__title">محرك البست العربي</h1>
          <p className="masthead__subtitle">
            حساب الأَبجد، المرايا، ونقل القيم بين الأنظمة
          </p>
        </div>
        <span className="masthead__badge" dir="ltr">
          basit-arabic-engine
        </span>
      </header>

      <section className="card composer">
        <div className="composer__field">
          <label className="label" htmlFor="text">
            النص
          </label>
          <textarea
            id="text"
            className="input input--text"
            dir="rtl"
            value={text}
            spellCheck={false}
            rows={2}
            onChange={(event) => setText(event.target.value)}
            placeholder="اكتب النص هنا…"
          />
        </div>

        <div className="composer__tools">
          <div className="segmented" role="tablist" aria-label="الأقسام">
            {TABS.map((entry) => (
              <button
                key={entry.id}
                type="button"
                role="tab"
                aria-selected={tab === entry.id}
                className={tab === entry.id ? "segmented__item is-active" : "segmented__item"}
                onClick={() => setTab(entry.id)}
              >
                {entry.label}
              </button>
            ))}
          </div>

          <div className="composer__actions">
            <label className="label" htmlFor="alphabet">
              النظام
            </label>
            <select
              id="alphabet"
              className="input"
              value={alphabet}
              onChange={(event) => setAlphabet(event.target.value)}
            >
              {ALPHABET_NAMES.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
            <button
              type="button"
              className="button"
              onClick={() => setText(EXAMPLE_TEXT)}
            >
              المثال
            </button>
            <button
              type="button"
              className="button"
              onClick={() => setText(REFERENCE_TEXT)}
            >
              الجملة المرجعية
            </button>
          </div>
        </div>
      </section>

      <main className="content">
        {tab === "transfer" ? <TransferReport text={trimmed} /> : null}
        {tab === "abjad" ? <AbjadPanel text={trimmed} alphabet={alphabet} /> : null}
        {tab === "mirror" ? <MirrorPanel text={trimmed} alphabet={alphabet} /> : null}
        {tab === "analysis" ? <AnalysisPanel text={trimmed} alphabet={alphabet} /> : null}
        {tab === "alphabets" ? <AlphabetPanel alphabet={alphabet} /> : null}
      </main>

      <footer className="footer">
        <p>
          النص يُحفظ بالترتيب المنطقي، والعرض من اليمين إلى اليسار — كل الأرقام
          والأحرف في كل جدول تتوافق عمودًا بعمود.
        </p>
      </footer>
    </div>
  );
}
