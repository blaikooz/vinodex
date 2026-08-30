import { test, expect, enterDex, seedDevice } from './fixtures';
import path from 'node:path';

/**
 * The WCAG AA sweep (Phase 6): axe-core over the representative screens, both
 * LCD modes, at the phone size. First pass is an audit -- it prints what it
 * finds; the assertion tightens to zero serious/critical once they are fixed.
 */
const AXE = path.resolve(process.cwd(), 'node_modules/axe-core/axe.min.js');

const SCREENS: [string, string][] = [
  ['/', 'landing'],
  ['/privacy', 'privacy'],
  ['/who-we-are', 'who-we-are'],
  ['/dex', 'menu'],
  ['/list/GRAPES', 'listing'],
  ['/detail/G001', 'detail'],
  ['/passport', 'passport'],
  ['/chip-filter', 'chip-filter'],
  ['/saved', 'collection'],
  ['/settings', 'settings'],
  ['/workshop', 'workshop'],
];

test.use({ viewport: { width: 390, height: 844 } });
test.setTimeout(240_000);

interface AxeViolation { id: string; impact: string; help: string; nodes: { target: string[] }[] }

test('axe-core WCAG A/AA sweep across the dex and the site', async ({ page }) => {
  const findings: Record<string, string[]> = {};
  for (const [mode] of [['DARK'], ['LIGHT']] as [string][]) {
    for (const [route, label] of SCREENS) {
      // Deterministic: the once-only popovers (the professor's arrival
      // bubble, the stamp-earned card) otherwise fire at whichever iteration
      // first crosses their trigger and hand the sweep a moving target mid
      // animation. Their inks sit on fixed stone-900 cards and are covered
      // by their own suites; the sweep audits the screens.
      await seedDevice(page, {
        lcdMode: mode,
        toolIntrosSeen: 'blindTasting,labelScan,wineExam,dailyChallenge,profVino,moonDial',
        triedEntryIDs: JSON.stringify(['G001']),
        vinoSilenced: 'true',
        passportSeenBadges: 'firstSip',
        passportSeenBadgesSeeded: 'true',
      });
      await enterDex(page, route);
      await page.waitForTimeout(700);
      const dismiss = page.getByText('TAP TO DISMISS');
      if (await dismiss.count()) await dismiss.first().click({ force: true }).catch(() => undefined);
      await page.addScriptTag({ path: AXE });
      const violations = await page.evaluate(async () => {
        const axe = (window as any).axe;
        const res = await axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa'] } });
        return res.violations as AxeViolation[];
      });
      for (const v of violations.filter(x => x.impact === 'serious' || x.impact === 'critical')) {
        const key = `${v.id} [${v.impact}] ${v.help}`;
        findings[key] = findings[key] ?? [];
        for (const n of v.nodes.slice(0, 3)) findings[key].push(`${label}/${mode}: ${n.target.join(' ')}`);
      }
    }
  }
  // The audit is a gate: a serious or critical WCAG A/AA violation on any of
  // these screens fails the build, with the offenders in the diff.
  expect(findings, JSON.stringify(findings, null, 1)).toEqual({});
});
