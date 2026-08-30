import React from 'react';
import ArtImage from './ArtImage';
import { BadgeId } from '../src/services/passport';

/**
 * A passport stamp, drawn.
 *
 * The stems are iOS's `StampCatalog` art names; the six ids the web's
 * `Passport` computes map onto them one to one. Unearned stamps draw the
 * same art at low opacity in greyscale rather than a lock glyph, which is
 * what iOS does: the shape of what you have not got yet is the thing that
 * makes a collection worth completing.
 */
const STAMP_STEM: Record<BadgeId, string> = {
  firstSip: 'stamp-first-sip',
  tenBottles: 'stamp-ten-bottles',
  allNoble: 'stamp-all-noble',
  regionComplete: 'stamp-region-complete',
  streakWeek: 'stamp-streak-week',
  sommelier: 'stamp-sommelier',
  allGrapes: 'stamp-all-grapes',
  allStyles: 'stamp-all-styles',
};

interface StampArtProps {
  id: BadgeId;
  size: number;
  earned: boolean;
}

const StampArt: React.FC<StampArtProps> = ({ id, size, earned }) => (
  <ArtImage
    src={`/art/stamp/${STAMP_STEM[id]}.png`}
    alt=""
    width={size}
    height={size}
    draggable={false}
    style={{
      width: size,
      height: size,
      objectFit: 'contain',
      imageRendering: 'pixelated',
      display: 'block',
      opacity: earned ? 1 : 0.28,
      filter: earned ? undefined : 'grayscale(1)',
    }}
  />
);

export default StampArt;
