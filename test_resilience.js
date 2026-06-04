import { chromium } from 'playwright';

async function testMobileResilience() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.createContext();
  const page = await context.newPage();

  // Stuur naar de app op poort 5176 (niet 5174 zoals aangegeven, want die poort was in use)
  await page.goto('http://localhost:5176', { waitUntil: 'networkidle' });
  
  // Open DevTools
  await page.keyboard.press('F12');
  await page.waitForTimeout(1000);

  console.log('=== SCENARIO 1: Basis disconnect/reconnect ===');
  
  // Stap 1: Wacht tot app geladen is
  console.log('Waiting for app to load...');
  await page.waitForTimeout(2000);
  
  // Check console voor errors
  const consoleMessages = [];
  page.on('console', msg => consoleMessages.push(msg.text()));

  // Stap 2: Stuur network offline (via DevTools Protocol)
  console.log('Setting network offline...');
  const client = await page.context().newCDPSession(page);
  await client.send('Network.emulateNetworkConditions', {
    offline: true,
    downloadThroughput: -1,
    uploadThroughput: -1,
    latency: 0
  });

  console.log('Network is now OFFLINE');
  await page.waitForTimeout(3000);

  // Stap 3: Check localStorage voor "regenwormen-session"
  const sessionData = await page.evaluate(() => {
    return localStorage.getItem('regenwormen-session');
  });
  console.log('LocalStorage regenwormen-session:', sessionData);

  // Stap 4: Reconnect
  console.log('Setting network back to ONLINE...');
  await client.send('Network.emulateNetworkConditions', {
    offline: false,
    downloadThroughput: -1,
    uploadThroughput: -1,
    latency: 0
  });

  const startTime = Date.now();
  await page.waitForTimeout(3000);
  const reconnectTime = Date.now() - startTime;

  console.log(`Reconnected in ${reconnectTime}ms`);
  console.log('Console errors:', consoleMessages.filter(m => m.includes('error')));

  await browser.close();
}

testMobileResilience().catch(console.error);
