import type { LinkTableConfig } from "../types/index.js";
import { toCodePoints } from "../utils/unicode.js";

/** Thrown when a link table is invalid or cannot be resolved. */
export class LinkTableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "LinkTableError";
  }
}

/**
 * An immutable table of letter chains.
 *
 * Every letter appears exactly once. The row a letter belongs to is its
 * chain: the other letters of that row, in the order they are written.
 */
export class LinkTable {
  readonly #name: string;
  readonly #rows: readonly (readonly string[])[];
  readonly #rowOf: ReadonlyMap<string, readonly string[]>;
  readonly #chainOf: ReadonlyMap<string, readonly string[]>;

  constructor(config: LinkTableConfig) {
    if (typeof config.name !== "string" || config.name.trim().length === 0) {
      throw new LinkTableError("Link table name must be a non-empty string.");
    }
    if (!Array.isArray(config.rows) || config.rows.length === 0) {
      throw new LinkTableError(
        `Link table "${config.name}" must declare at least one row.`
      );
    }

    const rows: (readonly string[])[] = [];
    const rowOf = new Map<string, readonly string[]>();
    const chainOf = new Map<string, readonly string[]>();
    const seen = new Set<string>();

    config.rows.forEach((row, rowIndex) => {
      if (!Array.isArray(row) || row.length === 0) {
        throw new LinkTableError(
          `Link table "${config.name}": row ${rowIndex} must not be empty.`
        );
      }

      const letters: string[] = [];
      row.forEach((candidate, columnIndex) => {
        if (typeof candidate !== "string" || candidate.length === 0) {
          throw new LinkTableError(
            `Link table "${config.name}": row ${rowIndex}, column ${columnIndex} must be a non-empty string.`
          );
        }
        if (toCodePoints(candidate).length !== 1) {
          throw new LinkTableError(
            `Link table "${config.name}": "${candidate}" must be exactly one Unicode code point.`
          );
        }
        if (seen.has(candidate)) {
          throw new LinkTableError(
            `Link table "${config.name}": "${candidate}" appears more than once.`
          );
        }
        seen.add(candidate);
        letters.push(candidate);
      });

      // The chain of a letter is its row without the letter itself, in the
      // order the row is written.
      for (const letter of letters) {
        rowOf.set(letter, Object.freeze([...letters]));
        chainOf.set(
          letter,
          Object.freeze(letters.filter((other) => other !== letter))
        );
      }
      rows.push(Object.freeze(letters));
    });

    this.#name = config.name;
    this.#rows = Object.freeze(rows);
    this.#rowOf = rowOf;
    this.#chainOf = chainOf;
  }

  /** Registry name of this table. */
  get name(): string {
    return this.#name;
  }

  /** Number of rows. */
  get rowCount(): number {
    return this.#rows.length;
  }

  /** Total number of letters. */
  get size(): number {
    return this.#chainOf.size;
  }

  /** The rows, in their original order. */
  get rows(): readonly (readonly string[])[] {
    return this.#rows;
  }

  /** The row a letter belongs to, or `undefined` when it is not in the table. */
  getRow(letter: string): readonly string[] | undefined {
    return this.#rowOf.get(letter);
  }

  /**
   * The chain of a letter: the other letters of its row, in the order they
   * are written. Empty for a letter that is not in the table.
   */
  getChain(letter: string): readonly string[] {
    return this.#chainOf.get(letter) ?? [];
  }
}
