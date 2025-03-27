import { PuppeteerService } from './dist/index.js';

// Create a more complete mock runtime that matches what's expected in the real agent
const mockRuntime = {
  getSetting: (key) => {
    console.log(`Getting setting: ${key}`);
    // Return null for the problematic settings
    return null;
  },
  registerAction: () => {},
  registerService: () => {},
  // Add other methods that might be required
  onShutdown: () => {}
};

async function testPuppeteerService() {
  try {
    console.log('Creating PuppeteerService instance...');
    const service = new PuppeteerService();
    
    console.log('Initializing service...');
    // This would have failed before our fix
    await service.initialize(mockRuntime);
    
    console.log('SUCCESS: PuppeteerService initialized successfully!');
    
    // Clean up
    console.log('Closing service...');
    await service.close();
    
  } catch (error) {
    console.error('ERROR: Failed to initialize PuppeteerService:', error);
  }
}

// Run the test
testPuppeteerService(); 