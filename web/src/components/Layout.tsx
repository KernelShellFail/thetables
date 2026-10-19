import type { ReactNode } from "react";
import { CopyButton } from "./CopyButton";

/** A numbered step of the value-transfer report. */
export function Step({
  number,
  title,
  copyText,
  children
}: {
  readonly number: number;
  readonly title: string;
  /** When given, the step offers a button that copies this text. */
  readonly copyText?: string;
  readonly children: ReactNode;
}) {
  return (
    <section className="step">
      <header className="step__head">
        <span className="step__number">{number}</span>
        <h3 className="step__title">{title}</h3>
        {copyText === undefined ? null : (
          <CopyButton text={copyText} title={`نسخ: ${title}`} />
        )}
      </header>
      <div className="step__body">{children}</div>
    </section>
  );
}

/** A panel with a title, used for the tabbed sections. */
export function Panel({
  title,
  hint,
  copyText,
  children
}: {
  readonly title: string;
  readonly hint?: string;
  /** When given, the panel offers a button that copies this text. */
  readonly copyText?: string;
  readonly children: ReactNode;
}) {
  return (
    <section className="panel">
      <header className="panel__head">
        <div>
          <h2 className="panel__title">{title}</h2>
          {hint !== undefined ? <p className="panel__hint">{hint}</p> : null}
        </div>
        {copyText === undefined ? null : (
          <CopyButton text={copyText} title={`نسخ: ${title}`} />
        )}
      </header>
      {children}
    </section>
  );
}

/** A label/value pair. */
export function Stat({
  label,
  value
}: {
  readonly label: string;
  readonly value: ReactNode;
}) {
  return (
    <div className="stat">
      <span className="stat__label">{label}</span>
      <span className="stat__value">{value}</span>
    </div>
  );
}

/** A table whose first column sits on the right. */
export function Grid({
  head,
  rows,
  className
}: {
  readonly head?: readonly string[];
  readonly rows: readonly (readonly ReactNode[])[];
  /** Extra class names, e.g. `grid--fixed` for tables that must line up. */
  readonly className?: string;
}) {
  return (
    <div className="grid-wrap">
      <table className={className === undefined ? "grid" : `grid ${className}`} dir="rtl">
        {head !== undefined ? (
          <thead>
            <tr>
              {head.map((cell) => (
                <th key={cell}>{cell}</th>
              ))}
            </tr>
          </thead>
        ) : null}
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {row.map((cell, cellIndex) => (
                <td key={cellIndex}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
