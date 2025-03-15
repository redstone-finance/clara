import puppeteer from 'puppeteer';
import fs from "node:fs";

(async () => {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-web-security'],
    timeout: 60000
  });
  const page = await browser.newPage();

  await page.setViewport({ width: 1920, height: 1080 });

  page.on('console', msg => console.log('PAGE LOG:', msg.text()));

  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36');

  console.log('Navigating to https://yaps.kaito.ai/pre-tge...');
  await page.goto('https://yaps.kaito.ai/pre-tge', {
    waitUntil: 'networkidle2',
  });

  console.log('Page loaded, waiting for content to render...');
  await page.screenshot({ path: 'kaito-page.png' });

  const pageContent = await page.content();
  fs.writeFileSync("content.txt", pageContent, 'utf8');
  await page.waitForSelector('table[data-sentry-element="Table"][data-sentry-component="RawDataTable"]');

  const top5TwitterIDs = await page.evaluate(() => {
    const table = document.querySelector('table[data-sentry-element="Table"][data-sentry-component="RawDataTable"]');
    if (!table) return [];

    const rows = table.querySelectorAll('tbody > tr');
    const results = [];

    for (let i = 0; i < Math.min(5, rows.length); i++) {
      const row = rows[i];
      const cells = row.querySelectorAll('td');
      // Make sure there is a second <td> containing the user info
      if (cells.length < 2) continue;

      // The structure is: a parent span with the avatar and then another span with the text,
      // where the Twitter handle appears in a span with classes like "text-white/40".
      const handleSpan = cells[1].querySelector('span.flex > span:not(.relative) span.text-white\\/40');
      if (handleSpan) {
        let handle = handleSpan.textContent.trim();
        if (handle.startsWith('@')) {
          handle = handle.slice(1);
        }
        results.push(handle);
      }
    }
    return results;
  });

  console.log('Top 5 Twitter IDs:', top5TwitterIDs);
  await browser.close();
})();
