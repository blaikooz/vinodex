import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { DEVICE_FRAME_BOX, DEVICE_FRAME_STAGE, DEVICE_FRAME_OVERLAY_STYLE } from './deviceFrame';

/**
 * The rule, not just the constants (v7#D1..D6).
 *
 * Every one of the four overlay faults this release fixed was the same typo of
 * intent: `fixed inset-0`, meaning "cover the device", written in a coordinate
 * space that only equals the device on a phone. The fix is two shared strings;
 * the *guard* has to be that nobody writes the fifth one, because the mistake
 * is invisible at the viewport the rest of the suite runs at.
 *
 * So this reads the components. A source scan is a blunt instrument and it is
 * the right one here — the failure mode is a class string, it costs nothing,
 * and the alternative is discovering the next instance from a user's browser
 * again.
 */

const COMPONENTS = resolve(process.cwd(), 'web/components');

/**
 * The retired fixed-height class, assembled rather than written out (R8).
 *
 * Tailwind scans this file like any other source under `web/`, and its
 * extractor reads a complete class name as a *use* — including inside a
 * regex, and including the backslash-escaped spelling, which is the form
 * Tailwind's own generated CSS uses for a bracketed utility. Writing the class
 * out here put the dead `height: 850px` rule back into the stylesheet, so the
 * class the v0.2.2 chassis fix removed was still greppable in the bundle — the
 * evidence the next reader would trust. Built from fragments, it never appears
 * as a candidate. Compared with `includes` rather than a regex, so no
 * bracket in either needle has to be escaped into meaning a character class.
 */
const RETIRED_HEIGHT = `md:h-[${850}px]`;

/** The live width class. Written out because it is genuinely in use. */
const FRAME_WIDTH = 'md:w-[522px]';

/**
 * Layers that genuinely belong to the browser window rather than the device.
 *
 * `InstallBanner` is the only one: it is a bar *about* the browser — "you are
 * playing in a browser, get the native app" — so it is chrome around the
 * machine, not part of it. It pays for that by publishing its height as
 * `--install-banner-h` so the shell can move the device out from under it
 * (see `InstallBanner.test.tsx`), which is the discipline that makes it a
 * legitimate exception rather than a fifth instance of the bug.
 */
const VIEWPORT_LAYERS_BY_DESIGN = new Set(['InstallBanner.tsx']);

const sources = () =>
  readdirSync(COMPONENTS)
    .filter(f => f.endsWith('.tsx') && !f.endsWith('.test.tsx'))
    .map(f => [f, readFileSync(resolve(COMPONENTS, f), 'utf8')] as const);

describe('the device frame', () => {
  it('is the only place the chassis dimensions are written', () => {
    // 522px and the height cap live in `deviceFrame.ts` and `index.css`
    // respectively. A component that restates either has forked the geometry,
    // which is how the boot and the chassis came to disagree in the first place.
    const offenders = sources()
      .filter(([, src]) => src.includes(FRAME_WIDTH) || src.includes(RETIRED_HEIGHT))
      .map(([f]) => f);
    expect(offenders, 'chassis dimensions hardcoded outside deviceFrame.ts').toEqual([]);
  });

  it('is what every full-screen overlay clamps itself to', () => {
    const offenders = sources()
      .filter(([file, src]) => {
        if (VIEWPORT_LAYERS_BY_DESIGN.has(file)) return false;
        if (!/className=\{?[`"'][^`"']*\bfixed\s+inset-/.test(src)) return false;
        return !src.includes("from '../src/services/deviceFrame'");
      })
      .map(([f]) => f);
    expect(
      offenders,
      'these draw fixed to the viewport without clamping to the device frame',
    ).toEqual([]);
  });

  it('caps the height rather than fixing it, and only above the mobile breakpoint', () => {
    // The two halves of the v0.2.2 chassis ruling, stated as an assertion:
    // shrink to fit (so the footer band is always reachable), and leave the
    // sub-`md` phone path — where the dynamic-viewport/URL-bar behaviour is
    // already correct — completely alone.
    expect(DEVICE_FRAME_BOX).toContain('w-full h-full');
    expect(DEVICE_FRAME_BOX).toContain('md:h-[var(--device-frame-h)]');
    expect(DEVICE_FRAME_BOX).not.toContain(RETIRED_HEIGHT);

    const css = readFileSync(resolve(process.cwd(), 'web/index.css'), 'utf8');
    expect(css).toMatch(/--device-frame-h:\s*min\(850px,\s*calc\(100dvh - 2rem\)\)/);
  });

  it('centres the same way DeviceLayout does', () => {
    const layout = readFileSync(resolve(COMPONENTS, 'DeviceLayout.tsx'), 'utf8');
    // Not a restatement of the string: the point is that the chassis itself
    // is positioned by the very constants the overlays import, so "in step"
    // is structural rather than remembered.
    expect(layout).toContain('${DEVICE_FRAME_STAGE}');
    expect(layout).toContain('${DEVICE_FRAME_BOX}');
    expect(DEVICE_FRAME_STAGE).toContain('justify-center');
    expect(DEVICE_FRAME_STAGE).toContain('items-center');
    expect(DEVICE_FRAME_STAGE).toContain('md:p-4');
  });

  it('keeps overlays in register with the install-banner offset', () => {
    // A fixed layer inherits none of the shell's padding, so the offset the
    // shell uses to sit below the bar has to be repeated here or a clamped
    // overlay would drift off the chassis it is covering.
    expect(DEVICE_FRAME_OVERLAY_STYLE.paddingTop).toContain('--install-banner-h');
  });
});
