/** Active in-app time before offering the optional iOS updates publication. */
export const IOS_UPDATES_PROMPT_DELAY_MS = 90_000;

/**
 * Substack owns the subscription form, consent, confirmation, and subscriber
 * data; Vinodex only links to the product's dedicated publication.
 */
export const VINODEX_SUBSTACK_URL = 'https://vinodex.substack.com/';

/** Official Substack-hosted signup form supplied by the publication owner. */
export const VINODEX_SUBSTACK_EMBED_URL = 'https://vinodex.substack.com/embed';

/**
 * Browser-level acknowledgement, not player data. Once the invitation has
 * appeared, it stays spent even if the device's saved wine data is cleared.
 */
const IOS_UPDATES_PROMPT_KEY = 'iosUpdatesPromptSeen';

export const hasSeenIosUpdatesPrompt = (): boolean => {
  try {
    return window.localStorage.getItem(IOS_UPDATES_PROMPT_KEY) === '1';
  } catch {
    return false;
  }
};

export const markIosUpdatesPromptSeen = (): void => {
  try {
    window.localStorage.setItem(IOS_UPDATES_PROMPT_KEY, '1');
  } catch {
    // Storage can be unavailable in private or locked-down browsing modes.
  }
};
