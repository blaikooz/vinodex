import { normalizeLabel } from '@/shared/services/entryUtils';

/**
 * Display helpers with no web equivalent, ported from
 * `vinodex-ios/Sources/VinodexCore/EntryDisplay.swift`.
 *
 * Most of that file already exists on this side — `styleClass`, `colorType`,
 * `grapeColorLabel` and `grapeBodyLabel` live in `shared/services/entryUtils`
 * and `grapeDisplay`. `appellationName` did not exist here at all, which is why
 * the region readout printed a bare "AOC" where iOS prints the abbreviation and
 * spells it out beside it.
 *
 * It lives under `web/` rather than in `shared/` because `shared/` is a frozen
 * leftover — see the README. Nothing new should be added there.
 */

/**
 * The spelled-out name of an appellation system.
 *
 * Keyed by the *pair*, not the abbreviation alone: `DOC` means three different
 * things depending on the country, and picking the Italian expansion for a
 * Portuguese region is the kind of error nobody reports because it still reads
 * like prose.
 *
 * An unknown system passes through unchanged rather than rendering empty — the
 * region screen shows the abbreviation and simply has nothing to add.
 */
export function appellationName(classification: string, country: string): string {
  const system = classification.trim();
  const place = normalizeLabel(country);

  switch (system.toUpperCase()) {
    case 'AOC': return "Appellation d'Origine Contrôlée";
    case 'AVA': return 'American Viticultural Area';
    case 'DAC': return 'Districtus Austriae Controllatus';
    case 'DHC': return 'Districtus Hungaricus Controllatus';
    case 'GI': return 'Geographical Indication';
    case 'PDO': return 'Protected Designation of Origin';
    case 'WO': return 'Wine of Origin';
    case 'DOCG': return 'Denominazione di Origine Controllata e Garantita';
    case 'DOCA': return 'Denominación de Origen Calificada';
    case 'DO': return 'Denominación de Origen';

    // The genuinely ambiguous one: same abbreviation, three languages.
    case 'DOC':
      if (place === 'italy') return 'Denominazione di Origine Controllata';
      if (place === 'portugal') return 'Denominação de Origem Controlada';
      return 'Denominación de Origen Controlada';

    default:
      return system;
  }
}

/**
 * Whether an appellation abbreviation has a spelled-out name at all.
 *
 * `appellationName` returns its input unchanged when it does not recognise the
 * system, so callers that want to *hide* the second line rather than print the
 * abbreviation twice need this to tell the two cases apart.
 */
export function hasAppellationName(classification: string, country: string): boolean {
  const system = classification.trim();
  if (!system) return false;
  return appellationName(system, country) !== system;
}
