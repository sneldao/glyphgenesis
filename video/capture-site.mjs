import { chromium } from 'playwright';

const browser = await chromium.launch();
const ctx = await browser.newContext({
  viewport: { width: 1920, height: 1080 },
  deviceScaleFactor: 2,
  recordVideo: { dir: 'public/site-capture', size: { width: 1920, height: 1080 } },
});
const page = await ctx.newPage();
await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
await page.waitForTimeout(3500); // hero field settles, fonts load

// slow drift down through the laboratory
await page.evaluate(() => window.scrollTo({ top: 0 }));
for (let y = 0; y <= 1400; y += 70) {
  await page.evaluate((v) => window.scrollTo({ top: v, behavior: 'instant' }), y);
  await page.waitForTimeout(140);
}
// interact: click generate once if the button is reachable
try {
  const btn = page.locator('button:has-text("Generate"), button:has-text("GENERATE")').first();
  if (await btn.isVisible({ timeout: 1500 })) {
    await btn.click();
    await page.waitForTimeout(4000);
  }
} catch {}
// drift on to the archive
for (let y = 1400; y <= 3200; y += 90) {
  await page.evaluate((v) => window.scrollTo({ top: v, behavior: 'instant' }), y);
  await page.waitForTimeout(140);
}
await page.waitForTimeout(2500);
await ctx.close(); // finalizes video file
await browser.close();
console.log('done');
