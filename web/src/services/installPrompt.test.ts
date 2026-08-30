import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  bindInstallPrompt,
  canPromptInstall,
  installSurface,
  isIosDevice,
  promptInstall,
  subscribeInstall,
} from './installPrompt';

const offer = (outcome: 'accepted' | 'dismissed') => {
  const e = new Event('beforeinstallprompt', { cancelable: true }) as Event & {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
  };
  e.prompt = vi.fn(async () => undefined);
  e.userChoice = Promise.resolve({ outcome });
  return e;
};

describe('the install offer', () => {
  afterEach(() => vi.restoreAllMocks());

  it('is nothing until the browser offers, then fires once and is spent', async () => {
    bindInstallPrompt();
    const fn = vi.fn();
    const stop = subscribeInstall(fn);
    expect(canPromptInstall()).toBe(false);
    expect(await promptInstall()).toBe('unavailable');

    const e = offer('accepted');
    window.dispatchEvent(e);
    // The default is prevented so Chrome's own banner stays down.
    expect(e.defaultPrevented).toBe(true);
    expect(canPromptInstall()).toBe(true);
    expect(installSurface()).toBe('prompt');
    expect(fn).toHaveBeenCalledTimes(1);

    expect(await promptInstall()).toBe('accepted');
    expect(e.prompt).toHaveBeenCalledOnce();
    expect(canPromptInstall()).toBe(false);
    expect(fn).toHaveBeenCalledTimes(2);
    stop();
  });

  it('forgets the offer when the app is installed', () => {
    window.dispatchEvent(offer('dismissed'));
    expect(canPromptInstall()).toBe(true);
    window.dispatchEvent(new Event('appinstalled'));
    expect(canPromptInstall()).toBe(false);
  });

  it('knows an iPhone, an iPad and a Mac apart', () => {
    expect(isIosDevice('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15')).toBe(true);
    expect(isIosDevice('Mozilla/5.0 (iPad; CPU OS 16_0 like Mac OS X)')).toBe(true);
    expect(isIosDevice('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15')).toBe(false);
    expect(isIosDevice('Mozilla/5.0 (Linux; Android 14) Chrome/120')).toBe(false);
  });

  it('picks the surface in order: standalone, prompt, iOS, nothing', () => {
    // jsdom: no matchMedia, no offer, not iOS -> nothing to show but the hint.
    expect(installSurface()).toBe('none');
    vi.spyOn(navigator, 'userAgent', 'get').mockReturnValue('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)');
    expect(installSurface()).toBe('ios');
    window.dispatchEvent(offer('dismissed'));
    expect(installSurface()).toBe('prompt');
    vi.spyOn(window, 'matchMedia').mockReturnValue({ matches: true } as MediaQueryList);
    expect(installSurface()).toBe('standalone');
    window.dispatchEvent(new Event('appinstalled'));
  });
});
