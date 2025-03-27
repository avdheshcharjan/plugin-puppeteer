import puppeteer from 'puppeteer';

async function testSimple() {
  try {
    console.log('Launching browser...');
    const browser = await puppeteer.launch({
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage'
      ]
    });

    console.log('Creating page...');
    const page = await browser.newPage();
    
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36');
    
    console.log('Navigating to example.com...');
    await page.goto('https://example.com', { waitUntil: 'networkidle2', timeout: 30000 });
    
    console.log('Taking screenshot...');
    await page.screenshot({ path: 'example-com.png' });
    console.log('Screenshot saved to example-com.png');
    
    const title = await page.title();
    console.log(`Page title: ${title}`);
    
    const content = await page.content();
    console.log(`Page content length: ${content.length} characters`);
    
    console.log('Closing browser...');
    await browser.close();
    console.log('Test completed successfully!');
    
  } catch (error) {
    console.error('ERROR:', error);
  }
}

// Run the test
console.log('Starting simple Puppeteer test...');
testSimple(); 