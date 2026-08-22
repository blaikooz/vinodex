import React from 'react';
import type { ChipColorStyle } from '@/shared/services/chipColors';

interface ChipProps {
  label: string;
  color?: string;
  colorStyle?: ChipColorStyle;
  icon?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  onClick?: (e: React.MouseEvent) => void;
}

const Chip: React.FC<ChipProps> = ({ label, color = '', colorStyle, icon, className = '', style, onClick }) => {
  // Stage 4 (v0.4.3): the chip face moves from Press Start 2P to the sans
  // caption step. A chip is metadata, not a mark, and the pixel face at 16px
  // was the loudest thing on every list row. The *colours* stay data-driven:
  // `colorStyle` values come from `shared/services/chipColors`, which is the
  // catalogue's own vocabulary (a country's chip is that country's colour on
  // both platforms) and deliberately does not follow the screen mode.
  const base = `inline-flex items-center justify-center px-2 py-0.5 rounded border font-sans text-caption uppercase leading-tight ${colorStyle ? '' : color} ${className}`.trim();
  const inlineColors: React.CSSProperties = colorStyle
    ? { backgroundColor: colorStyle.bg, borderColor: colorStyle.border, color: colorStyle.text }
    : {};
  const retro: React.CSSProperties = { ...inlineColors, ...style };
  const inner = (
    <>
      {icon && <span className="mr-1 inline-block align-middle">{icon}</span>}
      <span className="align-middle">{label}</span>
    </>
  );

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={base} style={retro}>
        {inner}
      </button>
    );
  }

  return (
    <span className={base} style={retro}>
      {inner}
    </span>
  );
};

export default Chip;
