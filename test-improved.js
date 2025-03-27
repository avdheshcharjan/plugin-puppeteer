import { PuppeteerService } from './dist/index.js';
import { existsSync, writeFileSync } from 'fs';

// Simple runtime mock with correct getSetting method
const runtimeMock = {
  getSetting: (key) => {
    const settings = {
      PUPPETEER_HEADLESS: 'true',
      PUPPETEER_STEALTH_MODE: 'true',
      PUPPETEER_USER_AGENT: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36'
      // PUPPETEER_PROXY_SERVER: 'http://your-proxy-if-needed:port'
    };
    
    // Strip the PUPPETEER_ prefix since the service adds it
    const prefixedKey = `PUPPETEER_${key}`;
    return settings[prefixedKey] || null;
  },
  registerAction: () => {},
  registerService: () => {}
};

async function testSearch() {
  console.log('=== Starting Puppeteer Web Search Test ===');

  try {
    // Create the service
    console.log('Creating PuppeteerService...');
    const service = new PuppeteerService();
    
    // Initialize the service
    console.log('Initializing service...');
    await service.initialize(runtimeMock);
    
    // Perform search
    const query = 'SpaceX latest news';
    console.log(`\nPerforming search for: "${query}"`);
    
    const results = await service.search(query);
    
    // Log results
    console.log('\n=== SEARCH RESULTS ===\n');
    
    if (results && results.length > 0) {
      // Write results to a file for inspection
      writeFileSync('search-results.json', JSON.stringify(results, null, 2));
      console.log(`Saved ${results.length} results to search-results.json`);
      
      results.forEach((result, index) => {
        console.log(`\nResult ${index + 1}:`);
        console.log(`Title: ${result.title.substring(0, 100)}${result.title.length > 100 ? '...' : ''}`);
        console.log(`URL: ${result.url}`);
        console.log(`Description: ${result.description.substring(0, 150)}${result.description.length > 150 ? '...' : ''}`);
      });
      
      console.log('\nSUCCESS: Found real search results!');
    } else {
      console.log('No results found or invalid results returned.');
    }
    
    // Close the browser
    console.log('\nClosing browser...');
    await service.close();
    
    // Check for screenshot
    if (existsSync('./google-search.png')) {
      console.log('Screenshot was saved as google-search.png');
    }
    
    console.log('\n=== Test completed successfully ===');
  } catch (error) {
    console.error('\nERROR during test:', error);
    process.exit(1);
  }
}

// Run the test
testSearch(); 