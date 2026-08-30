import { describe, expect, it } from 'vitest';
import { LCD_SECTIONS, SKIN_SECTIONS } from './pickerSections';
import { CHASSIS_SKINS, LCD_MODES } from './theme';

/** Each grouping is a partition: every id exactly once, none invented. */
describe('the picker sections', () => {
  it('partition the chassis skins', () => {
    const listed = SKIN_SECTIONS.flatMap(s => s.skins);
    expect([...listed].sort()).toEqual(Object.keys(CHASSIS_SKINS).sort());
    expect(new Set(listed).size).toBe(listed.length);
  });

  it('partition the screen modes', () => {
    const listed = LCD_SECTIONS.flatMap(s => s.modes);
    expect([...listed].sort()).toEqual(Object.keys(LCD_MODES).sort());
    expect(new Set(listed).size).toBe(listed.length);
  });
});
