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

  /**
   * The rules in the block, as selector -> declarations.
   *
   * Parsing rather than substring-matching, because "the name appears in the
   * block" is what let a *wrong* rule count as handled (M5): U7 applied
   * `translate(-50%, -50%) scale(1.18)` to five selectors when it was correct
   * for one, and a `block.includes(className)` check was satisfied by all
   * five.
   */
  const rules = (): { selectors: string[]; body: string }[] => {
    const block = reducedMotionBlock();
    // Comments stripped first, or a `/* ... */` before a rule is captured as
    // part of its selector list and the selector is never found.
    const inner = block
      .slice(block.indexOf('{') + 1, block.lastIndexOf('}'))
      .replace(/\/\*[\s\S]*?\*\//g, '');
    const out: { selectors: string[]; body: string }[] = [];
    const re = /([^{}]+)\{([^{}]*)\}/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(inner)) !== null) {
      const selectors = m[1]!.split(',').map(t => t.trim()).filter(Boolean);
      out.push({ selectors, body: m[2]!.trim() });
    }
    return out;
  };

  const ruleFor = (selector: string) =>
    rules().find(r => r.selectors.includes(selector));

  /**
   * Classes whose animation the stylesheet drives, and what "stopped" means
   * for each. Stated per class rather than assumed uniform: an animation is
   * held at the state it would have ended in, and that state is a property of
   * the individual animation.
   */
  const HANDLED: { selector: string; mustContain: string[]; mustNotContain?: string[] }[] = [
    // Held visible rather than mid-blink.
    { selector: '.animate-blink', mustContain: ['animation: none', 'opacity: 1'] },
    // The bright stop of `chassis-throb`, which includes the centre translate
    // the element is positioned with. The ONLY selector for which that
    // translate is correct.
    {
      selector: '.chassis-glow',
      mustContain: ['animation: none', 'opacity: 0.8', 'translate(-50%, -50%)', 'scale(1.18)'],
    },
    // Parked at the start of the scroll, not frozen mid-slide.
    {
      selector: '.terminal-marquee',
      mustContain: ['animation: none', 'translateX(0)'],
    },
    // Arrives in place.
    { selector: '.animate-in.slide-in-from-top-2', mustContain: ['animation: none'] },
  ];

  it('handles every animation class the stylesheet drives', () => {
    const missing = HANDLED.map(h => h.selector).filter(sel => !ruleFor(sel));
    expect(missing, `not handled under reduced motion: ${missing.join(', ')}`).toEqual([]);
  });

  it('holds each animation at its own end state, not at a shared one', () => {
    // The M5 assertion. A rule that merely mentions the class is not enough:
    // it has to say the right thing for THAT animation.
    for (const h of HANDLED) {
      const rule = ruleFor(h.selector)!;
      for (const decl of h.mustContain) {
        expect(
          rule.body.replace(/\s+/g, ' '),
          `${h.selector}'s reduced-motion rule is missing "${decl}"`,
        ).toContain(decl);
      }
      for (const decl of h.mustNotContain ?? []) {
        expect(rule.body, `${h.selector}'s rule must not contain "${decl}"`).not.toContain(decl);
      }
    }
  });

  it('never applies a centre translate to a selector that is not centred', () => {
    // The exact defect: `translate(-50%, -50%)` is part of `chassis-throb`'s
    // own keyframes and belongs only to the element positioned with it.
    // Anything else picking it up is displaced by half its own size.
    const CENTRED = ['.chassis-glow'];
    for (const rule of rules()) {
      if (!rule.body.includes('translate(-50%')) continue;
      const wrong = rule.selectors.filter(sel => !CENTRED.includes(sel));
      expect(
        wrong,
        `these are not centre-positioned and must not be given a centre translate: ${wrong.join(', ')}`,
      ).toEqual([]);
    }
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
    // Four fewer than U7 recorded: `lcd-pulse` and the three `dot-pulse-*`
    // were the pre-skin lamp glows with their colours baked into the
    // keyframes, superseded by `chassis-throb` and referenced by nothing.
    // Deleted in M5 rather than given a second, correct reduced-motion rule.
    expect(keyframeNames().sort()).toEqual([
      'blink',
      'chassis-throb',
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
