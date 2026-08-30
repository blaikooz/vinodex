import React from 'react';

/**
 * An art `<img>` that fails quietly (v0.6.21, Phase 3 offline).
 *
 * The drawn art -- portraits, stamps, menu icons, control glyphs -- is
 * runtime-cached on first view rather than precached (254 PNGs would push the
 * precache past 6 MB), so a piece never seen on this device is a request
 * that fails offline. A bare `<img>` then draws the browser's broken-image
 * glyph: a grey square with a torn corner, in the middle of a pixel-art
 * device. This swaps it for a plain sunken well of the same size, which
 * reads as "nothing here yet" rather than "something is wrong".
 *
 * Keyed on the `src` that failed, so a portrait that changes expression
 * tries again with the new file rather than staying blank -- and without an
 * effect, so it costs no render.
 */
const ArtImage: React.FC<React.ImgHTMLAttributes<HTMLImageElement>> = ({ alt = '', className, style, width, height, ...rest }) => {
  const [failedSrc, setFailedSrc] = React.useState<string | null>(null);
  if (failedSrc !== null && failedSrc === rest.src) {
    return (
      <span
        aria-hidden="true"
        data-art-fallback={rest.src}
        className={`inline-block rounded-control bg-[var(--surface-sunken,var(--lcd-surface))] ${className ?? ''}`}
        style={{ width, height, ...style }}
      />
    );
  }
  return (
    // Decorative by definition -- every caller passes alt="" -- so it is
    // hidden from assistive tech outright, which is also what lets the
    // `onError` handler past jsx-a11y (a load event, not an interaction; the
    // same shape DeviceFooter's cap art uses).
    <img
      aria-hidden="true"
      {...rest}
      alt={alt}
      width={width}
      height={height}
      className={className}
      style={style}
      onError={() => setFailedSrc(rest.src ?? '')}
    />
  );
};

export default ArtImage;
