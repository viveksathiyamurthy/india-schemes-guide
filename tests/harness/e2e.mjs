import { chromium } from '/opt/npm-tools/node_modules/playwright/index.mjs';
import assert from 'node:assert/strict';
import { mkdirSync } from 'node:fs';

const base = 'http://localhost:4173';
const shots = new URL('../out/shots/', import.meta.url).pathname;
mkdirSync(shots, { recursive: true });

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox'] });
const phone = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
const page = await phone.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(String(e)));
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });

const noOverflow = async (label) => {
  const [sw, iw] = await page.evaluate(() => [document.documentElement.scrollWidth, window.innerWidth]);
  assert.ok(sw <= iw, `${label}: horizontal overflow ${sw} > ${iw}`);
};

// Screen 1
await page.goto(base + '/');
await page.waitForSelector('.hero');
assert.ok(await page.locator('.strip').isVisible(), 'disclaimer visible');
assert.equal(await page.locator('.st').count(), 5);
assert.equal(await page.locator('a.st.on').count(), 1);
assert.ok(await page.locator('input[type=search]').isVisible(), 'search on screen 1');
await noOverflow('screen1');
await page.screenshot({ path: shots + '1-welcome-phone.png' });

// Screen 2
await page.click('a.st.on');
await page.waitForURL(base + '/tamil-nadu');
assert.equal(await page.locator('.who').count(), 5);
assert.ok(await page.locator('input[type=search]').isVisible(), 'search on screen 2');
await noOverflow('screen2');
await page.screenshot({ path: shots + '2-persona-phone.png' });

// Screen 3: Tamil Nadu + Woman
await page.click('.who:has-text("Woman")');
await page.waitForURL(base + '/tamil-nadu/woman');
assert.equal(await page.locator('.card').count(), 5);
assert.ok((await page.locator('.sub').first().innerText()).includes('5 schemes from Tamil Nadu and the Union/Central Government'));
await noOverflow('screen3');
await page.screenshot({ path: shots + '3-list-phone.png', fullPage: true });
await page.click('button.f:has-text("State Government")');
assert.equal(await page.locator('.card').count(), 3);
await page.click('button.f:has-text("Union/Central Government")');
assert.equal(await page.locator('.card').count(), 2);
await page.click('button.f:has-text("All")');
assert.equal(await page.locator('.card').count(), 5);

// Screen 4
await page.click('.card:has-text("Magalir Urimai Thogai")');
await page.waitForURL(base + '/scheme/magalir-urimai-thogai');
const official = page.locator('a.btn', { hasText: 'Go to the official government website' });
assert.equal(await official.getAttribute('href'), 'https://kmut.tn.gov.in');
assert.equal(await official.getAttribute('target'), '_blank');
assert.ok((await official.getAttribute('rel')).includes('noopener'));
assert.ok(await page.locator('text=Last verified: 18 Oct 2026').isVisible());
await noOverflow('screen4');
await page.screenshot({ path: shots + '4-detail-phone.png', fullPage: true });

// Language toggle on screen 4 (Tamil text missing for sections -> English with a note)
await page.click('.lang button:has-text("தமிழ்")');
assert.ok((await page.locator('h1').innerText()).includes('மகளிர் உரிமைத் தொகை'));
assert.ok(await page.locator('h2:has-text("யார் தகுதியானவர்")').isVisible());
assert.equal(await page.locator('.pending').count(), 4);
await page.screenshot({ path: shots + '4-detail-phone-tamil.png', fullPage: true });
// Language choice is remembered after a full page load.
await page.goto(base + '/');
await page.waitForSelector('.hero');
assert.ok((await page.locator('h1').innerText()).includes('வணக்கம்'));
await page.screenshot({ path: shots + '1-welcome-phone-tamil.png' });
await page.click('.lang button:has-text("EN")');

// Search before choosing a state: all states + Union/Central
await page.fill('input[type=search]', 'loan');
await page.click('button.go');
await page.waitForURL(base + '/search?q=loan');
assert.equal(await page.locator('.card').count(), 6);
assert.ok(await page.locator('.note').isVisible(), 'choose-state note shown without a state');
assert.ok((await page.locator('.sub').first().innerText()).includes('from all states and the Union/Central Government'));
assert.ok(await page.locator('.tag.p:has-text("All India")').count() > 0);
assert.ok(await page.locator('.tag.p:has-text("Tamil Nadu")').count() > 0);
await noOverflow('search');
await page.screenshot({ path: shots + '3-search-nostate-phone.png', fullPage: true });
await page.click('.card:has-text("PMEGP")');
await page.waitForURL(base + '/scheme/pmegp');

// Search after choosing a state: limited to that state + Union/Central
await page.goto(base + '/tamil-nadu');
await page.fill('input[type=search]', 'loan');
await page.click('button.go');
await page.waitForURL(base + '/search?state=tamil-nadu&q=loan');
assert.equal(await page.locator('.note').count(), 0);
assert.equal(await page.locator('.card').count(), 6);
assert.ok((await page.locator('.sub').first().innerText()).includes('from Tamil Nadu and the Union/Central Government'));
assert.equal(await page.locator('.tag.p').count(), 0);

// A state that is not live cannot narrow the search, so Kerala falls back to all states
await page.goto(base + '/search?q=women&state=kerala');
assert.ok(await page.locator('.note').isVisible());

// No results
await page.goto(base + '/search?q=zzzz');
assert.ok(await page.locator('.empty').isVisible());

// Unknown pages
for (const path of ['/nowhere/at/all', '/kerala', '/tamil-nadu/xyz', '/scheme/kamarajar-breakfast-scheme', '/scheme/nope']) {
  await page.goto(base + path);
  assert.ok(await page.locator('h1:has-text("Page not found")').isVisible(), path + ' should be not found');
}

// Laptop layout
const laptop = await browser.newContext({ viewport: { width: 1280, height: 800 } });
const lp = await laptop.newPage();
await lp.goto(base + '/');
await lp.waitForSelector('.hero');
await lp.screenshot({ path: shots + '1-welcome-laptop.png' });
await lp.goto(base + '/tamil-nadu/woman');
await lp.waitForSelector('.card');
await lp.screenshot({ path: shots + '3-list-laptop.png', fullPage: true });
await lp.goto(base + '/scheme/pm-kisan');
await lp.waitForSelector('.cta');
await lp.screenshot({ path: shots + '4-detail-laptop.png', fullPage: true });

assert.deepEqual(errors, [], 'console errors: ' + errors.join(' | '));
await browser.close();
console.log('e2e passed');
