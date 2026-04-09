import argentinaFlag from '../pixelflags/South America/argentina/argentina.png';
import australiaFlag from '../pixelflags/Oceania/australia/australia.png';
import austriaFlag from '../pixelflags/Europe/austria/austria.png';
import brazilFlag from '../pixelflags/South America/brazil/brazil.png';
import canadaFlag from '../pixelflags/North America/canada/canada.png';
import californiaFlag from '../pixelflags/North America/united_states/california/california.png';
import chileFlag from '../pixelflags/South America/chile/chile.png';
import chinaFlag from '../pixelflags/Asia/china/china.png';
import croatiaFlag from '../pixelflags/Europe/croatia/croatia.png';
import franceFlag from '../pixelflags/Europe/france/france.png';
import georgiaFlag from '../pixelflags/North America/united_states/georgia/georgia.png';
import germanyFlag from '../pixelflags/Europe/germany/germany.png';
import greeceFlag from '../pixelflags/Europe/greece/greece.png';
import hungaryFlag from '../pixelflags/Europe/hungary/hungary.png';
import indiaFlag from '../pixelflags/Asia/india/india.png';
import italyFlag from '../pixelflags/Europe/italy/italy.png';
import japanFlag from '../pixelflags/Asia/japan/japan.png';
import newYorkFlag from '../pixelflags/North America/united_states/new_york/new_york.png';
import newZealandFlag from '../pixelflags/Oceania/new_zealand/new_zealand.png';
import oregonFlag from '../pixelflags/North America/united_states/oregon/oregon_back.png';
import portugalFlag from '../pixelflags/Europe/portugal/portugal.png';
import southAfricaFlag from '../pixelflags/Africa/south_africa/south_africa.png';
import spainFlag from '../pixelflags/Europe/spain/spain.png';
import unitedStatesFlag from '../pixelflags/North America/united_states/united_states.png';
import uruguayFlag from '../pixelflags/South America/uruguay/uruguay.png';
import variousFlag from '../pixelflags/Other/Geographic-Historical/various.png';
import washingtonFlag from '../pixelflags/North America/united_states/washington/washington.png';

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
