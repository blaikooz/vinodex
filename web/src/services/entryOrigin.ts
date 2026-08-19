import {
  WineEntry,
  isCountryGateEntry,
  isGrapeEntry,
  isRegionEntry,
  isStyleEntry,
} from '@/shared/types';

/**
 * Where an entry is *from*, across the categories that spell it differently.
 *
 * **One accessor, because there were three** (L1). `passport.ts`, `quiz.ts`
 * and `chipFilter.ts` each grew their own during the W14 narrowing, and the
 * three disagreed:
 *
 *   passport    grape -> `grapeCountryOfOrigin`, no fallback
 *   quiz        grape -> `details.origin` (its `gCountry` held the chain)
 *   chipFilter  grape -> `grapeCountryOfOrigin || details.origin`
 *
 * Three functions computing "the country this is from" with three different
 * answers for the same entry is the shape the `any` casts were hiding, and
 * copying it into three narrowed versions preserved it rather than fixing it.
 *
 * **The semantics are the pre-narrowing ones, exactly:**
 * `grapeCountryOfOrigin ?? details.origin ?? ''`. Note `??`, not `||` — the
 * original was a nullish chain, so an *empty-string* top-level field yields
 * `''` rather than falling through. Two of the narrowed copies used `||`,
 * which is a different function; the commit that introduced them described
 * the chain as falling through when the field is "empty", which `??` does not
 * do.
 *
 * Measured before unifying, so the change is knowingly behaviour-preserving
 * rather than hopefully so: of 177 grapes, **zero** have an absent or empty
 * `grapeCountryOfOrigin`, so all three variants and both operators agree on
 * the shipped catalogue. The fallback is defensive, and the operator choice
 * only becomes visible if a future grape ships an empty string — at which
 * point `??` is the answer the original code gave.
 *
 * CONTINENTS declare no origin at all and correctly return `''`.
 */
export const entryOrigin = (e: WineEntry): string => {
  if (isGrapeEntry(e)) return e.grapeCountryOfOrigin ?? e.details.origin ?? '';
  if (isRegionEntry(e) || isStyleEntry(e) || isCountryGateEntry(e)) return e.details.origin ?? '';
  return '';
};
