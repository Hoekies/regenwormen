const { chromium } = require('playwright');
const fs = require('fs');

const viewports = [
  { name: 'iPhone', width: 375, height: 667 },
  { name: 'Android', width: 384, height: 812 },
  { name: 'Desktop', width: 1024, height: 768 }
];

const url = 'https://hoekies-regenwormen.vercel.app/';

(async () => {
  const browser = await chromium.launch();
  const results = {};
  
  for (const viewport of viewports) {
    const context = await browser.createContext({ viewport });
    const page = await context.newPage();
    
    console.log(`\n=== ${viewport.name} (${viewport.width}×${viewport.height}) ===`);
    
    try {
      await page.goto(url, { waitUntil: 'networkidle' });
      await page.waitForTimeout(1000);
      
      // Screenshot
      const filename = `screenshot_${viewport.name.toLowerCase()}.png`;
      await page.screenshot({ path: filename, fullPage: true });
      console.log(`📸 Screenshot: ${filename}`);
      
      // Test DOBBELEN button
      const dobbelBtns = await page.locator('button').all();
      let found = false;
      for (const btn of dobbelBtns) {
        const text = await btn.textContent();
        if (text && text.includes('DOBBELEN')) {
          const box = await btn.boundingBox();
          const isVisible = await btn.isVisible();
          console.log(`DOBBELEN button: ${box.width.toFixed(0)}×${box.height.toFixed(0)}px`);
          console.log(`  Height: ${box.height >= 44 ? '✅' : '⚠️'} ${box.height.toFixed(0)}px ${box.height >= 44 ? '(≥44px OK)' : '(too small <44px)'}`);
          console.log(`  Visibility: ${isVisible ? '✅' : '⚠️'}`);
          found = true;
          break;
        }
      }
      if (!found) console.log(`⚠️ DOBBELEN button not found`);
      
      // Check layout issues
      const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
      const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
      const hasOverflow = scrollWidth > clientWidth;
      
      console.log(`Layout: ${hasOverflow ? '⚠️' : '✅'} No horizontal overflow (${scrollWidth}px = ${clientWidth}px)`);
      
      // Check visible elements
      const main = await page.locator('main').isVisible().catch(() => false);
      const container = await page.locator('[class*="container"], [class*="game"], body').first().isVisible();
      console.log(`Content: ${container ? '✅' : '⚠️'} Rendered`);
      
      results[viewport.name] = { success: true, overflow: hasOverflow };
      
    } catch (error) {
      console.log(`❌ Error: ${error.message}`);
      results[viewport.name] = { success: false, error: error.message };
    }
    
    await context.close();
  }
  
  await browser.close();
  console.log('\n=== Summary ===');
  console.log(JSON.stringify(results, null, 2));
})();
