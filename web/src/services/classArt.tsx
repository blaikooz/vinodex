import React from 'react';
import { Icon } from '../components/LocalIcon';
import iconManifest from '../data/iconManifest.json';

/**
 * Class-art icon resolution, mirroring iOS `WineDatabase.icons.*` lookups
 * (`vinodex-ios/Sources/VinodexCore/Resources/icons.json`).
 *
 * The colour / body / style-class / flavor-class / flavor-subclass glyphs
 * resolve to `art:*` full-colour pixel PNGs (bundled under `/art/class`), with
 * a few intentional `game-icons:*` fallbacks (body Light-Medium / Medium-Full,
 * the STYLE style-class) that iOS keeps too.
 *
 * **Read from the generated manifest** (0.6.5). These five tables used to be
 * hand-copied into this file, because `iconManifest.json` was a stale snapshot
 * that still carried the pre-`art:` game-icons values — so the only way to get
 * the drawn sprites was to write them out here. The manifest is a current copy
 * of iOS's `icons.json` now, so the duplication is gone and a regenerated
 * manifest reaches the web without anyone re-typing a table.
 *
 * `LocalIcon` renders `art:` ids as plain full-colour `<img>` sprites and
 * everything else through Iconify, so callers pass whatever these helpers
 * return straight into `<Icon icon={…}>`.
 */

type IconMap = Record<string, string>;

const MANIFEST = iconManifest as {
  colorIcons: IconMap;
  bodyIcons: IconMap;
  styleClassIcons: IconMap;
  flavorClassIcons?: IconMap;
  flavorSubclassIcons?: IconMap;
  fallback: string;
};

const COLOR_ICONS: IconMap = MANIFEST.colorIcons;
const BODY_ICONS: IconMap = MANIFEST.bodyIcons;
const STYLE_CLASS_ICONS: IconMap = MANIFEST.styleClassIcons;
const FLAVOR_CLASS_ICONS: IconMap = MANIFEST.flavorClassIcons ?? {};
const FLAVOR_SUBCLASS_ICONS: IconMap = MANIFEST.flavorSubclassIcons ?? {};

const FALLBACK = MANIFEST.fallback ?? 'mdi:help-circle-outline';

const norm = (v: string | undefined | null): string => (v ?? '').toString().trim();

/** Colour-type glyph, e.g. RED → `art:color-red`. iOS `iconForColor`. */
export function colorIconId(colorType: string | undefined | null): string {
  return COLOR_ICONS[norm(colorType).toUpperCase()] ?? 'game-icons:wine-glass';
}

/** Body-class glyph, e.g. Medium → `art:body-medium`. iOS `iconForBody`. */
export function bodyIconId(bodyClass: string | undefined | null): string {
  return BODY_ICONS[norm(bodyClass)] ?? 'game-icons:scales';
}

/** Style-class glyph, e.g. TYPE → `art:styleclass-type`. */
export function styleClassIconId(styleClass: string | undefined | null): string {
  return STYLE_CLASS_ICONS[norm(styleClass).toUpperCase()] ?? FALLBACK;
}

/** Flavor-class glyph, e.g. SWEET → `art:class-sweet`. */
export function flavorClassIconId(classification: string | undefined | null): string {
  return FLAVOR_CLASS_ICONS[norm(classification).toUpperCase()] ?? FALLBACK;
}

/** Flavor-subclass glyph, e.g. RED_FRUIT → `art:subclass-red-fruit`. */
export function flavorSubclassIconId(subclass: string | undefined | null): string {
  return FLAVOR_SUBCLASS_ICONS[norm(subclass).toUpperCase()] ?? '';
}

/** Convenience node builder — returns an <Icon> at the requested size. */
export function classArtNode(id: string, size: number): React.ReactNode {
  if (!id) return null;
  return <Icon icon={id} width={size} height={size} />;
}
