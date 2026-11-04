// Render the original vector share artwork to a broadly supported social PNG.
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
const modulePath = process.argv.find(v => v.startsWith('--playwright='))?.split('=')[1];
const { chromium } = modulePath ? await import(pathToFileURL(modulePath).href) : await import('playwright');
const svg = await readFile('public/share.svg');
const server = createServer((_req, res) => { res.writeHead(200, { 'Content-Type': 'image/svg+xml' }); res.end(svg); });
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
try {
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
  await page.goto(`http://127.0.0.1:${server.address().port}/share.svg`);
  await page.screenshot({ path: 'public/share.png', type: 'png' });
  console.log('Rendered public/share.png: 1200 × 630, from original public/share.svg.');
} finally { await browser.close(); await new Promise(resolve => server.close(resolve)); }
