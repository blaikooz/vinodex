import argentinaFlag from '../flags/argentina.png';
import australiaFlag from '../flags/australia.png';
import austriaFlag from '../flags/austria.png';
import brazilFlag from '../flags/brazil.png';
import canadaFlag from '../flags/canada.png';
import californiaFlag from '../flags/california.png';
import chileFlag from '../flags/chile.png';
import chinaFlag from '../flags/china.png';
import croatiaFlag from '../flags/croatia.png';
import franceFlag from '../flags/france.png';
import georgiaFlag from '../flags/georgia.png';
import germanyFlag from '../flags/germany.png';
import greeceFlag from '../flags/greece.png';
import hungaryFlag from '../flags/hungary.png';
import indiaFlag from '../flags/india.png';
import italyFlag from '../flags/italy.png';
import japanFlag from '../flags/japan.png';
import newYorkFlag from '../flags/new_york.png';
import newZealandFlag from '../flags/new_zealand.png';
import oregonFlag from '../flags/oregon_back.png';
import portugalFlag from '../flags/portugal.png';
import southAfricaFlag from '../flags/south_africa.png';
import spainFlag from '../flags/spain.png';
import unitedStatesFlag from '../flags/united_states.png';
import uruguayFlag from '../flags/uruguay.png';
import variousFlag from '../flags/variousflags.png';
import washingtonFlag from '../flags/washington.png';

interface FlagImageEntry {
  keys: string[];
  image: string;
}

const FLAG_IMAGES: FlagImageEntry[] = [
  { keys: ['argentina'], image: argentinaFlag },
  { keys: ['australia'], image: australiaFlag },
  { keys: ['austria'], image: austriaFlag },
  { keys: ['brazil'], image: brazilFlag },
  { keys: ['canada'], image: canadaFlag },
  { keys: ['california'], image: californiaFlag },
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
  { keys: ['new york', 'new_york'], image: newYorkFlag },
  { keys: ['new zealand', 'new_zealand'], image: newZealandFlag },
  { keys: ['oregon', 'oregon_back'], image: oregonFlag },
  { keys: ['portugal'], image: portugalFlag },
  { keys: ['south africa', 'south_africa'], image: southAfricaFlag },
  { keys: ['spain'], image: spainFlag },
  { keys: ['united states', 'usa', 'us'], image: unitedStatesFlag },
  { keys: ['uruguay'], image: uruguayFlag },
  { keys: ['various'], image: variousFlag },
  { keys: ['washington'], image: washingtonFlag },
];

export const getFlagImage = (origin?: string) => {
  if (!origin) return undefined;
  const normalizedOrigin = origin
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const matchesKey = (key: string) => {
    const normalizedKey = key
      .toLowerCase()
      .replace(/_/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    if (normalizedOrigin === normalizedKey) return true;
    return normalizedOrigin.includes(` ${normalizedKey} `)
      || normalizedOrigin.startsWith(`${normalizedKey} `)
      || normalizedOrigin.endsWith(` ${normalizedKey}`);
  };

  const match = FLAG_IMAGES.find(({ keys }) => keys.some(matchesKey));
  return match?.image;
};
