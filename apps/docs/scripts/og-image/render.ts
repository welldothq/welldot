// Renders scripts/og-image/og-image.html to public/og-image.png (1200×630).
// Manual: `pnpm --filter docs generate:og`; the PNG is committed. Uses the installed Google
// Chrome, or Playwright's Chromium when that is installed (`npx playwright install chromium`).
// Needs network access for the Google Fonts.
import { fileURLToPath, pathToFileURL } from 'node:url';
import { chromium } from 'playwright-core';

const source = fileURLToPath(new URL('./og-image.html', import.meta.url));
const output = fileURLToPath(
  new URL('../../public/og-image.png', import.meta.url),
);

const browser = await chromium
  .launch()
  .catch(() => chromium.launch({ channel: 'chrome' }));
try {
  const page = await browser.newPage({
    viewport: { width: 1200, height: 630 },
    deviceScaleFactor: 1,
  });
  await page.goto(pathToFileURL(source).href, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: output, type: 'png' });
  console.log(`Wrote ${output}`);
} finally {
  await browser.close();
}
