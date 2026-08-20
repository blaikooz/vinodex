import type { CSSProperties } from 'react';

/**
 * The device frame's footprint, in one place, for everything that has to line
 * up with it.
 *
 * **Why this exists (v7#D1/#D2).** The chassis geometry lived as a class string
 * inside `DeviceLayout`, and every full-screen overlay in the app — the BIOS,
 * the screensaver, the professor's bubble and his intro card — was `fixed
 * inset-0` to the *viewport* instead. On a phone those two boxes coincide, so
 * the mistake was invisible for the app's whole life; on a 1280x800 desktop
 * window the BIOS drew its dotted POST leaders across the full 1280px, left
 * aligned, while the device it was booting sat in a centred 522px column.
 *
 * The rule iOS states for its own overlays (`DeviceChassis.swift:1156` — "every
 * overlay in this app is confined to the display") is the rule here: a layer
 * may be fixed to the viewport, but what it *draws* belongs to the device.
 * Import `DEVICE_FRAME_STAGE` + `DEVICE_FRAME_BOX` and you get exactly the box
 * `DeviceLayout` centres, because it is the same two strings.
 *
 * These are Tailwind class literals rather than a component so each call site
 * keeps its own refs, handlers and z-index — the screensaver needs its bounce
 * box measured, the BIOS needs the whole layer clickable, the coachmark needs
 * only its *card* clamped while its spotlight panels stay viewport-anchored.
 * Tailwind v4 scans this file like any other source file under `web/`.
 */

/**
 * The centring stage: a viewport-fixed layer that positions one
 * `DEVICE_FRAME_BOX` exactly where `DeviceLayout` puts the chassis.
 *
 * Must stay in step with `DeviceLayout`'s outer container — same flex
 * alignment, same `md:p-4`. `DeviceLayout` uses this string too, so "in step"
 * is enforced rather than remembered.
 */
export const DEVICE_FRAME_STAGE = 'flex justify-center items-center p-0 md:p-4';

/**
 * The chassis box itself.
 *
 * `--device-frame-h` (see `index.css`) is `min(850px, 100dvh - 2rem)`: the
 * device shrinks to fit a short window rather than hanging past the fold. It
 * was a flat 850 pixels at this breakpoint, which on an ~800px-tall window
 * pushed the
 * entire footer band — the back/home/user/settings caps, the marquee and the
 * v0.2.1 quick-pin lamps — below the viewport with `overflow-hidden` above it,
 * so the feature shipped in v0.2.1 was unreachable at a common desktop size.
 *
 * The retired class is spelled out in words rather than as a Tailwind literal
 * on purpose (R8): Tailwind scans this file, so writing it verbatim in a
 * comment put a dead `height: 850px` rule back into the shipped stylesheet —
 * which costs 30 bytes and misleads the next person who greps the bundle for
 * it.
 *
 * **Only the screen area gives.** Every moulded figure is untouched: the caps,
 * the island's `3x22 + 2x6.72 = 79.44` derivation, `.recessed-lamp`, the band
 * pill and the vent strips are all fixed-height and pinned to iOS's numbers.
 * The LCD is the one `flex-1` in the stack, so a shorter frame is a shorter
 * *display*, which is what iOS does on a shorter phone — `DeviceChassis` is
 * `.frame(maxWidth: .infinity, maxHeight: .infinity).ignoresSafeArea()` and
 * lets `PageRoom.growth(pageHeight:step:)` take up the slack from the measured
 * page height.
 *
 * Mobile is deliberately excluded: below `md` the box is `w-full h-full` inside
 * an `h-screen` stage, exactly as it has always been, so the dynamic-viewport /
 * URL-bar behaviour that currently renders correctly on a phone is not touched.
 */
export const DEVICE_FRAME_BOX = 'w-full h-full md:h-[var(--device-frame-h)] md:w-[522px]';

/**
 * Safe-area insets for an *overlay* stage, plus the install banner's height.
 *
 * A `position: fixed` layer does not inherit the app shell's padding, so an
 * overlay clamped to the frame would ignore the offset the shell uses to sit
 * below the install bar (`InstallBanner.tsx:36`) and drift out of register with
 * the very chassis it is meant to cover. Resolves to `0px` — the bar is dormant
 * while `APP_STORE_LISTING_IS_LIVE` is false — but it costs nothing to be right.
 *
 * Overlays only. `DeviceLayout` is *inside* the shell div that already carries
 * `--install-banner-h`, so handing it this object would count the bar twice.
 */
export const DEVICE_FRAME_OVERLAY_STYLE: CSSProperties = {
  paddingTop: 'calc(env(safe-area-inset-top) + var(--install-banner-h, 0px))',
  paddingLeft: 'env(safe-area-inset-left)',
  paddingRight: 'env(safe-area-inset-right)',
};
