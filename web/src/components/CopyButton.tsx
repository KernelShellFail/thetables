import { useCallback, useEffect, useRef, useState } from "react";
import { copyToClipboard } from "../lib/clipboard";

type CopyState = "idle" | "copied" | "failed";

/**
 * A button that puts a piece of text on the clipboard and says so.
 *
 * The state goes back to idle on its own, so the button never stays stuck
 * saying "copied".
 */
export function CopyButton({
  text,
  label = "نسخ",
  title
}: {
  readonly text: string;
  readonly label?: string;
  readonly title?: string;
}) {
  const [state, setState] = useState<CopyState>("idle");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timer.current !== null) clearTimeout(timer.current);
    };
  }, []);

  const copy = useCallback(() => {
    void copyToClipboard(text).then((ok) => {
      setState(ok ? "copied" : "failed");
      if (timer.current !== null) clearTimeout(timer.current);
      timer.current = setTimeout(() => setState("idle"), 1800);
    });
  }, [text]);

  const disabled = text.length === 0;

  return (
    <button
      type="button"
      className={`copy copy--${state}`}
      onClick={copy}
      disabled={disabled}
      title={title ?? "نسخ إلى الحافظة"}
      aria-label={title ?? "نسخ إلى الحافظة"}
    >
      {state === "copied" ? <CheckIcon /> : <CopyIcon />}
      <span className="copy__label">
        {state === "copied" ? "تم النسخ" : state === "failed" ? "تعذّر النسخ" : label}
      </span>
    </button>
  );
}

function CopyIcon() {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
      <rect x="9" y="9" width="11" height="11" rx="2" />
      <path d="M5 15V6a2 2 0 0 1 2-2h9" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
      <path d="m5 13 4 4L19 7" />
    </svg>
  );
}
