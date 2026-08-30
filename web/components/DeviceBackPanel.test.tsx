import { cleanup, fireEvent, render, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import DeviceBackPanel from './DeviceBackPanel';

/**
 * The plate follows the shell (v0.6.43, iOS ChassisSkin.backPlate): steel is
 * CLASSIC's alone, a patterned front keeps its pattern on the back, plastic
 * reads as moulding, and a clear shell shows the board.
 */
afterEach(cleanup);
beforeEach(() => window.localStorage.clear());

const noop = () => undefined;
const finishFor = (skin: string) => {
  window.localStorage.setItem('chassisSkin', skin);
  const view = render(<DeviceBackPanel onReturn={noop} />);
  const plate = view.container.querySelector('[data-plate-finish]');
  const finish = plate?.getAttribute('data-plate-finish');
  cleanup();
  return finish;
};

describe('the plate material', () => {
  it('is brushed steel only on CLASSIC, the front pattern on patterned shells, moulding elsewhere, internals when clear', () => {
    expect(finishFor('CLASSIC')).toBe('brushed');
    expect(finishFor('OAKED')).toBe('pattern');
    expect(finishFor('STEEL')).toBe('pattern');
    expect(finishFor('CHRISTMAS')).toBe('pattern');
    expect(finishFor('BURGUNDY')).toBe('moulded');
    expect(finishFor('GLOUGLOU')).toBe('internals');
  });
});

describe('the franked stamps', () => {
  it('draws the earned stamp as its art and opens its story on tap (iOS 0.6.4 F2)', () => {
    window.localStorage.setItem('chassisSkin', 'CLASSIC');
    window.localStorage.setItem('triedEntryIDs', JSON.stringify(['G001']));
    const view = render(<DeviceBackPanel onReturn={noop} />);
    const stamp = view.getByRole('button', { name: 'FIRST SIP stamp. Opens its story.' });
    fireEvent.click(stamp);
    const alert = view.getByRole('alertdialog');
    expect(alert.textContent).toContain('Issued for your first tasting');
    fireEvent.click(within(alert).getByRole('button', { name: 'OK' }));
    expect(view.queryByRole('alertdialog')).toBeNull();
    // The plate's own way back stays a real control.
    expect(view.getByRole('button', { name: 'Flip device back to front' })).toBeTruthy();
  });
});
