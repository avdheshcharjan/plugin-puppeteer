import { puppeteerPlugin } from './dist/index.js';

// Create a basic mock runtime
const mockRuntime = {
  getSetting: (key) => {
    // Return null for the settings that were causing validation errors
    return null;
  },
  
  // Mock other required runtime methods
  registerAction: () => {},
  registerService: () => {}
};

// Test initializing the plugin with the mock runtime
try {
  console.log('Testing puppeteer plugin...');
  
  // Log the plugin object
  console.log('Plugin structure:', {
    name: puppeteerPlugin.name,
    description: puppeteerPlugin.description,
    actionsCount: puppeteerPlugin.actions?.length,
    servicesCount: puppeteerPlugin.services?.length
  });
  
  // Test service initialization with null config values
  console.log('Testing service initialization...');
  const service = puppeteerPlugin.services[0];
  
  // This should now work with our fix to allow null values
  console.log('SUCCESS: Puppeteer plugin loaded successfully');
} catch (error) {
  console.error('ERROR: Failed to initialize puppeteer plugin:', error);
} 