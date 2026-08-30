import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { DEX_PREFIXES, SITE_EXACT, isDexPath, isSitePath } from './appRoutes';
import { buildWineEntries } from '@/shared/constants';
import {
  SHAREABLE_CATEGORIES,
  SITE_ORIGIN,
  SITE_PAGES,
  SITE_REDIRECTS,
  entryPageMeta,
  entryPagePath,
  indexableSitePaths,
  injectMeta,
  robotsTxt,
  sitePageMeta,
  sitemapUrls,
  sitemapXml,
} from './siteIndex';

/**
 * The site's index is pinned to the route table (v0.6.15).
 *
 * The failure this guards against is drift in either direction: a page the
 * router serves that no crawler is told about, or a sitemap line for a page
 * the router stopped serving. Both are invisible in a browser and only show
 * up as a slow decline in search results months later.
 */
describe('the site index', () => {
  it('has a page for every site route that is not a redirect, and no other', () => {
    const paths = SITE_PAGES.map(p => p.path);
    expect([...paths].sort()).toEqual([...indexableSitePaths()].sort());
    for (const r of SITE_REDIRECTS) {
      expect(SITE_EXACT, `${r} is listed as a redirect but is not a site route`).toContain(r);
      expect(paths, `${r} is a redirect and must not be indexed`).not.toContain(r);
    }
  });

  it('indexes only site pages, never the app', () => {
    for (const p of SITE_PAGES) {
      expect(isSitePath(p.path), `${p.path} is not a site path`).toBe(true);
      expect(isDexPath(p.path), `${p.path} is a dex path`).toBe(false);
    }
  });

  it('keeps titles and descriptions inside the lengths cards show', () => {
    for (const p of SITE_PAGES) {
      expect(p.title.length, `${p.path} title`).toBeLessThanOrEqual(60);
      expect(p.description.length, `${p.path} description`).toBeLessThanOrEqual(160);
      expect(p.title).not.toBe('');
      expect(p.description).not.toBe('');
    }
  });

  it('lists every site page and every shareable entry in the sitemap, once', () => {
    const ids = buildWineEntries().filter(e => SHAREABLE_CATEGORIES.has(e.category)).map(e => e.id);
    const urls = sitemapUrls(ids);
    expect(new Set(urls).size, 'a URL is listed twice').toBe(urls.length);
    expect(urls.length).toBe(SITE_PAGES.length + ids.length);
    for (const p of SITE_PAGES) expect(urls).toContain(`${SITE_ORIGIN}${p.path}`);
    expect(urls).toContain(`${SITE_ORIGIN}${entryPagePath('G001')}`);
    // The share prefix is the one dex prefix a crawler may see, and it is
    // the only one in the sitemap.
    for (const u of urls) {
      const path = u.slice(SITE_ORIGIN.length);
      const dexPrefix = DEX_PREFIXES.find(d => path === d || path.startsWith(`${d}/`));
      if (dexPrefix) expect(dexPrefix, `${path} is an app screen`).toBe('/detail');
    }
    const xml = sitemapXml(ids);
    expect(xml.startsWith('<?xml version="1.0"')).toBe(true);
    expect((xml.match(/<url>/g) ?? []).length).toBe(urls.length);
  });

  it('agrees with shareLink about the production origin', () => {
    const src = readFileSync(resolve(process.cwd(), 'web/src/services/shareLink.ts'), 'utf8');
    expect(src).toContain(`SHARE_BASE = '${SITE_ORIGIN}'`);
  });

  it('robots points at the sitemap and keeps crawlers out of the app', () => {
    const robots = robotsTxt();
    expect(robots).toContain(`Sitemap: ${SITE_ORIGIN}/sitemap.xml`);
    expect(robots).toContain('Allow: /');
    for (const p of ['/dex', '/settings', '/saved']) expect(robots).toContain(`Disallow: ${p}`);
    // Every Disallow names a real dex prefix (or a build artefact), so a
    // renamed screen cannot leave a stale line behind.
    for (const line of robots.split('\n').filter(l => l.startsWith('Disallow: /') && !/sw\.js|workbox-/.test(l))) {
      const p = line.slice('Disallow: '.length);
      expect(DEX_PREFIXES, `${p} is disallowed but is not a dex prefix`).toContain(p);
    }
    expect(robots).not.toContain('Disallow: /detail');
  });

  /**
   * The tag injection, on the real shell. The prerender script has no test
   * of its own -- it is a build step -- so the function it calls is proved
   * here against `web/index.html` as shipped.
   */
  describe('injecting a page into the shell', () => {
    const shell = readFileSync(resolve(process.cwd(), 'web/index.html'), 'utf8');

    it('writes one of each tag and a canonical, never two', () => {
      const html = injectMeta(shell, sitePageMeta(SITE_PAGES[3]!));
      for (const tag of ['og:title', 'og:description', 'og:url', 'og:image', 'og:type']) {
        expect((html.match(new RegExp(`property="${tag}"`, 'g')) ?? []).length, tag).toBe(1);
      }
      for (const tag of ['description', 'twitter:title', 'twitter:description', 'twitter:image', 'twitter:card']) {
        expect((html.match(new RegExp(`name="${tag}"`, 'g')) ?? []).length, tag).toBe(1);
      }
      expect((html.match(/<link rel="canonical"/g) ?? []).length).toBe(1);
      expect(html).toContain(`<link rel="canonical" href="${SITE_ORIGIN}/contact" />`);
      expect(html).toContain('<meta property="og:title" content="CONTACT US — HORIZON/GODOT" />');
      expect(html).toContain('<meta property="og:type" content="website" />');
      expect(html).toContain('<title>HORIZON/GODOT</title>');
    });

    it('gives an entry page the app title and an article card', () => {
      const html = injectMeta(shell, entryPageMeta('G001', 'Cabernet Sauvignon', 'A "bold" red <grape> & more'));
      expect(html).toContain('<title>VINODEX</title>');
      expect(html).toContain('<meta property="og:type" content="article" />');
      expect(html).toContain('content="Cabernet Sauvignon — Vinodex"');
      expect(html).toContain('content="A &quot;bold&quot; red &lt;grape&gt; &amp; more"');
      expect(html).toContain(`<link rel="canonical" href="${SITE_ORIGIN}/detail/G001" />`);
      // No card known: the logo, and no size claim about it.
      expect(html).toContain(`<meta property="og:image" content="${SITE_ORIGIN}/vinodex-logo.png" />`);
      expect(html).not.toContain('og:image:width');
    });

    it('gives an entry with a baked card its own image, sized (v0.6.24)', () => {
      const html = injectMeta(shell, entryPageMeta('G001', 'Cabernet Sauvignon', 'x', true));
      expect(html).toContain(`<meta property="og:image" content="${SITE_ORIGIN}/og/G001.png" />`);
      expect(html).toContain(`<meta name="twitter:image" content="${SITE_ORIGIN}/og/G001.png" />`);
      expect(html).toContain('<meta property="og:image:width" content="1200" />');
      expect(html).toContain('<meta property="og:image:height" content="630" />');
      expect(html).toContain('<meta property="og:image:alt" content="Cabernet Sauvignon — Vinodex share card" />');
      // The shell's own alt is replaced, not duplicated (the string survives
      // elsewhere in the shell -- the favicon's alt -- which is not this tag).
      expect(html).not.toContain('<meta property="og:image:alt" content="VINODEX logo" />');
      expect((html.match(/property="og:image:alt"/g) ?? []).length).toBe(1);
      expect((html.match(/property="og:image"/g) ?? []).length).toBe(1);
    });

    it('writes one JSON-LD block per page that parses and names the page (v0.6.32)', () => {
      const ld = (html: string) => {
        const blocks = html.match(/<script type="application\/ld\+json" data-site-index>([\s\S]*?)<\/script>/g) ?? [];
        expect(blocks.length).toBe(1);
        return JSON.parse(blocks[0]!.replace(/^<script[^>]*>/, '').replace(/<\/script>$/, '')) as Record<string, unknown>;
      };
      // The landing: the studio, the site and the app, one graph.
      const landing = ld(injectMeta(shell, sitePageMeta(SITE_PAGES[0]!)));
      expect(landing['@context']).toBe('https://schema.org');
      const graph = landing['@graph'] as Array<Record<string, unknown>>;
      expect(graph.map(n => n['@type'])).toEqual(['Organization', 'WebSite', 'SoftwareApplication']);
      expect(graph[2]!.url).toBe(`${SITE_ORIGIN}/dex`);
      // A site page is a typed page of that site.
      const contact = ld(injectMeta(shell, sitePageMeta(SITE_PAGES[3]!)));
      expect(contact['@type']).toBe('ContactPage');
      expect(contact.url).toBe(`${SITE_ORIGIN}/contact`);
      expect((contact.isPartOf as { '@id': string })['@id']).toBe(`${SITE_ORIGIN}/#website`);
      // An entry is an article about its subject, with its card when it has one.
      const entry = ld(injectMeta(shell, entryPageMeta('G001', 'Cabernet Sauvignon', 'Bold </script> red', true)));
      expect(entry['@type']).toBe('Article');
      expect(entry.headline).toBe('Cabernet Sauvignon');
      expect(entry.image).toBe(`${SITE_ORIGIN}/og/G001.png`);
      expect((entry.about as { name: string }).name).toBe('Cabernet Sauvignon');
      expect(entry.description).toBe('Bold </script> red');
    });

    it('keeps a closing script tag in the data from ending the block', () => {
      const html = injectMeta(shell, entryPageMeta('G001', 'X', 'a </script><b> b'));
      const start = html.indexOf('<script type="application/ld+json"');
      const body = html.slice(start, html.indexOf('</script>', start));
      expect(body).not.toContain('</script>');
      expect(body).toContain('\\u003c/script>');
    });

    it('names the card for twitter as well as for open graph', () => {
      const html = injectMeta(shell, entryPageMeta('G001', 'Cabernet Sauvignon', 'x', true));
      expect(html).toContain('<meta name="twitter:image:alt" content="Cabernet Sauvignon — Vinodex share card" />');
      expect((html.match(/name="twitter:image:alt"/g) ?? []).length).toBe(1);
    });

    it('is idempotent: injecting twice yields the same page', () => {
      const once = injectMeta(shell, sitePageMeta(SITE_PAGES[1]!));
      expect(injectMeta(once, sitePageMeta(SITE_PAGES[1]!))).toBe(once);
    });
  });
});
