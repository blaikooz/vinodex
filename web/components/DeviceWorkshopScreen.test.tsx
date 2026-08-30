import { cleanup, fireEvent, render, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import DeviceWorkshopScreen from './DeviceWorkshopScreen';

/**
 * The workshop's first component suite (Phase 6, v0.6.35): 500 lines of
 * screen with no render pin was the review's largest test gap. The suite
 * covers the door, the save/edit/delete lifecycle and the fitted derivation
 * -- the states a player actually passes through.
 */
afterEach(cleanup);
beforeEach(() => window.localStorage.clear());

const noop = () => undefined;
const mount = () =>
  render(
    <MemoryRouter initialEntries={['/workshop']}>
      <DeviceWorkshopScreen onBack={noop} onHome={noop} />
    </MemoryRouter>,
  );

const saveAs = (view: ReturnType<typeof mount>, name: string) => {
  fireEvent.change(view.getByLabelText('Build name'), { target: { value: name } });
  fireEvent.click(view.getByRole('button', { name: 'SAVE' }));
};

describe('the workshop door', () => {
  it('is locked under the starter harness without the workshop grant', () => {
    window.localStorage.setItem('starterOnly', 'true');
    const view = mount();
    expect(view.getByText('THE WORKSHOP IS LOCKED')).toBeTruthy();
    expect(view.queryByLabelText('Build name')).toBeNull();
  });

  it('opens with the grant, and for everyone off the harness', () => {
    window.localStorage.setItem('starterOnly', 'true');
    window.localStorage.setItem('grantedEntitlements', JSON.stringify(['workshop']));
    expect(mount().getByLabelText('Build name')).toBeTruthy();
    cleanup();
    window.localStorage.clear();
    expect(mount().getByLabelText('Build name')).toBeTruthy();
  });
});

describe('saving a build', () => {
  it('needs a name first, and says so without saving anything', () => {
    const view = mount();
    fireEvent.click(view.getByRole('button', { name: 'SAVE' }));
    expect(view.getByRole('status').textContent).toBe('GIVE THE BUILD A NAME FIRST.');
    expect(view.getByText(/Nothing saved yet/)).toBeTruthy();
  });

  it('saves under the typed name, clears the field, and the new build is FITTED', () => {
    const view = mount();
    saveAs(view, 'garage one');
    expect(view.getByRole('status').textContent).toBe('SAVED AS GARAGE ONE.');
    expect((view.getByLabelText('Build name') as HTMLInputElement).value).toBe('');
    // The device is wearing exactly what was just saved: the fitted badge in
    // the header and the card both carry the name, and the chip appears.
    expect(view.getAllByText('GARAGE ONE').length).toBe(2);
    expect(view.getAllByText('FITTED').length).toBeGreaterThanOrEqual(1);
    expect((view.getByRole('button', { name: 'FIT' }) as HTMLButtonElement).disabled).toBe(true);
  });

  it('re-saving under a held name replaces rather than duplicates', () => {
    const view = mount();
    saveAs(view, 'GARAGE');
    saveAs(view, 'GARAGE');
    expect(view.getByRole('status').textContent).toBe('GARAGE UPDATED.');
    // Two mentions -- the fitted badge and the one card. A duplicate card
    // would make three.
    expect(view.getAllByText('GARAGE').length).toBe(2);
  });
});

describe('the saved list', () => {
  it('EDIT loads the name back into the field -- re-saving is editing', () => {
    const view = mount();
    saveAs(view, 'GARAGE');
    fireEvent.click(view.getByRole('button', { name: 'EDIT' }));
    expect((view.getByLabelText('Build name') as HTMLInputElement).value).toBe('GARAGE');
  });

  it('DELETE asks first, CANCEL keeps the build, confirming removes it', () => {
    const view = mount();
    saveAs(view, 'GARAGE');
    fireEvent.click(view.getByRole('button', { name: 'DELETE' }));
    const dialog = view.getByRole('alertdialog');
    expect(within(dialog).getByText('DELETE GARAGE?')).toBeTruthy();
    fireEvent.click(within(dialog).getByRole('button', { name: 'CANCEL' }));
    expect(view.queryByRole('alertdialog')).toBeNull();
    expect(view.getAllByText('GARAGE').length).toBeGreaterThanOrEqual(1);

    fireEvent.click(view.getByRole('button', { name: 'DELETE' }));
    fireEvent.click(within(view.getByRole('alertdialog')).getByRole('button', { name: 'DELETE' }));
    expect(view.queryByRole('alertdialog')).toBeNull();
    expect(view.queryByText('GARAGE')).toBeNull();
    expect(view.getByText(/Nothing saved yet/)).toBeTruthy();
  });
});
