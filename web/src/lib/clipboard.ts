/**
 * Copying to the clipboard.
 *
 * The async Clipboard API needs a secure context, which `localhost` is but a
 * plain-HTTP address on the network is not — so there is a fallback for that
 * case, and a visible failure when neither works.
 */

/** Writes text to the clipboard. Returns `false` when the copy did not happen. */
export async function copyToClipboard(text: string): Promise<boolean> {
  if (typeof navigator !== "undefined" && navigator.clipboard !== undefined) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Permission denied or an insecure context: try the legacy path.
    }
  }

  if (typeof document === "undefined") return false;

  try {
    const area = document.createElement("textarea");
    area.value = text;
    area.setAttribute("readonly", "");
    area.style.position = "fixed";
    area.style.top = "-1000px";
    area.style.opacity = "0";
    document.body.appendChild(area);
    area.select();
    const copied = document.execCommand("copy");
    document.body.removeChild(area);
    return copied;
  } catch {
    return false;
  }
}
