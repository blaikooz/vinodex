import React, { useId } from 'react';

interface IOSGridTileProps {
  title: string;
  artSrc: string;
  face: string;
  shadow: string;
  ink: string;
  onClick: () => void;
  comingSoon?: boolean;
  artName?: string;
}

/**
 * The large LCD tile shared by the TOOLS and SYSTEM shelves.
 *
 * Its bitmap is the exact baked ButtonArt resource from iOS. Fitting every
 * drawing into one square well keeps the labels aligned despite the source
 * artwork's different aspect ratios.
 */
const IOSGridTile: React.FC<IOSGridTileProps> = ({
  title,
  artSrc,
  face,
  shadow,
  ink,
  onClick,
  comingSoon = false,
  artName,
}) => {
  const statusId = useId();
  return (
    <>
      <button
        type="button"
        onClick={onClick}
        disabled={comingSoon}
        aria-describedby={comingSoon ? statusId : undefined}
        className="ios-grid-tile"
        style={
          {
            '--ios-tile-face': face,
            '--ios-tile-shadow': shadow,
            '--ios-tile-ink': ink,
            opacity: comingSoon ? 0.72 : 1,
          } as React.CSSProperties
        }
      >
        <img
          src={artSrc}
          alt=""
          aria-hidden="true"
          draggable={false}
          data-button-art={artName}
          className="ios-grid-tile-art"
        />
        <span className="ios-grid-tile-label">{title}</span>
        {comingSoon ? <span aria-hidden="true" className="ios-grid-tile-status">COMING SOON</span> : null}
      </button>
      {comingSoon ? <span id={statusId} className="sr-only">Coming soon — not built yet.</span> : null}
    </>
  );
};

export default IOSGridTile;
