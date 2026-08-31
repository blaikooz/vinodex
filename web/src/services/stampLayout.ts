/**
 * Where the user has moved each back-plate stamp to -- iOS `StampLayoutStore`
 * (0.6.7 C1 / 0.8.7 A2, web v0.6.48), same storage key, same shape: a JSON
 * map of stamp id (or the artifact's id) to a pixel offset from the slot the
 * plate issued it at. Absence means "still where the plate put it" -- the
 * default is stored as absence rather than as a zero, so a plate nobody has
 * rearranged leaves nothing behind.
 *
 * In localStorage rather than session state: a stamp you deliberately
 * dragged to the corner is not a scroll position, and finding the plate
 * re-scattered on the next launch would read as the app forgetting.
 */
export interface StampOffset {
  dx: number;
  dy: number;
}

export const STAMP_LAYOUT_KEY = 'backPlateStampOffsets';

/** The sticker artifact's id in the layout map (iOS `DeviceBackPlate.artifactID`). */
export const ARTIFACT_ID = 'artifact';

let revision = 0;
const listeners = new Set<() => void>();
const emit = (): void => {
  revision += 1;
  listeners.forEach(fn => fn());
};

export const stampLayoutRevision = (): number => revision;
export const subscribeStampLayout = (fn: () => void): (() => void) => {
  listeners.add(fn);
  return () => listeners.delete(fn);
};

export function stampOffsets(): Record<string, StampOffset> {
  try {
    const raw = window.localStorage.getItem(STAMP_LAYOUT_KEY);
    if (!raw) return {};
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null) return {};
    const out: Record<string, StampOffset> = {};
    for (const [id, v] of Object.entries(parsed as Record<string, unknown>)) {
      const o = v as { dx?: unknown; dy?: unknown };
      if (typeof o?.dx === 'number' && typeof o?.dy === 'number' && Number.isFinite(o.dx) && Number.isFinite(o.dy)) {
        out[id] = { dx: o.dx, dy: o.dy };
      }
    }
    return out;
  } catch {
    return {};
  }
}

export const stampOffset = (id: string): StampOffset => stampOffsets()[id] ?? { dx: 0, dy: 0 };

/**
 * Records an object's new home. A move back to the issued spot clears the
 * entry rather than storing a zero; an emptied map removes the key.
 */
export function moveStamp(id: string, offset: StampOffset): void {
  try {
    const map = stampOffsets();
    if (offset.dx === 0 && offset.dy === 0) delete map[id];
    else map[id] = offset;
    if (Object.keys(map).length === 0) window.localStorage.removeItem(STAMP_LAYOUT_KEY);
    else window.localStorage.setItem(STAMP_LAYOUT_KEY, JSON.stringify(map));
  } catch {
    /* a device that refuses storage keeps the stamp for the session only */
  }
  emit();
}
