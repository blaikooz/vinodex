import React from 'react';
import type { ChipColorStyle } from '../src/services/chipColors';

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
  const base = `inline-flex items-center justify-center px-2 py-px rounded border font-retro text-[16px] md:text-[18px] tracking-normal leading-tight uppercase ${colorStyle ? '' : color} ${className}`.trim();
  const inlineColors: React.CSSProperties = colorStyle
    ? { backgroundColor: colorStyle.bg, borderColor: colorStyle.border, color: colorStyle.text }
    : {};
  const retro: React.CSSProperties = { fontFamily: 'Press Start 2P, var(--font-retro), cursive', ...inlineColors, ...style };
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
