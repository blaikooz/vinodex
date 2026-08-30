import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import ChassisInternals, { INTERNALS_TRACES } from './ChassisInternals';

describe('ChassisInternals (v0.6.30, iOS InternalsView port)', () => {
  it('draws two boards, every trace and the four corner screws, inert to pointers', () => {
    const { container } = render(<ChassisInternals />);
    const host = container.querySelector('[data-chassis-internals]') as HTMLElement;
    expect(host).toBeTruthy();
    expect(host.getAttribute('aria-hidden')).toBe('true');
    expect(host.className).toContain('pointer-events-none');
    expect(container.querySelectorAll('[data-board]').length).toBe(2);
    expect(container.querySelectorAll('[data-trace]').length).toBe(INTERNALS_TRACES.length);
    expect(INTERNALS_TRACES.length).toBe(19);
    expect(container.querySelectorAll('circle[fill="url(#internals-screw)"]').length).toBe(4);
  });

  it('leaves the screws to the back plate when asked', () => {
    const { container } = render(<ChassisInternals screws={false} />);
    expect(container.querySelectorAll('circle[fill="url(#internals-screw)"]').length).toBe(0);
  });
});
