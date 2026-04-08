const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();
  
  page.on('console', msg => {
    console.log(`[CONSOLE] ${msg.type().toUpperCase()}: ${msg.text()}`);
  });
  page.on('pageerror', err => {
    console.log(`[PAGE ERROR]: ${err.toString()}`);
  });
  page.on('requestfailed', request => {
    console.log(`[REQUEST FAILED]: ${request.url()} - ${request.failure()?.errorText || 'Unknown error'}`);
  });

  await page.goto('http://localhost:8000', { waitUntil: 'networkidle0' });
  
  console.log("Page loaded. Clicking PLAY...");
  try {
    await page.click('#btn-play');
  } catch (e) {
    console.log("Could not click PLAY button:", e.message);
  }

  await new Promise(r => setTimeout(r, 2000));
  await browser.close();
})();