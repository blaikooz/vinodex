import { WineEntry } from '../types';

export const COUNTRIES: WineEntry[] = [
  {
    id: 'SCA001',
    name: 'California',
    description: 'California is the leading U.S. wine state, spanning cool coastal valleys to warm inland zones with many benchmark AVAs.',
    category: 'COUNTRY_GATE',
    color: '#312e81',
    icon: 'flag',
    tags: ['AVA', 'STATE'],
    details: {
      origin: 'USA',
      classification: 'STATE',
      keyRegions: ['Napa Valley', 'Sonoma', 'Paso Robles', 'Santa Barbara', 'Lodi'],
      notableGrapes: ['Cabernet Sauvignon', 'Chardonnay', 'Pinot Noir']
    }
  },
  {
    id: 'SNY001',
    name: 'New York',
    description: 'New York is a cool-climate U.S. wine state centered on lake and coastal zones, known for Riesling and Cabernet Franc.',
    category: 'COUNTRY_GATE',
    color: '#0f172a',
    icon: 'flag',
    tags: ['AVA', 'STATE'],
    details: {
      origin: 'USA',
      classification: 'STATE',
      keyRegions: ['Finger Lakes'],
      notableGrapes: ['Riesling', 'Cabernet Franc', 'Chardonnay']
    }
  },
  {
    id: 'SOR001',
    name: 'Oregon',
    description: 'Oregon is a benchmark cool-climate U.S. state, with world-class Pinot Noir and Chardonnay in valley and hillside AVAs.',
    category: 'COUNTRY_GATE',
    color: '#14532d',
    icon: 'flag',
    tags: ['AVA', 'STATE'],
    details: {
      origin: 'USA',
      classification: 'STATE',
      keyRegions: ['Willamette Valley'],
      notableGrapes: ['Pinot Noir', 'Chardonnay', 'Pinot Gris']
    }
  },
  {
    id: 'SWA001',
    name: 'Washington',
    description: 'Washington State combines warm continental fruit concentration with high-altitude freshness in top AVAs.',
    category: 'COUNTRY_GATE',
    color: '#1e1b4b',
    icon: 'flag',
    tags: ['AVA', 'STATE'],
    details: {
      origin: 'USA',
      classification: 'STATE',
      keyRegions: ['Walla Walla'],
      notableGrapes: ['Cabernet Sauvignon', 'Merlot', 'Syrah']
    }
  },
  {
    id: 'C001',
    name: 'France',
    description: 'France hosts the world’s most celebrated appellations, spanning Champagne, Bordeaux, Burgundy, and more.',
    category: 'COUNTRY_GATE',
    color: '#1f3f99',
    icon: 'flag',
    tags: ['AOP (Appellation d’Origine Protégée)', 'IGP (Indication Géographique Protégée)', 'VDF (Vin de France)', 'COUNTRY'],
    details: {
      origin: 'France',
      classification: 'COUNTRY',
      keyRegions: ['Bordeaux', 'Burgundy', 'Champagne', 'Loire Valley', 'Rhone Valley', 'Alsace', 'Provence', 'Languedoc'],
      notableGrapes: ['Cabernet Sauvignon', 'Pinot Noir', 'Chardonnay']
    }
  },
  {
    id: 'C002',
    name: 'Italy',
    description: 'Italy is rich in regional diversity, from the hills of Tuscany to the volcanic soils of Sicily.',
    category: 'COUNTRY_GATE',
    color: '#14532d',
    icon: 'flag',
    tags: ['DOCG', 'DOC', 'IGT', 'COUNTRY'],
    details: {
      origin: 'Italy',
      classification: 'COUNTRY',
      keyRegions: ['Tuscany', 'Piedmont', 'Veneto', 'Sicily', 'Campania', 'Friuli-Venezia Giulia', 'Alto Adige', 'Abruzzo'],
      notableGrapes: ['Sangiovese', 'Nebbiolo', 'Barbera']
    }
  },
  {
    id: 'C003',
    name: 'Spain',
    description: 'Spain blends Old World tradition and innovation across regions such as Rioja, Ribiera del Duero, and Priorat.',
    category: 'COUNTRY_GATE',
    color: '#7f1d1d',
    icon: 'flag',
    tags: ['DO', 'DOCa', 'COUNTRY'],
    details: {
      origin: 'Spain',
      classification: 'COUNTRY',
      keyRegions: ['Rioja', 'Ribiera del Duero', 'Priorat', 'Rias Baixas', 'Rueda', 'Jerez'],
      notableGrapes: ['Tempranillo', 'Grenache', 'Carignan']
    }
  },
  {
    id: 'C004',
    name: 'Germany',
    description: 'Germany is known for precision white wines, especially Riesling from steep vineyard slopes.',
    category: 'COUNTRY_GATE',
    color: '#422006',
    icon: 'flag',
    tags: ['QbA', 'GG', 'COUNTRY'],
    details: {
      origin: 'Germany',
      classification: 'COUNTRY',
      keyRegions: ['Mosel', 'Rheingau', 'Pfalz', 'Baden'],
      notableGrapes: ['Riesling', 'Spätburgunder', 'Müller-Thurgau']
    }
  },
  {
    id: 'C005',
    name: 'Portugal',
    description: 'Portugal excels in fortified wines like Port and Madeira, and offers vibrant dry wines from Douro and Vinho Verde.',
    category: 'COUNTRY_GATE',
    color: '#064e3b',
    icon: 'flag',
    tags: ['DOC', 'VR', 'COUNTRY'],
    details: {
      origin: 'Portugal',
      classification: 'COUNTRY',
      keyRegions: ['Douro', 'Vinho Verde', 'Alentejo'],
      notableGrapes: ['Touriga Nacional', 'Vinhão', 'Tinta Pinheira']
    }
  },
  {
    id: 'C006',
    name: 'Hungary',
    description: 'Hungary’s legendary sweet wines come from Tokaj, and its other vineyards produce elegant dry whites and reds.',
    category: 'COUNTRY_GATE',
    color: '#365314',
    icon: 'flag',
    tags: ['PDO', 'PGI', 'COUNTRY'],
    details: {
      origin: 'Hungary',
      classification: 'COUNTRY',
      keyRegions: ['Tokaj'],
      notableGrapes: ['Furmint', 'Hárslevelű', 'Kékfrankos']
    }
  },
  {
    id: 'C007',
    name: 'Austria',
    description: 'Austria is prized for crisp Grüner Veltliner and Riesling from valleys like Wachau and Kamptal.',
    category: 'COUNTRY_GATE',
    color: '#831843',
    icon: 'flag',
    tags: ['DAC', 'COUNTRY'],
    details: {
      origin: 'Austria',
      classification: 'COUNTRY',
      keyRegions: ['Wachau', 'Kamptal'],
      notableGrapes: ['Grüner Veltliner', 'Riesling', 'Zweigelt']
    }
  },
  {
    id: 'C008',
    name: 'Switzerland',
    description: 'Switzerland produces elegant wines from steep terraces, especially Chasselas whites and Pinot Noir reds from Valais and Vaud.',
    category: 'COUNTRY_GATE',
    color: '#dc2626',
    icon: 'flag',
    tags: ['AOC', 'COUNTRY'],
    details: {
      origin: 'Switzerland',
      classification: 'COUNTRY',
      keyRegions: ['Valais', 'Vaud'],
      notableGrapes: ['Chasselas', 'Pinot Noir', 'Gamay']
    }
  },
  {
    id: 'C009',
    name: 'Romania',
    description: 'Romania is known for Feteasca Neagra and Feteasca Alba, with emerging regions like Dealu Mare producing structured reds.',
    category: 'COUNTRY_GATE',
    color: '#1e40af',
    icon: 'flag',
    tags: ['DOC', 'COUNTRY'],
    details: {
      origin: 'Romania',
      classification: 'COUNTRY',
      keyRegions: ['Dealu Mare'],
      notableGrapes: ['Feteasca Neagra', 'Feteasca Alba', 'Cabernet Sauvignon']
    }
  },
  {
    id: 'C010',
    name: 'Greece',
    description: 'Greece produces mineral-rich wines from islands and mountain vineyards, led by Santorini and Nemea.',
    category: 'COUNTRY_GATE',
    color: '#0e7490',
    icon: 'flag',
    tags: ['PDO', 'PGI', 'COUNTRY'],
    details: {
      origin: 'Greece',
      classification: 'COUNTRY',
      keyRegions: ['Santorini'],
      notableGrapes: ['Assyrtiko', 'Agiorgitiko', 'Moschofilero']
    }
  },
  {
    id: 'C011',
    name: 'Georgia',
    description: 'Georgia is the ancestral home of wine, famous for amber wines and qvevri winemaking in Kakheti and beyond.',
    category: 'COUNTRY_GATE',
    color: '#8b5cf6',
    icon: 'flag',
    tags: ['PDO', 'COUNTRY'],
    details: {
      origin: 'Georgia',
      classification: 'COUNTRY',
      keyRegions: ['Kakheti', 'Kartli', 'Imereti'],
      notableGrapes: ['Saperavi', 'Rkatsiteli', 'Mtsvane']
    }
  },
  {
    id: 'C012',
    name: 'USA',
    description: 'The United States is a major New World wine producer, led by California with premium AVAs and diverse climates nationwide.',
    category: 'COUNTRY_GATE',
    color: '#1e1b4b',
    icon: 'flag',
    tags: ['AVA', 'COUNTRY'],
    details: {
      origin: 'USA',
      classification: 'COUNTRY',
      keyRegions: ['Napa Valley', 'Sonoma', 'Willamette Valley', 'Walla Walla', 'Finger Lakes'],
      notableGrapes: ['Cabernet Sauvignon', 'Chardonnay', 'Pinot Noir']
    }
  },
  {
    id: 'C012_CAN',
    name: 'Canada',
    description: 'Canada is known for ice wine and cool-climate whites, especially from Ontario and British Columbia.',
    category: 'COUNTRY_GATE',
    color: '#7f1d1d',
    icon: 'flag',
    tags: ['VQA', 'COUNTRY'],
    details: {
      origin: 'Canada',
      classification: 'COUNTRY',
      keyRegions: ['Niagara', 'Okanagan'],
      notableGrapes: ['Vidal Blanc', 'Riesling', 'Chardonnay']
    }
  },
  {
    id: 'C013',
    name: 'Argentina',
    description: 'Argentina is dominated by Malbec from Mendoza, with high-altitude vineyards producing bold, ripe reds.',
    category: 'COUNTRY_GATE',
    color: '#0ea5e9',
    icon: 'flag',
    tags: ['DOC', 'COUNTRY'],
    details: {
      origin: 'Argentina',
      classification: 'COUNTRY',
      keyRegions: ['Mendoza'],
      notableGrapes: ['Malbec', 'Cabernet Sauvignon', 'Bonarda']
    }
  },
  {
    id: 'C014',
    name: 'Chile',
    description: 'Chile produces elegant Cabernet Sauvignon and Carmenere from coastal and Andean vineyards across the Maipo and Colchagua valleys.',
    category: 'COUNTRY_GATE',
    color: '#7f1d1d',
    icon: 'flag',
    tags: ['DO', 'COUNTRY'],
    details: {
      origin: 'Chile',
      classification: 'COUNTRY',
      keyRegions: ['Maipo Valley'],
      notableGrapes: ['Cabernet Sauvignon', 'Carmenere', 'Merlot']
    }
  },
  {
    id: 'C015',
    name: 'Uruguay',
    description: 'Uruguay is best known for Tannat, producing rich and savory reds from a cool Atlantic-influenced climate.',
    category: 'COUNTRY_GATE',
    color: '#312e81',
    icon: 'flag',
    tags: ['DO', 'COUNTRY'],
    details: {
      origin: 'Uruguay',
      classification: 'COUNTRY',
      keyRegions: ['Canelones'],
      notableGrapes: ['Tannat', 'Cabernet Sauvignon', 'Merlot']
    }
  },
  {
    id: 'C016',
    name: 'Australia',
    description: 'Australia is home to bold Shiraz and refined Chardonnay, with premium regions like Barossa Valley and Margaret River.',
    category: 'COUNTRY_GATE',
    color: '#7c2d12',
    icon: 'flag',
    tags: ['GI', 'COUNTRY'],
    details: {
      origin: 'Australia',
      classification: 'COUNTRY',
      keyRegions: ['Barossa Valley', 'Margaret River'],
      notableGrapes: ['Shiraz', 'Chardonnay', 'Cabernet Sauvignon']
    }
  },
  {
    id: 'C017',
    name: 'New Zealand',
    description: 'New Zealand excels in aromatic Sauvignon Blanc and pristine Pinot Noir from Marlborough and Central Otago.',
    category: 'COUNTRY_GATE',
    color: '#0f172a',
    icon: 'flag',
    tags: ['GI', 'COUNTRY'],
    details: {
      origin: 'New Zealand',
      classification: 'COUNTRY',
      keyRegions: ['Marlborough', 'Central Otago'],
      notableGrapes: ['Sauvignon Blanc', 'Pinot Noir', 'Chardonnay']
    }
  },
  {
    id: 'C018',
    name: 'South Africa',
    description: 'South Africa combines Old World structure and New World expressiveness, especially from Stellenbosch and Walker Bay.',
    category: 'COUNTRY_GATE',
    color: '#312e81',
    icon: 'flag',
    tags: ['WO', 'COUNTRY'],
    details: {
      origin: 'South Africa',
      classification: 'COUNTRY',
      keyRegions: ['Stellenbosch', 'Walker Bay', 'Swartland'],
      notableGrapes: ['Cabernet Sauvignon', 'Pinotage', 'Chenin Blanc']
    }
  },
  {
    id: 'C019',
    name: 'China',
    description: 'China is an emerging wine producer, with Ningxia and Helan Mountain gaining attention for polished Bordeaux-style reds.',
    category: 'COUNTRY_GATE',
    color: '#854d0e',
    icon: 'flag',
    tags: ['GI', 'COUNTRY'],
    details: {
      origin: 'China',
      classification: 'COUNTRY',
      keyRegions: ['Helan Mountain', 'Shangri-La'],
      notableGrapes: ['Cabernet Sauvignon', 'Riesling', 'Syrah']
    }
  },
  {
    id: 'C020',
    name: 'Japan',
    description: 'Japan is known for delicate Koshu whites and elegant cool-climate wines from Yamanashi.',
    category: 'COUNTRY_GATE',
    color: '#9f1239',
    icon: 'flag',
    tags: ['GI', 'COUNTRY'],
    details: {
      origin: 'Japan',
      classification: 'COUNTRY',
      keyRegions: ['Yamanashi'],
      notableGrapes: ['Koshu', 'Merlot', 'Chardonnay']
    }
  },
  {
    id: 'C021',
    name: 'India',
    description: 'India is an emerging wine region producing tropical whites and spicy Syrahs from cooler highland sites.',
    category: 'COUNTRY_GATE',
    color: '#713f12',
    icon: 'flag',
    tags: ['GI', 'COUNTRY'],
    details: {
      origin: 'India',
      classification: 'COUNTRY',
      keyRegions: ['Nashik', 'Nandi Hills'],
      notableGrapes: ['Riesling', 'Syrah', 'Chardonnay']
    }
  },
  {
    id: 'C022',
    name: 'Morocco',
    description: 'Morocco is an emerging wine producer with vineyards in the Atlas Mountains, producing aromatic whites and structured reds.',
    category: 'COUNTRY_GATE',
    color: '#ea580c',
    icon: 'flag',
    tags: ['AOC', 'COUNTRY'],
    details: {
      origin: 'Morocco',
      classification: 'COUNTRY',
      keyRegions: ['Guerrouane'],
      notableGrapes: ['Syrah', 'Cabernet Sauvignon', 'Chardonnay']
    }
  }
];
