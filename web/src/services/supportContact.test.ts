import { describe, expect, it } from 'vitest';
import { SUPPORT_ADDRESS, supportMailtoURL, supportSubject } from './supportContact';

/** Ported from `vinodex-ios/Tests/VinodexCoreTests/SupportContactTests.swift`. */
describe('support contact', () => {
  it('the address is a plausible address with no stray whitespace', () => {
    expect(SUPPORT_ADDRESS).toBe(SUPPORT_ADDRESS.trim());
    expect(SUPPORT_ADDRESS).toMatch(/^[^@\s]+@[^@\s]+\.[^@\s]+$/);
  });

  it('the subject carries the version', () => {
    expect(supportSubject('v0.1.0')).toBe('Vinodex v0.1.0');
  });

  it('the mailto URL encodes the subject rather than breaking on the space', () => {
    const url = supportMailtoURL('v0.1.0');
    expect(url).toBe(`mailto:${SUPPORT_ADDRESS}?subject=Vinodex%20v0.1.0`);
    expect(url).not.toContain(' ');
  });
});
