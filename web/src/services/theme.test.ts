import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  applyTheme,
  nextSkin,
  readTheme,
  setLcdMode,
  setSkin,
  setTextScale,
  subscribeToTheme,
  CHASSIS_SKINS,
  ChassisSkinId,
  LCD_MODES,
  LcdModeId,
  TEXT_SCALES,
  TextScaleId,
} from './theme';

/**
 * `theme.ts` is a port of `DexTheme.swift` and had no suite — it is named in
 * IOS-PARITY.md as untested, and it has just gained two tokens from the iOS
 * audit pass (`onAccent`, `heroGrid`), which is a good moment to pin it.
 *
 * There is no Swift original to port from: `DexTheme` is exercised through the
 * UI on that side. So these cases are written against what the file promises —
 * that every mode defines every token, that the persisted vocabulary matches
 * Swift's raw values, and that applying a theme actually writes the variables
 * the stylesheet reads.
 */
const ALL_LCD_KEYS = [
  'screen', 'page', 'text', 'accent', 'bodyText', 'heroWash',
  'surface', 'surfaceEdge', 'subtext', 'well', 'disabledText',
  'onAccent', 'heroGrid',
] as const;

describe('theme', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  describe('token tables', () => {
    it('defines every LCD token in both modes', () => {
      for (const mode of Object.values(LCD_MODES)) {
        for (const key of ALL_LCD_KEYS) {
          expect(mode[key], `${mode.id} is missing ${key}`).toBeTruthy();
        }
      }
    });

    /**
     * The audit's M44: dark mode's accent is mint and white on it is ~1.8:1, so
     * it takes black; light mode's deep green takes white. The bug this guards
     * is a token that quietly becomes the same colour as the fill behind it.
     */
    it('gives onAccent a foreground that is not the accent itself', () => {
      expect(LCD_MODES.DARK.onAccent).toBe('#000000');
      expect(LCD_MODES.LIGHT.onAccent).toBe('#FFFFFF');
      for (const mode of Object.values(LCD_MODES)) {
        expect(mode.onAccent.toLowerCase()).not.toBe(mode.accent.toLowerCase());
      }
    });

    /** The audit's L29 — light mode lifts the hero grid toward the paper. */
    it('gives each mode its own hero grid shade', () => {
      expect(LCD_MODES.DARK.heroGrid).toBe('#14532d');
      expect(LCD_MODES.LIGHT.heroGrid).toBe('#1B6B3A');
      expect(LCD_MODES.DARK.heroGrid).not.toBe(LCD_MODES.LIGHT.heroGrid);
    });

    it('keys every table by its own id', () => {
      for (const [id, skin] of Object.entries(CHASSIS_SKINS)) expect(skin.id).toBe(id);
      for (const [id, mode] of Object.entries(LCD_MODES)) expect(mode.id).toBe(id);
      for (const [id, scale] of Object.entries(TEXT_SCALES)) expect(scale.id).toBe(id);
    });

    // Twenty-two since v6#19-geometry brought iOS's 0.8.9x shells across;
    // iOS ships the same twenty-two in `ChassisSkin`.
    it('ships twenty-two skins, nine screen modes and two text scales', () => {
      expect(Object.keys(CHASSIS_SKINS)).toHaveLength(22);
      expect(Object.keys(LCD_MODES)).toHaveLength(9);
      expect(Object.keys(TEXT_SCALES)).toHaveLength(2);
    });

    /**
     * Both steps sit at or below 1.0 — the retro face has no optical sizes and
     * the tile metrics are tuned to 1.0, so that is the ceiling.
     */
    it('keeps every text scale at or below 1.0', () => {
      for (const scale of Object.values(TEXT_SCALES)) {
        expect(scale.factor).toBeGreaterThan(0);
        expect(scale.factor).toBeLessThanOrEqual(1);
      }
    });
  });

  describe('persistence', () => {
    it('defaults before anything is chosen', () => {
      const theme = readTheme();
      expect(CHASSIS_SKINS[theme.skin]).toBeDefined();
      expect(LCD_MODES[theme.lcd]).toBeDefined();
      expect(TEXT_SCALES[theme.scale]).toBeDefined();
    });

    it.each([
      ['skin', setSkin, 'BURGUNDY' as ChassisSkinId, () => readTheme().skin],
      ['lcd', setLcdMode, 'LIGHT' as LcdModeId, () => readTheme().lcd],
      ['scale', setTextScale, 'LARGE' as TextScaleId, () => readTheme().scale],
    ])('round-trips the %s choice', (_label, set, value, read) => {
      (set as (v: string) => void)(value);
      expect(read()).toBe(value);
    });

    /**
     * The Swift raw values are the persisted vocabulary on purpose, so the two
     * apps could ever share a backup — and because renaming a case would
     * silently reset everyone's stored choice.
     */
    it('stores the Swift raw value, not an index', () => {
      setLcdMode('LIGHT');
      expect(window.localStorage.getItem('lcdMode')).toBe('LIGHT');
    });

    it('falls back to a default when storage holds something unknown', () => {
      window.localStorage.setItem('lcdMode', 'NOT_A_MODE');
      expect(LCD_MODES[readTheme().lcd]).toBeDefined();
    });

    it('cycles through every skin and returns to the start', () => {
      const first = readTheme().skin;
      const seen = new Set<string>([first]);
      for (let i = 0; i < Object.keys(CHASSIS_SKINS).length - 1; i++) {
        nextSkin();
        seen.add(readTheme().skin);
      }
      expect(seen.size).toBe(Object.keys(CHASSIS_SKINS).length);

      nextSkin();
      expect(readTheme().skin).toBe(first);
    });
  });

  describe('applyTheme', () => {
    it('writes every LCD variable the stylesheet reads', () => {
      setLcdMode('LIGHT');
      applyTheme();

      const root = document.documentElement.style;
      for (const name of [
        '--lcd-screen', '--lcd-page', '--lcd-text', '--lcd-accent', '--lcd-body-text',
        '--lcd-hero-wash', '--lcd-surface', '--lcd-surface-edge', '--lcd-subtext',
        '--lcd-well', '--lcd-disabled-text', '--lcd-on-accent', '--lcd-hero-grid',
      ]) {
        expect(root.getPropertyValue(name), `${name} was not written`).toBeTruthy();
      }
    });

    it('writes the values of the mode actually chosen', () => {
      setLcdMode('LIGHT');
      applyTheme();
      expect(document.documentElement.style.getPropertyValue('--lcd-on-accent')).toBe(
        LCD_MODES.LIGHT.onAccent,
      );

      setLcdMode('DARK');
      applyTheme();
      expect(document.documentElement.style.getPropertyValue('--lcd-on-accent')).toBe(
        LCD_MODES.DARK.onAccent,
      );
    });

    it('writes the chassis variables too', () => {
      applyTheme();
      const root = document.documentElement.style;
      expect(root.getPropertyValue('--chassis-body')).toBeTruthy();
      expect(root.getPropertyValue('--chassis-panel-edge')).toBeTruthy();
    });
  });

  it('notifies subscribers when a choice changes', () => {
    const seen = vi.fn();
    const unsubscribe = subscribeToTheme(seen);

    setLcdMode('LIGHT');
    expect(seen).toHaveBeenCalled();

    const before = seen.mock.calls.length;
    unsubscribe();
    setLcdMode('DARK');
    expect(seen.mock.calls.length).toBe(before);
  });
});

