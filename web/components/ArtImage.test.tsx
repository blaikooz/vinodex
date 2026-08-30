import { cleanup, fireEvent, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import ArtImage from './ArtImage';

afterEach(cleanup);

describe('<ArtImage />', () => {
  it('is a plain img until the file fails, then a same-sized well', () => {
    const view = render(<ArtImage src="/art/vino/vino-missing.png" alt="" width={42} height={42} data-x="1" />);
    const img = view.container.querySelector('img')!;
    expect(img.getAttribute('src')).toBe('/art/vino/vino-missing.png');
    expect(img.getAttribute('data-x')).toBe('1');
    fireEvent.error(img);
    expect(view.container.querySelector('img')).toBeNull();
    const well = view.container.querySelector<HTMLElement>('[data-art-fallback]')!;
    expect(well.style.width).toBe('42px');
    expect(well.style.height).toBe('42px');
    expect(well.getAttribute('aria-hidden')).toBe('true');
  });

  it('tries again when the src changes', () => {
    const view = render(<ArtImage src="/art/vino/a.png" alt="" width={10} height={10} />);
    fireEvent.error(view.container.querySelector('img')!);
    expect(view.container.querySelector('img')).toBeNull();
    view.rerender(<ArtImage src="/art/vino/b.png" alt="" width={10} height={10} />);
    expect(view.container.querySelector('img')?.getAttribute('src')).toBe('/art/vino/b.png');
  });
});
