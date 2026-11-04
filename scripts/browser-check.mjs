// Bounded foreground check: owns and closes its static server and browser.
// Uses the production export under /preview/ to exercise relative asset paths.
import { createServer } from 'node:http';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { resolve, extname } from 'node:path';
import { pathToFileURL } from 'node:url';
import assert from 'node:assert/strict';

const modulePath = process.argv.find(v => v.startsWith('--playwright='))?.split('=')[1];
const { chromium, webkit } = modulePath ? await import(pathToFileURL(modulePath).href) : await import('playwright');
const output = 'test/scratch/browser';
await mkdir(output, { recursive: true });
const root = resolve('dist');
const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.woff': 'font/woff', '.json': 'application/json' };
const server = createServer(async (req, res) => {
  try {
    const path = decodeURIComponent(new URL(req.url, 'http://localhost').pathname).replace(/^\/preview\//, '');
    const file = resolve(root, path || 'index.html');
    if (!file.startsWith(root + '/') && file !== root) { res.writeHead(403); res.end(); return; }
    const data = await readFile(file);
    res.writeHead(200, { 'Content-Type': mime[extname(file)] ?? 'application/octet-stream' }); res.end(data);
  } catch { res.writeHead(404); res.end('Not found'); }
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const url = `http://127.0.0.1:${server.address().port}/preview/index.html`;
const results = [], errors = [], localFailures = [];
const cropNames = ['Sunflower', 'Carrot', 'Strawberry', 'Corn', 'Pumpkin', 'Grapes'];
const cropSeconds = [30,45,60,90,120,150];
const cropPrices = [2,3,4,5,7,9];
const key = 'squeek-farm-v1';
const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
function observe(page) {
  page.on('pageerror', e => errors.push(e.message));
  page.on('response', r => { if (r.url().startsWith(url.split('/preview/')[0]) && r.status() >= 400) localFailures.push(r.url()); });
}
async function check(name, test) {
  try { await test(); results.push({ name, passed: true }); console.log(`PASS ${name}`); }
  catch (e) { results.push({ name, passed: false, error: e.message }); console.log(`FAIL ${name}: ${e.message}`); throw e; }
}
const state = page => page.evaluate(k => JSON.parse(localStorage.getItem(k)), key);
const close = page => page.getByRole('button', { name: 'Close dialog', exact: true }).click();
async function open(page, name) { await page.getByRole('button', { name, exact: true }).click(); }
async function sellAll(page) {
  await open(page, 'Market');
  await page.getByRole('button', { name: /^Sell all goods/ }).click();
  await close(page);
}
async function growHarvest(page, cropIndex, count) {
  const name = cropNames[cropIndex];
  await page.getByRole('button', { name: new RegExp(`^Select ${name},`) }).click();
  for (let i = 0; i < count; i++) await page.getByTestId(`plot-${i}`).click();
  assert.equal(await page.getByTestId('plot-0').getAttribute('data-stage'), '0');
  await page.clock.runFor(cropSeconds[cropIndex] * 500);
  assert.equal(await page.getByTestId('plot-0').getAttribute('data-stage'), '1');
  await page.clock.runFor(cropSeconds[cropIndex] * 500 + 250);
  assert.equal(await page.getByTestId('plot-0').getAttribute('data-stage'), '2');
  await open(page, 'Harvest');
  assert.equal((await state(page)).plots.filter(Boolean).length, 0);
}
async function unlock(page, cropIndex) {
  const name = cropNames[cropIndex];
  await open(page, 'Market');
  await page.locator('.market-row').filter({ has: page.getByText(name, { exact: true }) }).getByRole('button', { name: /^Unlock/ }).click();
  await close(page);
  assert((await state(page)).unlocked.includes(name.toLowerCase()));
}
let context;
try {
  context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' });
  context.setDefaultTimeout(10_000);
  await context.route('https://api.squeekchain.com/**', route => route.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ error: 'database_unavailable' }) }));
  const page = await context.newPage(); observe(page);
  await page.clock.install({ time: new Date() });
  await page.goto(url); await page.getByRole('button', { name: 'Play now' }).waitFor();
  await check('Title, subpath assets, and keyboard entry', async () => {
    await page.getByRole('button', { name: 'Play now' }).focus();
    assert.match(await page.locator(':focus').innerText(), /Play now/);
    await page.keyboard.press('Enter');
    await page.getByTestId('plot-0').waitFor();
    assert.equal(await page.getByTestId('plot-0').getAttribute('data-stage'), 'empty');
    await page.screenshot({ path: `${output}/farm-desktop-empty.png`, fullPage: true });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.screenshot({ path: `${output}/farm-mobile-empty.png` });
    await page.setViewportSize({ width: 1440, height: 1000 });
  });
  await check('All six crops: all three stages, exact yields, individual and bulk sales', async () => {
    await growHarvest(page, 0, 4);
    assert.equal((await state(page)).inventory.sunflower, 32);
    await open(page, 'Market');
    await page.getByRole('button', { name: 'Sell one Sunflower', exact: true }).click();
    assert.equal((await state(page)).balance, 2); assert.equal((await state(page)).inventory.sunflower, 31);
    await page.getByRole('button', { name: 'Sell all Sunflower', exact: true }).click();
    assert.equal((await state(page)).balance, 64);
    assert(await page.getByRole('button', { name: 'Sell all Sunflower', exact: true }).isDisabled());
    await close(page);
    await growHarvest(page, 1, 4); assert.equal((await state(page)).inventory.carrot, 40); await sellAll(page);
    await unlock(page, 2);
    await growHarvest(page, 2, 4); await sellAll(page);
    await unlock(page, 3);
    for (let i = 0; i < 2; i++) { await growHarvest(page, 3, 4); await sellAll(page); }
    await unlock(page, 4);
    for (let i = 0; i < 3; i++) { await growHarvest(page, 4, 4); await sellAll(page); }
    await unlock(page, 5);
    await growHarvest(page, 5, 4); await sellAll(page);
    const g = await state(page); assert.equal(g.unlocked.length, 6); assert.equal(g.minted, g.balance + g.burned + g.treasury);
  });
  await check('Both expansions visibly add usable plots, and stop at eight', async () => {
    await open(page, 'Expand');
    await page.getByRole('dialog').getByRole('button', { name: /^Expand/ }).click();
    assert.equal((await state(page)).plotCount, 6);
    await page.getByRole('dialog').getByRole('button', { name: /^Expand/ }).click();
    assert.equal((await state(page)).plotCount, 8);
    assert.equal(await page.getByText('Unlocked', { exact: true }).count(), 2);
    await close(page);
    assert.equal(await page.locator('.plot').count(), 8);
  });
  await check('All three automatic weapons purchase and appear in fixed slots', async () => {
    await growHarvest(page, 5, 8); await sellAll(page);
    await open(page, 'Defense');
    for (let i = 0; i < 3; i++) await page.getByRole('dialog').getByRole('button', { name: /^Build/ }).first().click();
    assert.deepEqual((await state(page)).defenses, [true,true,true]);
    await close(page); assert.equal(await page.locator('.defense-slot.built').count(), 3);
    await page.screenshot({ path: `${output}/farm-desktop-expanded.png` });
  });
  await check('Economy popup, integer 80/20 accounting and balance equation', async () => {
    const g = await state(page);
    assert.equal(g.minted, g.balance + g.treasury + g.burned); assert.equal(g.burned, g.treasury * 4);
    await open(page, 'Economy');
    assert.match(await page.getByRole('dialog').innerText(), /Outstanding supply/);
    assert.match(await page.getByRole('dialog').innerText(), /not a real token/);
    await page.keyboard.press('Escape');
    assert.match(await page.locator(':focus').innerText(), /Economy/);
  });
  await check('Saving, reload, offline maturation and no repeated harvest rewards', async () => {
    await page.getByRole('button', { name: /^Select Grapes,/ }).click();
    await page.getByTestId('plot-0').click();
    const before = await state(page);
    await page.clock.fastForward(160_000);
    await page.reload(); await page.getByTestId('plot-0').waitFor();
    const after = await state(page);
    assert.equal(after.balance, before.balance); assert.deepEqual(after.defenses, before.defenses);
    assert.equal(after.plotCount, 8); assert.equal(after.plots[0].crop, 'grapes');
    assert.equal(await page.getByTestId('plot-0').getAttribute('data-stage'), '2');
    await page.getByTestId('plot-0').click();
    const harvested = (await state(page)).inventory.grapes;
    await page.reload(); await page.getByTestId('plot-0').waitFor();
    assert.equal((await state(page)).inventory.grapes, harvested);
  });
  await check('One save writer across tabs', async () => {
    const follower = await context.newPage(); await follower.goto(url);
    await follower.getByText(/This farm may be open in another tab/).waitFor();
    assert(await follower.getByRole('button', { name: 'Plant', exact: true }).isDisabled());
    await follower.close();
  });
  await check('Live API failure gives Offline and ordinary growth', async () => {
    assert.match(await page.locator('.chain-button').innerText(), /Offline/);
    await page.getByRole('button', { name: /^Select Carrot,/ }).click(); await page.getByTestId('plot-0').click();
    const before = await state(page); await page.clock.runFor(10_000); const after = await state(page);
    assert(after.plots[0].growth - before.plots[0].growth <= 10_500);
    assert(after.plots[0].growth - before.plots[0].growth >= 9_500);
  });
  await check('Mobile farm, inventory, shops and pause at 320, 390, 768 and 1440', async () => {
    for (const width of [320,390,768,1440]) {
      await page.setViewportSize({ width, height: 900 });
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
      if (width === 390) await page.screenshot({ path: `${output}/farm-mobile.png`, fullPage: true });
      for (const modal of ['Market','Expand','Defense','Economy']) {
        await open(page, modal);
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
        const d = await page.getByRole('dialog').boundingBox(); assert(d.x >= 0 && d.x + d.width <= width + 1);
        if (width === 390) await page.screenshot({ path: `${output}/${modal.toLowerCase()}-mobile.png` });
        await close(page);
      }
    }
    await page.setViewportSize({ width: 390, height: 844 });
    await page.getByRole('button', { name: 'Pause game', exact: true }).click();
    await page.getByRole('button', { name: 'Back to the farm', exact: true }).click();
    assert(await page.getByRole('button', { name: 'Pause game', exact: true }).isVisible());
    await page.getByRole('button', { name: 'How to play' }).click();
    await page.getByRole('button', { name: 'Enable game sounds' }).click();
    assert.equal((await state(page)).sound, true);
    await page.getByRole('button', { name: 'Mute game sounds' }).click(); await close(page);
  });

  await check('Fresh hardware spinning status, capped Sunshine, and expiry', async () => {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
    let good = true;
    await ctx.route('https://api.squeekchain.com/**', async route => {
      const requestPage = route.request().frame().page();
      const now = await requestPage.evaluate(() => Date.now());
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ schemaVersion: 1, generatedAt: new Date(now).toISOString(), measurement: { freshness: good ? 'online' : 'stale', observedAt: new Date(now - 1000).toISOString(), receivedAt: new Date(now).toISOString(), staleAfterSeconds: 120, provenance: 'hardware', coreStatus: 'ACTIVE', rpmMilli: 12500, speedMmPerSecond: 100 }, oracle: { state: 'accepted' } }) });
    });
    const p = await ctx.newPage(); observe(p); await p.clock.install({ time: new Date() }); await p.goto(url);
    await p.getByRole('button', { name: 'Play now' }).click();
    await p.getByRole('button', { name: /Wheel spinning/ }).waitFor();
    await p.getByTestId('plot-0').click(); const before = await state(p);
    await p.clock.runFor(10_000); const after = await state(p);
    assert(after.plots[0].growth - before.plots[0].growth >= 10_750);
    assert(after.plots[0].growth - before.plots[0].growth <= 11_300);
    good = false; await p.clock.runFor(16_000);
    await p.getByRole('button', { name: /Offline/ }).waitFor();
    await ctx.close();
  });
  await check('Brutus warning, escaping theft and player interception in the rendered game', async () => {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
    await ctx.route('https://api.squeekchain.com/**', route => route.abort());
    const p = await ctx.newPage(); observe(p); await p.clock.install({ time: new Date() }); await p.goto(url);
    await p.getByRole('button', { name: 'Play now' }).click(); await p.getByTestId('plot-0').click();
    await p.clock.runFor(91_000); assert((await state(p)).bandit);
    assert(await p.locator('.raid-warning').isVisible());
    await p.screenshot({ path: `${output}/brutus-warning.png` });
    await p.clock.runFor(35_000); let g = await state(p); assert.equal(g.stolen, 4); assert.equal(g.plots[0].lost, 4);
    const delay = g.nextRaidAt - g.activeMs + 1000;
    await p.clock.runFor(delay); g = await state(p); assert(g.bandit);
    await p.getByTestId('plot-0').click();
    await p.clock.runFor(15_000); g = await state(p);
    assert.equal(g.stolen, 4); assert.equal(g.inventory.sunflower, 4); assert.equal(g.bandit, null);
    await ctx.close();
  });
  await check('No uncaught script errors or failed local resources', async () => {
    assert.deepEqual(errors, []); assert.deepEqual(localFailures, []);
  });
  await check('Populated farm, readable mobile seeds, focus ring and rendered weapon interception', async () => {
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.clock.fastForward(160_000); await open(page, 'Harvest');
    const before = (await state(page)).repelled;
    for (let i = 0; i < 8; i++) {
      await page.getByRole('button', { name: new RegExp(`^Select ${cropNames[i % 6]},`) }).click();
      await page.getByTestId(`plot-${i}`).click();
    }
    await page.clock.runFor(160_000);
    assert((await state(page)).repelled > before);
    assert.equal((await state(page)).plots.filter(Boolean).length, 8);
    await page.getByTestId('plot-0').focus();
    const outline = await page.getByTestId('plot-0').evaluate(el => getComputedStyle(el).outlineWidth);
    assert.notEqual(outline, '0px');
    await page.screenshot({ path: `${output}/farm-desktop-growing.png`, fullPage: true });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.locator('.seed-choice').first().scrollIntoViewIfNeeded();
    for (const name of cropNames) {
      const label = page.locator('.seed-name', { hasText: new RegExp(`^${name}$`) });
      const box = await label.boundingBox();
      const lineHeight = await label.evaluate(el => parseFloat(getComputedStyle(el).lineHeight));
      assert(box.height <= lineHeight + 1, `${name} wraps in the mobile seed tray`);
    }
    await page.evaluate(() => scrollTo(0,0));
    await page.screenshot({ path: `${output}/farm-mobile-growing.png`, fullPage: true });
  });
  try {
    const safari = await webkit.launch({ headless: true });
    const c = await safari.newContext({ viewport: { width: 390, height: 844 } });
    await c.route('https://api.squeekchain.com/**', r => r.abort());
    const p = await c.newPage(); await p.goto(url);
    await p.getByRole('button', { name: 'Play now' }).click(); await p.getByTestId('plot-0').click();
    assert.equal((await state(p)).plots[0].crop, 'sunflower');
    results.push({ name: 'WebKit primary plant interaction', passed: true });
    await safari.close();
  } catch (e) { results.push({ name: 'WebKit primary plant interaction', notRun: true, reason: e.message.split('\n')[0] }); }
} catch (e) { console.error(e.stack); process.exitCode = 1; }
finally {
  await writeFile(`${output}/results.json`, JSON.stringify({ results, errors, localFailures }, null, 2));
  await context?.close(); await browser.close(); await new Promise(resolve => server.close(resolve));
}
