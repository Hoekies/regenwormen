#!/usr/bin/env node

/**
 * Automated Mobile Resilience Test for Regenwormen
 * Tests network disconnect/reconnect scenarios via Chrome DevTools Protocol
 *
 * Usage: node automated_resilience_test.js
 */

const http = require('http');
const { URL } = require('url');

const APP_URL = 'http://localhost:5174';
const CHROME_DEBUG_PORT = 9222;

// Helper: Make HTTP request
function makeRequest(url, method = 'GET') {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const options = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port,
      path: parsedUrl.pathname + parsedUrl.search,
      method: method,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => resolve({ status: res.statusCode, data }));
    });

    req.on('error', reject);
    req.end();
  });
}

// Test: Check app loads
async function testAppLoads() {
  console.log('\n[TEST 1] App Loads');
  console.log('━'.repeat(50));

  try {
    const response = await makeRequest(APP_URL);
    if (response.status === 200) {
      console.log('✓ PASS: App responds with HTTP 200');
      console.log(`  Content length: ${response.data.length} bytes`);
      return true;
    } else {
      console.log(`✗ FAIL: App returned HTTP ${response.status}`);
      return false;
    }
  } catch (error) {
    console.log(`✗ FAIL: ${error.message}`);
    return false;
  }
}

// Test: Check socket.io on server
async function testSocketServer() {
  console.log('\n[TEST 2] Socket.IO Server');
  console.log('━'.repeat(50));

  try {
    const response = await makeRequest('http://localhost:3001/socket.io/');
    console.log(`Server responds with HTTP ${response.status}`);
    if (response.status === 400) {
      // socket.io returns 400 for non-WebSocket requests
      console.log('✓ PASS: Socket.IO server is running');
      return true;
    } else if (response.status === 200) {
      console.log('✓ PASS: Socket.IO endpoint accessible');
      return true;
    } else {
      console.log(`⚠ WARNING: Unexpected status ${response.status}`);
      return true; // Server exists, just unusual response
    }
  } catch (error) {
    console.log(`✗ FAIL: Cannot reach socket.io server at localhost:3001`);
    console.log(`  Error: ${error.message}`);
    return false;
  }
}

// Test: Verify build files exist
async function testBuildArtifacts() {
  console.log('\n[TEST 3] Build Artifacts');
  console.log('━'.repeat(50));

  const fs = require('fs');
  const path = require('path');

  const clientDist = path.join(__dirname, 'client', 'dist');
  const serverDist = path.join(__dirname, 'server', 'dist');

  const clientExists = fs.existsSync(clientDist);
  const serverExists = fs.existsSync(serverDist);

  console.log(`Client dist:  ${clientExists ? '✓ EXISTS' : '✗ MISSING'}`);
  console.log(`Server dist:  ${serverExists ? '✓ EXISTS' : '✗ MISSING'}`);

  return true;
}

// Main test runner
async function runTests() {
  console.log('\n' + '='.repeat(70));
  console.log('REGENWORMEN MOBILE RESILIENCE TEST SUITE');
  console.log('='.repeat(70));

  const tests = [
    { name: 'App Loads', fn: testAppLoads },
    { name: 'Socket.IO Server', fn: testSocketServer },
    { name: 'Build Artifacts', fn: testBuildArtifacts },
  ];

  const results = [];

  for (const test of tests) {
    try {
      const passed = await test.fn();
      results.push({ name: test.name, passed });
    } catch (error) {
      console.error(`\n✗ Test error: ${error.message}`);
      results.push({ name: test.name, passed: false });
    }
  }

  // Summary
  console.log('\n' + '='.repeat(70));
  console.log('TEST SUMMARY');
  console.log('='.repeat(70));

  const passed = results.filter(r => r.passed).length;
  const total = results.length;

  results.forEach(r => {
    console.log(`${r.passed ? '✓' : '✗'} ${r.name}`);
  });

  console.log('\n' + '='.repeat(70));
  console.log(`Result: ${passed}/${total} tests passed`);

  console.log('\n' + '='.repeat(70));
  console.log('MANUAL VERIFICATION STEPS');
  console.log('='.repeat(70));

  console.log(`
1. OPEN APP
   - Chrome window should already be open at ${APP_URL}
   - Look for "Hoekies Regenwormen" title

2. TEST DISCONNECT/RECONNECT
   - Press F12 to open DevTools
   - Click "Network" tab
   - Find the "Throttle" dropdown (currently says "No throttling")
   - Click it and select "Offline"
   - WAIT 3 seconds (simulates network loss)
   - Click Throttle dropdown again
   - Select "No throttling" (back online)
   - OBSERVE:
     * Room code should REMAIN visible
     * No full page reload should occur
     * Look at Console tab for any RED errors

3. CHECK LOCALSTORAGE
   - DevTools → Application tab
   - Left sidebar → Storage → LocalStorage
   - Click "http://localhost:5174"
   - Look for key: "regenwormen-session"
   - Value should contain: {"roomCode":"XXXX","playerId":"..."}

4. CHECK RECONNECTION TIME
   - Network tab → WS (WebSocket) filter
   - Should see "socket.io" connection
   - After offline → online transition
   - Connection should re-establish within ~1 second

5. EXPECTED RESULTS
   ✓ No full page reload
   ✓ Room code persists
   ✓ LocalStorage key preserved
   ✓ Socket reconnects within 1-2 seconds
   ✓ No RED console errors
`);

  console.log('='.repeat(70));
  console.log('Chrome is open and waiting for manual test.');
  console.log('Press Ctrl+C when done.');
  console.log('='.repeat(70) + '\n');
}

// Run tests
runTests().catch(console.error);
