import { GrapeBodyClass, WineEntry, isGrapeEntry } from '../../types';

export type GrapeColorLabel = 'RED' | 'WHITE';

export interface GrapeDisplayChipColors {
  bg: string;
  border: string;
  text: string;
}

const BODY_LABELS: readonly GrapeBodyClass[] = ['Light', 'Light-Medium', 'Medium', 'Medium-Full', 'Full'];

const normalizeText = (value?: string) => (value || '').trim().toLowerCase();

const toTitleCase = (value: string) =>
  value
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join('-')
    .replace(/-([A-Z])/g, '-$1');

export const bodyFromStyleText = (value?: string): GrapeBodyClass | undefined => {
  const text = normalizeText(value)
    .replace(/-bodied/g, '')
    .replace(/body/g, '')
    .replace(/red|white|rose|ros\u00e9|orange|sparkling|aromatic|sweet/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (!text) return undefined;
  if (text.includes('medium full') || text.includes('full medium')) return 'Medium-Full';
  if (text.includes('light medium') || text.includes('medium light')) return 'Light-Medium';
  if (text.includes('full')) return 'Full';
  if (text.includes('medium')) return 'Medium';
  if (text.includes('light')) return 'Light';
  return undefined;
};

export const getGrapeColorLabel = (entry: WineEntry): GrapeColorLabel => {
  if (!isGrapeEntry(entry)) return 'RED';

  const type = normalizeText(entry.grapeType || entry.grapeCard?.type);
  if (type === 'white') return 'WHITE';
  if (type === 'red') return 'RED';

  const wineType = normalizeText(entry.grapeStyle || entry.grapeCard?.style || entry.wineType);
  if (wineType.includes('white')) return 'WHITE';
  return 'RED';
};

export const getGrapeBodyLabel = (entry: WineEntry): GrapeBodyClass => {
  if (!isGrapeEntry(entry)) return 'Medium';

  if (entry.grapeBodyClass) return entry.grapeBodyClass;

  const detailBody = entry.details.body;
  if (detailBody) {
    const matched = BODY_LABELS.find((label) => normalizeText(detailBody) === normalizeText(label));
    if (matched) return matched;
  }

  return bodyFromStyleText(entry.grapeStyle || entry.grapeCard?.style || entry.wineType) || 'Medium';
};

export const getGrapeColorChipColors = (color: GrapeColorLabel): GrapeDisplayChipColors => {
  if (color === 'WHITE') {
    return { bg: '#fef3c7', border: '#d97706', text: '#422006' };
  }

  return { bg: '#4c0519', border: '#be123c', text: '#ffe4e6' };
};

export const getGrapeBodyChipColors = (body: string): GrapeDisplayChipColors => {
  switch (body) {
    case 'Light':
      return { bg: '#082f49', border: '#0ea5e9', text: '#e0f2fe' };
    case 'Light-Medium':
      return { bg: '#164e63', border: '#06b6d4', text: '#cffafe' };
    case 'Medium':
      return { bg: '#14532d', border: '#22c55e', text: '#dcfce7' };
    case 'Medium-Full':
      return { bg: '#78350f', border: '#f59e0b', text: '#fef3c7' };
    case 'Full':
      return { bg: '#451a03', border: '#ea580c', text: '#ffedd5' };
    default:
      return { bg: '#1f2937', border: '#4b5563', text: '#e5e7eb' };
  }
};

export const getGrapeBodyFilterValue = (body: string, color: GrapeColorLabel) => `${body} ${toTitleCase(color.toLowerCase())}`;