import { stripBidiControls } from "basit-arabic-engine";
import { renderAlignedTable } from "basit-arabic-engine/interactive";

/**
 * Text versions of the outputs, for the clipboard.
 *
 * The layout is the same as the one on screen, but the invisible directional
 * marks are removed: they only help the rendering, and a pasted text is
 * cleaner without them.
 */

/** Renders rows of cells as aligned, plain text. */
export function alignedText(rows: readonly (readonly string[])[]): string {
  const rendered = renderAlignedTable(
    rows.map((cells) => ({ cells: [...cells] }))
  );
  return rendered
    .map((row) => stripBidiControls(row).trimEnd())
    .join("\n");
}

/** Renders a single row of cells as plain text. */
export function rowText(cells: readonly string[]): string {
  return alignedText([cells]);
}

/** Joins non-empty lines with a blank line between them. */
export function sections(...blocks: readonly (readonly string[])[]): string {
  return blocks
    .map((block) => block.join("\n"))
    .filter((block) => block.trim().length > 0)
    .join("\n\n");
}
