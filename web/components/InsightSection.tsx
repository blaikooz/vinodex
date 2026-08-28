import React, { useEffect, useMemo } from 'react';
import { Lightbulb } from 'lucide-react';
import { WineEntry } from '@/shared/types';
import { buildProfile, buildTriedIndex } from '../src/services/recommendations';
import { buildInsightPanel, panelIsEmpty } from '../src/services/insight';
import { shelfIds, triedDayLog } from '../src/services/bookmarks';
import { useBookmarks } from '../src/services/useBookmarks';
import { fireVino } from '../src/services/vinoPresenter';

interface InsightSectionProps {
  entry: WineEntry;
  allEntries: WineEntry[];
}

/**
 * The INSIGHT panel on an entry page, ported from `insightSection` in
 * `vinodex-ios/Sources/VinodexUI/Screens/EntryDetailScreen.swift` — the
 * v6#21 tail. An extracted component, per the god-file rule: `EntryDetail`
 * imports it, it does not grow there.
 *
 * Subscribes to the bookmark store, so a TRIED tap two rows below rebuilds
 * this panel in the same frame — Phase 1's "updates live" criterion. The
 * walkthrough's fourth step lights this panel *after* the tried tap changed
 * it, which is why that step has nothing to do but be read
 * (`data-coachmark="insightPanel"`).
 *
 * A bullet rather than a glyph per line: seven kinds would be seven pictures
 * to keep in a roster, and the sentences already say which is which.
 */
const InsightSection: React.FC<InsightSectionProps> = ({ entry, allEntries }) => {
  const revision = useBookmarks();
  const panel = useMemo(() => {
    const index = buildTriedIndex(allEntries, shelfIds('tried'));
    return buildInsightPanel(entry, index, buildProfile(index), allEntries, triedDayLog());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entry, allEntries, revision]);

  // The `firstInsight` event site (iOS: "the INSIGHT panel drew a line") —
  // the view and the trigger read the same panel rather than each deciding
  // for itself what counts as unlocked.
  useEffect(() => {
    if (panel.lines.length > 0) fireVino('firstInsight');
  }, [panel.lines.length]);

  if (panelIsEmpty(panel)) return null;

  return (
    <div className="px-4 md:px-6 pb-2" data-coachmark="insightPanel">
      <div className="rounded-card border-l-4 p-4" style={{ borderColor: 'var(--lcd-accent)', backgroundColor: 'color-mix(in srgb, var(--lcd-accent) 8%, transparent)' }}>
        <div className="flex items-center gap-2 mb-2.5">
          <Lightbulb size={15} className="text-[var(--lcd-accent)]" />
          <h2 className="text-label uppercase tracking-widest text-[var(--lcd-accent)]">INSIGHT</h2>
        </div>
        {panel.teaser && (
          <p className="text-caption text-[var(--lcd-subtext)] normal-case leading-relaxed">{panel.teaser}</p>
        )}
        <div className="flex flex-col gap-2">
          {panel.lines.map(line => (
            <div key={line.kind} className="flex items-start gap-2">
              <span className="text-caption text-[var(--lcd-accent)]">&#9656;</span>
              <span className="text-body text-[var(--lcd-body-text)] normal-case leading-relaxed">{line.text}</span>
            </div>
          ))}
        </div>
        {panel.nextDepth !== null && panel.toNextDepth > 0 && (
          <p className="text-micro tracking-widest text-[var(--lcd-subtext)] mt-3">
            {panel.toNextDepth === 1
              ? '1 MORE TASTING DEEPENS THIS PANEL.'
              : `${panel.toNextDepth} MORE TASTINGS DEEPEN THIS PANEL.`}
          </p>
        )}
      </div>
    </div>
  );
};

export default InsightSection;
