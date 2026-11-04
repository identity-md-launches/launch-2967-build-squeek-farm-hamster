// Focused keyboard and rendered UI checks against the exported game.
import { createServer } from 'node:http';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { resolve, extname } from 'node:path';
import { pathToFileURL } from 'node:url';
import assert from 'node:assert/strict';
const entry = process.argv.find(v => v.startsWith('--playwright='))?.split('=')[1];
const { chromium } = entry ? await import(pathToFileURL(entry).href) : await import('playwright');
const root = resolve('dist'), output = 'test/scratch/accessibility';
await mkdir(output, { recursive: true });
const types = { '.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.woff2':'font/woff2','.woff':'font/woff' };
const server = createServer(async (req, res) => {
  const file = resolve(root, decodeURIComponent(new URL(req.url, 'http://localhost').pathname).replace(/^\/preview\//, ''));
  if (!file.startsWith(root + '/')) { res.writeHead(403); res.end(); return; }
  try { const bytes = await readFile(file); res.writeHead(200, { 'Content-Type': types[extname(file)] || 'application/octet-stream' }); res.end(bytes); }
  catch { res.writeHead(404); res.end(); }
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const browser = await chromium.launch({ headless:true, args:['--no-sandbox'] });
const results = {};
try {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  await ctx.route('https://api.squeekchain.com/**', r => r.fulfill({ status:503, contentType:'application/json', body:'{"error":"unavailable"}' }));
  const p = await ctx.newPage(); await p.clock.install({ time:new Date() });
  await p.goto(`http://127.0.0.1:${server.address().port}/preview/index.html`);
  await p.getByRole('button', { name:'Play now' }).focus(); await p.keyboard.press('Enter');
  await p.getByTestId('plot-0').waitFor();
  await p.keyboard.press('Tab'); await p.getByTestId('plot-0').focus();
  const focus = await p.getByTestId('plot-0').evaluate(el => ({ visible:el.matches(':focus-visible'), style:getComputedStyle(el).outlineStyle, width:getComputedStyle(el).outlineWidth, color:getComputedStyle(el).outlineColor }));
  assert(focus.visible); assert.equal(focus.style,'solid'); assert.equal(focus.width,'3px'); results.focus = focus;
  await p.screenshot({ path:`${output}/keyboard-plot-mobile.png` });
  await p.keyboard.press('Space');
  assert.equal(await p.getByTestId('plot-0').getAttribute('data-crop'),'sunflower');
  await p.clock.runFor(31_000); await p.keyboard.press('Enter');
  assert.equal(await p.evaluate(() => JSON.parse(localStorage.getItem('squeek-farm-v1')).inventory.sunflower),8);
  results.keyboardPlantHarvest = true;
  await p.getByRole('button', { name:'Market', exact:true }).focus(); await p.keyboard.press('Enter');
  const dialog = p.getByRole('dialog');
  await dialog.waitFor();
  for (let i=0; i<18; i++) {
    await p.keyboard.press('Tab');
    assert(await p.evaluate(() => !!document.activeElement?.closest('dialog')));
  }
  await p.getByRole('button', { name:'Sell one Sunflower', exact:true }).focus(); await p.keyboard.press('Enter');
  assert.equal(await p.evaluate(() => JSON.parse(localStorage.getItem('squeek-farm-v1')).balance),2);
  await p.keyboard.press('Escape');
  assert.equal(await p.locator(':focus').getAttribute('aria-label'),'Market');
  results.keyboardSaleFocusTrapReturn = true;
  results.targets = await p.locator('.plot,.dock-button,.seed-choice').evaluateAll(els => els.map(el => { const r=el.getBoundingClientRect(); return { label:el.getAttribute('aria-label'), width:r.width, height:r.height }; }));
  assert(results.targets.every(t => t.width >= 44 && t.height >= 44));
  results.pairs = await p.evaluate(() => ['.brand-farm','.seed-choice.selected .seed-meta','.farm-status','.plot.empty .plot-label','.basket-summary'].map(selector => {
    const el = document.querySelector(selector); let bg = null;
    for(let a=el; a; a=a.parentElement) { const value=getComputedStyle(a).backgroundColor; if(!value.includes('rgba') && value !== 'transparent') { bg=value; break; } }
    return { selector, color:getComputedStyle(el).color, background:bg };
  }));
  const lum = rgb => { const c=rgb.match(/[\d.]+/g).slice(0,3).map(Number).map(v=>v/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4);return c[0]*.2126+c[1]*.7152+c[2]*.0722; };
  for (const pair of results.pairs) { const a=lum(pair.color), b=lum(pair.background); pair.ratio=(Math.max(a,b)+.05)/(Math.min(a,b)+.05); assert(pair.ratio>=4.5,`${pair.selector}: ${pair.ratio}`); }
  await p.emulateMedia({ reducedMotion:'reduce' });
  results.runningAnimations = await p.evaluate(() => document.getAnimations().filter(a => a.playState === 'running' && a.effect?.getTiming().iterations === Infinity).length);
  assert.equal(results.runningAnimations,0);
  const corrupt = await browser.newContext();
  await corrupt.route('https://api.squeekchain.com/**', r => r.abort());
  await corrupt.addInitScript(() => localStorage.setItem('squeek-farm-v1','{broken'));
  const damaged = await corrupt.newPage(); await damaged.clock.install({ time:new Date() });
  await damaged.goto(`http://127.0.0.1:${server.address().port}/preview/index.html`);
  await damaged.getByText(/The previous save could not be restored/).waitFor();
  await damaged.clock.runFor(3000);
  assert.equal(await damaged.evaluate(() => localStorage.getItem('squeek-farm-v1')),'{broken');
  await damaged.getByRole('button', { name:'Play now' }).click();
  assert.equal(await damaged.evaluate(() => JSON.parse(localStorage.getItem('squeek-farm-v1')).started),true);
  await corrupt.close();
  const blocked = await browser.newContext();
  await blocked.route('https://api.squeekchain.com/**', r => r.abort());
  await blocked.addInitScript(() => { Storage.prototype.getItem = () => { throw new Error('Test: storage disabled'); }; Storage.prototype.setItem = () => { throw new Error('Test: storage disabled'); }; });
  const unsaved = await blocked.newPage(); await unsaved.goto(`http://127.0.0.1:${server.address().port}/preview/index.html`);
  await unsaved.getByText(/Browser storage is unavailable/).waitFor();
  await unsaved.getByRole('button', { name:'Play now' }).click(); await unsaved.getByTestId('plot-0').click();
  assert.equal(await unsaved.getByTestId('plot-0').getAttribute('data-crop'),'sunflower');
  await unsaved.getByRole('button', { name:'Dismiss', exact:true }).click();
  assert.match(await unsaved.locator('.save-indicator').innerText(),/Check save status/);
  results.damagedSavePreservedUntilStart = true; results.storageFailureHonestAndPlayable = true;
  await blocked.close();
  await writeFile(`${output}/results.json`, JSON.stringify(results,null,2));
  console.log('PASS keyboard plant, harvest, sale, dialog trap/return, visible focus ring, 16 comfortable game targets, 5 rendered contrast pairs, reduced motion, damaged save recovery, storage failure fallback.');
} finally { await browser.close(); await new Promise(r => server.close(r)); }
