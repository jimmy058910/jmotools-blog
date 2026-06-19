import { describe, it, expect } from 'vitest';
import { validateEmail, isHoneypotTripped, buildPayload } from './subscribe';

describe('subscribe helpers', () => {
  it('accepts a valid email', () => { expect(validateEmail('a@b.com')).toBe(true); });
  it('rejects malformed emails', () => {
    expect(validateEmail('nope')).toBe(false);
    expect(validateEmail('a@b')).toBe(false);
    expect(validateEmail(' ')).toBe(false);
  });
  it('flags a filled honeypot', () => {
    expect(isHoneypotTripped('bot')).toBe(true);
    expect(isHoneypotTripped('')).toBe(false);
  });
  it('builds the payload with source=blog and trims', () => {
    expect(buildPayload('  a@b.com ')).toEqual({ email: 'a@b.com', source: 'blog' });
  });
});
