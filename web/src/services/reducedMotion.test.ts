import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

/**
 * Every animation can be switched off (U7).
 *
 * `index.css` carried eight `@keyframes`, seven of them `infinite`, and not
 * one `@media (prefers-reduced-motion: reduce)` rule — while CLAUDE.md's craft
 * rules name that media query explicitly. Two of the eight were worse than
 * merely unhandled: the orb halo and the three lamp haloes were declared as
 * inline `animation:` in `DeviceLayout`, where no selector of any kind can
 * reach them, so the two most prominent moving things on the device were the
 * two that could not be turned off at all.
 *
 * This suite reads the CSS and the components as text, because that is where
 * the defect lived. jsdom does not evaluate media queries against a
 * preference, so a render test could assert nothing here; a stylesheet that
 * *contains no rule* is exactly what needs catching, and text is the honest
 * way to catch it.
 */

const WEB_ROOT = path.resolve(__dirname, '../..');
const css = fs.readFileSync(path.join(WEB_ROOT, 'index.css'), 'utf8');

/** Every `@keyframes NAME` declared in the stylesheet. */
const keyframeNames = (): string[] =>
  [...css.matchAll(/@keyframes\s+([\w-]+)/g)].map(m => m[1]!);

/** The body of the reduced-motion media query. */
const reducedMotionBlock = (): string => {
  const start = css.indexOf('@media (prefers-reduced-motion: reduce)');
  expect(start, 'index.css has no prefers-reduced-motion rule at all').toBeGreaterThan(-1);
  // Balance braces from the query's own opening brace.
  let depth = 0;
  let i = css.indexOf('{', start);
  const from = i;
  for (; i < css.length; i += 1) {
    if (css[i] === '{') depth += 1;
    else if (css[i] === '}') {
      depth -= 1;
      if (depth === 0) return css.slice(from, i + 1);
    }
  }
  throw new Error('unbalanced braces in the reduced-motion block');
};

describe('reduced motion', () => {
  it('declares a prefers-reduced-motion block', () => {
    expect(reducedMotionBlock().length).toBeGreaterThan(100);
  });

  it('names every animation class the stylesheet drives', () => {
    // Not "some rule exists" — each animated class has to be accounted for,
    // so adding a ninth keyframe and forgetting it fails here.
    const block = reducedMotionBlock();
    const drivenClasses = [
      'animate-blink',
      'lcd-pulse',
      'dot-pulse-red',
      'dot-pulse-yellow',
      'dot-pulse-green',
      'chassis-glow',
      'slide-in-from-top-2',
      'terminal-marquee',
    ];
    const missing = drivenClasses.filter(c => !block.includes(c));
    expect(missing, `not handled under reduced motion: ${missing.join(', ')}`).toEqual([]);
  });

  it('carries a catch-all so a future animation is covered by default', () => {
    const block = reducedMotionBlock();
    expect(block).toMatch(/animation-duration:\s*0\.01ms\s*!important/);
    expect(block).toMatch(/transition-duration:\s*0\.01ms\s*!important/);
    // Not zero: a `transitionend` listener still has to fire.
    expect(block).not.toMatch(/animation-duration:\s*0s\s*!important/);
  });

  it('has a rule for every keyframe it declares', () => {
    // The keyframe names themselves need no rule — the *classes* that use them
    // do — but a keyframe with no class at all is dead CSS, and a keyframe
    // whose class is missing above is the real hazard. This asserts the count
    // is what the block was written against, so a new one is a red test.
    expect(keyframeNames().sort()).toEqual([
      'blink',
      'chassis-throb',
      'dot-pulse-green',
      'dot-pulse-red',
      'dot-pulse-yellow',
      'lcd-pulse',
      'slide-in-from-top',
      'terminal-marquee',
    ]);
  });

  it('leaves no inline animation beyond the reach of a selector', () => {
    // The orb and lamp haloes were `style={{ animation: ... }}`, which no
    // media query can override. Any inline `animation:` in a component is the
    // same hole reopening.
    const offenders: string[] = [];
    const walk = (dir: string) => {
      for (const name of fs.readdirSync(dir)) {
        if (name === 'node_modules' || name === 'e2e' || name.startsWith('.')) continue;
        const full = path.join(dir, name);
        if (fs.statSync(full).isDirectory()) { walk(full); continue; }
        if (!/\.tsx$/.test(name) || name.includes('.test.')) continue;
        const src = fs.readFileSync(full, 'utf8');
        for (const m of src.matchAll(/\banimation:\s*[`'"]/g)) {
          const line = src.slice(0, m.index).split('\n').pop() ?? '';
          if (/^\s*(\*|\/\/)/.test(line)) continue;
          offenders.push(path.relative(WEB_ROOT, full));
        }
      }
    };
    walk(WEB_ROOT);
    expect(
      [...new Set(offenders)],
      'inline `animation:` cannot be switched off by the reduced-motion query — use a class '
      + 'and a CSS custom property for whatever varies, as `.chassis-glow` does',
    ).toEqual([]);
  });
});
