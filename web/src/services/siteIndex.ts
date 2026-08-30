import { SITE_EXACT } from './appRoutes';

/**
 * The site's index — what a crawler is told about each public page
 * (v0.6.15, the SEO pass).
 *
 * ## Why this is a service and not a script
 *
 * `scripts/prerender-og.ts` already writes 440 static `dist/detail/<id>/`
 * pages so a shared entry link unfurls with the entry's own card. Extending
 * that to the site's own pages, plus a sitemap and a robots file, means three
 * outputs that all have to agree with **the route table** — and a build
 * script is the one place a test cannot reach. So the facts live here, next
 * to `appRoutes.ts`, where `siteIndex.test.ts` can hold them against
 * `SITE_EXACT`: a site page that appears in the router and not here fails a
 * test, and a page here that the router no longer serves fails the same one.
 * The script only formats what this module says.
 *
 * ## What is and is not indexed
 *
 * - The five site pages below. `/terms` is a redirect to `/privacy` and gets
 *   no card and no sitemap line — a crawler following it lands on the
 *   canonical page, which is what a redirect is for.
 * - Every shareable catalogue entry (`/detail/<id>` for grapes, regions,
 *   styles and flavours — the same set the OG prerender writes).
 * - **Not** the dex's own screens (`/dex`, `/passport`, `/settings`...). They
 *   are an app, not pages: nothing to unfurl, nothing for a search engine to
 *   rank, and every one boots the device on arrival. `robots.txt` says so.
 * - **Not** the `/project/:id` splashes. They introduce a publication and hand
 *   off to Substack; the publication is the page worth ranking.
 */

/** The production origin, shared with `shareLink.ts`'s `SHARE_BASE`. */
export const SITE_ORIGIN = 'https://vinodex.vercel.app';

export interface SitePage {
  /** The route, exactly as `SITE_EXACT` spells it. */
  path: string;
  /** `<title>` and `og:title`. Under 60 characters so it is not truncated. */
  title: string;
  /** `description` and `og:description`. Under 160 characters. */
  description: string;
}

export const SITE_PAGES: readonly SitePage[] = [
  {
    path: '/',
    title: 'HORIZON/GODOT — Playful tools, made well.',
    description: 'A two-person NYC studio making playful digital tools. Home of Vinodex, a retro-handheld wine encyclopedia you can play in the browser.',
  },
  {
    path: '/apps',
    title: 'OUR WORK — HORIZON/GODOT',
    description: 'Vinodex, the retro-handheld wine encyclopedia, and the studio\'s publications.',
  },
  {
    path: '/who-we-are',
    title: 'WHO WE ARE — HORIZON/GODOT',
    description: 'An independent creative and product studio: two founders, NYC based, service trained, wine obsessed, serious about play.',
  },
  {
    path: '/contact',
    title: 'CONTACT US — HORIZON/GODOT',
    description: 'Product feedback, collaboration ideas, project questions, or a good bottle we should know about.',
  },
  {
    path: '/privacy',
    title: 'PRIVACY + TERMS — HORIZON/GODOT',
    description: 'Vinodex is local-first: your shelves and ratings live in your browser, there are no accounts, and the app makes no third-party requests on its own.',
  },
];

/** Site routes that exist only to redirect, and so are not pages. */
export const SITE_REDIRECTS: readonly string[] = ['/terms'];

/** The route-table paths that must each have an entry above. */
export const indexableSitePaths = (): string[] => SITE_EXACT.filter(p => !SITE_REDIRECTS.includes(p));

/** The catalogue categories whose entries are shareable pages. */
export const SHAREABLE_CATEGORIES: ReadonlySet<string> = new Set(['GRAPES', 'REGIONS', 'STYLES', 'FLAVORS']);

export const entryPagePath = (id: string): string => `/detail/${id}`;

/** Every URL the sitemap lists, site pages first, then entries. */
export const sitemapUrls = (entryIds: readonly string[]): string[] => [
  ...SITE_PAGES.map(p => `${SITE_ORIGIN}${p.path}`),
  ...entryIds.map(id => `${SITE_ORIGIN}${entryPagePath(id)}`),
];

const xmlEsc = (s: string): string =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** `sitemap.xml`, one `<url>` per page, no lastmod: the build is the date. */
export const sitemapXml = (entryIds: readonly string[]): string =>
  '<?xml version="1.0" encoding="UTF-8"?>\n'
  + '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
  + sitemapUrls(entryIds).map(u => `  <url><loc>${xmlEsc(u)}</loc></url>`).join('\n')
  + '\n</urlset>\n';

/**
 * `robots.txt`. Everything is allowed except the app's own screens, which
 * are not pages, and the two build-time files a crawler has no use for.
 */
export const robotsTxt = (): string =>
  [
    'User-agent: *',
    'Allow: /',
    'Disallow: /dex',
    'Disallow: /settings',
    'Disallow: /saved',
    'Disallow: /passport',
    'Disallow: /minigames',
    'Disallow: /workshop',
    'Disallow: /cheats',
    'Disallow: /sw.js',
    'Disallow: /workbox-',
    '',
    `Sitemap: ${SITE_ORIGIN}/sitemap.xml`,
    '',
  ].join('\n');

/** What one prerendered page says about itself. */
export interface PageMeta {
  /** The browser tab. */
  browserTitle: string;
  /** `og:title` / `twitter:title`. */
  title: string;
  description: string;
  /** The canonical absolute URL. */
  url: string;
  type: 'website' | 'article';
  /** The page's own card image, 1200x630 (v0.6.24); the logo when absent. */
  image?: string;
}

const htmlEsc = (s: string): string =>
  (s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** The one share image, for every card. */
export const SHARE_IMAGE = `${SITE_ORIGIN}/vinodex-logo.png`;

/**
 * A copy of the built shell with one page's tags written into its `<head>`.
 *
 * Replaces a tag the shell already carries and appends one it does not, so
 * the shell's own `index.html` stays the single template and this never
 * produces two `og:title`s. A canonical link is always appended: the shell
 * has none, because the shell is every route.
 */
export const injectMeta = (shell: string, meta: PageMeta): string => {
  let html = shell.replace(/<title>[^<]*<\/title>/, `<title>${htmlEsc(meta.browserTitle)}</title>`);
  const set = (attr: 'name' | 'property', key: string, value: string) => {
    const re = new RegExp(`(<meta ${attr}="${key}" content=")[^"]*(")`);
    if (re.test(html)) html = html.replace(re, `$1${htmlEsc(value)}$2`);
    else html = html.replace('</head>', `    <meta ${attr}="${key}" content="${htmlEsc(value)}" />\n  </head>`);
  };
  const desc = meta.description.replace(/\s+/g, ' ').trim().slice(0, 180);
  set('name', 'description', desc);
  set('property', 'og:type', meta.type);
  set('property', 'og:title', meta.title);
  set('property', 'og:description', desc);
  set('property', 'og:url', meta.url);
  set('property', 'og:image', meta.image ?? SHARE_IMAGE);
  if (meta.image) {
    // The baked cards are all one size; saying so lets a crawler lay the
    // card out before it has fetched the pixels. And the alt is the card's
    // subject, not "VINODEX logo", which the shell says of its own image.
    set('property', 'og:image:width', '1200');
    set('property', 'og:image:height', '630');
    set('property', 'og:image:alt', `${meta.title} share card`);
  }
  set('name', 'twitter:card', 'summary_large_image');
  set('name', 'twitter:title', meta.title);
  set('name', 'twitter:description', desc);
  set('name', 'twitter:image', meta.image ?? SHARE_IMAGE);
  // The tag and its own line, so re-injecting a page yields the same bytes.
  html = html.replace(/[ \t]*<link rel="canonical"[^>]*>\r?\n?/g, '');
  html = html.replace('</head>', `    <link rel="canonical" href="${htmlEsc(meta.url)}" />\n  </head>`);
  return html;
};

/** The meta for a site page. */
export const sitePageMeta = (page: SitePage): PageMeta => ({
  browserTitle: 'HORIZON/GODOT',
  title: page.title,
  description: page.description,
  url: `${SITE_ORIGIN}${page.path}`,
  type: 'website',
});

/** Where an entry's baked share card lives (v0.6.24); see `ogManifest.ts`. */
export const ogCardPath = (id: string): string => `/og/${id}.png`;

/**
 * The meta for a catalogue entry's share page. `hasCard` is whether the bake
 * produced a card for this entry -- the prerender reads the committed
 * manifest -- so a missing card falls back to the logo rather than to a 404.
 */
export const entryPageMeta = (id: string, name: string, description: string, hasCard = false): PageMeta => ({
  browserTitle: 'VINODEX',
  title: `${name} — Vinodex`,
  description: description || 'A retro wine field guide.',
  url: `${SITE_ORIGIN}${entryPagePath(id)}`,
  type: 'article',
  ...(hasCard ? { image: `${SITE_ORIGIN}${ogCardPath(id)}` } : {}),
});
