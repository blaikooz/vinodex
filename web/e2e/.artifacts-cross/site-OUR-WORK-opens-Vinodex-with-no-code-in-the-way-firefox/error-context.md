# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: site.spec.ts >> OUR WORK opens Vinodex with no code in the way
- Location: web/e2e/site.spec.ts:138:1

# Error details

```
Error: locator.click: Element is not visible
Call log:
  - waiting for getByRole('button', { name: 'Skip boot' })
    - locator resolved to <div tabindex="0" role="button" aria-label="Skip boot" class="bios-boot absolute inset-0 z-[30] flex select-none cursor-pointer overflow-hidden font-mono">…</div>
  - attempting click action
    - scrolling into view if needed
    - done scrolling

```

# Page snapshot

```yaml
- generic [ref=e5]:
  - generic [ref=e7]:
    - generic [ref=e8]:
      - button "Hold to flip device" [ref=e11] [cursor=pointer]
      - generic [ref=e20]:
        - generic [ref=e26]:
          - generic [ref=e29]:
            - generic [ref=e30]:
              - button "GRAPES" [ref=e32]
              - button "REGIONS" [ref=e37]
              - button "STYLES" [ref=e42]
              - button "FLAVORS" [ref=e47]
            - button "Search" [ref=e51]
          - button "Skip boot" [ref=e53] [cursor=pointer]:
            - generic [ref=e54]: VINODEX BIOS v0.6.50
        - generic [ref=e58]: VINODEX
    - contentinfo [ref=e65]:
      - generic [ref=e66]:
        - button "Back" [ref=e67]
        - button "Collection" [ref=e68]
      - generic [ref=e69]:
        - generic [ref=e70]:
          - generic [ref=e71]: Right-click, press Alt plus Enter, or press and hold, to point this button somewhere else.
          - button "TOOLS" [ref=e72]
          - button "CUSTOMIZE" [ref=e75]
        - generic [ref=e78]: WELCOME!
      - generic [ref=e82]:
        - button "Home" [ref=e83]
        - button "Settings" [ref=e84]
  - generic:
    - generic:
      - button "VINODEX CLASSIC artifact."
      - generic:
        - generic:
          - generic: VINODEX
          - generic: v0.6.50
        - generic:
          - generic: "SN: VDX-2026-001"
          - generic: © 2026 HORIZON/GODOT
          - generic: ALL RIGHTS RESERVED
        - button "Flip device back to front" [ref=e85] [cursor=pointer]:
          - generic [ref=e91]: TAP TO RETURN
```

# Test source

```ts
  56  |   // The old studio line is replaced by a concrete promise.
  57  |   await expect(page.getByText('CREATING ACROSS MULTITUDES')).toHaveCount(0);
  58  | });
  59  | 
  60  | test('a dead link gets NOT FOUND in the studio chassis, and no boot', async ({ page, consoleErrors }) => {
  61  |   void consoleErrors;
  62  |   await seedDevice(page);
  63  |   await page.goto('/this/never/existed');
  64  |   await expect(page.getByRole('heading', { name: 'NO SUCH PAGE' })).toBeVisible();
  65  |   await expect(page.getByText('/this/never/existed')).toBeVisible();
  66  |   await expect(page.getByRole('button', { name: 'Skip boot' })).toHaveCount(0);
  67  |   await expect(page).toHaveTitle('HORIZON/GODOT');
  68  |   await page.getByRole('button', { name: 'HOME' }).click();
  69  |   await expect(page).toHaveURL(/\/$/);
  70  |   await expect(page.getByRole('heading', { name: 'HORIZON/GODOT' })).toBeVisible();
  71  | });
  72  | 
  73  | test('leaving the dex mid-boot takes the BIOS with it', async ({ page, consoleErrors }) => {
  74  |   void consoleErrors;
  75  |   // Back or Home pressed during the POST used to carry `booting` onto the
  76  |   // site, and the BIOS -- which never plays there -- sat on the studio's
  77  |   // front page until tapped away (v0.6.19).
  78  |   await seedDevice(page);
  79  |   await page.goto('/');
  80  |   await page.getByRole('button', { name: 'OPEN VINODEX' }).click();
  81  |   await expect(page.getByRole('button', { name: 'Skip boot' })).toBeVisible();
  82  |   await page.goBack();
  83  |   await expect(page).toHaveURL(/\/$/);
  84  |   await expect(page.getByRole('heading', { name: 'HORIZON/GODOT' })).toBeVisible();
  85  |   await expect(page.getByRole('button', { name: 'Skip boot' })).toHaveCount(0);
  86  | });
  87  | 
  88  | test('every v0.2.x /website URL still resolves', async ({ page, consoleErrors }) => {
  89  |   void consoleErrors;
  90  |   await seedDevice(page);
  91  | 
  92  |   // Nothing already linked, bookmarked or shared may break (v8#1). Checked by
  93  |   // walking the old URLs in a real browser rather than by reading the route
  94  |   // table, because a redirect that renders a blank frame before it fires is
  95  |   // still a broken link to the person who followed it.
  96  |   const moved: [string, string][] = [
  97  |     ['/website', '/'],
  98  |     ['/website/apps', '/apps'],
  99  |     ['/website/who-we-are', '/who-we-are'],
  100 |     ['/website/contact', '/contact'],
  101 |     ['/website/project/focuspond', '/project/focuspond'],
  102 |     // The access door's own URL. Its whole purpose was to get into the app,
  103 |     // and nothing stands in the way now (v8#3), so it goes there.
  104 |     ['/website/unlock', '/dex'],
  105 |   ];
  106 |   for (const [from, to] of moved) {
  107 |     await page.goto(from);
  108 |     await page.waitForTimeout(500);
  109 |     expect(new URL(page.url()).pathname, `${from} should land on ${to}`).toBe(to);
  110 |     await expect(page.locator('body')).not.toBeEmpty();
  111 |   }
  112 | });
  113 | 
  114 | test('the legal page is reachable, and /terms resolves to it', async ({ page, consoleErrors }) => {
  115 |   void consoleErrors;
  116 |   await seedDevice(page);
  117 | 
  118 |   // The small print, from the screen that invites mail (v0.6.0). This is the
  119 |   // URL the App Store's privacy-policy field will carry, so a real browser
  120 |   // walks it: link, content, and the spelling store forms guess.
  121 |   await page.goto('/contact');
  122 |   await page.getByRole('button', { name: 'PRIVACY + TERMS' }).click();
  123 |   await expect(page).toHaveURL(/\/privacy$/);
  124 |   const content = page.getByRole('region', { name: 'PRIVACY + TERMS content' });
  125 |   await expect(content).toBeVisible();
  126 |   await expect(content).toContainText('local-first');
  127 |   await expect(content).toContainText('TERMS OF USE');
  128 | 
  129 |   // A site page: HORIZON/GODOT's, and no BIOS on a cold arrival.
  130 |   await expect(page).toHaveTitle('HORIZON/GODOT');
  131 |   await expect(page.getByText(/VINODEX BIOS/)).toHaveCount(0);
  132 | 
  133 |   await page.goto('/terms');
  134 |   await page.waitForTimeout(400);
  135 |   expect(new URL(page.url()).pathname, '/terms should land on /privacy').toBe('/privacy');
  136 | });
  137 | 
  138 | test('OUR WORK opens Vinodex with no code in the way', async ({ page, consoleErrors }) => {
  139 |   void consoleErrors;
  140 |   await seedDevice(page);
  141 |   await page.goto('/');
  142 |   await page.getByRole('button', { name: 'OUR WORK' }).click();
  143 |   await expect(page).toHaveURL(/\/apps$/);
  144 | 
  145 |   // The tile stays; the keypad does not (v8#3). Stated as an absence as well
  146 |   // as a presence: a four-slot code entry reappearing anywhere on this walk
  147 |   // would mean the ruling was reversed without being revisited.
  148 |   await expect(page.getByText('ENTER ACCESS CODE')).toHaveCount(0);
  149 |   await expect(page.getByText(/DEMO CODE/)).toHaveCount(0);
  150 | 
  151 |   await page.getByRole('button', { name: /VINODEX/ }).first().click();
  152 |   await expect(page).toHaveURL(/\/project\/vinodex$/);
  153 |   await expect(page.getByText('ENTER ACCESS CODE')).toHaveCount(0);
  154 | 
  155 |   await page.getByRole('button', { name: /OPEN VINODEX/ }).click();
> 156 |   await page.getByRole('button', { name: 'Skip boot' }).click({ force: true });
      |                                                         ^ Error: locator.click: Element is not visible
  157 |   await expect(page).toHaveURL(/\/dex$/);
  158 | });
  159 | 
  160 | test('OUR WORK includes Château and hands off safely', async ({ page, consoleErrors }) => {
  161 |   void consoleErrors;
  162 |   await seedDevice(page);
  163 |   await page.goto('/apps');
  164 | 
  165 |   await page.getByRole('button', { name: /CHÂTEAU/ }).click();
  166 |   await expect(page).toHaveURL(/\/project\/chateau-earth$/);
  167 |   const publication = page.getByRole('link', { name: /VISIT PUBLICATION/ });
  168 |   await expect(publication).toHaveAttribute('href', 'https://chateauearth.substack.com/');
  169 |   await expect(publication).toHaveAttribute('target', '_blank');
  170 |   await expect(publication).toHaveAttribute('rel', /noopener/);
  171 | });
  172 | 
  173 | test('the site wears CLASSIC while the player wears something else', async ({ page, consoleErrors }, testInfo) => {
  174 |   void consoleErrors;
  175 |   // A stored skin as far from the red shell as the table gets, so "the site is
  176 |   // CLASSIC" cannot pass by the override doing nothing.
  177 |   await seedDevice(page, { chassisSkin: 'NOCTURNE' });
  178 | 
  179 |   await page.goto('/');
  180 |   await page.waitForTimeout(600);
  181 |   const onSite = await paintedChassis(page);
  182 |   expect(onSite, 'the site chassis is not CLASSIC').toBe(rgbOf(CHASSIS_SKINS.CLASSIC.body));
  183 |   await testInfo.attach('site-classic', { body: await page.screenshot(), contentType: 'image/png' });
  184 |   await page.screenshot({ path: 'web/e2e/.shots/site-classic-over-nocturne.png' });
  185 | 
  186 |   // **The stored choice survives, which is the whole reason the override is
  187 |   // scoped rather than written.** `:root` still carries NOCTURNE while the
  188 |   // site paints CLASSIC — so nothing has to be restored on the way out, and a
  189 |   // reload on a site page cannot strand the override.
  190 |   const rootSkin = await page.evaluate(() =>
  191 |     getComputedStyle(document.documentElement).getPropertyValue('--chassis-body').trim(),
  192 |   );
  193 |   expect(rootSkin.toLowerCase(), 'the site overwrote the stored skin').toBe(
  194 |     CHASSIS_SKINS.NOCTURNE.body.toLowerCase(),
  195 |   );
  196 |   expect(await page.evaluate(() => window.localStorage.getItem('chassisSkin'))).toBe('NOCTURNE');
  197 | 
  198 |   // And the app is the player's own shell again the moment they are in it.
  199 |   await enterDex(page, '/dex');
  200 |   await page.waitForTimeout(600);
  201 |   const inDex = await paintedChassis(page);
  202 |   expect(inDex, 'the dex is not the stored skin').toBe(rgbOf(CHASSIS_SKINS.NOCTURNE.body));
  203 |   await testInfo.attach('dex-nocturne', { body: await page.screenshot(), contentType: 'image/png' });
  204 | });
  205 | 
  206 | test('the site keeps its bezel, removes the footer, and navigates inside the LCD', async ({ page, consoleErrors }) => {
  207 |   void consoleErrors;
  208 |   await seedDevice(page);
  209 | 
  210 |   // The engraved wordmark remains part of the hardware, but the website no
  211 |   // longer carries the app's footer controls, marquee, or status lamps.
  212 |   await page.goto('/');
  213 |   await page.waitForTimeout(600);
  214 |   await expect(page.locator('.island-strip')).toHaveCount(0);
  215 |   const bezel = page.locator('.bezel-wordmark');
  216 |   await expect(bezel).toHaveCount(1);
  217 |   expect((await bezel.textContent())?.trim(), 'the site bezel does not read HORIZON/GODOT')
  218 |     .toBe('HORIZON/GODOT');
  219 | 
  220 |   await expect(page.locator('footer')).toHaveCount(0);
  221 |   await expect(page.locator('.terminal-marquee')).toHaveCount(0);
  222 |   await expect(page.locator('.lamp-hit')).toHaveCount(0);
  223 | 
  224 |   await page.getByRole('button', { name: 'OUR WORK' }).click();
  225 |   const lcdNav = page.getByRole('navigation', { name: 'Screen navigation' });
  226 |   await expect(lcdNav).toBeVisible();
  227 |   await expect(lcdNav.getByRole('button', { name: 'Back' })).toBeVisible();
  228 |   await expect(lcdNav).toContainText('OUR WORK');
  229 | 
  230 |   // Inside the app it reads VINODEX again, and the dex's own script is
  231 |   // untouched: the menu greets once per launch, exactly as before.
  232 |   await enterDex(page, '/dex');
  233 |   await page.waitForTimeout(600);
  234 |   expect((await page.locator('.bezel-wordmark').textContent())?.trim(),
  235 |     'the dex bezel does not read VINODEX').toBe('VINODEX');
  236 | });
  237 | 
  238 | test('the site alone reshapes its chassis for the viewport', async ({ page, consoleErrors }) => {
  239 |   void consoleErrors;
  240 |   await seedDevice(page);
  241 | 
  242 |   await page.setViewportSize({ width: 390, height: 844 });
  243 |   await page.goto('/');
  244 |   const mobile = await page.locator('.site-device-frame').boundingBox();
  245 |   expect(mobile).not.toBeNull();
  246 |   expect(Math.abs((mobile?.width ?? 0) - (mobile?.height ?? 0))).toBeLessThanOrEqual(1);
  247 |   await expect(page.locator('.island-strip')).toHaveCount(0);
  248 |   const mobileCrown = await page.evaluate(() => {
  249 |     const frame = document.querySelector('.site-device-frame')!.getBoundingClientRect();
  250 |     const panel = document.querySelector('.chamfered-panel')!.getBoundingClientRect();
  251 |     return panel.top - frame.top;
  252 |   });
  253 |   expect(mobileCrown, 'the square website chassis has no top moulding').toBeGreaterThanOrEqual(10);
  254 | 
  255 |   await page.setViewportSize({ width: 1280, height: 800 });
  256 |   const desktop = await page.locator('.site-device-frame').boundingBox();
```