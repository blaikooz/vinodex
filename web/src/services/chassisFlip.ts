/**
 * The one route to the back plate that is not the orb -- iOS
 * `ChassisFlipRouter` (AUDIT M21, web v0.6.45): SETTINGS > ABOUT >
 * TURN THE DEVICE OVER asks; whichever `DeviceLayout` is mounted and
 * owns its own flip answers. An event bus rather than shared state:
 * the layout already owns `isFlipped`, and a second owner would be
 * the bug the iOS note warns about.
 */
type Listener = () => void;
const listeners = new Set<Listener>();

export const subscribeChassisFlip = (fn: Listener): (() => void) => {
  listeners.add(fn);
  return () => listeners.delete(fn);
};

export const requestChassisFlip = (): void => {
  listeners.forEach(fn => fn());
};
