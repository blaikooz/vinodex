/**
 * The taster's profile — a display name and an optional avatar photo — shown at
 * the top of the collection screen. Ports the identity half of
 * `vinodex-ios/Sources/VinodexUI/ProfileAvatar.swift` (AvatarStore) plus the
 * `userDisplayName` @AppStorage field.
 *
 * iOS keeps the avatar as a downscaled JPEG *file* (an image in UserDefaults
 * would tax every read). The web has no app-support directory, so we do the
 * closest equivalent: downscale to a 512px long edge at ~0.85 JPEG quality on a
 * canvas and store the result as a base64 data URI in localStorage. The name
 * keeps iOS's exact key so a backup could ever line up.
 */

const NAME_KEY = 'userDisplayName';
const AVATAR_KEY = 'avatarImage';
const MAX_EDGE = 512;
const JPEG_QUALITY = 0.85;

let revision = 0;
const listeners = new Set<() => void>();

function emit(): void {
  revision += 1;
  listeners.forEach(fn => fn());
}

function readString(key: string): string {
  try {
    return window.localStorage.getItem(key) ?? '';
  } catch {
    return '';
  }
}

export function displayName(): string {
  return readString(NAME_KEY);
}

export function setDisplayName(name: string): void {
  const trimmed = name.trim();
  try {
    if (trimmed) window.localStorage.setItem(NAME_KEY, trimmed);
    else window.localStorage.removeItem(NAME_KEY);
  } catch {
    /* quota / private mode */
  }
  emit();
}

/** The avatar as a data URI, or '' if none set. */
export function avatarDataUrl(): string {
  return readString(AVATAR_KEY);
}

export function hasAvatar(): boolean {
  return readString(AVATAR_KEY).length > 0;
}

/**
 * Adopt a picked image file: downscale to a 512px long edge, re-encode JPEG at
 * ~0.85, persist as a data URI. An undecodable file is a silent no-op (keeps
 * the existing avatar), matching iOS.
 */
export function adoptAvatar(file: Blob): Promise<void> {
  return new Promise<void>(resolve => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      try {
        const longEdge = Math.max(img.width, img.height);
        const scale = longEdge > MAX_EDGE ? MAX_EDGE / longEdge : 1;
        const w = Math.max(1, Math.round(img.width * scale));
        const h = Math.max(1, Math.round(img.height * scale));
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, w, h);
          const dataUrl = canvas.toDataURL('image/jpeg', JPEG_QUALITY);
          try {
            window.localStorage.setItem(AVATAR_KEY, dataUrl);
          } catch {
            /* quota — a large avatar can overflow; keep prior */
          }
          emit();
        }
      } catch {
        /* decode/draw failure — keep existing avatar */
      } finally {
        URL.revokeObjectURL(url);
        resolve();
      }
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve();
    };
    img.src = url;
  });
}

export function clearAvatar(): void {
  try {
    window.localStorage.removeItem(AVATAR_KEY);
  } catch {
    /* ignore */
  }
  emit();
}

export function subscribeToProfile(onChange: () => void): () => void {
  listeners.add(onChange);
  return () => listeners.delete(onChange);
}

export function profileRevision(): number {
  return revision;
}
