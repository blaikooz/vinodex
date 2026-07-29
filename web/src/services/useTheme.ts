import { useSyncExternalStore } from 'react';
import { ThemeState, readTheme, subscribeToTheme, themeRevision } from './theme';

/**
 * The active theme, re-rendering the caller whenever it changes.
 *
 * Same external-store shape as `useBookmarks`: the theme lives outside React so
 * `applyTheme()` can run at boot before the tree mounts, and so the settings
 * panel can write it without a provider threaded through every screen.
 */
export function useTheme(): ThemeState {
  useSyncExternalStore(subscribeToTheme, themeRevision, themeRevision);
  return readTheme();
}
