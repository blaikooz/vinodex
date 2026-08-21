import React from 'react';
import {
  Settings, Wine, Bookmark, Leaf, Map as MapIcon, Sparkles, Search, ScanLine,
  Globe, GraduationCap, Calendar, BookOpen, SlidersHorizontal, Wrench, Moon,
} from 'lucide-react';

/**
 * The marquee's art table and the glyph that falls back for it.
 *
 * **Extracted from `DeviceLayout.tsx` (v7#W7).** The tell that this was never
 * chrome was in the suite: `marqueeArt.test.ts` and `marqueeTitles.test.ts`
 * both reached *into a component file* to import `MARQUEE_ART`, which is a
 * unit test importing a React tree to get at a lookup table. The table is a
 * pure title -> stem map and the glyph is a pure title -> node function;
 * neither reads a prop, a store or the theme, and nothing about either is
 * specific to the chassis that happens to draw them.
 *
 * `.tsx` rather than `.ts` because `marqueeGlyph` returns JSX, which is the
 * same reason `settingsSections.tsx` and `lucideIconMap.tsx` carry the
 * extension.
 */

/**
 * The marquee's per-route glyph, stamped between the banner's repetitions —
 * iOS `DexRoute.marqueeSymbol` / `MarqueeBanner.symbol`. The web has only the
 * screen `title` for context, so the fixed-title screens map to their iOS
 * glyph and everything else (entry readouts, ad-hoc titles) falls back to the
 * wineglass, the app's own mark.
 */
/**
 * The drawn marquee panel per route, mirrored from iOS by
 * `sync-shared.ps1`'s web art leg (v6#2 ruling). iOS keys these off
 * `DexRoute.marqueeArtStem`; the web has only the screen title, so the map is
 * title-keyed and any title without a panel falls through to the lucide
 * glyph below rather than drawing nothing.
 */
export const MARQUEE_ART: Record<string, string> = {
  'VINODEX': 'marquee-menu',
  'SYSTEM': 'marquee-system',
  'SAVED': 'marquee-user',
  'COLLECTION': 'marquee-user',
  'GRAPES': 'marquee-grapescan',
  // The listing titles the app actually uses, which are not the category
  // names (found by the screenshot gate: VARIETIES was falling back).
  'VARIETIES': 'marquee-grapescan',
  'DATABASE': 'marquee-encyclopedia',
  'WORLD SEARCH': 'marquee-globescan',
  'REGIONS': 'marquee-regions',
  'COUNTRIES': 'marquee-countryscan',
  'STYLES': 'marquee-stylescan',
  'FLAVORS': 'marquee-flavorscan',
  'CONTINENTS': 'marquee-continentscan',
  'GLOBE': 'marquee-globescan',
  'GLOBE SCAN': 'marquee-globescan',
  'MASTER SEARCH': 'marquee-mastersearch',
  'SEARCH': 'marquee-mastersearch',
  'BLIND TASTING': 'marquee-blindtasting',
  'SCANNER': 'marquee-blindtasting',
  'TOOLS': 'marquee-tools',
  'FILTER': 'marquee-filtersearch',
  'WINE EXAM': 'marquee-wineexam',
  'DAILY CHALLENGE': 'marquee-dailychallenge',
  'PASSPORT': 'marquee-passport',
  'MOON DIAL': 'marquee-moondial',
  'ENCYCLOPEDIA': 'marquee-encyclopedia',
  'FIRMWARE': 'marquee-firmware',
  'CHEAT CODES': 'marquee-cheatcodes',
  'LINEAGE': 'marquee-lineage',
  'STAMPS': 'marquee-stamps',
  'TUTORIAL': 'marquee-tutorial',
  'CUSTOMIZE': 'marquee-customize',
  'DATA': 'marquee-data',
  'DEV': 'marquee-dev',
  'ACCESS': 'marquee-shop',
  // The filter-mode scan titles the listing sets, and the remaining screens.
  // Every stem below exists on disk; `marqueeArt.test.ts` holds the map and
  // the directory to each other in both directions.
  'SECTOR SCAN': 'marquee-regions',
  'AREA SCAN': 'marquee-countryscan',
  'STYLE SCAN': 'marquee-stylescan',
  'FLAVOR SCAN': 'marquee-flavorscan',
  'GEOLOGY SCAN': 'marquee-soilscan',
  'REGION SCAN': 'marquee-regions',
  'STATE SCAN': 'marquee-countryscan',
  'CLIMATE SCAN': 'marquee-soilscan',
  'SYSTEM SCAN': 'marquee-system',
  'WORLD SCAN': 'marquee-globescan',
  'SECTOR SELECT': 'marquee-continentscan',
  'TACTILE VIEW': 'marquee-globescan',
  'BIODYNAMIC SCAN': 'marquee-moondial',
  'PROF. VINO': 'marquee-vinodex',
  'SUPPORT': 'marquee-notifications',
  'YOU MIGHT LIKE': 'marquee-encyclopedia',
  'DEMO MODE': 'marquee-demo',
  'PROFILES': 'marquee-user',
  'HAPTICS': 'marquee-haptics',
  'HEALTH': 'marquee-dev',
  'SETTINGS': 'marquee-settings',
};

/**
 * The company site's own mark, and the key that stamps it (v8#10).
 *
 * **The first and only web-authored art in this repo.** Everything in
 * `MARQUEE_ART` above is mirrored one-way out of `vinodex-ios` by
 * `sync-shared.ps1`'s art leg; iOS owns it and the web consumes it. iOS has no
 * company site, so it has no mark for one — this had to be drawn here, by
 * `scripts/draw-site-marquee.py`, and it is recorded as a deliberate deviation
 * in IOS-PARITY-v8.
 *
 * **Full `src` rather than a stem, and that carries the whole point.** The
 * stems above resolve under `/art/marquee/`, which the sync leg `/MIR`s —
 * mirroring deletions, so a web-authored PNG dropped in there is removed by
 * the next sync and the site silently falls back to the wineglass. This mark
 * lives at `/art/site/` instead, which the leg cannot reach.
 * `siteMarquee.test.ts` pins that, by reading the script rather than trusting
 * the comment.
 *
 * A map rather than one constant so a second web-authored mark is a line here,
 * and so `marqueeArt.test.ts` can hold the whole set to its directory the way
 * it already holds the iOS set to theirs.
 */
export const WEB_MARQUEE_ART: Record<string, string> = {
  'HORIZON/GODOT': '/art/site/marquee-horizon-godot.png',
};

/**
 * The key every company-site screen stamps.
 *
 * The site's *text* differs per screen — WELCOME on the landing, the screen's
 * own name elsewhere — but the *mark* is the studio's throughout, because the
 * mark is whose device this is rather than which page you are on. Before this
 * every site screen fell through to `<Wine>`: dex iconography on a company
 * page, which is exactly the leak the separation rule exists to stop, arriving
 * through a default rather than through an import.
 */
export const SITE_MARK_TITLE = 'HORIZON/GODOT';

const artImg = (src: string, size: number): React.ReactNode => (
  <img
    src={src}
    alt=""
    aria-hidden="true"
    draggable={false}
    style={{ height: size, width: 'auto', objectFit: 'contain', imageRendering: 'pixelated', display: 'block', flexShrink: 0 }}
  />
);

export const marqueeGlyph = (title: string, size: number): React.ReactNode => {
  const t = title.toUpperCase();
  // Web-authored first: a title that gains an iOS panel later must not
  // silently displace a mark drawn here for a screen iOS does not have.
  const web = WEB_MARQUEE_ART[t];
  if (web) return artImg(web, size);
  const stem = MARQUEE_ART[t];
  if (stem) {
    return artImg(`/art/marquee/${stem}.png`, size);
  }
  const props = { size, className: 'text-green-500 shrink-0', 'aria-hidden': true } as const;
  switch (t) {
    case 'VINODEX': return <Wine {...props} />;
    case 'SYSTEM': return <Settings {...props} />;
    case 'SAVED':
    case 'COLLECTION': return <Bookmark {...props} />;
    case 'GRAPES': return <Leaf {...props} />;
    case 'REGIONS':
    case 'COUNTRIES': return <MapIcon {...props} />;
    case 'STYLES': return <Wine {...props} />;
    case 'FLAVORS': return <Sparkles {...props} />;
    case 'CONTINENTS':
    case 'GLOBE': return <Globe {...props} />;
    case 'SEARCH': return <Search {...props} />;
    case 'SCANNER': return <ScanLine {...props} />;
    case 'TOOLS':
    case 'MINIGAMES': return <Wrench {...props} />;
    case 'FILTER': return <SlidersHorizontal {...props} />;
    case 'WSET QUIZ':
    case 'QUIZ': return <GraduationCap {...props} />;
    case 'DAILY CHALLENGE': return <Calendar {...props} />;
    case 'PASSPORT': return <BookOpen {...props} />;
    case 'MOON DIAL': return <Moon {...props} />;
    default: return <Wine {...props} />;
  }
};
