import React from 'react';
import { VinoExpression } from '../src/services/vinoDialogue';

interface VinoPortraitProps {
  expression: VinoExpression;
  size: number;
  className?: string;
}

/**
 * Professor Vino's drawn face, one of six.
 *
 * The v6#2 art ruling landing as the asset swap it was promised to be: the
 * six-expression vocabulary was already threaded through the bubble, the
 * intro card and his own page as chrome glyphs, so this replaces the glyph
 * and changes nothing else.
 *
 * Stems are iOS's `VinoExpression.artStem` verbatim (`vino-` + raw value),
 * and the files are the same baked PNGs the iOS app renders, mirrored by
 * `sync-shared.ps1`'s web art leg. `pixelated` because the art is pixel art
 * and the browser's smooth default turns hard edges to mush.
 */
const VinoPortrait: React.FC<VinoPortraitProps> = ({ expression, size, className }) => (
  <img
    src={`/art/vino/vino-${expression}.png`}
    alt=""
    width={size}
    height={size}
    draggable={false}
    className={className}
    style={{ width: size, height: size, objectFit: 'contain', imageRendering: 'pixelated', display: 'block' }}
  />
);

export default VinoPortrait;
