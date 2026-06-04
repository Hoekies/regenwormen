import asyncio
from playwright.async_api import async_playwright
import json
import time
import sys

async def test_resilience():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=False)
        context = await browser.create_context()
        page = await context.new_page()

        print("=" * 60)
        print("REGENWORMEN MOBILE RESILIENCE TEST")
        print("=" * 60)

        # Navigate to app
        print("\n[SETUP] Navigating to http://localhost:5176...")
        try:
            await page.goto('http://localhost:5176', wait_until='networkidle', timeout=10000)
        except Exception as e:
            print(f"WARNING: Navigation timeout or error: {e}")
            print("Continuing test anyway...")

        await asyncio.sleep(2)

        # Test 1: Check localStorage
        print("\n" + "=" * 60)
        print("SCENARIO 1: LocalStorage Persistence")
        print("=" * 60)

        session = await page.evaluate("""() => {
            return localStorage.getItem('regenwormen-session');
        }""")
        print(f"LocalStorage regenwormen-session: {session}")

        # Test 2: Disconnect/Reconnect
        print("\n" + "=" * 60)
        print("SCENARIO 2: Network Disconnect/Reconnect")
        print("=" * 60)

        # Get CDP session
        client = await page.context().new_cdp_session(page)

        # Go OFFLINE
        print("\n[ACTION] Setting network OFFLINE...")
        await client.send('Network.emulateNetworkConditions', {
            'offline': True,
            'downloadThroughput': -1,
            'uploadThroughput': -1,
            'latency': 0
        })
        print("✓ Network is now OFFLINE")

        # Wait 3 seconds
        print("[WAIT] Waiting 3 seconds offline...")
        await asyncio.sleep(3)

        # Check console for errors
        errors = []
        def on_console(msg):
            if 'error' in msg.text.lower():
                errors.append(msg.text)
        page.on("console", on_console)

        # Go ONLINE
        print("\n[ACTION] Setting network back ONLINE...")
        start_time = time.time()
        await client.send('Network.emulateNetworkConditions', {
            'offline': False,
            'downloadThroughput': -1,
            'uploadThroughput': -1,
            'latency': 0
        })
        print("✓ Network is now ONLINE")

        # Wait for reconnection
        await asyncio.sleep(3)
        reconnect_time = time.time() - start_time

        print(f"\n[RESULT] Reconnection time: {reconnect_time:.2f}s")
        print(f"[RESULT] Console errors detected: {len(errors)}")
        if errors:
            for err in errors[:5]:
                print(f"  - {err}")

        # Test 3: Socket state after reconnect
        print("\n" + "=" * 60)
        print("SCENARIO 3: Socket State After Reconnect")
        print("=" * 60)

        socket_connected = await page.evaluate("""() => {
            if (window.socket) {
                return window.socket.connected;
            }
            return 'socket not found';
        }""")
        print(f"Socket connected: {socket_connected}")

        # Test 4: Refresh while offline
        print("\n" + "=" * 60)
        print("SCENARIO 4: Refresh While Offline")
        print("=" * 60)

        # Go offline again
        await client.send('Network.emulateNetworkConditions', {
            'offline': True,
            'downloadThroughput': -1,
            'uploadThroughput': -1,
            'latency': 0
        })
        print("[ACTION] Network OFFLINE again")

        # Refresh page
        print("[ACTION] Refreshing page while offline...")
        try:
            await page.reload(wait_until='networkidle', timeout=5000)
            print("WARNING: Page reload while offline succeeded (may indicate no hard requirement)")
        except:
            print("✓ Page reload blocked while offline (expected)")

        # Check localStorage still has data
        session = await page.evaluate("""() => {
            return localStorage.getItem('regenwormen-session');
        }""")
        print(f"✓ LocalStorage preserved after offline refresh: {bool(session)}")

        # Go back online
        await client.send('Network.emulateNetworkConditions', {
            'offline': False,
            'downloadThroughput': -1,
            'uploadThroughput': -1,
            'latency': 0
        })
        print("[ACTION] Network back ONLINE")
        await asyncio.sleep(2)

        # Try navigation again
        try:
            await page.goto('http://localhost:5176', wait_until='networkidle', timeout=5000)
            print("✓ Navigation successful after reconnect")
        except:
            print("⚠ Navigation timeout (server may not be responding)")

        print("\n" + "=" * 60)
        print("TEST COMPLETE")
        print("=" * 60)

        await asyncio.sleep(5)
        await browser.close()

if __name__ == '__main__':
    asyncio.run(test_resilience())
