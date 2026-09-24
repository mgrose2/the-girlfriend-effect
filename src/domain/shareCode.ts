/**
 * Share codes. A stylist reads one off her screen and puts it in a text
 * message; her partner types it back into the app. Every decision here is
 * about surviving that round trip.
 */

/**
 * Deliberately missing 0/O, 1/I/L and U. The first two groups are the classic
 * misreads; dropping U as well keeps the generator from spelling a real word
 * by accident, which matters when the code is going out in a text.
 */
const ALPHABET = '23456789ABCDEFGHJKMNPQRSTVWXYZ';

const CODE_LENGTH = 4;
const PREFIX = 'TGE';

/** e.g. `TGE-4F9K`. */
export function generateShareCode(random: () => number = Math.random): string {
  let body = '';
  for (let i = 0; i < CODE_LENGTH; i += 1) {
    // Clamp rather than trust the generator: Math.random() is exclusive of 1,
    // but an injected one might not be, and an out-of-range index would append
    // "undefined" to the code.
    const index = Math.min(Math.floor(random() * ALPHABET.length), ALPHABET.length - 1);
    body += ALPHABET[Math.max(index, 0)];
  }
  return `${PREFIX}-${body}`;
}

/**
 * Canonical form of whatever the recipient typed: absorbs lower case, spaces
 * from a sloppy copy-paste, missing or doubled hyphens, and a prefix they may
 * or may not have included.
 *
 * It deliberately does *not* "correct" lookalike characters. Since 0, O, 1, I,
 * L and U never appear in a generated code, a typed one is a genuine mistake —
 * and guessing which real character was meant could silently resolve to
 * somebody else's board. Better to reject and let them retype.
 */
export function normalizeShareCode(input: string): string {
  const body = input
    .toUpperCase()
    .replace(/[^0-9A-Z]/g, '')
    .replace(new RegExp(`^${PREFIX}`), '');

  return body.length === 0 ? '' : `${PREFIX}-${body}`;
}

export function isValidShareCode(input: string): boolean {
  return new RegExp(`^${PREFIX}-[${ALPHABET}]{${CODE_LENGTH}}$`).test(
    normalizeShareCode(input),
  );
}
