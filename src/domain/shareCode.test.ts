import { generateShareCode, isValidShareCode, normalizeShareCode } from './shareCode';

const AMBIGUOUS = ['0', 'O', '1', 'I', 'L', 'U'];

describe('generateShareCode', () => {
  it('produces the TGE-XXXX shape', () => {
    expect(generateShareCode()).toMatch(/^TGE-[A-Z0-9]{4}$/);
  });

  it('never emits a character a human would misread', () => {
    // 400 codes is 1600 characters — enough that a stray character in the
    // alphabet would show up rather than hide behind luck.
    const body = Array.from({ length: 400 }, () => generateShareCode().slice(4)).join('');
    for (const char of AMBIGUOUS) {
      expect(body).not.toContain(char);
    }
  });

  it('is driven entirely by the injected randomness', () => {
    expect(generateShareCode(() => 0)).toBe('TGE-2222');
  });

  it('does not run off the end of the alphabet when random returns 1', () => {
    // Math.random() excludes 1, but a supplied generator might not, and an
    // out-of-range index would append "undefined" to the code.
    expect(generateShareCode(() => 1)).toBe('TGE-ZZZZ');
  });

  it('produces a code that validates', () => {
    for (let i = 0; i < 50; i += 1) {
      expect(isValidShareCode(generateShareCode())).toBe(true);
    }
  });
});

describe('normalizeShareCode', () => {
  it('leaves a well-formed code alone', () => {
    expect(normalizeShareCode('TGE-4F9K')).toBe('TGE-4F9K');
  });

  it('accepts lower case', () => {
    expect(normalizeShareCode('tge-4f9k')).toBe('TGE-4F9K');
  });

  it('accepts the body without a prefix', () => {
    expect(normalizeShareCode('4F9K')).toBe('TGE-4F9K');
  });

  it('accepts a missing hyphen', () => {
    expect(normalizeShareCode('TGE4F9K')).toBe('TGE-4F9K');
  });

  it('absorbs whitespace from a sloppy copy-paste', () => {
    expect(normalizeShareCode('  TGE - 4F9K \n')).toBe('TGE-4F9K');
  });

  it('returns empty for input with nothing usable in it', () => {
    expect(normalizeShareCode('')).toBe('');
    expect(normalizeShareCode('---')).toBe('');
  });

  it('does not invent a prefix for a bare prefix', () => {
    expect(normalizeShareCode('TGE')).toBe('');
  });
});

describe('isValidShareCode', () => {
  it('accepts every form normalize accepts', () => {
    for (const input of ['TGE-4F9K', 'tge-4f9k', '4F9K', 'TGE4F9K', ' TGE - 4F9K ']) {
      expect(isValidShareCode(input)).toBe(true);
    }
  });

  it('rejects the wrong length', () => {
    expect(isValidShareCode('TGE-4F9')).toBe(false);
    expect(isValidShareCode('TGE-4F9KK')).toBe(false);
  });

  it('rejects characters the alphabet excludes', () => {
    // These are never generated, so a typed one is a real mistake. Guessing
    // which character was meant could resolve to somebody else's board.
    for (const char of AMBIGUOUS) {
      expect(isValidShareCode(`TGE-${char}F9K`)).toBe(false);
    }
  });

  it('rejects empty and junk', () => {
    expect(isValidShareCode('')).toBe(false);
    expect(isValidShareCode('hello')).toBe(false);
  });
});
