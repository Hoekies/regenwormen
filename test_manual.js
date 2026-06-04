// Manual test script - Open browser and test resilience scenarios
// Run with: npx playwright test-manual.js

const { chromium } = require('playwright');

async function runTests() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.createContext();
  const page = await context.newPage();

  console.log('\n' + '='.repeat(70));
  console.log('REGENWORMEN MOBILE RESILIENCE TEST');
  console.log('='.repeat(70));

  // Collect console messages and errors
  const consoleLogs = [];
  page.on('console', msg => {
    consoleLogs.push({ type: msg.type(), text: msg.text() });
    console.log(`[${msg.type()}] ${msg.text()}`);
  });

  try {
    // Step 1: Navigate to app
    console.log('\n[STEP 1] Navigating to http://localhost:5174...');
    await page.goto('http://localhost:5174', { waitUntil: 'networkidle' });
    console.log('✓ Page loaded');

    await page.waitForTimeout(2000);

    // Check if socket is available
    const socketCheck = await page.evaluate(() => {
      return {
        socketExists: typeof socket !== 'undefined',
        socketConnected: typeof socket !== 'undefined' && socket.connected
      };
    });
    console.log('Socket status:', socketCheck);

    // SCENARIO 1: Check localStorage
    console.log('\n' + '='.repeat(70));
    console.log('SCENARIO 1: LocalStorage Persistence');
    console.log('='.repeat(70));

    const initialSession = await page.evaluate(() => localStorage.getItem('regenwormen-session'));
    console.log('Initial localStorage state:', initialSession ? 'EXISTS' : 'EMPTY');
    if (initialSession) {
      console.log('Session data:', initialSession);
    }

    // SCENARIO 2: Network Disconnect/Reconnect
    console.log('\n' + '='.repeat(70));
    console.log('SCENARIO 2: Network Disconnect/Reconnect (3 second outage)');
    console.log('='.repeat(70));

    const cdpSession = await context.newCDPSession(page);

    // Go offline
    console.log('[ACTION] Sending network OFFLINE...');
    await cdpSession.send('Network.emulateNetworkConditions', {
      offline: true,
      downloadThroughput: -1,
      uploadThroughput: -1,
      latency: 0
    });
    console.log('✓ Network is OFFLINE');

    // Check socket state while offline
    const offlineSocketState = await page.evaluate(() => ({
      connected: typeof socket !== 'undefined' && socket.connected,
      reconnecting: typeof socket !== 'undefined' && socket.disconnected
    })).catch(() => ({ error: 'eval failed' }));
    console.log('Socket state (offline):', offlineSocketState);

    // Wait 3 seconds
    console.log('[WAIT] Offline for 3 seconds...');
    await page.waitForTimeout(3000);

    // Go back online
    console.log('[ACTION] Sending network ONLINE...');
    const reconnectStart = Date.now();
    await cdpSession.send('Network.emulateNetworkConditions', {
      offline: false,
      downloadThroughput: -1,
      uploadThroughput: -1,
      latency: 0
    });
    console.log('✓ Network is ONLINE');

    // Wait for reconnection attempt
    let reconnectTime = null;
    let socketReconnected = false;

    for (let i = 0; i < 10; i++) {
      await page.waitForTimeout(500);
      const socketState = await page.evaluate(() =>
        typeof socket !== 'undefined' && socket.connected
      ).catch(() => false);

      if (socketState && !socketReconnected) {
        reconnectTime = Date.now() - reconnectStart;
        socketReconnected = true;
        console.log(`✓ Socket reconnected after ${reconnectTime}ms`);
        break;
      }
    }

    if (!socketReconnected) {
      reconnectTime = Date.now() - reconnectStart;
      console.log(`⚠ Socket NOT reconnected after ${reconnectTime}ms`);
    }

    // Check if session preserved
    const sessionAfterReconnect = await page.evaluate(() => localStorage.getItem('regenwormen-session'));
    console.log(`Session preserved after disconnect: ${sessionAfterReconnect ? '✓ YES' : '✗ NO'}`);

    // SCENARIO 3: Refresh while offline
    console.log('\n' + '='.repeat(70));
    console.log('SCENARIO 3: Page Refresh While Offline');
    console.log('='.repeat(70));

    // Go offline again
    await cdpSession.send('Network.emulateNetworkConditions', {
      offline: true,
      downloadThroughput: -1,
      uploadThroughput: -1,
      latency: 0
    });
    console.log('[ACTION] Network OFFLINE again');

    // Try to refresh
    console.log('[ACTION] Attempting page refresh while offline...');
    try {
      await page.reload({ waitUntil: 'networkidle', timeout: 3000 });
      console.log('⚠ Page reload succeeded (may load from cache)');
    } catch (e) {
      console.log(`✓ Page reload failed (expected): ${e.message.substring(0, 50)}`);
    }

    // Check localStorage still intact
    const sessionAfterOfflineRefresh = await page.evaluate(() => localStorage.getItem('regenwormen-session'));
    console.log(`LocalStorage after offline refresh: ${sessionAfterOfflineRefresh ? '✓ PRESERVED' : '✗ LOST'}`);

    // Go back online
    await cdpSession.send('Network.emulateNetworkConditions', {
      offline: false,
      downloadThroughput: -1,
      uploadThroughput: -1,
      latency: 0
    });
    console.log('[ACTION] Network ONLINE');

    await page.waitForTimeout(2000);

    // SCENARIO 4: Check console for errors
    console.log('\n' + '='.repeat(70));
    console.log('SCENARIO 4: Console Error Analysis');
    console.log('='.repeat(70));

    const errors = consoleLogs.filter(log => log.type === 'error');
    const warnings = consoleLogs.filter(log => log.type === 'warning');

    console.log(`Total errors: ${errors.length}`);
    console.log(`Total warnings: ${warnings.length}`);

    if (errors.length > 0) {
      console.log('\nErrors detected:');
      errors.slice(0, 5).forEach(err => console.log(`  - ${err.text}`));
    } else {
      console.log('✓ No console errors detected');
    }

    // SUMMARY
    console.log('\n' + '='.repeat(70));
    console.log('TEST SUMMARY');
    console.log('='.repeat(70));

    console.log(`Scenario 1 (LocalStorage):     ${initialSession ? '✓' : '⚠'} PASS`);
    console.log(`Scenario 2 (Reconnect):        ${socketReconnected && reconnectTime < 5000 ? '✓' : '⚠'} ${reconnectTime ? reconnectTime + 'ms' : 'FAILED'}`);
    console.log(`Scenario 3 (Offline Refresh):  ${sessionAfterOfflineRefresh ? '✓' : '⚠'} Session preserved`);
    console.log(`Scenario 4 (Console):          ${errors.length === 0 ? '✓' : '⚠'} ${errors.length} errors`);

    console.log('\n' + '='.repeat(70));
    console.log('TEST COMPLETE - Keep browser open to inspect');
    console.log('Press Ctrl+C to exit');
    console.log('='.repeat(70) + '\n');

    // Keep browser open for inspection
    await page.waitForTimeout(30000);

  } catch (error) {
    console.error('Test error:', error);
  } finally {
    await browser.close();
  }
}

runTests().catch(console.error);
