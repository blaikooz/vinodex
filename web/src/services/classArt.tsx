import React from 'react';
import { Icon } from '../components/LocalIcon';

/**
 * Class-art icon resolution, mirroring iOS `WineDatabase.icons.*` lookups
 * (`vinodex-ios/Sources/VinodexCore/Resources/icons.json`).
 *
 * The colour / body / style-class / flavor-class / flavor-subclass glyphs
 * resolve to `art:*` full-colour pixel PNGs (bundled under `/art/class`), with
 * a few intentional `game-icons:*` fallbacks (body Light-Medium / Medium-Full,
 * the STYLE style-class) that iOS keeps too.
 *
 * These tables are defined in code rather than read from the generated
 * `iconManifest.json`, matching the Pass-1 outline treatment: the web manifest
 * still carries the pre-`art:` game-icons values, and nothing else in the app
 * consumes these five maps, so the source of truth lives here alongside the
 * render.
 *
 * `LocalIcon` renders `art:` ids as plain full-colour `<img>` sprites and
 * everything else through Iconify, so callers pass whatever these helpers
 * return straight into `<Icon icon={…}>`.
 */

type IconMap = Record<string, string>;

const COLOR_ICONS: IconMap = {
  RED: 'art:color-red',
  WHITE: 'art:color-white',
  ROSE: 'art:color-rose',
  ORANGE: 'art:color-orange',
  DUAL: 'art:color-dual',
};

const BODY_ICONS: IconMap = {
  Light: 'art:body-light',
  'Light-Medium': 'game-icons:weight-scale',
  Medium: 'art:body-medium',
  'Medium-Full': 'game-icons:weight-lifting-up',
  Full: 'art:body-full',
};

const STYLE_CLASS_ICONS: IconMap = {
  TYPE: 'art:styleclass-type',
  BLEND: 'art:styleclass-blend',
  ORIGIN: 'art:styleclass-origin',
  METHOD: 'art:styleclass-method',
  STYLE: 'game-icons:wine-glass',
};

const FLAVOR_CLASS_ICONS: IconMap = {
  SWEET: 'art:class-sweet',
  UMAMI: 'art:class-umami',
  BITTER: 'art:class-bitter',
  SOUR: 'art:class-sour',
  SALTY: 'art:class-salty',
};

const FLAVOR_SUBCLASS_ICONS: IconMap = {
  BERRY: 'art:subclass-berry',
  WOOD: 'art:subclass-wood',
  SPICE: 'art:subclass-spice',
  RED_FRUIT: 'art:subclass-red-fruit',
  EARTH: 'art:subclass-earth',
  FLORAL: 'art:subclass-floral',
  ORCHARD_FRUIT: 'art:subclass-orchard-fruit',
  BAKING: 'art:subclass-baking',
  DARK_FRUIT: 'art:subclass-dark-fruit',
  HERBAL: 'art:subclass-herbal',
  SMOKY: 'art:subclass-smoky',
  CITRUS: 'art:subclass-citrus',
  STONE_FRUIT: 'art:subclass-stone-fruit',
  VEGETAL: 'art:subclass-vegetal',
  WAX: 'art:subclass-wax',
  TROPICAL: 'art:subclass-tropical',
  GAME: 'art:subclass-game',
  SALTY: 'art:subclass-salty',
  NUT: 'art:subclass-nut',
  SAVORY: 'art:subclass-savory',
  BREAD: 'art:subclass-bread',
  BRINY: 'art:subclass-briny',
};

const FALLBACK = 'mdi:help-circle-outline';

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
