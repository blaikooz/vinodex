import argentinaFlag from '../pixelflags/South America/argentina/argentina.png';
import australiaFlag from '../pixelflags/Oceania/australia/australia.png';
import austriaFlag from '../pixelflags/Europe/austria/austria.png';
import brazilFlag from '../pixelflags/South America/brazil/brazil.png';
import canadaFlag from '../pixelflags/North America/canada/canada.png';
import chileFlag from '../pixelflags/South America/chile/chile.png';
import chinaFlag from '../pixelflags/Asia/china/china.png';
import croatiaFlag from '../pixelflags/Europe/croatia/croatia.png';
import franceFlag from '../pixelflags/Europe/france/france.png';
import germanyFlag from '../pixelflags/Europe/germany/germany.png';
import greeceFlag from '../pixelflags/Europe/greece/greece.png';
import hungaryFlag from '../pixelflags/Europe/hungary/hungary.png';
import indiaFlag from '../pixelflags/Asia/india/india.png';
import italyFlag from '../pixelflags/Europe/italy/italy.png';
import japanFlag from '../pixelflags/Asia/japan/japan.png';
import newZealandFlag from '../pixelflags/Oceania/new_zealand/new_zealand.png';
import portugalFlag from '../pixelflags/Europe/portugal/portugal.png';
import southAfricaFlag from '../pixelflags/Africa/south_africa/south_africa.png';
import spainFlag from '../pixelflags/Europe/spain/spain.png';
import switzerlandFlag from '../pixelflags/Europe/switzerland/switzerland.png';
import unitedStatesFlag from '../pixelflags/North America/united_states/united_states.png';
import romaniaFlag from '../pixelflags/Europe/romania/romania.png';
import uruguayFlag from '../pixelflags/South America/uruguay/uruguay.png';
import variousFlag from '../pixelflags/Other/Geographic-Historical/various.png';

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

const US_STATE_FLAG_MODULES = import.meta.glob('../pixelflags/North America/united_states/*/*.{png,jpg,jpeg,webp}', {
  eager: true,
  import: 'default',
}) as Record<string, string>;

const US_STATE_FLAG_IMAGES: FlagImageEntry[] = Object.entries(US_STATE_FLAG_MODULES).reduce<FlagImageEntry[]>((entries, [path, image]) => {
  const match = path.match(/united_states\/([^/]+)\/[^/]+$/);
  if (!match) return entries;

  const folder = match[1];
  entries.push({
    keys: [folder, folder.replace(/_/g, ' ')],
    image,
  });
  return entries;
}, []);

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
  { keys: ['germany'], image: germanyFlag },
  { keys: ['greece'], image: greeceFlag },
  { keys: ['hungary'], image: hungaryFlag },
  { keys: ['india'], image: indiaFlag },
  { keys: ['italy'], image: italyFlag },
  { keys: ['japan'], image: japanFlag },
  { keys: ['new zealand', 'new_zealand'], image: newZealandFlag },
  { keys: ['portugal'], image: portugalFlag },
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
