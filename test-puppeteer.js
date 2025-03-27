import { puppeteerConfigSchema } from './dist/environment.js';
import { z } from 'zod';

// Test the schema validation
const testConfig = {
  PROXY_SERVER: null,
  USER_AGENT: null,
  HEADLESS: true,
  STEALTH_MODE: true
};

// Try to parse the config with our updated schema
try {
  const validatedConfig = puppeteerConfigSchema.parse(testConfig);
  console.log('SUCCESS: Puppeteer config validation passed!');
  console.log('Config:', validatedConfig);
} catch (error) {
  console.error('ERROR: Puppeteer config validation failed:', error);
} 