import { ArabicEngine } from "basit-arabic-engine";

/**
 * One engine for the whole interface. It is stateless apart from the
 * alphabet registry, so a single instance is enough.
 */
export const engine = new ArabicEngine();

/** The example from the specification. */
export const EXAMPLE_TEXT = "كعبه كهان هي";

/** The reference phrase used across the documentation. */
export const REFERENCE_TEXT = "بسم الله الرحمن الرحيم";

/** Names of the built-in systems, in registration order. */
export const ALPHABET_NAMES = engine.listAlphabetNames();
