import { chromium } from 'playwright';
import path from 'node:path';

const projectDir = process.cwd();
const appRoot = path.resolve(projectDir, '..', '..');
const pdfPath = path.join(appRoot, 'tmp', 'signlocal-test.pdf');
const assetsDir = path.join(projectDir, 'assets');

const browser = await chromium.launch({ channel: 'msedge', headless: true });
const page = await browser.newPage({ viewport: { width: 1080, height: 1080 }, deviceScaleFactor: 1 });
page.setDefaultTimeout(12_000);

try {
  await page.goto('https://signlocal-adam-designs.netlify.app', { waitUntil: 'networkidle' });
  console.log('captured: home loaded');
  await page.screenshot({ path: path.join(assetsDir, 'demo-01-home.png') });

  await page.locator('input[type="file"]').setInputFiles(pdfPath);
  await page.locator('.workspace').waitFor({ state: 'visible' });
  await page.locator('.paper canvas').waitFor({ state: 'visible' });
  await page.waitForTimeout(1200);
  await page.screenshot({ path: path.join(assetsDir, 'demo-02-editor.png') });
  console.log('captured: editor loaded');

  const pad = page.getByLabel('Signature drawing pad');
  await pad.scrollIntoViewIfNeeded();
  const padBox = await pad.boundingBox();
  if (!padBox) throw new Error('Signature pad was not measurable.');
  await page.mouse.move(padBox.x + padBox.width * 0.16, padBox.y + padBox.height * 0.68);
  await page.mouse.down();
  await page.mouse.move(padBox.x + padBox.width * 0.30, padBox.y + padBox.height * 0.30, { steps: 6 });
  await page.mouse.move(padBox.x + padBox.width * 0.42, padBox.y + padBox.height * 0.72, { steps: 6 });
  await page.mouse.move(padBox.x + padBox.width * 0.56, padBox.y + padBox.height * 0.35, { steps: 6 });
  await page.mouse.move(padBox.x + padBox.width * 0.68, padBox.y + padBox.height * 0.64, { steps: 6 });
  await page.mouse.move(padBox.x + padBox.width * 0.84, padBox.y + padBox.height * 0.40, { steps: 6 });
  await page.mouse.up();
  await page.screenshot({ path: path.join(assetsDir, 'debug-after-draw.png') });
  console.log('captured: signature drawn');

  await page.getByRole('button', { name: 'Place signature' }).click();
  await page.waitForTimeout(200);
  console.log(`status: ${await page.locator('.status-line').textContent()}`);
  console.log('captured: place-signature mode entered');
  const paper = page.locator('.paper');
  await paper.scrollIntoViewIfNeeded();
  const paperBox = await paper.boundingBox();
  if (!paperBox) throw new Error('PDF page was not measurable.');
  await paper.click({ position: { x: paperBox.width * 0.34, y: paperBox.height * 0.58 } });
  await page.locator('.placed-item.signature').waitFor({ state: 'visible' });
  console.log('captured: signature placed');
  await page.screenshot({ path: path.join(assetsDir, 'demo-03-signed.png') });

  const downloadEvent = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download PDF' }).click();
  const download = await downloadEvent;
  await download.saveAs(path.join(assetsDir, 'signlocal-demo-signed.pdf'));
  console.log('captured: signed PDF downloaded');
  await page.getByText('Downloaded. Your original PDF was not changed.').waitFor({ state: 'visible' });
  await page.screenshot({ path: path.join(assetsDir, 'demo-04-downloaded.png') });

  console.log(JSON.stringify({
    ok: true,
    screenshots: ['demo-01-home.png', 'demo-02-editor.png', 'demo-03-signed.png', 'demo-04-downloaded.png'],
    signedPdf: 'signlocal-demo-signed.pdf',
  }, null, 2));
} finally {
  await browser.close();
}
