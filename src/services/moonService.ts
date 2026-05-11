// Sidereal moon-sign calculator for biodynamic "wine days".
// Uses Meeus' low-precision lunar longitude (Astronomical Algorithms, ch. 47),
// then subtracts the precession offset to convert from tropical to sidereal
// (Lahiri ayanamsa approximation), so the sign matches what Maria/Matthias
// Thun's biodynamic wine-tasting calendar would show.

export type ZodiacSign =
  | 'Aries' | 'Taurus' | 'Gemini' | 'Cancer'
  | 'Leo' | 'Virgo' | 'Libra' | 'Scorpio'
  | 'Sagittarius' | 'Capricorn' | 'Aquarius' | 'Pisces';

export type BiodynamicElement = 'fruit' | 'root' | 'flower' | 'leaf';

export interface MoonReading {
  sign: ZodiacSign;
  element: BiodynamicElement;
  isFruitDay: boolean;
  siderealLongitude: number; // degrees, 0–360
  degreesIntoSign: number;   // 0–30
  nodeSuppressed: boolean;   // Moon within ±NODE_THRESHOLD_DEG of an ecliptic node
}

// Biodynamic "unfavorable" window: when |latitude| < this many degrees,
// the Moon is near an ecliptic node. ~2.5° corresponds to roughly ±5h
// of motion either side of the crossing. Standard practice in Thun calendars.
const NODE_THRESHOLD_DEG = 2.5;

export const ZODIAC_SIGNS: readonly ZodiacSign[] = [
  'Aries', 'Taurus', 'Gemini', 'Cancer',
  'Leo', 'Virgo', 'Libra', 'Scorpio',
  'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces',
] as const;

// Maria/Matthias Thun biodynamic mapping. Fire = fruit (the wine days).
const ELEMENT_BY_SIGN: Record<ZodiacSign, BiodynamicElement> = {
  Aries: 'fruit', Leo: 'fruit', Sagittarius: 'fruit',
  Taurus: 'root', Virgo: 'root', Capricorn: 'root',
  Gemini: 'flower', Libra: 'flower', Aquarius: 'flower',
  Cancer: 'leaf', Scorpio: 'leaf', Pisces: 'leaf',
};

const DEG = Math.PI / 180;

function toJulianDay(date: Date): number {
  return date.getTime() / 86_400_000 + 2_440_587.5;
}

// Lahiri ayanamsa (sidereal offset). Reference epoch J2000 ≈ 23.85°,
// drift ≈ 50.29 arcseconds/year.
function ayanamsa(jd: number): number {
  const yearsFromJ2000 = (jd - 2_451_545.0) / 365.25;
  return 23.85 + (50.29 / 3600) * yearsFromJ2000;
}

interface MoonEcliptic {
  longitude: number; // tropical, 0–360
  latitude: number;  // degrees, ±~5
}

// Meeus low-precision Moon position (Astronomical Algorithms, ch. 47),
// accurate to ~0.3° in longitude / ~0.2° in latitude — way more than enough
// for 30° sign bins and node detection.
function moonEcliptic(jd: number): MoonEcliptic {
  const T = (jd - 2_451_545.0) / 36_525;

  const Lp = 218.3164477 + 481_267.88123421 * T;
  const D  = 297.8501921 + 445_267.1114034  * T;
  const M  = 357.5291092 +  35_999.0502909  * T;
  const Mp = 134.9633964 + 477_198.8675055  * T;
  const F  =  93.2720950 + 483_202.0175233  * T;

  const dLp =
      6.289 * Math.sin(Mp * DEG)
    - 1.274 * Math.sin((2 * D - Mp) * DEG)
    + 0.658 * Math.sin(2 * D * DEG)
    - 0.186 * Math.sin(M * DEG)
    - 0.059 * Math.sin((2 * Mp - 2 * D) * DEG)
    - 0.057 * Math.sin((Mp + 2 * D - 2 * M) * DEG)
    + 0.053 * Math.sin((Mp + 2 * D) * DEG)
    + 0.046 * Math.sin((2 * D - M) * DEG)
    + 0.041 * Math.sin((Mp - M) * DEG)
    - 0.035 * Math.sin(D * DEG)
    - 0.031 * Math.sin((Mp + M) * DEG);

  // Ecliptic latitude (Meeus 47.5, leading terms)
  const lat =
      5.128 * Math.sin(F * DEG)
    + 0.281 * Math.sin((Mp + F) * DEG)
    + 0.278 * Math.sin((Mp - F) * DEG)
    + 0.173 * Math.sin((2 * D - F) * DEG);

  const lon = ((Lp + dLp) % 360 + 360) % 360;
  return { longitude: lon, latitude: lat };
}

function siderealMoonLongitude(date: Date): number {
  const jd = toJulianDay(date);
  const lon = moonEcliptic(jd).longitude - ayanamsa(jd);
  return ((lon % 360) + 360) % 360;
}

export function isInNodeWindow(date: Date): boolean {
  const jd = toJulianDay(date);
  return Math.abs(moonEcliptic(jd).latitude) < NODE_THRESHOLD_DEG;
}

export function getMoonReading(date: Date = new Date()): MoonReading {
  const lon = siderealMoonLongitude(date);
  const signIndex = Math.floor(lon / 30) % 12;
  const sign = ZODIAC_SIGNS[signIndex] ?? ZODIAC_SIGNS[0]!;
  const element = ELEMENT_BY_SIGN[sign];
  return {
    sign,
    element,
    isFruitDay: element === 'fruit',
    siderealLongitude: lon,
    degreesIntoSign: lon - signIndex * 30,
    nodeSuppressed: isInNodeWindow(date),
  };
}

// Sample readings hourly across `count` hours starting at `start`.
export function getHourlyReadings(start: Date, count: number): MoonReading[] {
  const out: MoonReading[] = [];
  for (let i = 0; i < count; i++) {
    out.push(getMoonReading(new Date(start.getTime() + i * 3_600_000)));
  }
  return out;
}

// Sample one reading per day at noon local for `count` consecutive days.
export function getDailyReadings(start: Date, count: number): MoonReading[] {
  const out: MoonReading[] = [];
  for (let i = 0; i < count; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    d.setHours(12, 0, 0, 0);
    out.push(getMoonReading(d));
  }
  return out;
}

export function getElementForSign(sign: ZodiacSign): BiodynamicElement {
  return ELEMENT_BY_SIGN[sign];
}

// Find the next datetime (within ~32 days) when the Moon enters `targetSign`.
// Samples hourly until the sign changes to the target, then refines by
// bisection to ~1-minute precision.
export function getNextDateInSign(
  targetSign: ZodiacSign,
  fromDate: Date = new Date(),
): Date | null {
  const HOUR = 3_600_000;
  const start = fromDate.getTime();
  const horizon = start + 32 * 24 * HOUR;

  let prevTime = start;
  let prevSign = getMoonReading(new Date(prevTime)).sign;

  for (let t = start + HOUR; t <= horizon; t += HOUR) {
    const sign = getMoonReading(new Date(t)).sign;
    if (sign === targetSign && prevSign !== targetSign) {
      // bisect [prevTime, t] for the precise crossing
      let lo = prevTime;
      let hi = t;
      while (hi - lo > 60_000) {
        const mid = (lo + hi) / 2;
        const midSign = getMoonReading(new Date(mid)).sign;
        if (midSign === targetSign) hi = mid;
        else lo = mid;
      }
      return new Date(hi);
    }
    prevTime = t;
    prevSign = sign;
  }
  return null;
}
