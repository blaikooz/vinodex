import React from 'react';
import { Icon } from '../components/LocalIcon';
import iconManifest from '../data/iconManifest.json';

/**
 * Class-art icon resolution, mirroring iOS `WineDatabase.icons.*` lookups.
 *
 * The colour / body / style-class / flavor-class / flavor-subclass glyphs are
 * data-driven from the shared `icons.json` manifest (imported here as
 * `iconManifest.json`), so the ids match iOS byte-for-byte: most resolve to
 * `art:*` full-colour pixel PNGs, a few (body Light-Medium / Medium-Full, the
 * STYLE style-class) intentionally fall back to `game-icons:*`.
 *
 * `LocalIcon` already renders `art:` ids as plain `<img>` full-colour sprites
 * and `game-icons:` / other ids through Iconify, so callers just pass whatever
 * these helpers return straight into `<Icon icon={…}>`.
 */

type IconMap = Record<string, string>;

const manifest = iconManifest as {
  bodyIcons?: IconMap;
  colorIcons?: IconMap;
  styleClassIcons?: IconMap;
  flavorClassIcons?: IconMap;
  flavorSubclassIcons?: IconMap;
  fallback?: string;
};

const BODY_ICONS: IconMap = manifest.bodyIcons ?? {};
const COLOR_ICONS: IconMap = manifest.colorIcons ?? {};
const STYLE_CLASS_ICONS: IconMap = manifest.styleClassIcons ?? {};
const FLAVOR_CLASS_ICONS: IconMap = manifest.flavorClassIcons ?? {};
const FLAVOR_SUBCLASS_ICONS: IconMap = manifest.flavorSubclassIcons ?? {};
const FALLBACK: string = manifest.fallback ?? 'mdi:help-circle-outline';

const norm = (v: string | undefined | null): string =>
  (v ?? '').toString().trim();

/** Colour-type glyph, e.g. RED → `art:color-red`. iOS `iconForColor`. */
export function colorIconId(colorType: string | undefined | null): string {
  const key = norm(colorType).toUpperCase();
  return COLOR_ICONS[key] ?? 'game-icons:wine-glass';
}

/** Body-class glyph, e.g. Medium → `art:body-medium`. iOS `iconForBody`. */
export function bodyIconId(bodyClass: string | undefined | null): string {
  const key = norm(bodyClass);
  return BODY_ICONS[key] ?? 'game-icons:scales';
}

/** Style-class glyph, e.g. TYPE → `art:styleclass-type`. */
export function styleClassIconId(styleClass: string | undefined | null): string {
  const key = norm(styleClass).toUpperCase();
  return STYLE_CLASS_ICONS[key] ?? FALLBACK;
}

/** Flavor-class glyph, e.g. SWEET → `art:class-sweet`. */
export function flavorClassIconId(classification: string | undefined | null): string {
  const key = norm(classification).toUpperCase();
  return FLAVOR_CLASS_ICONS[key] ?? FALLBACK;
}

/** Flavor-subclass glyph, e.g. RED_FRUIT → `art:subclass-red-fruit`. */
export function flavorSubclassIconId(subclass: string | undefined | null): string {
  const key = norm(subclass).toUpperCase();
  return FLAVOR_SUBCLASS_ICONS[key] ?? '';
}

/** Convenience node builder — returns an <Icon> at the requested size. */
export function classArtNode(id: string, size: number): React.ReactNode {
  if (!id) return null;
  return <Icon icon={id} width={size} height={size} />;
}
