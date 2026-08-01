import argentinaFlag from '@/shared/pixelflags/South America/argentina/argentina.png';
import australiaFlag from '@/shared/pixelflags/Oceania/australia/australia.png';
import austriaFlag from '@/shared/pixelflags/Europe/austria/austria.png';
import brazilFlag from '@/shared/pixelflags/South America/brazil/brazil.png';
import canadaFlag from '@/shared/pixelflags/North America/canada/canada.png';
import chileFlag from '@/shared/pixelflags/South America/chile/chile.png';
import chinaFlag from '@/shared/pixelflags/Asia/china/china.png';
import croatiaFlag from '@/shared/pixelflags/Europe/croatia/croatia.png';
import franceFlag from '@/shared/pixelflags/Europe/france/france.png';
import georgiaFlag from '@/shared/pixelflags/Europe/georgia_country/georgia_country_flag.png';
import germanyFlag from '@/shared/pixelflags/Europe/germany/germany.png';
import greeceFlag from '@/shared/pixelflags/Europe/greece/greece.png';
import hungaryFlag from '@/shared/pixelflags/Europe/hungary/hungary.png';
import indiaFlag from '@/shared/pixelflags/Asia/india/india.png';
import italyFlag from '@/shared/pixelflags/Europe/italy/italy.png';
import japanFlag from '@/shared/pixelflags/Asia/japan/japan.png';
import newZealandFlag from '@/shared/pixelflags/Oceania/new_zealand/new_zealand.png';
import portugalFlag from '@/shared/pixelflags/Europe/portugal/portugal.png';
import moroccoFlag from '@/shared/pixelflags/Africa/morocco/morocco.png';
import southAfricaFlag from '@/shared/pixelflags/Africa/south_africa/south_africa.png';
import spainFlag from '@/shared/pixelflags/Europe/spain/spain.png';
import switzerlandFlag from '@/shared/pixelflags/Europe/switzerland/switzerland.png';
import unitedStatesFlag from '@/shared/pixelflags/North America/united_states/united_states.png';
import romaniaFlag from '@/shared/pixelflags/Europe/romania/romania.png';
import uruguayFlag from '@/shared/pixelflags/South America/uruguay/uruguay.png';
import variousFlag from '@/shared/pixelflags/Other/Geographic-Historical/various.png';

interface FlagImageEntry {
  keys: string[];
  image: string;
}

interface FlagImageOptions {
  preferUsState?: boolean;
}

const normalizeFlagKey = (value: string) =>
  value
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

// Uses the `@/` alias (repo root), like the 26 static imports above.
//
// This pattern pointed at `../pixelflags/…` — i.e. `web/pixelflags/`, a
// directory that has never existed — so it matched **zero** modules and every
// US state flag silently fell back to no image. A glob that matches nothing is
// not an error in Vite, just an empty object, which is how it sat broken
// unnoticed. Verified fixed: the 56 state folders now resolve (they are ~280 B
// each, so Vite inlines them as base64 rather than emitting files — check the
// bundle, not the asset list). (0.6.5, batch 4 phase 1.)
const US_STATE_FLAG_MODULES = import.meta.glob('@/shared/pixelflags/North America/united_states/*/*.{png,jpg,jpeg,webp}', {
  eager: true,
  import: 'default',
}) as Record<string, string>;

const US_STATE_FLAG_IMAGES: FlagImageEntry[] = (() => {
  const folderMap = new Map<string, string>();
  Object.entries(US_STATE_FLAG_MODULES).forEach(([path, image]) => {
    const match = path.match(/united_states\/([^/]+)\/[^/]+$/);
    const folder = match?.[1];
    if (!folder) return;
    const isBack = path.includes('_back.');
    if (!folderMap.has(folder) || isBack) folderMap.set(folder, image);
  });
  return Array.from(folderMap.entries()).map(([folder, image]) => ({
    keys: [folder, folder.replace(/_/g, ' ')],
    image,
  }));
})();

const FLAG_IMAGES: FlagImageEntry[] = [
  { keys: ['argentina'], image: argentinaFlag },
  { keys: ['australia'], image: australiaFlag },
  { keys: ['austria'], image: austriaFlag },
  { keys: ['brazil'], image: brazilFlag },
  { keys: ['canada'], image: canadaFlag },
  { keys: ['chile'], image: chileFlag },
  { keys: ['china'], image: chinaFlag },
  { keys: ['croatia'], image: croatiaFlag },
  { keys: ['france'], image: franceFlag },
  { keys: ['georgia'], image: georgiaFlag },
  { keys: ['germany'], image: germanyFlag },
  { keys: ['greece'], image: greeceFlag },
  { keys: ['hungary'], image: hungaryFlag },
  { keys: ['india'], image: indiaFlag },
  { keys: ['italy'], image: italyFlag },
  { keys: ['japan'], image: japanFlag },
  { keys: ['new zealand', 'new_zealand'], image: newZealandFlag },
  { keys: ['portugal'], image: portugalFlag },
  { keys: ['morocco'], image: moroccoFlag },
  { keys: ['south africa', 'south_africa'], image: southAfricaFlag },
  { keys: ['spain'], image: spainFlag },
  { keys: ['switzerland'], image: switzerlandFlag },
  { keys: ['united states', 'usa', 'us'], image: unitedStatesFlag },
  { keys: ['romania'], image: romaniaFlag },
  { keys: ['uruguay'], image: uruguayFlag },
  { keys: ['various'], image: variousFlag },
];

const matchesNormalizedKey = (normalizedOrigin: string, key: string) => {
  const normalizedKey = normalizeFlagKey(key);
  if (normalizedOrigin === normalizedKey) return true;
  return normalizedOrigin.includes(` ${normalizedKey} `)
    || normalizedOrigin.startsWith(`${normalizedKey} `)
    || normalizedOrigin.endsWith(` ${normalizedKey}`);
};

export const getFlagImage = (origin?: string, options?: FlagImageOptions) => {
  if (!origin) return undefined;
  const normalizedOrigin = normalizeFlagKey(origin);

  if (options?.preferUsState) {
    const usStateMatch = US_STATE_FLAG_IMAGES.find(({ keys }) => keys.some((key) => matchesNormalizedKey(normalizedOrigin, key)));
    if (usStateMatch) return usStateMatch.image;
  }

  const match = FLAG_IMAGES.find(({ keys }) => keys.some((key) => matchesNormalizedKey(normalizedOrigin, key)));
  return match?.image;
};
