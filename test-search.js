import { PuppeteerService } from './dist/index.js';

// Mock runtime for testing
const mockRuntime = {
  getSetting: (key) => {
    console.log(`Getting setting: ${key}`);
    if (key === 'HEADLESS') return 'true';
    return null;
  },
  registerAction: () => {},
  registerService: () => {}
};

// Test function
async function testSearch() {
  try {
    console.log('Creating PuppeteerService...');
    const service = new PuppeteerService();
    
    console.log('Initializing service...');
    await service.initialize(mockRuntime);
    
    console.log('Performing web search for "SpaceX latest news"...');
    const results = await service.search('SpaceX latest news');
    
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
    
    // Clean up
    console.log('\nClosing browser...');
    await service.close();
    
  } catch (error) {
    console.error('ERROR:', error);
  }
}

// Run the test
console.log('Starting Puppeteer web search test...');
testSearch(); 