import puppeteer from 'puppeteer';

async function testDirectSearch() {
  try {
    console.log('Launching browser...');
    const browser = await puppeteer.launch({
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu'
      ]
    });

    console.log('Creating page...');
    const page = await browser.newPage();
    
    // Set a realistic user agent
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36');
    
    // Set viewport
    await page.setViewport({ width: 1920, height: 1080 });
    
    console.log('Navigating to Google...');
    await page.goto('https://www.google.com', { waitUntil: 'networkidle2', timeout: 30000 });
    
    // Try to accept cookies if they appear
    try {
      const acceptButton = await page.$('button:has-text("Accept all")');
      if (acceptButton) {
        await acceptButton.click();
        await page.waitForNavigation({ waitUntil: 'networkidle2' });
      }
    } catch (err) {
      console.log('No cookie dialog found or could not be handled');
    }
    
    // Perform search
    console.log('Performing search for "SpaceX latest news"...');
    await page.type('input[name="q"]', 'SpaceX latest news');
    await page.keyboard.press('Enter');
    
    // Wait for results
    console.log('Waiting for search results...');
    await page.waitForSelector('div[data-hveid]', { timeout: 10000 });
    
    // Take a screenshot
    console.log('Taking screenshot...');
    await page.screenshot({ path: 'google-search.png' });
    console.log('Screenshot saved to google-search.png');
    
    // Extract results
    console.log('Extracting search results...');
    const results = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('.g, [data-hveid][data-ved]'))
        .map(div => {
          // Find the title element
          const titleEl = div.querySelector('h3, [role="heading"]');
          const title = titleEl ? titleEl.textContent || '' : '';
          
          // Find the link element
          const linkEl = div.querySelector('a[href^="http"]');
          const url = linkEl ? linkEl.getAttribute('href') || '' : '';
          
          // Find the description element
          const descEl = div.querySelector('.VwiC3b, [data-snc], [style*="webkit-line-clamp"]');
          const description = descEl ? descEl.textContent || '' : '';
          
          return { title, url, description };
        })
        .filter(item => 
          item.title && 
          item.url && 
          item.description && 
          !item.url.includes('google.com') && 
          !item.url.includes('gstatic.com')
        )
        .slice(0, 5); // Return top 5 results
    });
    
    // Display results
    console.log('\n========== SEARCH RESULTS ==========');
    if (results && results.length > 0) {
      results.forEach((result, index) => {
        console.log(`\nResult ${index + 1}:`);
        console.log(`Title: ${result.title}`);
        console.log(`URL: ${result.url}`);
        console.log(`Description: ${result.description}`);
      });
      console.log('\nSUCCESS: Found real search results!');
    } else {
      console.log('No results found or invalid results returned.');
    }
    
    // Close browser
    console.log('\nClosing browser...');
    await browser.close();
    
  } catch (error) {
    console.error('ERROR:', error);
  }
}

// Run the test
console.log('Starting direct Puppeteer web search test...');
testDirectSearch(); 