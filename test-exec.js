import puppeteer from 'puppeteer';
import { execSync } from 'child_process';

async function testWithExecPath() {
  try {
    // Check Chrome version
    console.log('\nChecking Chrome installation...');
    try {
      const output = execSync('which google-chrome').toString().trim();
      console.log(`Found Chrome at: ${output}`);
    } catch (e) {
      console.log('Google Chrome not found in PATH, will use bundled Chromium');
    }

    try {
      const output = execSync('/Applications/Google\\ Chrome.app/Contents/MacOS/Google\\ Chrome --version').toString().trim();
      console.log(`macOS Chrome version: ${output}`);
    } catch (e) {
      console.log('Could not get macOS Chrome version');
    }

    // Print Puppeteer version
    console.log(`\nPuppeteer version: ${puppeteer.version}`);

    // Test with system Chrome if available
    try {
      console.log('\nAttempting to use system Chrome...');

      console.log('Launching browser with system Chrome...');
      const browser = await puppeteer.launch({
        headless: 'new',
        executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage'
        ]
      });

      console.log('Creating page...');
      const page = await browser.newPage();
      
      console.log('Navigating to example.com...');
      await page.goto('https://example.com', { waitUntil: 'networkidle2', timeout: 30000 });
      
      const title = await page.title();
      console.log(`Page title: ${title}`);
      
      console.log('Closing browser...');
      await browser.close();
      console.log('System Chrome test completed successfully!');
      return;
    } catch (error) {
      console.error('\nERROR with system Chrome:', error.message);
      console.log('Falling back to bundled Chromium...');
    }

    // Fall back to bundled Chromium
    console.log('\nAttempting to use bundled Chromium...');
    
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
    
    console.log('Navigating to example.com...');
    await page.goto('https://example.com', { waitUntil: 'networkidle2', timeout: 30000 });
    
    const title = await page.title();
    console.log(`Page title: ${title}`);
    
    console.log('Closing browser...');
    await browser.close();
    console.log('Bundled Chromium test completed successfully!');
    
  } catch (error) {
    console.error('\nFATAL ERROR:', error);
  }
}

// Run the test
console.log('Starting Puppeteer test with executable path...');
testWithExecPath(); 