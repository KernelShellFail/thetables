import type { LinkTableConfig } from "../types/index.js";

/**
 * The link table: every letter of the standard alphabet exactly once, arranged
 * in nine rows.
 *
 * A letter's row is the chain it belongs to. Reading a row from left to right
 * gives the chain of each of its letters — the first letter of the row
 * continues with the rest of the row, the last letter continues with the row
 * from its beginning.
 *
 * Row 1 is the only one with four letters, so a chain can be three long
 * there; every other row holds three letters, so their chains are two long.
 */
export const linkRows: ReadonlyArray<ReadonlyArray<string>> = Object.freeze([
  Object.freeze(["ا", "ي", "ق", "غ"]),
  Object.freeze(["ب", "ك", "ر"]),
  Object.freeze(["ج", "ل", "ش"]),
  Object.freeze(["د", "م", "ت"]),
  Object.freeze(["ه", "ن", "ث"]),
  Object.freeze(["و", "س", "خ"]),
  Object.freeze(["ز", "ع", "ذ"]),
  Object.freeze(["ح", "ف", "ض"]),
  Object.freeze(["ط", "ص", "ظ"])
]);

/** Ready-to-use configuration for the link table. */
export const LINK_TABLE: LinkTableConfig = Object.freeze({
  name: "links",
  rows: linkRows
});